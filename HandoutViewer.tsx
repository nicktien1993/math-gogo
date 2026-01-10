import React, { useState } from 'react';
import { HandoutContent, SelectionParams, ThemeMode } from './types.ts';
import DrawingCanvas from './DrawingCanvas.tsx';

interface Props {
  content: HandoutContent;
  params: SelectionParams;
  theme: ThemeMode;
}

export const renderMathContent = (text: any, colorCoding: boolean = true) => {
  // 核心修復：確保輸入必須為字串，避免 replace 報錯
  if (text === null || text === undefined) return null;
  const contentStr = typeof text === 'string' ? text : String(text);
  
  // 處理換行
  let processed = contentStr.replace(/\\n/g, '<br/>').trim();
  
  // 偵測是否包含標籤（如 SVG）
  const hasTags = /<[a-z][\s\S]*>/i.test(processed);
  
  if (hasTags) {
    // 注入 SVG 樣式，確保響應式縮放
    processed = processed.replace(/<svg([\s\S]*?)>/gi, (match, attributes) => {
      // 移除可能存在的固定寬高設定
      let fixedAttrs = attributes
        .replace(/\bwidth=["']\d+["']/gi, '')
        .replace(/\bheight=["']\d+["']/gi, '');
      
      // 檢查是否有 viewBox，如果沒有則嘗試補上，確保縮放正常
      if (!attributes.toLowerCase().includes('viewbox')) {
        fixedAttrs += ' viewBox="0 0 400 300"'; 
      }

      return `<svg ${fixedAttrs} class="max-w-full h-auto mx-auto block my-6" style="max-height: 320px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08));">`;
    });

    if (colorCoding) {
      // 為運算符號染色，避開標籤內的屬性（使用正規表達式排除 <> 括號內容）
      processed = processed.replace(/(<[^>]+>)|([\+\-×÷=><])/gi, (match, tag, symbol) => {
        if (tag) return tag;
        return `<span class="text-rose-600 font-black mx-1 inline-block transform hover:scale-125 transition-transform duration-200 cursor-default">${symbol}</span>`;
      });
    }

    return <span className="inline-block w-full align-middle" dangerouslySetInnerHTML={{ __html: processed }} />;
  }

  return <span className="math-text leading-relaxed align-middle">{contentStr}</span>;
};

const HandoutViewer: React.FC<Props> = ({ content, params, theme }) => {
  const [visibleCanvas, setVisibleCanvas] = useState<Record<string, boolean>>({});
  
  if (!content) return (
    <div className="flex flex-col items-center justify-center p-20 text-slate-400 font-bold">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin mb-4"></div>
      正在排版講義內容...
    </div>
  );

  const examples = Array.isArray(content.examples) ? content.examples : [];

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden print:shadow-none print:rounded-none">
      <div className="bg-slate-800 p-8 md:p-12 flex flex-col md:flex-row justify-between items-center text-white no-print gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">{content.title || '數學講義'}</h1>
          <p className="opacity-70 font-bold text-lg">{params.publisher}版 · {params.grade} {params.semester}學期</p>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-lg">
          🖨️ 列印講義
        </button>
      </div>

      <div className="p-8 md:p-16 space-y-16">
        <section className="bg-blue-50/40 p-10 rounded-[2.5rem] border-2 border-blue-100/50 shadow-inner">
          <h2 className="text-blue-600 font-black mb-8 text-xl tracking-[0.2em] flex items-center gap-3">
            <span className="w-2.5 h-8 bg-blue-600 rounded-full"></span> 核心觀念
          </h2>
          <div className="text-3xl leading-[2.5] font-bold text-slate-700">
            {renderMathContent(content.concept)}
          </div>
        </section>

        <section className="space-y-24">
          {examples.map((ex, i) => (
            <div key={i} className="relative page-break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-10">
                <span className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest shadow-md">範例教學 {i+1}</span>
                <button 
                  onClick={() => setVisibleCanvas(p => ({...p, [`ex-${i}`]: !p[`ex-${i}`]}))} 
                  className="no-print text-xs font-black text-slate-400 hover:text-blue-600 transition flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100"
                >
                  {visibleCanvas[`ex-${i}`] ? '✕ 關閉手寫板' : '✎ 開啟手寫板'}
                </button>
              </div>
              
              <div className="text-4xl font-black mb-12 text-slate-800 leading-relaxed pl-6 border-l-[10px] border-blue-50">
                {renderMathContent(ex.question)}
              </div>

              {visibleCanvas[`ex-${i}`] && (
                <div className="mb-12 no-print animate-in zoom-in-95 duration-300">
                  <DrawingCanvas id={`ex-${i}`} height={450} />
                </div>
              )}

              <div className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <div className="text-9xl font-black">?</div>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 border-b border-slate-200 pb-3 inline-block">微步化解題步驟</p>
                {(ex.stepByStep || []).map((s, si) => (
                  <div key={si} className="flex gap-8 items-start group">
                    <span className="w-12 h-12 rounded-2xl bg-white border-2 border-blue-100 flex items-center justify-center font-black text-blue-500 shrink-0 shadow-sm group-hover:border-blue-400 group-hover:bg-blue-50 transition-all text-xl">{si+1}</span>
                    <div className="text-2xl font-bold text-slate-600 pt-2 leading-relaxed flex-1">
                      {renderMathContent(s)}
                    </div>
                  </div>
                ))}
                <div className="mt-10 pt-10 border-t-4 border-dashed border-slate-200 flex flex-col md:flex-row items-baseline gap-6">
                  <span className="text-xl bg-emerald-100 text-emerald-700 px-6 py-2 rounded-xl font-black shadow-sm">正確答案</span>
                  <div className="text-5xl font-black text-emerald-600 tracking-tight">
                    {renderMathContent(ex.answer, false)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default HandoutViewer;