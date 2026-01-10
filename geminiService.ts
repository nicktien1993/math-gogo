
import { GoogleGenAI } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';
import { getLocalHandout } from './handoutData.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的國小資源班特教老師。
請注意：
1. 輸出格式必須是純 JSON，不得包含任何 Markdown 標記。
2. 禁止使用 $ 符號，數學算式直接寫純文字（如：1/2, 2x3=6）。
3. 講義內容要微步化(stepByStep)，確保特教學生易懂。
4. SVG 圖示請保持簡潔，並確保包含 viewBox 屬性以利縮放。
5. 使用台灣數學術語。`;

const cleanAndParse = (text: any) => {
  if (!text) return null;
  const contentStr = typeof text === 'string' ? text : String(text);
  
  try {
    let clean = contentStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const startIdx = Math.min(
      clean.indexOf('{') === -1 ? Infinity : clean.indexOf('{'),
      clean.indexOf('[') === -1 ? Infinity : clean.indexOf('[')
    );
    const endIdx = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));

    if (startIdx !== Infinity && endIdx !== -1) {
      clean = clean.substring(startIdx, endIdx + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON 解析失敗:", e);
    return null;
  }
};

/**
 * 獲取目錄：完全本地化
 */
export const fetchChapters = async (params: SelectionParams): Promise<Chapter[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = getLocalChapters(params.publisher, params.grade, params.semester);
      resolve(data);
    }, 50);
  });
};

/**
 * 獲取講義：優先本地化，若環境變數有 API_KEY 且使用者需要，才調用 API (此處預設回傳本地)
 */
export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  // 1. 優先檢查是否有內建講義
  const localHandout = getLocalHandout(params, chapter, sub);
  
  // 如果是內建的精選講義（非模板），則直接回傳，秒開！
  if (!localHandout.concept.includes('自行出一個')) {
    return new Promise((resolve) => setTimeout(() => resolve(localHandout), 100));
  }

  // 2. 如果沒有精選內容，且有 API Key，則嘗試動態生成以提供更高品質內容
  if (process.env.API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `針對「${params.publisher}版 ${params.grade}${params.semester}：${chapter}-${sub}」生成特教講義。包含核心觀念、3個範例。`,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json" 
        }
      });
      const data = cleanAndParse(response.text);
      if (data) return data;
    } catch (e) {
      console.warn("AI 生成失敗，改用本地模板", e);
    }
  }

  // 3. 最後手段：回傳本地模板
  return localHandout;
};

/**
 * 生成練習卷：這部分邏輯較多變，仍保留 AI 生成能力，但若無 Key 可回傳空結構
 */
export const generateHomework = async (params: SelectionParams, chapter: string, sub: string, config: HomeworkConfig): Promise<HomeworkContent> => {
  if (!process.env.API_KEY) {
    return {
      title: `${chapter} 練習卷`,
      questions: [{ type: '計算題', content: '請老師在此處補充題目。' }],
      checklist: []
    };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `生成「${chapter}-${sub}」的練習卷。難度：${config.difficulty}。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json" 
    }
  });
  const data = cleanAndParse(response.text);
  return data || { title: '生成失敗', questions: [], checklist: [] };
};
