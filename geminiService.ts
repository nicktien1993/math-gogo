
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小資源班特教老師。你的任務是生成一份「微步化」教材。

核心規範：
1. 嚴禁使用 $ 符號，所有數學算式直接寫純文字。
2. 圖示使用簡潔的 SVG，ViewBox="0 0 400 250"。
3. 核心觀念 (concept) 必須拆解為短句，並用「重點一：...」開頭。
4. 練習卷 (Homework) 必須包含題目與老師提示，但「嚴禁」在練習卷內容中出現答案。`;

/**
 * 終極 JSON 提取器：只保留第一個括號到最後一個括號之間的內容
 */
const cleanAndParse = (text: any) => {
  if (!text) return null;
  let raw = typeof text === 'string' ? text : String(text);
  
  // 移除 Markdown 標記
  let cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();

  // 尋找 JSON 的邊界
  const startBrace = cleaned.indexOf('{');
  const startBracket = cleaned.indexOf('[');
  let startIdx = -1;
  let endChar = '';

  if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
    startIdx = startBrace;
    endChar = '}';
  } else if (startBracket !== -1) {
    startIdx = startBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const endIdx = cleaned.lastIndexOf(endChar);
    if (endIdx !== -1) {
      // 關鍵修復：切除括號以外的所有文字（如 AI 的解釋或結尾語）
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON 解析失敗:", e, "處理後的字串:", cleaned);
    return null;
  }
};

const CHAPTER_LIST_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      subChapters: { type: Type.ARRAY, items: { type: Type.STRING } }
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

const HOMEWORK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          content: { type: Type.STRING },
          hint: { type: Type.STRING },
          answer: { type: Type.STRING },
          visualAidSvg: { type: Type.STRING }
        },
        required: ["content", "answer"]
      }
    },
    checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "questions"]
};

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const cacheKey = `MATH_V17_${params.publisher}_${params.grade}_${params.semester}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `請列出台灣國小數學「${params.publisher}版」${params.grade}${params.semester}目錄。`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: CHAPTER_LIST_SCHEMA
      }
    });
    const data = cleanAndParse(response.text);
    if (data && Array.isArray(data)) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
  } catch (e) { console.error("抓取目錄失敗:", e); }
  return getLocalChapters(params.publisher, params.grade, params.semester);
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `生成「${chapter} - ${sub}」特教講義。`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json", 
        responseSchema: HANDOUT_SCHEMA 
      }
    });
    const data = cleanAndParse(response.text);
    if (data) return data;
  } catch (e) { throw e; }
  throw new Error("講義生成內容異常");
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `為「${chapter}-${sub}」生成練習題。計算:${config.calculationCount} 題，應用:${config.wordProblemCount} 題。`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json",
        responseSchema: HOMEWORK_SCHEMA
      }
    });
    const data = cleanAndParse(response.text);
    if (data) return data;
  } catch (e) { throw e; }
  throw new Error("練習卷生成異常");
};
