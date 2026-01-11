
import React, { useState } from 'react';
import { HandoutContent, SelectionParams, ThemeMode } from './types.ts';
import DrawingCanvas from './DrawingCanvas.tsx';

interface Props {
  content: HandoutContent;
  params: SelectionParams;
  theme: ThemeMode;
}

export const renderMathContent = (text: any, colorCoding: boolean = true) => {
  if (text === null || text === undefined) return null;
  const contentStr = typeof text === 'string' ? text : String(text);
  
  let processed = contentStr.replace(/\\n/g, '<br/>').trim();
  const hasTags = /<[a-z][\s\S]*>/i.test(processed);
  
  if (hasTags) {
    processed = processed.replace(/<svg([\s\S]*?)>/gi, (match, attributes) => {
      let fixedAttrs = attributes
        .replace(/\bwidth=["']\d+["']/gi, '')
        .replace(/\bheight=["']\d+["']/gi, '');
      
      if (!attributes.toLowerCase().includes('viewbox')) {
        fixedAttrs += ' viewBox="0 0 400 250"'; 
      }

      return `
      <div class="relative group my-8">
        <div class="absolute inset-0 bg-slate-100/50 rounded-3xl -rotate-1 scale-[1.02] -z-10 group-hover:rotate-0 transition-transform"></div>
        <svg ${fixedAttrs} class="max-w-full h-auto mx-auto block bg-white rounded-3xl p-4 border border-slate-100 shadow-sm" style="max-height: 300px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.05));">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
      `;
    });

    if (colorCoding) {
      processed = processed.replace(/(<[^>]+>)|([\+\-×÷=><])/gi, (match, tag, symbol) => {
        if (tag) return tag;
        return `<span class="text-rose-600 font-black mx-1 inline-block transform hover:scale-110 transition-transform duration-200">${symbol}</span>`;
      });
    }

    return <span className="inline-block w-full align-middle" dangerouslySetInnerHTML={{ __html: processed }} />;
  }

  const fracRegex = /(\d+)\s*又\s*(\d+)\/(\d+)|(\d+)\/(\d+)/g;
  if (fracRegex.test(contentStr)) {
    return <span className="math-text text-3xl font-bold">{contentStr}</span>;
  }

  return <span className="math-text leading-relaxed align-middle">{contentStr}</span>;
};

// 拆分步驟標題與內文的輔助組件
const StepContent: React.FC<{ text: string }> = ({ text }) => {
  // 尋找第一個句號作為分割點
  const splitIndex = text.indexOf('。');
  
  if (splitIndex !== -1) {
    const title = text.substring(0, splitIndex + 1);
    let body = text.substring(splitIndex + 1).trim();
    
    // 移除開頭可能存在的分隔符號
    body = body.replace(/^[-\s]+/, '');

    return (
      <div className="flex flex-col gap-3">
        <div className="text-4xl font-black text-slate-900 tracking-tight leading-snug">
          {renderMathContent(title)}
        </div>
        {body && (
          <div className="text-3xl font-bold text-slate-600 leading-relaxed pt-1">
            {renderMathContent(body)}
          </div>
        )}
      </div>
    );
  }

  return <div className="text-3xl font-bold text-slate-700 leading-relaxed">{renderMathContent(text)}</div>;
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
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100">
      {/* 依照截圖風格優化 Header */}
      <div className="bg-[#0f172a] p-10 md:p-14 flex flex-col md:flex-row justify-between items-center text-white no-print gap-8 border-b-8 border-blue-600 rounded-t-[3rem]">
        <div className="text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tighter italic">
            {content.title || '數學講義'}
          </h1>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <span className="bg-blue-600 px-5 py-2 rounded-full font-black text-sm shadow-lg border border-blue-400">
              {params.grade} {params.semester}學期
            </span>
            <span className="bg-slate-800 px-5 py-2 rounded-full font-black text-sm border border-slate-600 shadow-lg">
              {params.publisher}版
            </span>
          </div>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-white text-slate-900 hover:bg-slate-50 px-10 py-4 rounded-2xl font-black transition-all shadow-2xl active:scale-95 text-xl flex items-center gap-3"
        >
          <span className="text-2xl">🖨️</span>
          <span>列印講義</span>
        </button>
      </div>

      <div className="p-8 md:p-20 space-y-24">
        {content.visualAidSvg && (
          <section className="mb-12">
            {renderMathContent(content.visualAidSvg)}
          </section>
        )}

        <section className="bg-slate-50 p-12 rounded-[3.5rem] border-4 border-dashed border-slate-200 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-100 rounded-full opacity-30"></div>
          <h2 className="text-slate-900 font-black mb-10 text-3xl tracking-tight flex items-center gap-4">
            <span className="w-4 h-12 bg-blue-600 rounded-full"></span> 核心觀念
          </h2>
          <div className="text-4xl leading-[2.2] font-bold text-slate-700">
            {renderMathContent(content.concept)}
          </div>
        </section>

        <section className="space-y-40">
          {examples.map((ex, i) => (
            <div key={i} className="relative page-break-inside-avoid animate-in fade-in duration-700">
              <div className="flex items-center gap-6 mb-12">
                <span className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl transform -rotate-3">
                  {i+1}
                </span>
                <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">範例解析</h3>
                <button 
                  onClick={() => setVisibleCanvas(p => ({...p, [`ex-${i}`]: !p[`ex-${i}`]}))} 
                  className="no-print ml-auto text-sm font-black text-slate-400 hover:text-blue-600 transition flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  {visibleCanvas[`ex-${i}`] ? '✕ 隱藏手寫板' : '✎ 開啟計算區'}
                </button>
              </div>
              
              {ex.visualAidSvg && (
                <div className="mb-14">
                  {renderMathContent(ex.visualAidSvg)}
                </div>
              )}

              <div className="text-5xl font-black mb-16 text-slate-900 leading-snug tracking-tighter">
                {renderMathContent(ex.question)}
              </div>

              {visibleCanvas[`ex-${i}`] && (
                <div className="mb-16 no-print">
                  <DrawingCanvas id={`ex-${i}`} height={500} />
                </div>
              )}

              <div className="space-y-16 bg-blue-50/40 p-14 rounded-[4rem] border-2 border-blue-100 shadow-sm relative">
                <div className="absolute top-8 left-8 text-blue-100/50 font-black text-9xl -z-10 select-none pointer-events-none">STEP</div>
                {(ex.stepByStep || []).map((s, si) => (
                  <div key={si} className="flex gap-10 items-start group">
                    <span className="w-16 h-16 rounded-full bg-white border-4 border-blue-200 flex items-center justify-center font-black text-blue-600 shrink-0 shadow-sm text-3xl">{si+1}</span>
                    <div className="flex-1 pt-1">
                      <StepContent text={s} />
                    </div>
                  </div>
                ))}
                
                <div className="mt-16 pt-16 border-t-4 border-dashed border-blue-200 flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <span className="bg-emerald-500 text-white px-8 py-2 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">答案結果</span>
                    <div className="text-6xl font-black text-emerald-600 tracking-tighter">
                      {renderMathContent(ex.answer, false)}
                    </div>
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
