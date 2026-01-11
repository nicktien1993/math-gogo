
import { HandoutContent } from './types.ts';

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
  },
  '康軒-四年級-上-1. 一億以內的數-十萬位與百萬位': {
    title: '一億以內的數：認識十萬與百萬',
    concept: '重點一：十個一萬是十萬。重點二：十個十萬是一百萬。重點三：位值順序為：...、百萬位、十萬位、萬位、千位、百位、十位、個位。',
    visualAidSvg: '<svg viewBox="0 0 400 120"><rect x="10" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="50" y="75" text-anchor="middle" font-weight="bold" font-size="12">百萬位</text><rect x="110" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="150" y="75" text-anchor="middle" font-weight="bold" font-size="12">十萬位</text><rect x="210" y="40" width="80" height="50" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/><text x="250" y="75" text-anchor="middle" font-weight="bold" font-size="12">萬位</text></svg>',
    examples: [
      {
        question: '3個百萬、5個十萬和2個萬是多少？',
        stepByStep: [
          '步驟 1：找出百萬位，寫下 3。',
          '步驟 2：找出十萬位，接著寫下 5。',
          '步驟 3：找出萬位，寫下 2。',
          '步驟 4：萬位後面還有四位(千、百、十、個)，所以補四個 0。'
        ],
        answer: '3520000'
      }
    ],
    exercises: [],
    tips: '提示：每四位數畫一個小撇記號，可以幫助你分清楚「萬」跟「億」喔！',
    checklist: ['我有沒有對齊位值？', '零的個數數對了嗎？']
  }
};
