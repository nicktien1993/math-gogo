
import React from 'react';
import { Chapter } from './types.ts';

interface Props {
  chapters: Chapter[];
  onSelect: (chapterTitle: string, subChapter: string) => void;
  isLoading: boolean;
}

const ChapterSelector: React.FC<Props> = ({ chapters, onSelect, isLoading }) => {
  const safeChapters = Array.isArray(chapters) ? chapters : [];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">2. 選擇章節</h2>
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {safeChapters.map((chapter, i) => {
          const chapterTitle = chapter?.title || `單元 ${i + 1}`;
          return (
            <div key={i} className="border-l-4 border-blue-100 pl-4 py-1">
              <h3 className="font-bold text-slate-900 mb-3 tracking-tight text-lg">{chapterTitle}</h3>
              <div className="grid gap-2">
                {(chapter?.subChapters || []).map((sub, j) => (
                  <button 
                    key={j}
                    onClick={() => onSelect(chapterTitle, sub)}
                    disabled={isLoading}
                    className="text-left text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 px-4 py-2.5 rounded-xl transition-all border border-transparent hover:border-blue-100 disabled:opacity-50"
                  >
                    {sub || '未知子單元'}
                  </button>
                ))}
                {(!chapter?.subChapters || chapter.subChapters.length === 0) && (
                  <div className="text-xs text-slate-300 italic px-4">無子單元</div>
                )}
              </div>
            </div>
          );
        })}
        {safeChapters.length === 0 && !isLoading && (
          <div className="text-center py-10 text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
            請點擊上方按鈕查詢目錄
          </div>
        )}
      </div>
    </div>
  );
};
export default ChapterSelector;
