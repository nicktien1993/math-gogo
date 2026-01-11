
import React, { useRef, useState, useMemo } from 'react';
import { HomeworkContent, SelectionParams, ThemeMode } from './types.ts';
import DrawingCanvas from './DrawingCanvas.tsx';
import { renderMathContent } from './HandoutViewer.tsx';

interface Props {
  content: HomeworkContent;
  params: SelectionParams;
  theme: ThemeMode;
}

const HomeworkViewer: React.FC<Props> = ({ content, params, theme }) => {
  const [visibleAnswers, setVisibleAnswers] = useState<Record<number, boolean>>({});
  const [visibleCanvas, setVisibleCanvas] = useState<Record<number, boolean>>({});
  const [showGlobalNotes, setShowGlobalNotes] = useState(false);

  if (!content) return (
    <div className="flex items-center justify-center p-20 text-slate-400 font-bold">
      正在準備練習卷...
    </div>
  );
  
  const questions = Array.isArray(content.questions) ? content.questions : [];

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100">
      <div className="bg-[#1e293b] p-12 md:p-16 flex flex-col md:flex-row justify-between items-center text-white no-print gap-8 border-b-[12px] border-emerald-600">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter italic">
            {content.title || '數學隨堂練習卷'}
          </h1>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span className="bg-emerald-600 px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg border border-emerald-400">
              {params.grade} 練習卷
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-[200px]">
          <button 
            onClick={() => setShowGlobalNotes(!showGlobalNotes)} 
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-3 ${showGlobalNotes ? 'bg-rose-500 text-white' : 'bg-white text-slate-900'}`}
          >
            {showGlobalNotes ? '✕ 關閉草稿區' : '✏️ 開啟計算草稿區'}
          </button>
        </div>
      </div>

      <div className="p-10 md:p-24 space-y-32">
        {/* 個人資料欄 (僅列印或頂部顯示) */}
        <div className="border-b-4 border-slate-800 pb-12 mb-20 flex flex-wrap justify-between items-end gap-8">
          <div className="flex gap-12 text-3xl font-bold">
            <span className="text-slate-400">年級：{params.grade}</span>
            <span>姓名：__________</span>
          </div>
          <div className="text-3xl font-bold flex items-center gap-4">
            <span>得分：</span>
            <div className="w-24 h-24 border-4 border-slate-200 rounded-3xl flex items-center justify-center"></div>
          </div>
        </div>

        {/* 全頁草稿區 */}
        {showGlobalNotes && (
          <section className="no-print bg-slate-50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200">
            <h3 className="text-xl font-black text-slate-400 mb-4 uppercase tracking-widest">計算草稿區</h3>
            <DrawingCanvas id="homework-global-notes" height={600} />
          </section>
        )}

        <div className="space-y-48">
          {questions.map((q, i) => (
            <div key={i} className="relative page-break-inside-avoid">
              <div className="flex gap-10 items-start">
                <span className="bg-emerald-600 text-white w-16 h-16 flex items-center justify-center rounded-[1.5rem] font-black text-4xl shrink-0 shadow-xl">
                  {i + 1}
                </span>
                <div className="flex-1 pt-2">
                  <div className="flex justify-between items-start mb-10">
                    <div className="text-4xl font-bold text-slate-800 flex-1 leading-[1.8]">
                      {renderMathContent(q.content)}
                    </div>
                    <button 
                      onClick={() => setVisibleCanvas(p => ({...p, [i]: !p[i]}))} 
                      className="no-print shrink-0 bg-white border-2 border-slate-100 text-slate-500 px-6 py-3 rounded-2xl text-sm font-black shadow-sm hover:border-emerald-200 transition-all"
                    >
                      {visibleCanvas[i] ? '✕ 關閉計算區' : '✎ 計算區'}
                    </button>
                  </div>

                  {q.visualAidSvg && (
                    <div className="mb-12">
                      {renderMathContent(q.visualAidSvg)}
                    </div>
                  )}

                  {visibleCanvas[i] && (
                    <div className="mt-8 mb-12 no-print animate-in zoom-in-95 duration-300">
                      <DrawingCanvas id={`hw-q-${i}`} height={450} />
                    </div>
                  )}
                  
                  {/* 列印用的留白區 */}
                  <div className="hidden print:block w-full h-[25rem] border-4 border-dashed border-slate-100 rounded-[3rem] mt-10"></div>

                  <div className="no-print flex flex-col items-end gap-4 mt-12">
                    <button 
                      onClick={() => setVisibleAnswers(p => ({...p, [i]: !p[i]}))} 
                      className="text-xs font-black text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {visibleAnswers[i] ? '隱藏提示與解答' : '顯示提示與解答'}
                    </button>
                    {visibleAnswers[i] && (
                      <div className="w-full bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 animate-in fade-in duration-500">
                        {q.hint && (
                          <div className="mb-6 flex gap-4">
                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black h-fit">HINT</span>
                            <div className="text-2xl font-bold text-emerald-800">{renderMathContent(q.hint)}</div>
                          </div>
                        )}
                        <div className="bg-white p-8 rounded-2xl text-center">
                          <span className="text-[10px] font-black text-slate-300 uppercase mb-2 block">ANSWER</span>
                          <div className="text-5xl font-black text-emerald-600">{renderMathContent(q.answer, false)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-12 border-t border-slate-100 flex justify-center no-print bg-slate-50">
        <button 
          onClick={() => window.print()} 
          className="bg-emerald-600 text-white hover:bg-emerald-700 px-16 py-6 rounded-[2.5rem] font-black transition-all shadow-2xl active:scale-95 text-3xl flex items-center gap-6"
        >
          🖨️ 列印練習卷
        </button>
      </div>
    </div>
  );
};

export default HomeworkViewer;
