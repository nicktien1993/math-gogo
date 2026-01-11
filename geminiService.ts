
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

/**
 * 安全地取得 API Key，防止 process 未定義導致的崩潰
 */
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小資源班特教老師。你的任務是生成一份「微步化」教材。

核心規範：
1. 嚴禁使用 $ 符號，所有數學算式直接寫純文字。
2. 圖示使用簡潔的 SVG，ViewBox="0 0 400 250"。
3. 核心觀念 (concept) 必須拆解為短句，並用「重點一：...」開頭。
4. 練習卷 (Homework) 必須包含題目與老師提示，但「嚴禁」在練習卷內容中出現答案。`;

const cleanAndParse = (text: any) => {
  if (!text) return null;
  let raw = typeof text === 'string' ? text : String(text);
  let cleaned = raw.replace(/```json/gi, '').replace(/```/gi, '').trim();

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
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
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

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const cacheKey = `MATH_STABLE_V22_${params.publisher}_${params.grade}_${params.semester}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const apiKey = getApiKey();
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `列出台灣國小數學「${params.publisher}版」${params.grade}${params.semester}目錄 JSON。`,
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
      console.warn("API 獲取失敗，切換至在地資料庫庫。");
    }
  }
  
  return getLocalChapters(params.publisher, params.grade, params.semester);
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API 金鑰未配置");
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `為資源班學生生成「${chapter} - ${sub}」特教講義。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json", 
      responseSchema: HANDOUT_SCHEMA 
    }
  });
  const data = cleanAndParse(response.text);
  if (data) return data;
  throw new Error("講義解析失敗");
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API 金鑰未配置");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `生成「${chapter}-${sub}」練習題。計算:${config.calculationCount}，應用:${config.wordProblemCount}。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json"
    }
  });
  const data = cleanAndParse(response.text);
  if (data) return data;
  throw new Error("練習卷解析失敗");
};
