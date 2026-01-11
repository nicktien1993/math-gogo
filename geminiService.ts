
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

/**
 * Utility to extract JSON from model responses which might contain markdown artifacts.
 */
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

const validateApiKey = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key must be set when running in a browser. Please authorize the teaching assistant.");
  }
};

const SYSTEM_PROMPT = `你是一位專業的台灣國小資源班特教老師。
你的目標是為學生生成「微步化（小步子）」教材。
1. 嚴禁使用 $ 符號，請用一般文字描述數學式。
2. 觀念必須簡單易懂。
3. 圖解使用 SVG (ViewBox 0 0 400 250)，確保樣式簡潔且能清晰傳達概念。
4. 必須回傳有效的 JSON 格式。
5. 使用繁體中文。`;

const CHAPTERS_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: '單元章節名稱' },
      subChapters: { type: Type.ARRAY, items: { type: Type.STRING }, description: '子單元列表' }
    },
    required: ["title", "subChapters"],
    propertyOrdering: ["title", "subChapters"]
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
  required: ["title", "concept", "examples", "tips", "checklist"],
  propertyOrdering: ["title", "concept", "visualAidSvg", "examples", "tips", "checklist"]
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
        required: ["type", "content", "answer"]
      }
    },
    checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "questions", "checklist"],
  propertyOrdering: ["title", "questions", "checklist"]
};

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣「${params.publisher}」${params.grade}${params.semester}數學課程目錄。格式為 JSON。`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: CHAPTERS_SCHEMA
      }
    });
    const text = response.text || "";
    const data = robustExtractJSON(text);
    return Array.isArray(data) ? data : getLocalChapters(params.publisher, params.grade, params.semester);
  } catch (e) {
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
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
    const text = response.text || "";
    const data = robustExtractJSON(text);
    if (!data) throw new Error("AI 回傳的內容格式不正確");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "生成講義時發生 API 錯誤");
  }
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  validateApiKey();
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `製作「${chapter}-${sub}」練習卷。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。難度：${config.difficulty}。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: HOMEWORK_SCHEMA
      }
    });
    const text = response.text || "";
    const data = robustExtractJSON(text);
    if (!data) throw new Error("練習卷內容生成失敗");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "生成練習卷時發生錯誤");
  }
};
