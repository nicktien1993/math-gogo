
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from '../types.ts';
import { getLocalChapters } from '../curriculumData.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小資源班特教老師。你的任務是生成一份「微步化」教材。

核心規範：
1. 嚴禁使用 $ 符號，所有數學算式直接寫純文字。
2. 圖示使用簡潔的 SVG，ViewBox="0 0 400 250"。
3. 核心觀念 (concept) 必須拆解為短句，並用「重點一：...」開頭。
4. 練習卷 (Homework) 必須包含題目與老師提示，但「嚴禁」在練習卷內容中出現答案。`;

/**
 * 徹底解決 "Unexpected non-whitespace character after JSON" 錯誤
 * 透過正則表達式精確擷取 JSON 區塊，忽略 AI 在 JSON 之外產生的任何文字。
 */
const cleanAndParse = (text: any) => {
  if (!text) return null;
  let raw = typeof text === 'string' ? text : String(text);
  
  // 1. 移除 Markdown 程式碼區塊標記
  let cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();

  // 2. 尋找 JSON 邊界 (處理物件 {} 或 陣列 [])
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
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
    const endIdx = cleaned.lastIndexOf(endChar);
    if (endIdx !== -1) {
      // 關鍵修復：強制只保留第一個括號到最後一個括號之間的字串
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("JSON 解析錯誤:", e, "處理後的字串內容:", cleaned);
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
  const cacheKey = `MATH_CACHE_V19_${params.publisher}_${params.grade}_${params.semester}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣國小數學「${params.publisher}版」${params.grade}${params.semester}目錄 JSON 陣列。`,
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
    console.error("抓取目錄失敗:", e);
  }
  return getLocalChapters(params.publisher, params.grade, params.semester);
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `為國小資源班學生生成「${chapter} - ${sub}」微步化講義 JSON。`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json", 
        responseSchema: HANDOUT_SCHEMA 
      }
    });
    const data = cleanAndParse(response.text);
    if (data) return data;
  } catch (e) {
    console.error("生成講義失敗:", e);
    throw e;
  }
  throw new Error("講義內容格式解析錯誤。");
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const prompt = `生成「${chapter}-${sub}」練習卷 JSON。包含計算題:${config.calculationCount} 題，應用題:${config.wordProblemCount} 題。`;
  
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
  } catch (e) {
    console.error("生成練習卷失敗:", e);
    throw e;
  }
  throw new Error("練習卷內容格式解析錯誤。");
};
