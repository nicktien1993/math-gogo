
import React from 'react';
import { SelectionParams, Difficulty, Grade } from '../types.ts';

interface Props {
  onChange: (params: SelectionParams) => void;
  onGenerate: () => void;
  isLoading: boolean;
  params: SelectionParams;
}

const SelectionForm: React.FC<Props> = ({ onChange, onGenerate, isLoading, params }) => {
  const handleChange = (key: keyof SelectionParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  const grades: Grade[] = ['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'];
  const difficulties: Difficulty[] = ['易', '中', '難'];

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm shadow-md">✨</span>
        快速生成設定
      </h2>

      {/* 年級選取 - 無預設 */}
      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
          學生的年級
        </label>
        <div className="grid grid-cols-3 gap-2">
          {grades.filter(g => g !== '').map((g) => (
            <button
              key={g}
              type="button"
              disabled={isLoading}
              onClick={() => handleChange('grade', g)}
              className={`
                py-3 rounded-xl font-black text-xs transition-all active:scale-95 border-2
                ${params.grade === g 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-blue-100'
                }
              `}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* 單元輸入 */}
      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
          教學單元名稱或目標
        </label>
        <textarea
          value={params.unitTitle}
          onChange={(e) => handleChange('unitTitle', e.target.value)}
          placeholder="例如：10以內的加法、認識時鐘的整點、50元內的找零練習..."
          className="w-full bg-slate-50 p-6 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none h-40 resize-none font-bold text-lg text-slate-800"
        />
        <p className="text-[10px] text-slate-300 mt-2 ml-1">提示：輸入越具體的目標，生成的題目越精確。</p>
      </div>

      <div className="mb-10">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
          難易度
        </label>
        <div className="grid grid-cols-3 gap-3">
          {difficulties.map((d) => (
            <button
              key={d}
              type="button"
              disabled={isLoading}
              onClick={() => handleChange('difficulty', d)}
              className={`
                py-4 rounded-2xl font-black text-sm transition-all active:scale-95
                ${params.difficulty === d 
                  ? 'bg-blue-600 text-white shadow-lg border-blue-600' 
                  : 'bg-slate-50 text-slate-400 border border-transparent hover:border-blue-100'
                }
              `}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !params.unitTitle.trim() || !params.grade}
        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
      >
        {isLoading ? '正在編寫教學內容...' : '開始生成講義 ➔'}
      </button>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 pt-8 border-t border-slate-50 mt-8 animate-pulse">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            AI 老師正在思考中...
          </span>
        </div>
      )}
    </div>
  );
};
export default SelectionForm;
