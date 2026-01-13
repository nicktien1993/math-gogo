
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

【零容忍規則：嚴禁 $ 符號】
- 絕對禁止使用 $ 符號來包裹數學公式。
- 錯誤範例：$1+1=2$ (禁止)
- 正確範例：1+1=2 (必須這樣寫)
- 如果你在輸出中包含任何 $ 符號，該教材將無法閱讀，請務必遵守。

【SVG 繪圖規範：透明填充】
1. 繪製矩形 <rect> 或圓形 <circle> 時，必須設定 fill="none"，以免遮擋下方的文字或數字。
2. viewBox="0 0 400 400"，stroke="#000000"，stroke-width="3"。
3. 繪製順序：背景圖形先畫，文字與數字後畫，確保數字在最上層。`;

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
      contents: `為國小「${params.grade}」資源班學生製作數學講義。單元：${params.unitTitle}。難度：${params.difficulty}。再次強調：禁止使用 $ 符號，圖形必須透明。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: HANDOUT_SCHEMA
      }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("AI 回傳格式錯誤");
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
      contents: `針對單元「${params.unitTitle}」製作隨堂練習卷。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。禁止使用 $ 符號。`,
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
