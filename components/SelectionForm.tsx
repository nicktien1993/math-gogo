
import React from 'react';
import { SelectionParams, Grade, Semester, Difficulty, Publisher } from '../types.ts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const publishers: Publisher[] = ['康軒', '南一', '翰林'];
  const grades: Grade[] = ['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'];
  const semesters: Semester[] = ['上', '下'];
  const difficulties: Difficulty[] = ['易', '中', '難'];

  const ButtonGroup = ({ label, options, current, onSelect, columns = 3 }: any) => (
    <div className="mb-6">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
        {label}
      </label>
      <div className={`grid grid-cols-${columns} gap-2`}>
        {options.map((opt: string) => (
          <button
            key={opt}
            type="button"
            disabled={isLoading}
            onClick={() => onSelect(opt)}
            className={`
              py-3.5 px-2 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95
              ${current === opt 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 shadow-sm'
              }
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-200/60 shadow-inner">
      <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
        <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-sm shadow-md">1</span>
        課程設定
      </h2>
      
      <ButtonGroup 
        label="出版社" 
        options={publishers} 
        current={params.publisher} 
        onSelect={(v: Publisher) => handleChange('publisher', v)} 
        columns={3}
      />

      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
          學年度設定
        </label>
        <div className="flex items-center bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-xl">
          <button 
            type="button"
            onClick={() => handleChange('year', String(parseInt(params.year) - 1))}
            className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          
          <div className="flex-1 text-center">
            <span className="text-4xl font-black text-slate-800 tracking-tighter mr-1">{params.year}</span>
            <span className="text-xs font-black text-slate-400 uppercase">學年度</span>
          </div>

          <button 
            type="button"
            onClick={() => handleChange('year', String(parseInt(params.year) + 1))}
            className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <ButtonGroup 
        label="年級選取" 
        options={grades} 
        current={params.grade} 
        onSelect={(v: Grade) => handleChange('grade', v)} 
        columns={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <ButtonGroup 
          label="學期" 
          options={semesters} 
          current={params.semester} 
          onSelect={(v: Semester) => handleChange('semester', v)} 
          columns={2}
        />
        <ButtonGroup 
          label="難度" 
          options={difficulties} 
          current={params.difficulty} 
          onSelect={(v: Difficulty) => handleChange('difficulty', v)} 
          columns={3}
        />
      </div>

      {/* 單元輸入 */}
      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
          單元名稱或目標
        </label>
        <textarea
          value={params.unitTitle}
          onChange={(e) => handleChange('unitTitle', e.target.value)}
          placeholder="例如：10以內的加法、時鐘的認識、二位數加減..."
          className="w-full bg-white p-4 rounded-2xl border-2 border-slate-100 font-bold text-slate-800 focus:border-blue-500 outline-none h-32 resize-none"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !params.unitTitle.trim()}
        className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
      >
        {isLoading ? '正在編寫講義...' : '開始生成教材 ➔'}
      </button>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 pt-6 border-t border-slate-200 mt-6 animate-pulse">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            正在處理資料中...
          </span>
        </div>
      )}
    </div>
  );
};
export default SelectionForm;
