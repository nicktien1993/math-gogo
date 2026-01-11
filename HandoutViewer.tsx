
import React, { useState, useMemo } from 'react';
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
  const hasSvg = /<svg[\s\S]*?<\/svg>/i.test(processed);
  
  if (hasSvg) {
    processed = processed.replace(/(<svg[\s\S]*?<\/svg>)/gi, (svgMatch) => {
      let cleanedSvg = svgMatch
        .replace(/\bwidth=["'][^"']+["']/gi, '')
        .replace(/\bheight=["'][^"']+["']/gi, '');

      if (!cleanedSvg.toLowerCase().includes('viewbox')) {
        cleanedSvg = cleanedSvg.replace('<svg', '<svg viewBox="0 0 400 250"');
      }

      return `
      <div class="svg-visual-container relative group my-8">
        <div class="absolute inset-0 bg-slate-100/20 rounded-[3rem] -rotate-1 scale-[1.01] -z-10"></div>
        <div class="w-full max-w-2xl mx-auto block bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center" style="min-height: 200px; max-height: 400px;">
          <div class="w-full h-full flex items-center justify-center">
            ${cleanedSvg}
          </div>
        </div>
      </div>
      `;
    });

    if (colorCoding) {
      processed = processed.replace(/(<[^>]+>)|([\+\-×÷=><])/gi, (match, tag, symbol) => {
        if (tag) return tag;
        return `<span class="text-rose-600 font-black mx-1 inline-block transition-transform hover:scale-110">${symbol}</span>`;
      });
    }

    return <span className="inline-block w-full align-middle" dangerouslySetInnerHTML={{ __html: processed }} />;
  }

  if (colorCoding) {
    processed = processed.replace(/([\+\-×÷=><])/gi, (symbol) => {
      return `<span class="text-rose-600 font-black mx-1 inline-block">${symbol}</span>`;
    });
  }

  return <span className="math-text leading-relaxed align-middle" dangerouslySetInnerHTML={{ __html: processed }} />;
};

const ConceptCard: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const splitIdx = text.indexOf('：') !== -1 ? text.indexOf('：') : text.indexOf(':');
  let label = `重點 ${index + 1}`;
  let content = text;

  if (splitIdx !== -1 && splitIdx < 12) {
    label = text.substring(0, splitIdx).trim();
    content = text.substring(splitIdx + 1).trim();
  }

  return (
    <div className="group relative bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 mb-8 last:mb-0">
      <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 rounded-l-full group-hover:w-3 transition-all"></div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-xl text-xs font-black uppercase tracking-widest shadow-md">
            {label}
          </span>
          <div className="h-[2px] flex-1 bg-slate-50"></div>
        </div>
        <div className="text-3xl md:text-4xl font-black text-slate-800 leading-[1.8] tracking-tight">
          {renderMathContent(content)}
        </div>
      </div>
    </div>
  );
};

const StepContent: React.FC<{ text: string }> = ({ text }) => {
  const splitIndex = text.indexOf('。');
  if (splitIndex !== -1) {
    const title = text.substring(0, splitIndex + 1);
    let body = text.substring(splitIndex + 1).trim();
    body = body.replace(/^[-\s]+/, '');
    return (
      <div className="flex flex-col gap-3">
        <div className="text-4xl font-black text-slate-900 tracking-tight leading-snug">
          {renderMathContent(title)}
        </div>
        {body && (
          <div className="text-3xl font-bold text-slate-600 leading-relaxed pt-1 border-l-4 border-slate-100 pl-6">
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
  const [activeSteps, setActiveSteps] = useState<Record<number, number>>({});
  const [showGlobalNotes, setShowGlobalNotes] = useState(false);
  
  const structuredConcepts = useMemo(() => {
    if (!content.concept) return [];
    return content.concept
      .split(/(?=[重點\d]+\s*[:：])|\n|(?<=。)/g)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }, [content.concept]);

  if (!content) return <div className="p-20 text-center font-bold text-slate-400">講義內容載入中...</div>;

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100">
      <div className="bg-[#0f172a] p-12 md:p-16 flex flex-col md:flex-row justify-between items-center text-white no-print gap-8 border-b-[12px] border-blue-600">
        <div className="text-center md:text-left">
          <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tighter italic drop-shadow-lg">
            {content.title || '數學教學講義'}
          </h1>
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            <span className="bg-blue-600 px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg border border-blue-400 uppercase tracking-widest">
              {params.grade} {params.semester}學期
            </span>
            <span className="bg-slate-800 px-6 py-2.5 rounded-2xl font-black text-sm border border-slate-600 shadow-lg uppercase tracking-widest">
              {params.publisher}版
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-[200px]">
          <button 
            onClick={() => setShowGlobalNotes(!showGlobalNotes)} 
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${showGlobalNotes ? 'bg-rose-500 text-white' : 'bg-white text-slate-900'}`}
          >
            {showGlobalNotes ? '✕ 關閉全頁筆記' : '✏️ 開啟全頁筆記'}
          </button>
        </div>
      </div>

      <div className="p-10 md:p-24 space-y-32">
        {/* 核心觀念 */}
        <section className="relative">
          <div className="flex items-center gap-6 mb-16">
            <div className="w-4 h-14 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
            <h2 className="text-slate-900 font-black text-5xl tracking-tighter italic">核心觀念</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {structuredConcepts.map((item, idx) => (
              <ConceptCard key={idx} text={item} index={idx} />
            ))}
          </div>

          {content.visualAidSvg && (
            <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              {renderMathContent(content.visualAidSvg)}
            </div>
          )}
        </section>

        {/* 實戰範例 */}
        <section className="space-y-48">
          <div className="h-[2px] bg-slate-100 w-full"></div>
          {(content.examples || []).map((ex, i) => (
            <div key={i} className="relative page-break-inside-avoid">
              <div className="flex items-center gap-6 mb-12">
                <span className="bg-slate-900 text-white w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black text-4xl shadow-2xl transform -rotate-3 border-4 border-slate-800">
                  {i+1}
                </span>
                <h3 className="text-3xl font-black text-slate-300 uppercase tracking-widest italic">Example</h3>
                <button 
                  onClick={() => setVisibleCanvas(p => ({...p, [`ex-${i}`]: !p[`ex-${i}`]}))} 
                  className="no-print ml-auto text-sm font-black text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-200"
                >
                  {visibleCanvas[`ex-${i}`] ? '✕ 關閉手寫板' : '✎ 開啟計算區'}
                </button>
              </div>
              
              <div className="text-5xl font-black mb-16 text-slate-900 leading-[1.5] tracking-tighter">
                {renderMathContent(ex.question)}
              </div>

              {visibleCanvas[`ex-${i}`] && (
                <div className="mb-16 no-print animate-in zoom-in-95 duration-300">
                  <DrawingCanvas id={`ex-${i}`} height={550} />
                </div>
              )}

              {ex.visualAidSvg && (
                <div className="mb-14">
                  {renderMathContent(ex.visualAidSvg)}
                </div>
              )}

              <div className="space-y-16 bg-blue-50/30 p-12 md:p-16 rounded-[4.5rem] border-4 border-white shadow-[inset_0_4px_12px_rgba(0,0,0,0.02)] relative">
                {(ex.stepByStep || []).map((s, si) => (
                  <div 
                    key={si} 
                    className={`flex gap-10 items-start transition-all duration-700 ${
                      si < (activeSteps[i] || 0) || typeof window !== 'undefined' && window.location.search.includes('print')
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8 h-0 overflow-hidden'
                    }`}
                  >
                    <span className="w-16 h-16 rounded-2xl bg-white border-4 border-blue-100 flex items-center justify-center font-black text-blue-600 shrink-0 shadow-sm text-3xl">{si+1}</span>
                    <div className="flex-1 pt-1">
                      <StepContent text={s} />
                    </div>
                  </div>
                ))}
                
                <div className="mt-16 pt-16 border-t-4 border-dashed border-blue-200 flex flex-col md:flex-row items-center gap-8 min-h-[120px]">
                  { (activeSteps[i] || 0) < (ex.stepByStep || []).length ? (
                    <button 
                      onClick={() => setActiveSteps(prev => ({...prev, [i]: (prev[i] || 0) + 1}))}
                      className="no-print bg-blue-600 hover:bg-blue-700 text-white px-16 py-6 rounded-[2rem] font-black text-3xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 animate-bounce"
                    >
                      點擊看下一步 ➜
                    </button>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-8 animate-in zoom-in-95 duration-500">
                      <div className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl rotate-1">
                        最終答案
                      </div>
                      <div className="text-7xl font-black text-emerald-600 tracking-tighter drop-shadow-sm">
                        {renderMathContent(ex.answer, false)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 老師補充與全頁筆記區 */}
        {(showGlobalNotes || (typeof window !== 'undefined' && window.location.search.includes('print'))) && (
          <section className="mt-48 pt-32 border-t-8 border-slate-100 page-break-before-always">
             <div className="flex items-center gap-6 mb-16">
              <div className="w-4 h-14 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.4)]"></div>
              <h2 className="text-slate-900 font-black text-5xl tracking-tighter italic">老師補充與筆記區</h2>
            </div>
            <div className="p-8 bg-white border-4 border-dashed border-slate-200 rounded-[3rem]">
              <DrawingCanvas id="global-handout-notes" height={800} />
            </div>
          </section>
        )}
      </div>

      <div className="p-12 border-t border-slate-100 flex justify-center no-print bg-slate-50">
        <button 
          onClick={() => window.print()} 
          className="group bg-slate-900 text-white hover:bg-black px-16 py-6 rounded-[2.5rem] font-black transition-all shadow-2xl active:scale-95 text-3xl flex items-center gap-6"
        >
          <span className="group-hover:animate-bounce">🖨️</span>
          <span>立即列印講義</span>
        </button>
      </div>
    </div>
  );
};

export default HandoutViewer;
