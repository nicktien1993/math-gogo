
import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, ArrowLeft, LayoutDashboard, Settings, Layers, FileText, AlertCircle, RefreshCw, ChevronLeft, Menu, History, Clock, Key } from 'lucide-react';
import { SelectionParams, Chapter, HandoutContent, HomeworkContent, HomeworkConfig, HistoryItem } from './types.ts';
import { fetchChapters, generateHandoutFromText, generateHomework } from './geminiService.ts';
import SelectionForm from './SelectionForm.tsx';
import ChapterSelector from './ChapterSelector.tsx';
import ManualUnitInput from './ManualUnitInput.tsx';
import HandoutViewer from './HandoutViewer.tsx';
import HomeworkViewer from './HomeworkViewer.tsx';
import HomeworkConfigSection from './HomeworkConfigSection.tsx';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

const LOADING_MESSAGES = [
  "正在運用 AI 老師的智慧排版...",
  "正在準備微步化教學步驟...",
  "正在優化特教專用視覺圖示...",
  "確保內容完整，移除所有佔位符...",
  "正在加速運算，請稍候..."
];

const HISTORY_KEY = 'MATH_APP_HISTORY_V1';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [view, setView] = useState<'welcome' | 'handout' | 'homework'>('welcome');
  const [showSettings, setShowSettings] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [params, setParams] = useState<SelectionParams>({
    year: '114',
    publisher: '康軒',
    semester: '上',
    grade: '五年級',
    difficulty: '中',
    showBopomofo: false
  });
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<{ title: string; sub: string } | null>(null);
  const [handout, setHandout] = useState<HandoutContent | null>(null);
  const [homework, setHomework] = useState<HomeworkContent | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 載入歷史紀錄
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("History loading failed", e);
      }
    }
  }, []);

  const addToHistory = (item: HistoryItem) => {
    setHistory(prev => {
      const filtered = prev.filter(h => h.sub !== item.sub || h.chapter !== item.chapter);
      const updated = [item, ...filtered].slice(0, 10);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      handleRetry();
    }
  };

  const loadChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChapters(params);
      setChapters(data);
    } catch (e: any) {
      const msg = e.message || "";
      if (msg.includes("not found") || msg.includes("401") || msg.includes("403")) {
        setError("API 金鑰無效或尚未設定。請點擊下方按鈕重新選取金鑰。");
      } else {
        setError("課程目錄載入失敗，請確認網路連線穩定。");
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    loadChapters();
  }, [params.publisher, params.grade, params.semester]);

  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSelectUnit = useCallback(async (chapter: string, sub: string, isRetry = false) => {
    setCurrentChapter({ title: chapter, sub });
    setShowSettings(false);
    setError(null);
    setLoading(true);
    
    try {
      const data = await generateHandoutFromText(params, chapter, sub);
      setHandout(data);
      if (currentChapter?.sub !== sub) setHomework(null);
      setView('handout');
      addToHistory({ timestamp: Date.now(), params: { ...params }, chapter, sub, content: data });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("not found")) {
        setError("API 金鑰授權失敗，請確保您已選取正確的付費金鑰或專案。");
      } else if (!isRetry) {
        handleSelectUnit(chapter, sub, true);
        return;
      } else {
        setError("講義生成失敗。這可能是因為 AI 格式解析錯誤或頻率限制。");
      }
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  const handleRetry = () => {
    setError(null);
    if (currentChapter) {
      if (view === 'homework') {
        handleGenerateHomework({ calculationCount: 3, wordProblemCount: 2, difficulty: params.difficulty });
      } else {
        handleSelectUnit(currentChapter.title, currentChapter.sub, false);
      }
    } else {
      loadChapters();
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setParams(item.params);
    setCurrentChapter({ title: item.chapter, sub: item.sub });
    setHandout(item.content);
    setHomework(null);
    setView('handout');
    setShowSettings(false);
  };

  const handleGenerateHomework = useCallback(async (config: HomeworkConfig) => {
    if (!currentChapter) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateHomework(params, currentChapter.title, currentChapter.sub, config);
      setHomework(data);
      setView('homework');
    } catch (err: any) {
      setError("練習卷生成失敗。建議檢查 API 金鑰是否具備足夠的 quota 或重新選取金鑰。");
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  return (
    <div className="min-h-screen flex bg-slate-50 transition-all duration-500 ease-in-out">
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-6 top-6 z-50 p-4 bg-white rounded-2xl shadow-2xl border border-slate-200 text-blue-600 hover:scale-110 active:scale-95 transition-all no-print group"
        >
          <Menu size={24} strokeWidth={3} />
        </button>
      )}

      <aside className={`
        ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -translate-x-full' : 'w-96 opacity-100 translate-x-0'}
        bg-white no-print p-6 flex flex-col h-screen sticky top-0 border-r border-slate-200 shadow-2xl z-40
        transition-all duration-500 ease-in-out overflow-hidden shrink-0
      `}>
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3 text-blue-600">
            <BookOpen size={28} strokeWidth={3} />
            <h1 className="text-2xl font-black tracking-tighter italic text-slate-900 whitespace-nowrap">特教數學助手</h1>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
          {showSettings ? (
            <div className="space-y-8 pb-10">
              <SelectionForm params={params} onChange={setParams} isLoading={loading} />
              <ChapterSelector chapters={chapters} onSelect={(c, s) => handleSelectUnit(c, s)} isLoading={loading} />
              <ManualUnitInput onGenerate={(c, s) => handleSelectUnit(c, s)} isLoading={loading} />
              
              {history.length > 0 && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-2 mb-4 text-slate-400 font-black text-xs uppercase tracking-widest px-2">
                    <Clock size={14} /> 最近生成紀錄
                  </div>
                  <div className="space-y-3">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group relative overflow-hidden"
                      >
                        <div className="font-bold text-slate-700 truncate text-sm">
                          {item.sub}
                        </div>
                        <div className="text-[10px] font-black text-blue-600/40 uppercase mt-1">
                          {item.params.publisher} {item.params.grade}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <button 
                onClick={() => { setShowSettings(true); setError(null); }} 
                className="group flex items-center gap-3 text-slate-400 font-black py-4 hover:text-blue-600 transition-all border-b border-slate-100"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                返回單元設定
              </button>
              
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2.5rem] shadow-xl text-white">
                <div className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">目前單元</div>
                <div className="text-2xl font-black leading-tight tracking-tight">
                  {currentChapter?.sub || '未選擇單元'}
                </div>
              </div>

              <nav className="flex flex-col gap-4">
                <button 
                  onClick={() => setView('handout')} 
                  className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black transition-all duration-300 text-lg hover:scale-105 active:scale-95 ${
                    view === 'handout' 
                      ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 shadow-md' 
                      : 'text-slate-400 hover:bg-white hover:text-blue-500 hover:shadow-xl hover:border-blue-100 border-2 border-transparent'
                  }`}
                >
                  <Layers size={22} className={`${view === 'handout' ? 'animate-bounce' : ''}`} />
                  教學講義
                </button>
                <button 
                  onClick={() => homework && setView('homework')} 
                  disabled={!homework} 
                  className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black transition-all duration-300 text-lg ${
                    homework 
                      ? 'hover:scale-105 active:scale-95 hover:bg-white hover:text-blue-500 hover:shadow-xl hover:border-blue-100' 
                      : 'opacity-30 cursor-not-allowed'
                  } ${
                    view === 'homework' 
                      ? 'bg-blue-50 text-blue-600 border-2 border-blue-200 shadow-md' 
                      : 'text-slate-400 border-2 border-transparent'
                  }`}
                >
                  <FileText size={22} className={`${view === 'homework' ? 'animate-bounce' : ''}`} />
                  練習卷
                </button>
              </nav>
            </div>
          )}
        </div>
        
        <div className="pt-6 border-t border-slate-100 mt-auto flex items-center justify-between shrink-0">
          <button onClick={() => window.aistudio?.openSelectKey()} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
            <Key size={12} /> API Key Settings
          </button>
          <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">V15.0 Parse-Optimized</span>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-16 lg:p-24 overflow-y-auto bg-slate-50 scroll-smooth transition-all duration-500 ease-in-out">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-8 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-24 h-24 border-[8px] border-blue-50 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-24 h-24 border-[8px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="font-black text-slate-700 text-3xl mb-3 tracking-tighter italic">{LOADING_MESSAGES[loadingMsgIdx]}</p>
              <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">正在解析 AI 的教育策略</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto animate-in fade-in zoom-in-95">
            <div className="bg-white p-12 rounded-[3.5rem] border-2 border-rose-100 shadow-2xl mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
              <AlertCircle size={80} className="text-rose-500 mx-auto mb-6" />
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter italic">生成過程遇到阻礙</h3>
              <p className="text-slate-500 font-bold mb-8 leading-relaxed italic">{error}</p>
              
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleRetry}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  <RefreshCw size={24} /> 再次嘗試生成
                </button>
                <button 
                  onClick={handleOpenKeySelector}
                  className="bg-slate-800 hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  <Key size={24} /> 🔑 重新選取 API 金鑰
                </button>
                <button 
                  onClick={() => { setShowSettings(true); setError(null); setView('welcome'); }}
                  className="text-slate-400 font-bold hover:text-slate-600 transition-colors pt-2"
                >
                  返回單元設定
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && view === 'welcome' && (
          <div className="h-full flex flex-col items-center justify-center text-center select-none opacity-20">
            <LayoutDashboard size={120} className="text-slate-300 mb-8" />
            <h2 className="text-5xl font-black italic tracking-tighter text-slate-300">請從左側功能列開始</h2>
          </div>
        )}

        {!loading && !error && view === 'handout' && handout && (
          <div className={`mx-auto space-y-12 animate-in fade-in duration-700 ${isSidebarCollapsed ? 'max-w-6xl' : 'max-w-4xl'}`}>
            <HandoutViewer content={handout} params={params} theme="default" />
            <div className="no-print">
              <HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} />
            </div>
          </div>
        )}

        {!loading && !error && view === 'homework' && homework && (
          <div className={`mx-auto animate-in fade-in duration-700 ${isSidebarCollapsed ? 'max-w-6xl' : 'max-w-5xl'}`}>
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
