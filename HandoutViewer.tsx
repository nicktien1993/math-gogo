
import React, { useState, useMemo, useRef } from 'react';
import { HandoutContent, SelectionParams, ThemeMode } from './types.ts';
import DrawingCanvas from './DrawingCanvas.tsx';

interface Props {
  content: HandoutContent;
  params: SelectionParams;
  theme: ThemeMode;
}

declare var html2pdf: any;

export const renderMathContent = (text: any, colorCoding: boolean = true) => {
  if (text === null || text === undefined) return null;
  let contentStr = typeof text === 'string' ? text : String(text);
  
  // 1. 強制移除所有 $ 符號，避免 AI 產出的 LaTeX 影響閱讀
  contentStr = contentStr.replace(/\$/g, '');

  let processed = contentStr.replace(/\\n/g, '<br/>').trim();
  const hasSvg = /<svg[\s\S]*?<\/svg>/i.test(processed);
  
  if (hasSvg) {
    processed = processed.replace(/(<svg[\s\S]*?<\/svg>)/gi, (svgMatch) => {
      // 2. 處理 SVG 遮擋問題：確保 rect, circle 等圖形不具備遮擋文字的填充色
      let cleanedSvg = svgMatch
        .replace(/\bwidth=["'][^"']+["']/gi, '')
        .replace(/\bheight=["'][^"']+["']/gi, '');

      // 強制注入全域線條樣式並移除所有矩形的填充色
      if (!cleanedSvg.toLowerCase().includes('stroke=')) {
        cleanedSvg = cleanedSvg.replace('<svg', '<svg stroke="#000000" fill="none" stroke-width="3"');
      }
      
      // 修復：強制將所有 <rect> 的 fill 設定為 none，避免框住數字時數字看不見
      cleanedSvg = cleanedSvg.replace(/<rect([^>]*)fill=["'][^"']+["']([^>]*)>/gi, '<rect$1fill="none"$2>');
      if (!cleanedSvg.includes('fill="none"') && cleanedSvg.includes('<rect')) {
         cleanedSvg = cleanedSvg.replace('<rect', '<rect fill="none"');
      }

      // 強制確保有 viewBox
      if (!cleanedSvg.toLowerCase().includes('viewbox')) {
        cleanedSvg = cleanedSvg.replace('<svg', '<svg viewBox="0 0 400 400"');
      }

      return `
      <div class="svg-container my-10 bg-white border-4 border-slate-50 rounded-[3rem] p-10 flex items-center justify-center shadow-inner" style="min-height: 350px;">
        <div class="w-full h-full max-w-[400px] max-h-[400px]">
          ${cleanedSvg}
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
    <div className="group relative bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 mb-8 last:mb-0">
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

const HandoutViewer: React.FC<Props> = ({ content, params, theme }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCanvas, setVisibleCanvas] = useState<Record<string, boolean>>({});
  const [activeSteps, setActiveSteps] = useState<Record<number, number>>({});
  
  const structuredConcepts = useMemo(() => {
    if (!content.concept) return [];
    return content.concept
      .split(/(?=[重點\d]+\s*[:：])|\n|(?<=。)/g)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }, [content.concept]);

  if (!content) return <div className="p-20 text-center font-bold text-slate-400">講義內容載入中...</div>;

  const handleExportPDF = () => {
    const opt = {
      margin: 10,
      filename: `講義_${content.title || '無標題'}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(containerRef.current).save();
  };

  return (
    <div ref={containerRef} className="bg-white rounded-[4rem] shadow-2xl overflow-hidden print:shadow-none print:rounded-none border border-slate-100">
      <style>{`
        .svg-container svg { width: 100%; height: 100%; display: block; }
        .svg-container text { font-family: 'Noto Sans TC', sans-serif; font-weight: 900; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      <div className="no-print p-8 border-b flex justify-end gap-4 sticky top-0 bg-white/95 backdrop-blur z-50 shadow-sm">
        <button onClick={handleExportPDF} className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-2">
          <span>📂</span> 下載 PDF
        </button>
        <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black shadow-lg active:scale-95 transition-all flex items-center gap-2">
          <span>🖨️</span> 列印講義
        </button>
      </div>

      <div className="bg-[#0f172a] p-16 md:p-20 text-white border-b-[12px] border-blue-600">
        <h1 className="text-6xl md:text-7xl font-black mb-8 tracking-tighter italic drop-shadow-lg">
          {renderMathContent(content.title || '數學教學講義', false)}
        </h1>
        <div className="flex flex-wrap gap-4">
          <span className="bg-blue-600 px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest border border-blue-400">
            {params.grade} 資源班講義
          </span>
          <span className="bg-slate-800 px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest border border-slate-600">
            {params.difficulty} 難度
          </span>
        </div>
      </div>

      <div className="p-12 md:p-24 space-y-32">
        <section>
          <div className="flex items-center gap-6 mb-16">
            <div className="w-4 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></div>
            <h2 className="text-slate-900 font-black text-5xl tracking-tighter italic">核心觀念</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {structuredConcepts.map((item, idx) => (
              <ConceptCard key={idx} text={item} index={idx} />
            ))}
          </div>

          {content.visualAidSvg && (
            <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {renderMathContent(content.visualAidSvg)}
            </div>
          )}
        </section>

        <section className="space-y-48">
          <div className="h-[2px] bg-slate-100 w-full"></div>
          {(content.examples || []).map((ex, i) => (
            <div key={i} className="relative page-break-inside-avoid">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-6">
                  <span className="bg-slate-900 text-white w-16 h-16 rounded-[1.8rem] flex items-center justify-center font-black text-4xl shadow-xl transform -rotate-3 border-4 border-slate-800">
                    {i+1}
                  </span>
                  <h3 className="text-3xl font-black text-slate-300 uppercase tracking-widest italic">Example</h3>
                </div>
                <button 
                  onClick={() => setVisibleCanvas(p => ({...p, [`ex-${i}`]: !p[`ex-${i}`]}))} 
                  className="no-print text-sm font-black text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm hover:border-blue-200"
                >
                  {visibleCanvas[`ex-${i}`] ? '✕ 關閉寫字板' : '✎ 開啟計算區'}
                </button>
              </div>
              
              <div className="text-5xl font-black mb-16 text-slate-900 leading-[1.5] tracking-tighter">
                {renderMathContent(ex.question)}
              </div>

              {visibleCanvas[`ex-${i}`] && (
                <div className="mb-16 no-print animate-in zoom-in-95 duration-300">
                  <DrawingCanvas id={`ex-${i}`} height={500} />
                </div>
              )}

              {ex.visualAidSvg && (
                <div className="mb-16">
                  {renderMathContent(ex.visualAidSvg)}
                </div>
              )}

              <div className="space-y-16 bg-blue-50/30 p-12 md:p-16 rounded-[4rem] border-4 border-white shadow-inner relative">
                {(ex.stepByStep || []).map((s, si) => (
                  <div 
                    key={si} 
                    className={`flex gap-10 items-start transition-all duration-700 ${
                      si < (activeSteps[i] || 0) || (typeof window !== 'undefined' && window.location.search.includes('print'))
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8 h-0 overflow-hidden'
                    }`}
                  >
                    <span className="w-14 h-14 rounded-2xl bg-white border-4 border-blue-100 flex items-center justify-center font-black text-blue-600 shrink-0 shadow-sm text-2xl">{si+1}</span>
                    <div className="text-3xl font-bold text-slate-700 leading-relaxed flex-1 pt-2">
                      {renderMathContent(s)}
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
      </div>
    </div>
  );
};

export default HandoutViewer;
