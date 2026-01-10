import React from 'react';
import { SelectionParams, Publisher, Grade, Semester } from './types.ts';

interface Props {
  onChange: (params: SelectionParams) => void;
  isLoading: boolean;
  params: SelectionParams;
}

const SelectionForm: React.FC<Props> = ({ onChange, isLoading, params }) => {
  const handleChange = (key: keyof SelectionParams, value: any) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">1. 課程設定</h2>
      
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-1">版本</label>
        <select 
          value={params.publisher} 
          onChange={e => handleChange('publisher', e.target.value as Publisher)} 
          disabled={isLoading}
          className="w-full border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        >
          <option value="康軒">康軒</option>
          <option value="南一">南一</option>
          <option value="翰林">翰林</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">年級</label>
          <select 
            value={params.grade} 
            onChange={e => handleChange('grade', e.target.value as Grade)} 
            disabled={isLoading}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          >
            {['一年級', '二年級', '三年級', '四年級', '五年級', '六年級'].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-1">學期</label>
          <select 
            value={params.semester} 
            onChange={e => handleChange('semester', e.target.value as Semester)} 
            disabled={isLoading}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          >
            <option value="上">上學期</option>
            <option value="下">下學期</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 pt-2 text-blue-600 animate-pulse">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-black">正在同步最新目錄...</span>
        </div>
      )}
    </div>
  );
};
export default SelectionForm;