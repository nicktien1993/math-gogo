
import { GoogleGenAI } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';
import { getLocalHandout, PRESET_HANDOUTS } from './handoutData.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小資源班特教老師，擅長「視覺化策略教學」。

核心規範：
1. 格式：純 JSON，不准有 Markdown 標記。
2. 數學：禁止 $ 符號。分數寫成 "2又1/2" 或 "3/4"。
3. 幾何 SVG 要求：必須使用 <svg viewBox="0 0 400 250">，標註底、高（虛線）、直角記號及長度數字。
4. 步驟排版規範 (極重要)：
   每個步驟請使用以下格式： "步驟 X：標題內容。- 詳細說明內容"
   一定要有句號「。」作為標題與說明的拆分點。
   範例："步驟 1：先找出「底」和「高」。- 橫量在下面那條線是底，垂直往上的是高。"
5. 術語：使用台灣教育部數學術語（如：平方公分、上底、下底）。

JSON 結構請嚴格遵守：
講義：{ "title": string, "concept": string, "visualAidSvg": string, "examples": [{ "question": string, "stepByStep": [string], "answer": string, "visualAidSvg": string }], "tips": string, "checklist": [string] }
練習卷：{ "title": string, "questions": [{ "type": "計算題"|"應用題", "content": string, "hint": string, "answer": string, "visualAidSvg": string }], "checklist": [string] }`;

const CACHE_PREFIX = 'MATH_HANDOUT_CACHE_V3_';
const HW_CACHE_PREFIX = 'MATH_HW_CACHE_V3_';

const cleanAndParse = (text: any) => {
  if (!text) return null;
  let clean = typeof text === 'string' ? text : String(text);
  try {
    clean = clean.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const startIdx = clean.indexOf('{');
    const endIdx = clean.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    return null;
  }
};

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getLocalChapters(params.publisher, params.grade, params.semester));
    }, 50);
  });
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const cacheKey = `${CACHE_PREFIX}${params.publisher}_${params.grade}_${params.semester}_${chapter}_${sub}`;
  const handoutKey = `${params.publisher}-${params.grade}-${params.semester}-${chapter}-${sub}`;
  
  // 優先檢查內建
  if (PRESET_HANDOUTS[handoutKey]) return PRESET_HANDOUTS[handoutKey];
  
  // 檢查快取
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  if (process.env.API_KEY) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `針對單元「${chapter}-${sub}」生成資源班教學講義。請確保步驟格式為「步驟 X：標題。- 說明」。`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
      });
      const data = cleanAndParse(response.text);
      if (data && data.title) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
    } catch (e) { console.error(e); }
  }
  return getLocalHandout(params, chapter, sub);
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const cacheKey = `${HW_CACHE_PREFIX}${params.publisher}_${params.grade}_${params.semester}_${chapter}_${sub}_${config.difficulty}_${config.calculationCount}_${config.wordProblemCount}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);
  
  if (!process.env.API_KEY) throw new Error("API Key Missing");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `生成「${chapter}-${sub}」練習卷。難度：${config.difficulty}。`,
      config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
    });
    const data = cleanAndParse(response.text);
    if (data && data.questions && data.questions.length > 0) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      return data;
    }
  } catch (e) { console.error(e); }
  throw new Error("生成失敗");
};
