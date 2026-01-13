
import React, { useState, useMemo, useRef } from 'react';
import { HandoutContent, SelectionParams, ThemeMode } from '../types.ts';
import DrawingCanvas from './DrawingCanvas.tsx';

interface Props {
  content: HandoutContent;
  params: SelectionParams;
  theme: ThemeMode;
}

declare var html2pdf: any;

/**
 * 通用數學內容渲染函數
 * 具備 $ 符號過濾與 SVG 透明化處理
 */
export const renderMathContent = (text: any, colorCoding: boolean = true) => {
  if (text === null || text === undefined) return null;
  let contentStr = typeof text === 'string' ? text : String(text);
  
  // 【最核心修復】：在所有邏輯開始前，強制移除所有 $ 符號
  contentStr = contentStr.replace(/\$/g, '');

  let processed = contentStr.replace(/\\n/g, '<br/>').trim();
  const hasSvg = /<svg[\s\S]*?<\/svg>/i.test(processed);
  
  if (hasSvg) {
    processed = processed.replace(/(<svg[\s\S]*?<\/svg>)/gi, (svgMatch) => {
      let cleanedSvg = svgMatch
        .replace(/\bwidth=["'][^"']+["']/gi, '')
        .replace(/\bheight=["'][^"']+["']/gi, '');

      // 強制將所有圖形元素的填充設為 none，確保不遮擋文字
      cleanedSvg = cleanedSvg.replace(/<rect([^>]*)fill=["'][^"']+["']([^>]*)>/gi, '<rect$1fill="none"$2>');
      cleanedSvg = cleanedSvg.replace(/<circle([^>]*)fill=["'][^"']+["']([^>]*)>/gi, '<circle$1fill="none"$2>');
      cleanedSvg = cleanedSvg.replace(/<ellipse([^>]*)fill=["'][^"']+["']([^>]*)>/gi, '<ellipse$1fill="none"$2>');
      cleanedSvg = cleanedSvg.replace(/<path([^>]*)fill=["'][^"']+["']([^>]*)>/gi, '<path$1fill="none"$2>');

      // 如果標籤內完全沒有 fill 屬性，則在標籤開頭注入 fill="none"
      cleanedSvg = cleanedSvg.replace(/<(rect|circle|ellipse|path)(?![^>]*fill=)([^>]*)>/gi, '<$1 fill="none"$2>');

      // 強制確保有 viewBox
      if (!cleanedSvg.toLowerCase().includes('viewbox')) {
        cleanedSvg = cleanedSvg.replace('<svg', '<svg viewBox="0 0 400 400"');
      }

      return `
      <div class="svg-container my-8 bg-white border-2 border-slate-50 rounded-[2.5rem] p-6 flex items-center justify-center shadow-inner" style="min-height: 300px;">
        <div class="w-full h-full max-w-[380px] max-h-[380px]">
          ${cleanedSvg}
        </div>
      </div>
      `;
    });

    if (colorCoding) {
      // 為數學符號加上顏色（避開 HTML 標籤內部的內容）
      processed = processed.replace(/(<[^>]+>)|([\+\-×÷=><])/gi, (match, tag, symbol) => {
        if (tag) return tag;
        return `<span class="text-rose-600 font-black mx-1 inline-block">${symbol}</span>`;
      });
    }

    return <span className="inline-block w-full align-middle" dangerouslySetInnerHTML={{ __html: processed }} />;
  }

  if (colorCoding) {
    processed = processed.replace(/([\+\-×÷=><])/gi, (symbol) => {
      return `<span class="text-rose-600 font-black mx-1 inline-block">${symbol}</span>`;
    });
  }

  return <span className="math-text leading-relaxed align-middle font-bold" dangerouslySetInnerHTML={{ __html: processed }} />;
};

const ConceptCard: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const splitIdx = text.indexOf('：') !== -1 ? text.indexOf('：') : text.indexOf(':');
  let label = `重點 ${index + 1}`;
  let content = text;

  if (splitIdx !== -1 && splitIdx < 15) {
    label = text.substring(0, splitIdx).trim();
    content = text.substring(splitIdx + 1).trim();
  }

  return (
    <div className="group relative bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-md transition-all mb-6 last:mb-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            {label}
          </span>
          <div className="h-[1px] flex-1 bg-slate-100"></div>
        </div>
        <div className="text-3xl font-bold text-slate-800 leading-relaxed">
          {renderMathContent(content)}
        </div>
      </div>
    </div>
  );
};

const HandoutViewer: React.FC<Props> = ({ content, params, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCanvas, setVisibleCanvas] = useState<Record<string, boolean>>({});
  const [activeSteps, setActiveSteps] = useState<Record<number, number>>({});
  
  const structuredConcepts = useMemo(() => {
    if (!content.concept) return [];
    return content.concept
      .split(/\n|(?<=。)/g)
      .map(s => s.trim())
      .filter(s => s.length > 2);
  }, [content.concept]);

  const handleExportPDF = () => {
    const opt = {
      margin: 10,
      filename: `講義_${content.title || '數學'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(containerRef.current).save();
  };

  return (
    <div ref={containerRef} className="bg-white rounded-[3rem] shadow-xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100">
      <style>{`
        .svg-container svg { width: 100%; height: 100%; display: block; }
        .svg-container text { font-family: 'Noto Sans TC', sans-serif; font-weight: 900; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="no-print p-6 border-b flex justify-end gap-3 sticky top-0 bg-white/95 backdrop-blur z-50 shadow-sm">
        <button onClick={handleExportPDF} className="bg-rose-500 text-white px-6 py-2 rounded-xl font-black text-sm shadow-md hover:bg-rose-600 transition-all flex items-center gap-2">
          下載 PDF
        </button>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-black text-sm shadow-md transition-all">
          列印
        </button>
      </div>

      <div className="bg-slate-900 p-12 text-white border-b-8 border-blue-600">
        <h1 className="text-5xl font-black mb-6 tracking-tight">
          {renderMathContent(content.title || '教學講義', false)}
        </h1>
        <div className="flex gap-3">
          <span className="bg-blue-600 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
            {params.grade}
          </span>
          <span className="bg-slate-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
            {params.difficulty} 難度
          </span>
        </div>
      </div>

      <div className="p-10 md:p-16 space-y-24">
        <section>
          <h2 className="text-slate-900 font-black text-4xl mb-10 flex items-center gap-4">
            <span className="w-2 h-10 bg-blue-600 rounded-full"></span> 核心觀念
          </h2>
          
          <div className="space-y-4">
            {structuredConcepts.map((item, idx) => (
              <ConceptCard key={idx} text={item} index={idx} />
            ))}
          </div>

          {content.visualAidSvg && (
            <div className="mt-12">
              {renderMathContent(content.visualAidSvg)}
            </div>
          )}
        </section>

        <section className="space-y-24">
          <div className="h-[1px] bg-slate-100 w-full"></div>
          {(content.examples || []).map((ex, i) => (
            <div key={i} className="page-break-inside-avoid">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <span className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">
                    {i+1}
                  </span>
                  <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Example</h3>
                </div>
                <button 
                  onClick={() => setVisibleCanvas(p => ({...p, [`ex-${i}`]: !p[`ex-${i}`]}))} 
                  className="no-print text-[10px] font-black text-slate-400 px-4 py-2 bg-white rounded-xl border border-slate-100 hover:border-blue-200 transition-all shadow-sm"
                >
                  {visibleCanvas[`ex-${i}`] ? '✕ 關閉寫字板' : '✏️ 開啟寫字板'}
                </button>
              </div>
              
              <div className="text-4xl font-black mb-10 text-slate-800 leading-snug tracking-tight">
                {renderMathContent(ex.question)}
              </div>

              {visibleCanvas[`ex-${i}`] && (
                <div className="mb-10 no-print">
                  <DrawingCanvas id={`ex-${i}`} height={400} />
                </div>
              )}

              {ex.visualAidSvg && (
                <div className="mb-10">
                  {renderMathContent(ex.visualAidSvg)}
                </div>
              )}

              <div className="space-y-6 bg-blue-50/20 p-8 rounded-[2.5rem] border-2 border-blue-50 shadow-inner relative">
                {(ex.stepByStep || []).map((s, si) => (
                  <div 
                    key={si} 
                    className={`flex gap-6 items-start transition-all duration-500 ${
                      si < (activeSteps[i] || 0) || (typeof window !== 'undefined' && window.location.search.includes('print'))
                        ? 'opacity-100' 
                        : 'opacity-0 h-0 overflow-hidden'
                    }`}
                  >
                    <span className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center font-black text-blue-600 shrink-0 shadow-sm text-lg">{si+1}</span>
                    <div className="text-2xl font-bold text-slate-700 pt-1 leading-relaxed">
                      {renderMathContent(s)}
                    </div>
                  </div>
                ))}
                
                <div className="mt-8 pt-8 border-t border-dashed border-blue-100 flex items-center gap-6">
                  { (activeSteps[i] || 0) < (ex.stepByStep || []).length ? (
                    <button 
                      onClick={() => setActiveSteps(prev => ({...prev, [i]: (prev[i] || 0) + 1}))}
                      className="no-print bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black text-xl shadow-lg transition-all"
                    >
                      下一步 ➜
                    </button>
                  ) : (
                    <div className="flex items-center gap-6 animate-in zoom-in-95">
                      <div className="bg-emerald-500 text-white px-4 py-1 rounded-lg font-black text-[10px] shadow-md">
                        答案
                      </div>
                      <div className="text-5xl font-black text-emerald-600 tracking-tighter">
                        {renderMathContent(ex.answer, false)}
                      </div>
                    </div>
                  )}
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
