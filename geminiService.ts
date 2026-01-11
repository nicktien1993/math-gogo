
import { GoogleGenAI } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

/**
 * 終極 JSON 救星：從任何雜亂字串中挖出 JSON。
 */
const deepExtractJSON = (text: string) => {
  if (!text) return null;
  // 嘗試找出所有可能的 JSON 區塊
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let jsonStr = "";
  if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    jsonStr = text.substring(firstBrace, lastBrace + 1);
  } else if (firstBracket !== -1 && lastBracket !== -1) {
    jsonStr = text.substring(firstBracket, lastBracket + 1);
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("JSON Parse Failed, raw text:", text);
    // 試著手動清理 Markdown
    const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try { return JSON.parse(cleaned); } catch { return null; }
  }
};

const SYSTEM_PROMPT = `你是一位專業的台灣國小特教老師。
請注意：
1. 嚴禁使用 $ 符號。
2. 步驟必須極度簡化（微步化）。
3. 使用繁體中文。
4. 必須嚴格回傳有效的 JSON 格式。`;

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return getLocalChapters(params.publisher, params.grade, params.semester);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣「${params.publisher}」${params.grade}${params.semester}數學課程目錄。格式：[{"title": "單元名", "subChapters": ["子單元"]}]`
    });
    const data = deepExtractJSON(response.text);
    return Array.isArray(data) ? data : getLocalChapters(params.publisher, params.grade, params.semester);
  } catch (e) {
    console.error("fetchChapters Error:", e);
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API KEY MISSING");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `為資源班學生製作講義：單元「${chapter}-${sub}」。JSON 格式須包含：title, concept, examples(question, stepByStep[], answer), tips, checklist[]。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json" 
      }
    });
    
    const data = deepExtractJSON(response.text);
    if (!data) throw new Error("AI 回傳的內容無法解析成講義，請重試。");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "未知 API 錯誤");
  }
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `製作「${chapter}-${sub}」練習卷 JSON。計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。`,
      config: { 
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });
    const data = deepExtractJSON(response.text);
    if (!data) throw new Error("練習卷內容損毀。");
    return data;
  } catch (e: any) {
    throw new Error(e.message || "練習卷 API 出錯");
  }
};
