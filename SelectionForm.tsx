
import React from 'react';
import { SelectionParams, Publisher, Grade, Semester, Difficulty } from './types.ts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onChange: (params: SelectionParams) => void;
  isLoading: boolean;
  params: SelectionParams;
}

const SelectionForm: React.FC<Props> = ({ onChange, isLoading, params }) => {
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
      
      {/* 數位學年度調整器 */}
      <div className="mb-8">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
          學年度設定
        </label>
        <div className="flex items-center bg-white p-2 rounded-[2rem] border-2 border-slate-100 shadow-xl">
          <button 
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
            onClick={() => handleChange('year', String(parseInt(params.year) + 1))}
            className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors"
          >
            <ChevronRight size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      <ButtonGroup 
        label="出版商版本" 
        options={publishers} 
        current={params.publisher} 
        onSelect={(v: Publisher) => handleChange('publisher', v)} 
      />

      <ButtonGroup 
        label="年級" 
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
          label="教材難度" 
          options={difficulties} 
          current={params.difficulty} 
          onSelect={(v: Difficulty) => handleChange('difficulty', v)} 
          columns={3}
        />
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 pt-6 border-t border-slate-200 mt-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          </div>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            正在同步最新課程資料...
          </span>
        </div>
      )}
    </div>
  );
};
export default SelectionForm;
