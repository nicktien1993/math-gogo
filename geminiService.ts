
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';
import { PRESET_HANDOUTS } from './handoutData.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小資源班特教老師。你的任務是生成一份「微步化」教材。

核心繪圖規範 (visualAidSvg)：
1. 使用 <svg viewBox="0 0 400 250">，背景必須透明或純白。
2. **主題特化繪圖**：
   - **小數加減**：必須繪製「直式位值對齊表」。使用垂直虛線區隔個位、十分位、百分位，並用顯眼的實心圓點標示「小數點」，幫助學生理解對齊原則。
   - **分數**：使用矩形或圓形面積模型，清楚切分等份。
   - **幾何面積**：繪製圖形並標示輔助線（如高），但不可在圖中標示計算結果。
3. **嚴禁算式**：絕對禁止在 <svg> 標籤外或內部包含任何算式（如 1.2+0.5）、答案或文字描述。
4. **微步化觀念**：concept 必須拆解為短句，每句 30 字內。`;

const CACHE_PREFIX = 'MATH_HANDOUT_V13_';
const HW_CACHE_PREFIX = 'MATH_HW_V13_';
const CHAPTERS_CACHE_PREFIX = 'MATH_CHAPTERS_V12_';

const cleanAndParse = (text: any) => {
  if (!text) return null;
  let clean = typeof text === 'string' ? text : String(text);
  try {
    clean = clean.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) startIdx = Math.min(firstBrace, firstBracket);
    else if (firstBrace !== -1) startIdx = firstBrace;
    else if (firstBracket !== -1) startIdx = firstBracket;

    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    let endIdx = -1;
    if (lastBrace !== -1 && lastBracket !== -1) endIdx = Math.max(lastBrace, lastBracket);
    else if (lastBrace !== -1) endIdx = lastBrace;
    else if (lastBracket !== -1) endIdx = lastBracket;

    if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parsing Error:", e);
    return null;
  }
};

const CHAPTER_LIST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      subChapters: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }
      }
    },
    required: ["title", "subChapters"]
  }
};

const HANDOUT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    concept: { type: Type.STRING },
    visualAidSvg: { type: Type.STRING },
    examples: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          visualAidSvg: { type: Type.STRING }
        },
        required: ["question", "stepByStep", "answer"]
      }
    },
    tips: { type: Type.STRING },
    checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "concept", "examples"]
};

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const cacheKey = `${CHAPTERS_CACHE_PREFIX}${params.publisher}_${params.grade}_${params.semester}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請詳細列出台灣國小數學「${params.publisher}版」${params.grade}${params.semester}的課程目錄。回傳 JSON 陣列，每個物件包含 title 和 subChapters。`,
      config: { 
        systemInstruction: "你是一個專業課程目錄資料庫。請回傳嚴格符合 JSON Schema 的目錄結構。",
        responseMimeType: "application/json",
        responseSchema: CHAPTER_LIST_SCHEMA
      }
    });
    const data = cleanAndParse(response.text);
    if (data && Array.isArray(data)) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
  } catch (e) { console.error("Fetch Chapters Error:", e); }
  return getLocalChapters(params.publisher, params.grade, params.semester);
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const cacheKey = `${CACHE_PREFIX}${params.publisher}_${params.grade}_${params.semester}_${chapter}_${sub}`;
  const handoutKey = `${params.publisher}-${params.grade}-${params.semester}-${chapter}-${sub}`;
  if (PRESET_HANDOUTS[handoutKey]) return PRESET_HANDOUTS[handoutKey];
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `針對「${chapter} - ${sub}」生成資源班教學講義。若是計算題，請在 visualAidSvg 中畫出對齊格或視覺化結構模型。嚴禁在圖中寫出答案。`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json", 
        responseSchema: HANDOUT_SCHEMA 
      }
    });
    const data = cleanAndParse(response.text);
    if (data) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
  } catch (e) { throw e; }
  throw new Error("生成失敗");
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const cacheKey = `${HW_CACHE_PREFIX}${params.publisher}_${params.grade}_${params.semester}_${chapter}_${sub}_${config.difficulty}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `生成「${chapter}-${sub}」練習卷。包含 ${config.calculationCount} 題計算與 ${config.wordProblemCount} 題應用。`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const data = cleanAndParse(response.text);
    if (data) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
  } catch (e) {}
  throw new Error("練習卷生成失敗");
};
