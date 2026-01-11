
import { HandoutContent } from './types.ts';

/**
 * 內建高品質講義資料庫 (由老師手工校對過)
 * 只要有在這裡出現的 Key，就不會去呼叫 AI
 */
export const PRESET_HANDOUTS: Record<string, HandoutContent> = {
  '康軒-四年級-上-1. 一億以內的數-十萬位與百萬位': {
    title: '一億以內的數：認識十萬與百萬',
    concept: '重點一：十個一萬是十萬。重點二：十個十萬是一百萬。重點三：位值順序為：...、百萬位、十萬位、萬位、千位、百位、十位、個位。',
    visualAidSvg: '<svg viewBox="0 0 400 120"><rect x="10" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="50" y="75" text-anchor="middle" font-weight="bold" font-size="12">百萬位</text><rect x="110" y="40" width="80" height="50" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/><text x="150" y="75" text-anchor="middle" font-weight="bold" font-size="12">十萬位</text><rect x="210" y="40" width="80" height="50" fill="#f0fdf4" stroke="#22c55e" stroke-width="2"/><text x="250" y="75" text-anchor="middle" font-weight="bold" font-size="12">萬位</text></svg>',
    examples: [
      {
        question: '3個百萬、5個十萬和2個萬是多少？',
        stepByStep: [
          '步驟 1：找出百萬位。- 題目說是 3，所以寫下 3。',
          '步驟 2：找出十萬位。- 題目說是 5，接著寫下 5。',
          '步驟 3：補齊後面的零。- 萬位後面還有四位，所以補四個 0。'
        ],
        answer: '3520000'
      }
    ],
    exercises: [],
    tips: '提示：每四位數畫一個小撇記號，可以幫助你分清楚「萬」跟「億」喔！',
    checklist: ['我有沒有對齊位值？', '零的個數數對了嗎？']
  }
};
