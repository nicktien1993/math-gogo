
import { GoogleGenAI, Type } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';

/**
 * 終極容錯解析器：如果 JSON 解析失敗，則回傳一個包含原始文字的備用物件
 */
const robustParse = (text: string, type: 'handout' | 'homework' | 'chapters'): any => {
  if (!text) return null;
  
  // 移除 Markdown 標記
  let cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();

  // 嘗試擷取 JSON 部分
  const startBrace = cleaned.indexOf('{');
  const startBracket = cleaned.indexOf('[');
  let finalJson = "";

  if (startBrace !== -1 || startBracket !== -1) {
    const startIdx = (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) ? startBrace : startBracket;
    const endChar = (startIdx === startBrace) ? '}' : ']';
    const endIdx = cleaned.lastIndexOf(endChar);
    if (endIdx !== -1) {
      finalJson = cleaned.substring(startIdx, endIdx + 1);
    }
  }

  try {
    if (finalJson) return JSON.parse(finalJson);
  } catch (e) {
    console.warn("JSON 解析失敗，啟用純文字補償模式");
  }

  // 補償模式：如果 JSON 爛掉了，至少要把文字塞回去讓老師看得到內容
  if (type === 'handout') {
    return {
      title: "生成的講義",
      concept: cleaned,
      examples: [{ question: "內容解析中...", stepByStep: ["請查看上方核心觀念"], answer: "無" }],
      tips: "提示：AI 回傳格式異常，請嘗試重新生成。",
      checklist: ["檢查內容完整性"]
    };
  }
  
  return null;
};

const SYSTEM_INSTRUCTION = `你是一位專業的台灣國小特教老師。
核心規範：
1. 嚴禁使用 $ 符號，數學算式直接寫純文字。
2. SVG 圖示必須包含 ViewBox="0 0 400 250"。
3. 內容必須「微步化」，將複雜概念拆解為極短句。
4. 回傳格式必須嚴格遵守 JSON。`;

export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return getLocalChapters(params.publisher, params.grade, params.semester);

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest',
      contents: `列出台灣國小數學「${params.publisher}版」${params.grade}${params.semester}目錄 JSON 陣列。`,
      config: { responseMimeType: "application/json" }
    });

    const data = robustParse(response.text, 'chapters');
    return Array.isArray(data) ? data : getLocalChapters(params.publisher, params.grade, params.semester);
  } catch (e) {
    return getLocalChapters(params.publisher, params.grade, params.semester);
  }
};

export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("環境變數中找不到 API_KEY，請檢查後台設定。");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `為資源班學生生成「${chapter} - ${sub}」特教微步化講義。包含核心觀念、例題與解題步驟。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json" 
    }
  });

  const data = robustParse(response.text, 'handout');
  if (data) return data;
  throw new Error("無法解析 AI 回傳內容，請再試一次。");
};

export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY 未設定");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `生成「${chapter}-${sub}」練習卷。計算:${config.calculationCount}題，應用:${config.wordProblemCount}題。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json"
    }
  });

  const data = robustParse(response.text, 'homework');
  if (data) return data;
  throw new Error("練習卷生成失敗");
};
