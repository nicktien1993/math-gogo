
import { GoogleGenAI } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

/**
 * 終極 JSON 擷取器：從任何包含垃圾字元的字串中挖出 JSON
 */
const robustExtractJSON = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const bracketStart = text.indexOf('[');
    const bracketEnd = text.lastIndexOf(']');
    
    // 判斷是物件還是陣列，取範圍較大且合法的那個
    let jsonStr = '';
    if (start !== -1 && (bracketStart === -1 || start < bracketStart)) {
      jsonStr = text.substring(start, end + 1);
    } else if (bracketStart !== -1) {
      jsonStr = text.substring(bracketStart, bracketEnd + 1);
    }
    
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parse Error. Raw text:", text);
    return null;
  }
};

const SYSTEM_PROMPT = `你是一位專業的台灣特教老師。
1. 嚴禁使用 $ 符號。
2. 內容必須「微步化」，將概念拆解為極簡步驟。
3. 輸出必須是純 JSON 格式。
4. 使用繁體中文。`;

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return getLocalChapters(params.publisher, params.grade, params.semester);

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出台灣「${params.publisher}」${params.grade}${params.semester}數學目錄，格式為：[{"title": "單元名", "subChapters": ["子單元1", "子單元2"]}]`
    });
    const data = robustExtractJSON(response.text);
    return Array.isArray(data) ? data : getLocalChapters(params.publisher, params.grade, params.semester);
  } catch (e: any) {
    console.error("API Error in fetchChapters:", e);
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("環境變數 API_KEY 缺失");

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `生成「${chapter} - ${sub}」特教講義 JSON。包含 title, concept, examples (question, stepByStep, answer), tips, checklist。`,
      config: { systemInstruction: SYSTEM_PROMPT }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("解析失敗，AI 回傳內容不完整。");
    return data;
  } catch (e: any) {
    throw new Error(`講義生成失敗：${e.message}`);
  }
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `生成「${chapter}-${sub}」練習卷 JSON。包含 questions (type, content, hint, answer), checklist。計算題:${config.calculationCount}，應用題:${config.wordProblemCount}。`,
      config: { systemInstruction: SYSTEM_PROMPT }
    });
    const data = robustExtractJSON(response.text);
    if (!data) throw new Error("練習卷內容解析失敗。");
    return data;
  } catch (e: any) {
    throw new Error(`練習卷生成失敗：${e.message}`);
  }
};
