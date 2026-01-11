
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

/**
 * 終極容錯解析器：如果 JSON 解析失敗，則擷取內容並包裝
 */
const robustParse = (text: string, type: 'handout' | 'homework' | 'chapters'): any => {
  if (!text) return null;
  let cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const startBrace = cleaned.indexOf('{');
  const startBracket = cleaned.indexOf('[');
  let finalJson = "";

  if (startBrace !== -1 || startBracket !== -1) {
    const startIdx = (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) ? startBrace : startBracket;
    const endChar = (startIdx === startBrace) ? '}' : ']';
    const endIdx = cleaned.lastIndexOf(endChar);
    if (endIdx !== -1) finalJson = cleaned.substring(startIdx, endIdx + 1);
  }

  try {
    if (finalJson) return JSON.parse(finalJson);
  } catch (e) {
    console.warn("JSON Parsing Error, falling back to text wrapper.");
  }

  if (type === 'handout') {
    return {
      title: "AI 生成講義",
      concept: cleaned,
      examples: [{ question: "內容解析中...", stepByStep: ["請參考上方觀念"], answer: "無" }],
      tips: "AI 回傳格式不正確，但已擷取純文字內容。",
      checklist: ["檢查內容是否完整"]
    };
  }
  return null;
};

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小特教老師。
核心規範：
1. 嚴禁使用 $ 符號，數學算式直接寫純文字。
2. SVG 圖示 ViewBox="0 0 400 250"，必須是純 HTML。
3. 使用繁體中文。
4. 內容必須「微步化」。`;

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing, using local data.");
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `列出「${params.publisher}」${params.grade}${params.semester}數學目錄，以 JSON 陣列格式回傳。`,
      config: { responseMimeType: "application/json" }
    });
    const data = robustParse(response.text, 'chapters');
    return Array.isArray(data) ? data : getLocalChapters(params.publisher, params.grade, params.semester);
  } catch (e: any) {
    console.error("Fetch Chapters API Error:", e);
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("系統環境中找不到 API 金鑰，請檢查設定。");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `為資源班學生生成「${chapter} - ${sub}」特教微步化講義 JSON。`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json" 
      }
    });
    const data = robustParse(response.text, 'handout');
    if (data) return data;
    throw new Error("AI 回傳內容無法解析。");
  } catch (e: any) {
    throw new Error(`API 請求失敗: ${e.message || "未知錯誤"}`);
  }
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API 金鑰未設定。");

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `生成「${chapter}-${sub}」練習卷 JSON。計算:${config.calculationCount}，應用:${config.wordProblemCount}。`,
      config: { 
        systemInstruction: SYSTEM_INSTRUCTION, 
        responseMimeType: "application/json"
      }
    });
    const data = robustParse(response.text, 'homework');
    if (data) return data;
    throw new Error("練習卷內容解析失敗。");
  } catch (e: any) {
    throw new Error(`練習卷 API 失敗: ${e.message}`);
  }
};
