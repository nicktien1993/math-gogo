
import React from 'react';
import { HomeworkContent, SelectionParams, ThemeMode } from './types.ts';
import { renderMathContent } from './HandoutViewer.tsx';

interface Props {
  content: HomeworkContent;
  params: SelectionParams;
  theme: ThemeMode;
}

const HomeworkViewer: React.FC<Props> = ({ content, params, theme }) => {
  if (!content) return (
    <div className="flex items-center justify-center p-20 text-slate-400 font-bold">
      正在準備練習卷...
    </div>
  );
  
  const questions = Array.isArray(content.questions) ? content.questions : [];

  return (
    <div className="bg-white p-12 md:p-24 rounded-[4rem] shadow-2xl border border-slate-100 min-h-screen print:p-0 print:shadow-none print:border-none relative">
      <div className="text-center border-b-[6px] border-slate-800 pb-16 mb-20">
        <h1 className="text-6xl font-black text-slate-900 mb-10 tracking-tighter italic">
          {content.title || '隨堂練習卷'}
        </h1>
        <div className="flex flex-wrap justify-center gap-x-16 gap-y-6 text-2xl font-bold text-slate-600">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Grade</span>
            <span className="bg-slate-100 px-4 py-1.5 rounded-xl">{params.grade}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Name</span>
            <span className="border-b-2 border-slate-300 w-48 h-8"></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-slate-300 uppercase tracking-widest">Score</span>
            <span className="border-2 border-slate-200 rounded-2xl w-24 h-12 flex items-center justify-center"></span>
          </div>
        </div>
      </div>

      <div className="space-y-40">
        {questions.map((q, i) => (
          <div key={i} className="relative page-break-inside-avoid animate-in fade-in duration-700">
            <div className="flex gap-12 items-start">
              <span className="bg-slate-900 text-white w-16 h-16 flex items-center justify-center rounded-[1.5rem] font-black text-4xl shrink-0 shadow-2xl rotate-[-2deg]">
                {i + 1}
              </span>
              <div className="flex-1 pt-2">
                {/* 顯示題目自帶的圖示 */}
                {q.visualAidSvg && (
                  <div className="mb-10 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                    {renderMathContent(q.visualAidSvg)}
                  </div>
                )}
                
                <div className="text-4xl font-bold text-slate-800 mb-16 leading-[1.8] tracking-tight">
                  {renderMathContent(q.content)}
                </div>
                
                <div className="w-full h-[35rem] border-[4px] border-dashed border-slate-100 rounded-[3.5rem] flex items-center justify-center relative bg-slate-50/20 overflow-hidden">
                  <span className="text-slate-200 font-black text-4xl opacity-40 no-print select-none tracking-widest">請在此處作答</span>
                  <div className="hidden print:block absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{
                      backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                      backgroundSize: '40px 40px'
                    }}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-32 text-slate-300 font-black text-3xl italic animate-pulse">
            AI 老師正在為您出題中...
          </div>
        )}
      </div>

      <div className="mt-32 no-print flex justify-center pb-12">
        <button onClick={() => window.print()} className="bg-slate-900 hover:bg-black text-white px-16 py-6 rounded-[2rem] font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
          <span>🖨️ 列印這份練習卷</span>
        </button>
      </div>
    </div>
  );
};

export default HomeworkViewer;
