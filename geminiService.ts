
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

嚴格規則：
1. 嚴禁使用 $ 符號，請使用繁體中文。
2. 每個例題必須提供視覺圖解 visualAidSvg (SVG 格式)。
3. SVG 規則：黑色線條 (stroke="#000000")，粗細 3px，viewBox="0 0 400 400"。
4. 如果是時鐘題目，必須畫出圓、12個數字、長短針。`;

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

export const generateHandout = async (params: SelectionParams): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("請設定 API 金鑰。");

  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `為國小「${params.grade}」資源班學生製作數學講義。單元名稱：${params.unitTitle}。難度：${params.difficulty}。請用微步化拆解步驟並提供大量 SVG 圖解。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: HANDOUT_SCHEMA
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("AI 回傳失敗");
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
      contents: `針對單元「${params.unitTitle}」製作練習卷。年級：${params.grade}。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT, 
        responseMimeType: "application/json" 
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("練習卷生成失敗");
    return data;
  } catch (e: any) {
    throw new Error("API 錯誤");
  }
};
