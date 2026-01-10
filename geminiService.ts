import { GoogleGenAI } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的國小資源班特教老師。
請注意：
1. 輸出格式必須是純 JSON，不得包含任何 Markdown 標記或前言後語。
2. 禁止使用 $ 符號，數學算式直接寫純文字（如：1/2, 2x3=6）。
3. 講義內容要微步化(stepByStep)，確保特教學生易懂。
4. SVG 圖示請保持簡潔，並確保包含 viewBox 屬性以利縮放，不要設定固定的 width 或 height。
5. 使用台灣數學術語。`;

const cleanAndParse = (text: string | undefined) => {
  if (!text) return null;
  try {
    // 移除可能的 Markdown 代碼塊標記
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 尋找第一個 { 或 [ 以及最後一個 } 或 ]
    const startIdx = Math.min(
      clean.indexOf('{') === -1 ? Infinity : clean.indexOf('{'),
      clean.indexOf('[') === -1 ? Infinity : clean.indexOf('[')
    );
    const endIdx = Math.max(
      clean.lastIndexOf('}'),
      clean.lastIndexOf(']')
    );

    if (startIdx !== Infinity && endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
    }

    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON 解析失敗:", e, "原始文字內容:", text);
    return null;
  }
};

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  // 使用 flash-preview 提升搜尋速度
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `請列出 ${params.publisher}版 國小數學 ${params.grade}${params.semester}學期 的課程目錄。回傳格式：{ "chapters": [{ "id": "1", "title": "單元名", "subChapters": ["子單元"] }] }`,
    config: { responseMimeType: "application/json" }
  });
  const data = cleanAndParse(response.text);
  if (!data) return [];
  return data.chapters || (Array.isArray(data) ? data : []);
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `針對單元「${chapter}-${sub}」生成特教講義內容。包含核心觀念(concept)、3個例題(examples)及解法、2個提示。核心觀念請務必提供完整的說明文字。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json" 
    }
  });
  const data = cleanAndParse(response.text);
  return {
    title: data?.title || `${chapter}-${sub}`,
    concept: data?.concept || '內容生成失敗，請嘗試重新點擊生成。',
    examples: data?.examples || [],
    exercises: data?.exercises || [],
    tips: data?.tips || '',
    checklist: data?.checklist || []
  };
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `生成「${chapter}-${sub}」的練習卷。難度：${config.difficulty}，包含 ${config.calculationCount} 題計算與 ${config.wordProblemCount} 題應用。不要提供答案，僅提供題目內容。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json" 
    }
  });
  const data = cleanAndParse(response.text);
  return {
    title: data?.title || `${chapter}-${sub} 練習卷`,
    questions: data?.questions || [],
    checklist: data?.checklist || []
  };
};