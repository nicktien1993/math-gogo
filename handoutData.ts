
import { HandoutContent, HomeworkContent } from './types.ts';

/**
 * 內建高品質講義資料庫
 */
export const PRESET_HANDOUTS: Record<string, HandoutContent> = {
  '康軒-一年級-上-1. 10以內的數-數到5': {
    title: '數到 5：認識數字與量',
    concept: '重點一：數數時要由左到右。重點二：一個圓點代表 1。重點三：1, 2, 3, 4, 5 的順序。',
    visualAidSvg: '<svg viewBox="0 0 400 100"><circle cx="50" cy="50" r="20" fill="#3b82f6"/><circle cx="120" cy="50" r="20" fill="#3b82f6"/><circle cx="190" cy="50" r="20" fill="#3b82f6"/><circle cx="260" cy="50" r="20" fill="#3b82f6"/><circle cx="330" cy="50" r="20" fill="#3b82f6"/><text x="50" y="90" text-anchor="middle" font-weight="bold">1</text><text x="120" y="90" text-anchor="middle" font-weight="bold">2</text><text x="190" y="90" text-anchor="middle" font-weight="bold">3</text><text x="260" y="90" text-anchor="middle" font-weight="bold">4</text><text x="330" y="90" text-anchor="middle" font-weight="bold">5</text></svg>',
    examples: [
      {
        question: '盤子裡有幾個蘋果？(●●●)',
        stepByStep: [
          '步驟 1：指著第一個點說「1」。',
          '步驟 2：指著第二個點說「2」。',
          '步驟 3：指著最後一個點說「3」。',
          '最後數到的數字就是答案。'
        ],
        answer: '3 個'
      }
    ],
    tips: '提示：數過的東西可以用筆畫掉，就不會數錯囉！',
    checklist: ['我有沒有漏掉任何一個？', '我有沒有重複數同一個？']
  },
  '康軒-五年級-上-1. 因數與倍數-找出因數': {
    title: '找出因數：分配與整除',
    concept: '重點一：因數是可以把一個數「整除」的數。重點二：1 是所有整數的因數。重點三：成對尋找法。',
    visualAidSvg: '<svg viewBox="0 0 400 100"><rect x="50" y="20" width="300" height="60" rx="10" fill="#f8fafc" stroke="#cbd5e1"/><text x="200" y="55" text-anchor="middle" font-size="20">12 = 1 × 12 = 2 × 6 = 3 × 4</text></svg>',
    examples: [
      {
        question: '請找出 12 的所有因數。',
        stepByStep: [
          '步驟 1：從 1 開始，1 × 12 = 12，所以 1 和 12 是因數。',
          '步驟 2：試試 2，2 × 6 = 12，所以 2 和 6 是因數。',
          '步驟 3：試試 3，3 × 4 = 12，所以 3 和 4 是因數。',
          '步驟 4：把剛才找到的數字按從小到大排好。'
        ],
        answer: '1, 2, 3, 4, 6, 12'
      }
    ],
    tips: '提示：用「乘法表」倒著想，誰乘誰會等於這個數？',
    checklist: ['我有沒有漏掉 1 和它自己？', '中間還有數字可以整除嗎？']
  }
};

/**
 * 內建高品質練習卷資料庫
 */
export const PRESET_HOMEWORKS: Record<string, HomeworkContent> = {
  '康軒-一年級-上-1. 10以內的數-數到5': {
    title: '「數到 5」隨堂練習卷',
    questions: [
      { type: '計算題', content: '數數看，這裡有幾個圓圈？ (●●●●)', hint: '用手指頭指著一個一個數。', answer: '4 個' },
      { type: '計算題', content: '數數看，盤子裡有幾個草莓？ (●●)', hint: '最後數到的數字就是答案。', answer: '2 個' },
      { type: '應用題', content: '小華有 3 顆糖果，再拿 1 顆，現在有幾顆？', hint: '3 往後數一個。', answer: '4 顆' }
    ],
    checklist: ['我有沒有數錯？', '數字有沒有寫對？']
  }
};
