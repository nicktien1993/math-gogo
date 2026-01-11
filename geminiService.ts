
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
 * 強大的 JSON 清洗與解析函式
 * 支援偵測物件 {} 與 陣列 []
 */
const cleanAndParse = (text: any) => {
  if (!text) return null;
  let clean = typeof text === 'string' ? text : String(text);
  
  // 移除 Markdown 程式碼區塊標記
  clean = clean.replace(/```json/gi, '').replace(/```/gi, '').trim();

  // 尋找 JSON 的起始點與結束點 (相容物件與陣列)
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  let startIdx = -1;
  let endChar = '';
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const endIdx = clean.lastIndexOf(endChar);
    if (endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parsing Error:", e, "Cleaned result:", clean);
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
  const cacheKey = `MATH_CHAPTERS_V15_${params.publisher}_${params.grade}_${params.semester}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣國小數學「${params.publisher}版」${params.grade}${params.semester}目錄。請嚴格遵守 JSON 陣列格式回傳。`,
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
  } catch (e) { 
    console.error("Fetch Chapters Error:", e); 
  }
  return getLocalChapters(params.publisher, params.grade, params.semester);
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `為資源班學生生成「${chapter} - ${sub}」講義。目標是微步化拆解並提供 SVG 視覺輔助。`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json", 
        responseSchema: HANDOUT_SCHEMA 
      }
    });
    const data = cleanAndParse(response.text);
    if (data) return data;
  } catch (e) { 
    console.error("Generate Handout Error:", e);
    throw e; 
  }
  throw new Error("講義生成內容解析失敗");
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `為單元「${chapter}-${sub}」生成練習卷。包含 ${config.calculationCount} 題計算與 ${config.wordProblemCount} 題應用。難度為 ${config.difficulty}。注意：回傳內容中絕對不能出現答案提示給學生看到。`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json",
        responseSchema: HOMEWORK_SCHEMA
      }
    });
    const data = cleanAndParse(response.text);
    if (data) return data;
  } catch (e) {
    console.error("Homework Generation API Error:", e);
  }
  throw new Error("練習卷生成失敗，請檢查 API 金鑰額度或網路狀態。");
};
