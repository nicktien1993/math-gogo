
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
    concept: '重點一：十個一萬是十萬。\\n重點二：十個十萬是一百萬。\\n重點三：位值順序為：...、百萬位、十萬位、萬位、千位、百位、十位、個位。',
    visualAidSvg: '<svg viewBox="0 0 400 120"><rect x="10" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="50" y="75" text-anchor="middle" font-weight="bold">百萬位</text><rect x="110" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="150" y="75" text-anchor="middle" font-weight="bold">十萬位</text><rect x="210" y="40" width="80" height="50" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/><text x="250" y="75" text-anchor="middle" font-weight="bold">萬位</text><path d="M210 65 L190 65" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" /></marker></defs></svg>',
    examples: [
      {
        question: '例題 1：3個百萬、5個十萬和2個萬是多少？',
        stepByStep: [
          '步驟一：先看「百萬位」，題目說是 3，所以寫下 3。',
          '步驟二：再看「十萬位」，題目說是 5，接著寫下 5。',
          '步驟三：最後看「萬位」，題目說是 2，寫下 2。',
          '步驟四：因為萬位後面還有千、百、十、個位，所以要補上四個 0。'
        ],
        answer: '3520000'
      },
      {
        question: '例題 2：讀讀看數字「4,200,000」該怎麼說？',
        stepByStep: [
          '步驟一：我們從右邊開始數，每四位一組。',
          '步驟二：左邊第一位是「百萬位」，所以是「四百萬」。',
          '步驟三：接著是「十萬位」，有 2，所以是「二十萬」。',
          '步驟四：後面都是 0，不需讀出來。'
        ],
        answer: '四百二十萬'
      },
      {
        question: '例題 3：比比看，5,000,000 和 4,990,000 哪個比較大？',
        stepByStep: [
          '步驟一：先數數看兩邊各有幾位數。',
          '步驟二：兩邊都是七位數，所以我們從「左邊最大位」開始比。',
          '步驟三：左邊第一位（百萬位），5 比 4 大。',
          '步驟四：只要最大的那位比較大，整個數就比較大。'
        ],
        answer: '5,000,000 比較大'
      }
    ],
    exercises: [],
    tips: '提示：每四位數畫一個小撇記號，可以幫助你分清楚「萬」跟「億」喔！',
    checklist: ['我有沒有對齊位值？', '零的個數數對了嗎？', '有沒有正確補上後面的零？']
  },
  
  // 範例：康軒一年級上學期 - 1. 10以內的數 - 數到5
  '康軒-一年級-上-1. 10以內的數-數到5': {
    title: '數數看：1到5',
    concept: '重點一：數數要從 1 開始。\\n重點二：手指頭指著東西，數一個點一個。\\n重點三：最後數到的那個數字，就是東西的總數。',
    visualAidSvg: '<svg viewBox="0 0 300 100"><circle cx="40" cy="50" r="20" fill="#fbbf24"/><circle cx="90" cy="50" r="20" fill="#fbbf24"/><circle cx="140" cy="50" r="20" fill="#fbbf24"/><circle cx="190" cy="50" r="20" fill="#fbbf24"/><circle cx="240" cy="50" r="20" fill="#fbbf24"/><text x="40" y="55" text-anchor="middle" font-weight="bold">1</text><text x="90" y="55" text-anchor="middle" font-weight="bold">2</text><text x="140" y="55" text-anchor="middle" font-weight="bold">3</text><text x="190" y="55" text-anchor="middle" font-weight="bold">4</text><text x="240" y="55" text-anchor="middle" font-weight="bold">5</text></svg>',
    examples: [
      {
        question: '例題 1：籃子裡有幾顆蘋果？數數看。',
        stepByStep: ['拿出手指頭指著第一顆，說「1」。', '指著第二顆，說「2」。', '指著第三顆，說「3」。', '數完後最後一個數字是 3。'],
        answer: '3 顆'
      },
      {
        question: '例題 2：畫面上出現了幾顆星星？',
        stepByStep: ['從左邊開始數：1。', '數下一顆：2。', '再數一顆：3。', '再數一顆：4。', '最後一顆：5。'],
        answer: '5 顆'
      },
      {
        question: '例題 3：這裡有 2 塊積木，請圈出數字「2」。',
        stepByStep: ['先點點看積木：1、2。', '在數字卡中找到 2。', '用筆把 2 圈起來。'],
        answer: '圈出數字 2'
      }
    ],
    exercises: [],
    tips: '慢慢數，不要急，手指頭指對地方最重要！',
    checklist: ['我有指著數嗎？', '我有數對順序嗎？', '我有從 1 開始數嗎？']
  }
};

/**
 * 通用模板產生器
 * 當找不到內建講義時，回傳一個結構化的空模板，包含三個待填寫的例題框
 */
export const getTemplateHandout = (params: SelectionParams, chapter: string, sub: string): HandoutContent => {
  return {
    title: `${chapter}：${sub}`,
    concept: `重點一：掌握本單元「${sub}」的核心觀念。\\n重點二：觀察例題的解題步驟。\\n重點三：練習自行列式與計算。\\n\\n請老師在此處補充具體的教學解說內容。`,
    examples: [
      {
        question: `例題 1：[請老師補充關於「${sub}」的基礎題目]`,
        stepByStep: ['步驟一：讀懂題目意思。', '步驟二：找出題目給的數字。', '步驟三：進行計算。'],
        answer: '等待補充'
      },
      {
        question: `例題 2：[請老師補充關於「${sub}」的進階題目]`,
        stepByStep: ['步驟一：觀察題目的變化。', '步驟二：利用學過的觀念解題。', '步驟三：檢查結果。'],
        answer: '等待補充'
      },
      {
        question: `例題 3：[請老師補充關於「${sub}」的應用題目]`,
        stepByStep: ['步驟一：找出關鍵字。', '步驟二：思考怎麼列式。', '步驟三：算出最後答案。'],
        answer: '等待補充'
      }
    ],
    exercises: [],
    tips: '資源班教學建議：使用顏色標記數字，或使用具體物（如花片）輔助學生理解。',
    checklist: ['我有看清楚題目要求嗎？', '我的計算過程正確嗎？', '我有檢查最後的答案嗎？']
  };
};

/**
 * 外部呼叫接口
 */
export const getLocalHandout = (params: SelectionParams, chapter: string, sub: string): HandoutContent => {
  const key = getHandoutKey(params.publisher, params.grade, params.semester, chapter, sub);
  return PRESET_HANDOUTS[key] || getTemplateHandout(params, chapter, sub);
};
