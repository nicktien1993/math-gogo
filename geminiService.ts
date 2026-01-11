
import { GoogleGenAI } from "@google/genai";
import { SelectionParams, Chapter, HandoutContent, HomeworkConfig, HomeworkContent } from './types.ts';
import { getLocalChapters } from './curriculumData.ts';
import { getLocalHandout, PRESET_HANDOUTS } from './handoutData.ts';

const SYSTEM_INSTRUCTION = `你是一位專業的國小資源班特教老師。
請注意：
1. 輸出格式必須是純 JSON，不得包含任何 Markdown 標記。
2. 禁止使用 $ 符號，數學算式直接寫純文字（如：1/2, 2x3=6）。
3. 講義內容要微步化(stepByStep)，確保特教學生易懂。
4. SVG 圖示請保持簡潔，並確保包含 viewBox 屬性以利縮放。
5. 使用台灣數學術語。
6. 講義內容必須包含 title, concept, examples (至少3題), tips, checklist。`;

const CACHE_PREFIX = 'MATH_HANDOUT_CACHE_';

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
 * 獲取講義：智慧快取機制
 */
export const generateHandoutFromText = async (params: SelectionParams, chapter: string, sub: string): Promise<HandoutContent> => {
  const cacheKey = `${CACHE_PREFIX}${params.publisher}_${params.grade}_${params.semester}_${chapter}_${sub}`;

  // 1. 優先檢查：代碼內建的「精選預設講義」
  const handoutKey = `${params.publisher}-${params.grade}-${params.semester}-${chapter}-${sub}`;
  if (PRESET_HANDOUTS[handoutKey]) {
    console.log("從內建資料庫讀取講義");
    return PRESET_HANDOUTS[handoutKey];
  }

  // 2. 次要檢查：瀏覽器快取 (localStorage)
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    try {
      console.log("從瀏覽器快取讀取講義 (秒開)");
      return JSON.parse(cachedData);
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  // 3. 若無快取且有 API Key，則調用 AI 生成
  if (process.env.API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `針對「${params.publisher}版 ${params.grade}${params.semester}：${chapter}-${sub}」為資源班學生生成專業講義。確保至少有三題解釋。`,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json" 
        }
      });
      
      const data = cleanAndParse(response.text);
      if (data && data.title) {
        // 生成成功後，存入快取
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log("AI 生成講義成功，已存入快取以供下次使用");
        return data;
      }
    } catch (e) {
      console.warn("AI 生成失敗，回傳模板", e);
    }
  }

  // 4. 最後手段：回傳本地空白模板
  return getLocalHandout(params, chapter, sub);
};

/**
 * 生成練習卷
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
    contents: `針對「${chapter}-${sub}」生成一份練習卷。難度：${config.difficulty}，計算題 ${config.calculationCount} 題，應用題 ${config.wordProblemCount} 題。`,
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json" 
    }
  });
  const data = cleanAndParse(response.text);
  return data || { title: '生成失敗', questions: [], checklist: [] };
};
