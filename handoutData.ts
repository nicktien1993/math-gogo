
import { HandoutContent, SelectionParams } from './types.ts';

// 建立一個 Key 的產生函數，方便查找
const getHandoutKey = (p: string, g: string, s: string, c: string, sub: string) => `${p}-${g}-${s}-${c}-${sub}`;

/**
 * 內建講義資料庫
 * 這裡儲存高品質、預先撰寫好的特教講義
 */
export const PRESET_HANDOUTS: Record<string, HandoutContent> = {
  // 範例：康軒四年級上學期 - 一億以內的數 - 十萬位與百萬位
  '康軒-四年級-上-1. 一億以內的數-十萬位與百萬位': {
    title: '一億以內的數：認識十萬與百萬',
    concept: '1. 十個一萬是十萬。\\n2. 十個十萬是一百萬。\\n3. 在位值表上，萬位的左邊是十萬位，十萬位的左邊是百萬位。',
    visualAidSvg: '<svg viewBox="0 0 400 120"><rect x="10" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="50" y="75" text-anchor="middle" font-weight="bold">百萬位</text><rect x="110" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="150" y="75" text-anchor="middle" font-weight="bold">十萬位</text><rect x="210" y="40" width="80" height="50" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/><text x="250" y="75" text-anchor="middle" font-weight="bold">萬位</text><path d="M210 65 L190 65" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" /></marker></defs></svg>',
    examples: [
      {
        question: '3個百萬、5個十萬和2個萬是多少？',
        stepByStep: [
          '先看百萬位：寫下 3',
          '再看十萬位：寫下 5',
          '最後看萬位：寫下 2',
          '萬位後面補上四個 0（代表千、百、十、個位）'
        ],
        answer: '3520000'
      }
    ],
    exercises: [],
    tips: '記得每四位數可以輕輕畫一個撇，幫助讀數。',
    checklist: ['我有沒有補齊後面的零？', '位值有沒有對齊？']
  },
  
  // 範例：康軒一年級上學期 - 1. 10以內的數 - 數到5
  '康軒-一年級-上-1. 10以內的數-數到5': {
    title: '數數看：1到5',
    concept: '我們可以用手指頭來數數看：1、2、3、4、5。',
    visualAidSvg: '<svg viewBox="0 0 300 100"><circle cx="40" cy="50" r="20" fill="#fbbf24"/><circle cx="90" cy="50" r="20" fill="#fbbf24"/><circle cx="140" cy="50" r="20" fill="#fbbf24"/><circle cx="190" cy="50" r="20" fill="#fbbf24"/><circle cx="240" cy="50" r="20" fill="#fbbf24"/><text x="40" y="55" text-anchor="middle" font-weight="bold">1</text><text x="90" y="55" text-anchor="middle" font-weight="bold">2</text><text x="140" y="55" text-anchor="middle" font-weight="bold">3</text><text x="190" y="55" text-anchor="middle" font-weight="bold">4</text><text x="240" y="55" text-anchor="middle" font-weight="bold">5</text></svg>',
    examples: [
      {
        question: '畫面中有幾個圓圈？',
        stepByStep: ['拿出手指頭指著圓圈', '點一個數一個：1, 2, 3...', '數到最後一個是 5'],
        answer: '5個'
      }
    ],
    exercises: [],
    tips: '慢慢數，不要漏掉喔！',
    checklist: ['我有指著數嗎？', '我有數對順序嗎？']
  }
};

/**
 * 通用模板產生器
 * 當找不到內建講義時，回傳一個結構化的空模板，讓老師可以用手寫板教學
 */
export const getTemplateHandout = (params: SelectionParams, chapter: string, sub: string): HandoutContent => {
  return {
    title: `${chapter}：${sub}`,
    concept: `本單元「${sub}」的核心目標是讓學生掌握基礎運算與概念理解。\\n\\n請老師利用下方寫字板補充具體的解說內容。`,
    examples: [
      {
        question: `這裡請老師自行出一個關於「${sub}」的基礎例題。`,
        stepByStep: ['步驟一：觀察題目', '步驟二：找出關鍵字', '步驟三：列出算式'],
        answer: '等待作答'
      }
    ],
    exercises: [],
    tips: '對於資源班學生，建議多使用具體教具輔助。',
    checklist: ['我有讀完題目嗎？', '我有檢查答案嗎？']
  };
};

/**
 * 外部呼叫接口
 */
export const getLocalHandout = (params: SelectionParams, chapter: string, sub: string): HandoutContent => {
  const key = getHandoutKey(params.publisher, params.grade, params.semester, chapter, sub);
  return PRESET_HANDOUTS[key] || getTemplateHandout(params, chapter, sub);
};
