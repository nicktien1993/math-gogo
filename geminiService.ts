
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

const robustExtractJSON = (text: string) => {
  if (!text) return null;
  // 嘗試從 Markdown 標籤或純文字中擷取 JSON 區塊
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
    console.error("JSON Parse Error. Raw text snippet:", text.substring(0, 100));
    // 暴力清理：移除所有換行符號後再試一次
    try {
      return JSON.parse(jsonStr.replace(/\n/g, ' ').replace(/\r/g, ' '));
    } catch {
      return null;
    }
  }
};

const SYSTEM_PROMPT = `你是一位專業的台灣國小資源班特教老師。
你的目標是為學生生成「微步化（小步子）」教材。
1. 嚴禁使用 $ 符號，請用一般文字描述數學式。
2. 觀念必須簡單易懂。
3. 必須回傳有效的 JSON 格式。
4. 使用繁體中文。`;

const HANDOUT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    concept: { type: Type.STRING },
    visualAidSvg: { type: Type.STRING, description: "SVG 程式碼，ViewBox 0 0 400 250" },
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

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣「${params.publisher}」${params.grade}${params.semester}數學課程目錄。格式：[{"title": "單元名稱", "subChapters": ["子單元1", "子單元2"]}]`,
      config: { responseMimeType: "application/json" }
    });
    const data = robustExtractJSON(response.text);
    return Array.isArray(data) ? data : getLocalChapters(params.publisher, params.grade, params.semester);
  } catch (e) {
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `為資源班學生製作講義：單元「${chapter}-${sub}」。請拆解步驟，並提供視覺化圖解（SVG）。`,
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
  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `製作「${chapter}-${sub}」練習卷。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。難度：${config.difficulty}。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("練習卷內容生成失敗");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "生成練習卷時發生錯誤");
  }
};
