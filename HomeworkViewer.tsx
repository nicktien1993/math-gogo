
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

  if (!content || !content.questions) return (
    <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
      <div className="text-6xl mb-6">🏜️</div>
      <div className="text-slate-400 font-black text-2xl">
        練習卷內容為空，請嘗試重新生成。
      </div>
    </div>
  );
  
  const questions = Array.isArray(content.questions) ? content.questions : [];

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100">
      <style>{`
        .svg-container svg { width: 100%; height: 100%; display: block; }
        .svg-container text { font-family: 'Noto Sans TC', sans-serif; font-weight: 900; fill: #000; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="bg-[#064e3b] p-12 md:p-16 flex flex-col md:flex-row justify-between items-center text-white no-print gap-8 border-b-[12px] border-emerald-500">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter italic">
            {renderMathContent(content.title || '數學隨堂練習卷', false)}
          </h1>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span className="bg-emerald-600 px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg border border-emerald-400">
              資源班隨堂練習
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
          <button onClick={() => window.print()} className="w-full py-4 px-6 bg-emerald-400 text-[#064e3b] rounded-2xl font-black text-sm shadow-xl">
            🖨️ 直接列印
          </button>
        </div>
      </div>

      <div className="p-10 md:p-24 space-y-32">
        {/* 個人資料欄 */}
        <div className="border-b-4 border-slate-800 pb-12 mb-20 flex flex-wrap justify-between items-end gap-8">
          <div className="flex gap-12 text-3xl font-bold">
            <span className="text-slate-400">程度：{params.difficulty}</span>
            <span>姓名：__________</span>
          </div>
          <div className="text-3xl font-bold flex items-center gap-4">
            <span>得分：</span>
            <div className="w-24 h-24 border-4 border-slate-200 rounded-3xl flex items-center justify-center font-black text-slate-300">/ 100</div>
          </div>
        </div>

        {showGlobalNotes && (
          <section className="no-print bg-slate-50 p-8 rounded-[3rem] border-4 border-dashed border-slate-200 mb-20">
            <h3 className="text-xl font-black text-slate-400 mb-4 uppercase tracking-widest">計算草稿區</h3>
            <DrawingCanvas id="homework-global-notes" height={500} />
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
                      {visibleCanvas[i] ? '✕ 關閉' : '✎ 計算區'}
                    </button>
                  </div>

                  {q.visualAidSvg && (
                    <div className="mb-12">
                      {renderMathContent(q.visualAidSvg)}
                    </div>
                  )}

                  {visibleCanvas[i] && (
                    <div className="mt-8 mb-12 no-print animate-in zoom-in-95 duration-300">
                      <DrawingCanvas id={`hw-q-${i}`} height={400} />
                    </div>
                  )}
                  
                  <div className="hidden print:block w-full h-[20rem] border-4 border-dashed border-slate-50 rounded-[3rem] mt-10"></div>

                  <div className="no-print flex flex-col items-end gap-4 mt-12">
                    <button 
                      onClick={() => setVisibleAnswers(p => ({...p, [i]: !p[i]}))} 
                      className="text-xs font-black text-slate-300 hover:text-emerald-600 transition-colors uppercase tracking-widest"
                    >
                      {visibleAnswers[i] ? '隱藏答案' : '顯示解答'}
                    </button>
                    {visibleAnswers[i] && (
                      <div className="w-full bg-emerald-50 p-10 rounded-[3rem] border-2 border-emerald-100 animate-in slide-in-from-top-4 duration-300">
                        {q.hint && (
                          <div className="mb-6 flex gap-4 bg-white/50 p-6 rounded-2xl">
                            <span className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-black h-fit">提示</span>
                            <div className="text-2xl font-bold text-emerald-800">{renderMathContent(q.hint)}</div>
                          </div>
                        )}
                        <div className="bg-white p-8 rounded-2xl text-center shadow-inner">
                          <span className="text-[10px] font-black text-slate-300 uppercase mb-2 block tracking-widest">正確答案</span>
                          <div className="text-5xl font-black text-emerald-600">
                            {renderMathContent(q.answer, false)}
                          </div>
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

      {content.checklist && content.checklist.length > 0 && (
        <div className="p-16 bg-slate-50 border-t border-slate-100">
          <h3 className="text-2xl font-black text-slate-900 mb-10">自我檢查表</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {content.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-6 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
                <div className="w-10 h-10 border-4 border-slate-200 rounded-xl"></div>
                <div className="text-2xl font-bold text-slate-700">{renderMathContent(item)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-12 border-t border-slate-100 flex justify-center no-print bg-white">
        <button 
          onClick={() => window.print()} 
          className="bg-emerald-600 text-white hover:bg-emerald-700 px-16 py-6 rounded-[2.5rem] font-black transition-all shadow-2xl active:scale-95 text-3xl flex items-center gap-6"
        >
          🖨️ 確認並列印練習卷
        </button>
      </div>
    </div>
  );
};

export default HomeworkViewer;
