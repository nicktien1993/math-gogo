
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';
import { PRESET_HANDOUTS } from './handoutData.ts';

const robustExtractJSON = (text: string) => {
  if (!text) return null;
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let jsonStr = "";
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    jsonStr = text.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    jsonStr = text.substring(firstBracket, lastBracket + 1);
  } else {
    jsonStr = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    try {
      return JSON.parse(jsonStr.replace(/\n/g, ' ').replace(/\r/g, ' '));
    } catch {
      return null;
    }
  }
};

const SYSTEM_PROMPT = `你是一位專業的台灣國小資源班特教老師。你的目標是為學生生成「微步化（小步子）」教材。嚴禁使用 $ 符號。圖解使用 SVG。`;

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
  required: ["title", "concept", "examples", "tips", "checklist"]
};

export const isPresetAvailable = (params: SelectionParams, chapter: string, sub: string): boolean => {
  const presetKey = `${params.publisher}-${params.grade}-${params.semester}-${chapter}-${sub}`;
  return !!PRESET_HANDOUTS[presetKey];
};

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  // 優先回傳本地資料庫
  const local = getLocalChapters(params.publisher, params.grade, params.semester);
  if (local.length > 0) return local;

  // 若無本地資料，才嘗試呼叫 AI
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣「${params.publisher}」${params.grade}${params.semester}數學課程目錄。格式為 JSON。`,
      config: { responseMimeType: "application/json" }
    });
    return robustExtractJSON(response.text) || [];
  } catch (e) {
    return [];
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const presetKey = `${params.publisher}-${params.grade}-${params.semester}-${chapter}-${sub}`;
  if (PRESET_HANDOUTS[presetKey]) {
    return PRESET_HANDOUTS[presetKey];
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("此單元暫無內建講義且未設定 API 金鑰。請更換有內建資料的單元（如：五年級上學期-找出因數）。");
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `為資源班學生製作講義：單元「${chapter}-${sub}」。難度：${params.difficulty}。請拆解步驟並提供視覺化圖解。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: HANDOUT_SCHEMA
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("AI 回傳的內容格式不正確");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "生成講義時發生 API 錯誤");
  }
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("目前暫無內建練習卷，且未設定 API 金鑰進行 AI 生成。");
  }

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `製作「${chapter}-${sub}」練習卷。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT, 
        responseMimeType: "application/json" 
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("練習卷生成失敗");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "生成練習卷時發生錯誤");
  }
};
