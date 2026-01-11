
import { Publisher, Grade, Semester, Chapter } from './types.ts';

type CurriculumDB = {
  [key in Publisher]?: {
    [key in Grade]: {
      [key in Semester]: Chapter[];
    };
  };
};

export const CURRICULUM_DATA: CurriculumDB = {
  '康軒': {
    '一年級': {
      '上': [
        { id: 'k1u1', title: '1. 10以內的數', subChapters: ['數到5', '數到10', '0的認識', '數的順序與大小'] },
        { id: 'k1u2', title: '2. 比長短', subChapters: ['長短的比較', '長短的測量'] },
        { id: 'k1u3', title: '3. 10以內的加法', subChapters: ['合起來', '加法算式', '0的加法'] },
        { id: 'k1u4', title: '4. 位置與形狀', subChapters: ['認識前後左右', '認識圓形、三角形、正方形'] },
        { id: 'k1u5', title: '5. 30以內的數', subChapters: ['數到30', '位值'] }
      ],
      '下': [
        { id: 'k1d1', title: '1. 20以內的數', subChapters: ['數到20', '數的順序', '兩兩一數'] },
        { id: 'k1d2', title: '2. 10以內的減法', subChapters: ['剩下來', '減法算式', '被減數為0'] },
        { id: 'k1d3', title: '3. 認識圖形', subChapters: ['平面圖形', '堆堆看'] },
        { id: 'k1d4', title: '4. 50以內的數', subChapters: ['數到50', '50以內的加減'] },
        { id: 'k1d5', title: '5. 認識錢幣', subChapters: ['1元、5元、10元', '錢幣換算'] }
      ]
    },
    '二年級': {
      '上': [
        { id: 'k2u1', title: '1. 200以內的數', subChapters: ['數到200', '百位、十位、個位', '數的大小'] },
        { id: 'k2u2', title: '2. 二位數的加減', subChapters: ['二位數加法(進位)', '二位數減法(退位)'] },
        { id: 'k2u3', title: '3. 長度', subChapters: ['認識公分', '用尺量量看', '公分的加減'] },
        { id: 'k2u4', title: '4. 乘法(一)', subChapters: ['認識乘法', '2、5、10的乘法'] }
      ],
      '下': [
        { id: 'k2d1', title: '1. 1000以內的數', subChapters: ['數到1000', '錢幣的換算', '數的大小比較'] },
        { id: 'k2d2', title: '2. 乘法(二)', subChapters: ['3、4的乘法', '6、7、8、9的乘法'] },
        { id: 'k2d3', title: '3. 分數', subChapters: ['幾分之一', '分數的大小'] },
        { id: 'k2d4', title: '4. 公尺', subChapters: ['認識公尺', '公尺與公分的換算'] }
      ]
    },
    '三年級': {
      '上': [
        { id: 'k3u1', title: '1. 四位數', subChapters: ['數到10000', '數的大小', '錢幣換算'] },
        { id: 'k3u2', title: '2. 加與減', subChapters: ['三、四位數加法', '三、四位數減法'] },
        { id: 'k3u3', title: '3. 乘法', subChapters: ['二、三位數乘一位數', '乘法估算'] },
        { id: 'k3u4', title: '4. 除法', subChapters: ['認識除法', '二、三位數除以一位數'] }
      ],
      '下': [
        { id: 'k3d1', title: '1. 除法', subChapters: ['除法算式', '除法的驗算'] },
        { id: 'k3d2', title: '2. 時間', subChapters: ['時間單位(分、秒)', '時間的換算與加減'] },
        { id: 'k3d3', title: '3. 小數', subChapters: ['一位小數', '小數的大小比較', '小數的加減'] }
      ]
    },
    '四年級': {
      '上': [
        { id: 'k4u1', title: '1. 一億以內的數', subChapters: ['十萬位與百萬位', '千萬位與億位', '數的大小比較'] },
        { id: 'k4u2', title: '2. 乘法', subChapters: ['三位數乘二位數', '乘法的估算'] },
        { id: 'k4u3', title: '3. 除法', subChapters: ['三位數除以二位數', '除法的驗算'] },
        { id: 'k4u4', title: '4. 角度', subChapters: ['認識角與度', '量角器的使用', '角度的加減'] }
      ],
      '下': [
        { id: 'k4d1', title: '1. 分數', subChapters: ['真分數與假分數', '帶分數', '同分母加減'] },
        { id: 'k4d2', title: '2. 小數', subChapters: ['二位小數', '小數的大小與加減'] },
        { id: 'k4d3', title: '3. 四則運算', subChapters: ['兩步驟運算', '括號的使用', '先乘除後加減'] },
        { id: 'k4d4', title: '4. 面積', subChapters: ['正方形面積', '長方形面積'] }
      ]
    },
    '五年級': {
      '上': [
        { id: 'k5u1', title: '1. 因數與倍數', subChapters: ['找出因數', '找出倍數', '公因數與公倍數'] },
        { id: 'k5u2', title: '2. 分數', subChapters: ['擴分與約分', '通分', '異分母分數大小比較'] },
        { id: 'k5u3', title: '3. 面積', subChapters: ['三角形面積', '平行四邊形面積', '梯形面積'] },
        { id: 'k5u4', title: '4. 小數乘法', subChapters: ['小數乘整數', '小數乘小數'] }
      ],
      '下': [
        { id: 'k5d1', title: '1. 分數除法', subChapters: ['分數除以整數', '分數乘分數'] },
        { id: 'k5d2', title: '2. 容積與重量', subChapters: ['認識公升與毫升', '重量的加減'] },
        { id: 'k5d3', title: '3. 比率與百分率', subChapters: ['認識比率', '認識百分率'] },
        { id: 'k5d4', title: '4. 扇形', subChapters: ['認識扇形', '扇形的面積初步'] }
      ]
    },
    '六年級': {
      '上': [
        { id: 'k6u1', title: '1. 最大公因數', subChapters: ['質數與合數', '質因數分解', '最大公因數求法'] },
        { id: 'k6u2', title: '2. 分數除法', subChapters: ['分數除以分數', '倒數'] },
        { id: 'k6u3', title: '3. 比與比值', subChapters: ['認識比', '最簡整數比', '比例式'] },
        { id: 'k6u4', title: '4. 圓周率與圓面積', subChapters: ['認識圓周率', '圓周長', '圓面積'] }
      ],
      '下': [
        { id: 'k6d1', title: '1. 速度', subChapters: ['認識速度', '距離與時間', '速度的換算'] },
        { id: 'k6d2', title: '2. 柱體體積', subChapters: ['角柱體積', '圓柱體積'] },
        { id: 'k6d3', title: '3. 基準量與比較量', subChapters: ['母子問題', '兩數之差'] },
        { id: 'k6d4', title: '4. 統計圖表', subChapters: ['圓形圖', '折線圖'] }
      ]
    }
  }
};

export const getLocalChapters = (publisher: Publisher, grade: Grade, semester: Semester): Chapter[] => {
  return CURRICULUM_DATA[publisher]?.[grade]?.[semester] || [];
};
