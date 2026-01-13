
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';

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
    return null;
  }
};

const SYSTEM_PROMPT = `你是一位專業的台灣國小資源班特教老師。
請為學生生成「微步化（小步子）」教材。

【生成邏輯】
1. 請根據使用者提供的「單元名稱」判斷這屬於哪一個數學領域。
2. 根據選定的「年級」與「難度」，調整數值的複雜度（例如：一年級加法不超過20，三年級可涉及三位數）。
3. 使用台灣國小數學術語（例如：進位、退位、因數）。

【零容忍規則：嚴禁 $ 符號】
- 絕對禁止使用 $ 符號來包裹數學公式。
- 正確範例：10 x 3.14 = 31.4 (不准加任何 $)。

【SVG 繪圖規範：透明填充】
1. 繪製圖解時，必須設定 fill="none"，以免遮擋下方的文字。
2. 每個範例必須附帶一個與題目相關的視覺化圖解 SVG。
3. viewBox="0 0 400 400"，粗線條 stroke="#000000" (3px)。`;

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
        required: ["question", "stepByStep", "answer", "visualAidSvg"]
      }
    },
    tips: { type: Type.STRING },
    checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "concept", "examples", "tips", "checklist", "visualAidSvg"]
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
          type: { type: Type.STRING, description: "計算題或應用題" },
          content: { type: Type.STRING },
          hint: { type: Type.STRING },
          answer: { type: Type.STRING },
          visualAidSvg: { type: Type.STRING, description: "必填，透明填充的 SVG 程式碼" }
        },
        required: ["type", "content", "answer", "visualAidSvg"]
      }
    },
    checklist: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["title", "questions", "checklist"]
};

export const generateHandout = async (params: SelectionParams): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `為國小「${params.grade}」資源班學生製作數學講義。單元：${params.unitTitle}。難度要求：${params.difficulty}。請以此難度為基準生成微步化內容。嚴禁 $。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: HANDOUT_SCHEMA
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("解析失敗");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "生成失敗");
  }
};

export const generateHomework = async (params: SelectionParams, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `製作國小「${params.grade}」數學練習卷。單元：${params.unitTitle}。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。難度：${params.difficulty}。嚴禁 $。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT, 
        responseMimeType: "application/json",
        responseSchema: HOMEWORK_SCHEMA
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("練習卷解析失敗");
    return data;
  } catch (e: any) {
    throw new Error("API 傳輸錯誤，請重試");
  }
};
