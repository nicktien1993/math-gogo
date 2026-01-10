
import { Publisher, Grade, Semester, Chapter } from './types.ts';

type CurriculumDB = {
  [key in Publisher]: {
    [key in Grade]: {
      [key in Semester]: Chapter[];
    };
  };
};

// 這裡提供精選的常用目錄範本，老師可根據需求擴充
export const CURRICULUM_DATA: CurriculumDB = {
  '康軒': {
    '一年級': {
      '上': [
        { id: 'k1u1', title: '1. 10以內的數', subChapters: ['數到5', '數到10', '0的認識'] },
        { id: 'k1u2', title: '2. 比長短', subChapters: ['長短的比較', '長短的測量'] },
        { id: 'k1u3', title: '3. 10以內的加法', subChapters: ['合起來', '加法算式'] }
      ],
      '下': [
        { id: 'k1d1', title: '1. 20以內的數', subChapters: ['數到20', '數的順序'] },
        { id: 'k1d2', title: '2. 圖形與分類', subChapters: ['認識形狀', '簡單分類'] }
      ]
    },
    '二年級': { '上': [], '下': [] },
    '三年級': { '上': [], '下': [] },
    '四年級': {
      '上': [
        { id: 'k4u1', title: '1. 一億以內的數', subChapters: ['十萬位與百萬位', '千萬位與億位', '數的大小比較'] },
        { id: 'k4u2', title: '2. 乘法', subChapters: ['三位數乘二位數', '乘法的估算'] },
        { id: 'k4u3', title: '3. 除法', subChapters: ['三位數除以二位數', '除法的驗算'] },
        { id: 'k4u4', title: '4. 公里', subChapters: ['公里的認識', '公里的換算與計算'] },
        { id: 'k4u5', title: '5. 角度', subChapters: ['認識角與度', '量角器的使用', '角度的加減'] }
      ],
      '下': [
        { id: 'k4d1', title: '1. 分數', subChapters: ['真分數與假分數', '帶分數', '同分母加減'] },
        { id: 'k4d2', title: '2. 小數', subChapters: ['二位小數', '小數的大小與加減'] }
      ]
    },
    '五年級': { '上': [], '下': [] },
    '六年級': { '上': [], '下': [] }
  },
  '南一': {
    '一年級': { '上': [], '下': [] },
    '二年級': { '上': [], '下': [] },
    '三年級': { '上': [], '下': [] },
    '四年級': {
      '上': [
        { id: 'n4u1', title: '1. 大數的認識', subChapters: ['五位以上的數', '大數的加減'] },
        { id: 'n4u2', title: '2. 乘法與除法', subChapters: ['多位數乘法', '除以二位數'] }
      ],
      '下': []
    },
    '五年級': { '上': [], '下': [] },
    '六年級': { '上': [], '下': [] }
  },
  '翰林': {
    '一年級': { '上': [], '下': [] },
    '二年級': { '上': [], '下': [] },
    '三年級': { '上': [], '下': [] },
    '四年級': {
      '上': [
        { id: 'h4u1', title: '1. 億以內的數', subChapters: ['讀數與寫數', '數的大小比較'] },
        { id: 'h4u2', title: '2. 角度', subChapters: ['角度的大小', '畫角'] }
      ],
      '下': []
    },
    '五年級': { '上': [], '下': [] },
    '六年級': { '上': [], '下': [] }
  }
};

// 模擬動態資料補完：如果某個區間是空的，回傳一個通用範本以確保系統不壞掉
export const getLocalChapters = (publisher: Publisher, grade: Grade, semester: Semester): Chapter[] => {
  const data = CURRICULUM_DATA[publisher]?.[grade]?.[semester];
  if (data && data.length > 0) return data;
  
  // 預設回傳各年級通用的基礎單元 (Fallback)
  return [
    { id: 'f1', title: '1. 整數運算', subChapters: ['加與減', '乘與除'] },
    { id: 'f2', title: '2. 分數概念', subChapters: ['認識分數', '等值分數'] },
    { id: 'f3', title: '3. 圖形與幾何', subChapters: ['認識形狀', '周長與面積'] },
    { id: 'f4', title: '4. 時間與測量', subChapters: ['時間的計算', '長度與容量'] }
  ];
};
