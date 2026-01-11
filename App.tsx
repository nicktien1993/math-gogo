
import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, ArrowLeft, LayoutDashboard, Settings, Layers, FileText, AlertCircle, RefreshCw, ChevronLeft, Menu, History, Clock, Key, Sparkles } from 'lucide-react';
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
  "優化視覺圖示中，請稍候...",
  "正在為特教學生調整內容...",
];

const HISTORY_KEY = 'MATH_APP_HISTORY_V2';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [view, setView] = useState<'welcome' | 'handout' | 'homework'>('welcome');
  const [showSettings, setShowSettings] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth < 768);

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

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
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
      setError("無法載入目錄，請點擊右下角設定 API 金鑰。");
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
    if (window.innerWidth < 768) setIsSidebarCollapsed(true);
    
    try {
      const data = await generateHandoutFromText(params, chapter, sub);
      setHandout(data);
      if (currentChapter?.sub !== sub) setHomework(null);
      setView('handout');
      addToHistory({ timestamp: Date.now(), params: { ...params }, chapter, sub, content: data });
    } catch (err: any) {
      setError("生成失敗。請點擊下方按鈕檢查 API 金鑰。");
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  const handleRetry = () => {
    setError(null);
    if (currentChapter) {
      handleSelectUnit(currentChapter.title, currentChapter.sub, false);
    } else {
      loadChapters();
    }
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
      setError("練習卷生成失敗，建議重新選取金鑰。");
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  return (
    <div className="min-h-screen flex bg-slate-50 transition-all duration-500 overflow-hidden">
      {/* 行動裝置選單按鈕 */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-4 top-4 z-50 p-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all no-print"
        >
          <Menu size={24} strokeWidth={3} />
        </button>
      )}

      {/* 側邊欄 */}
      <aside className={`
        ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -translate-x-full' : 'w-full md:w-96 opacity-100 translate-x-0'}
        bg-white no-print p-6 flex flex-col h-screen fixed md:sticky top-0 border-r border-slate-200 shadow-2xl z-40
        transition-all duration-500 overflow-hidden shrink-0
      `}>
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-3 text-blue-600">
            <BookOpen size={28} strokeWidth={3} />
            <h1 className="text-xl font-black tracking-tighter italic text-slate-900">特教數學助手</h1>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"
          >
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
        </div>

        {/* 行動裝置優先的大型按鈕 */}
        <button 
          onClick={handleOpenKeySelector}
          className="w-full mb-6 bg-slate-900 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
        >
          <Key size={20} /> 🔑 設定 API 金鑰
        </button>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
          {showSettings ? (
            <div className="space-y-6 pb-10">
              <SelectionForm params={params} onChange={setParams} isLoading={loading} />
              <ChapterSelector chapters={chapters} onSelect={(c, s) => handleSelectUnit(c, s)} isLoading={loading} />
              <ManualUnitInput onGenerate={(c, s) => handleSelectUnit(c, s)} isLoading={loading} />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <button 
                onClick={() => { setShowSettings(true); setError(null); }} 
                className="group flex items-center gap-3 text-slate-400 font-black py-4 hover:text-blue-600 transition-all border-b border-slate-100"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                返回單元選擇
              </button>
              
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-[2rem] shadow-xl text-white">
                <div className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">目前單元</div>
                <div className="text-xl font-black leading-tight">{currentChapter?.sub || '未選擇'}</div>
              </div>

              <nav className="flex flex-col gap-4">
                <button 
                  onClick={() => setView('handout')} 
                  className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black transition-all ${
                    view === 'handout' ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' : 'text-slate-400'
                  }`}
                >
                  <Layers size={22} /> 教學講義
                </button>
                <button 
                  onClick={() => homework && setView('homework')} 
                  disabled={!homework} 
                  className={`flex items-center gap-4 px-6 py-5 rounded-[2rem] font-black transition-all ${
                    view === 'homework' ? 'bg-blue-50 text-blue-600 border-2 border-blue-200' : 'text-slate-400 opacity-50'
                  }`}
                >
                  <FileText size={22} /> 練習卷
                </button>
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-20 relative">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div>
            <p className="text-2xl font-black text-slate-700 italic">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto animate-in zoom-in-95">
            <div className="bg-white p-10 rounded-[3rem] border-2 border-rose-100 shadow-2xl text-center w-full">
              <AlertCircle size={60} className="text-rose-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-slate-800 mb-4">生成遇到阻礙</h3>
              <p className="text-slate-500 font-bold mb-8 leading-relaxed italic">{error}</p>
              <div className="flex flex-col gap-4">
                <button onClick={handleRetry} className="bg-rose-500 text-white p-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all">
                  再次嘗試生成
                </button>
                <button onClick={handleOpenKeySelector} className="bg-slate-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Key size={20} /> 🔑 重新設定金鑰
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && view === 'welcome' && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-32 h-32 bg-blue-100 rounded-[3rem] flex items-center justify-center text-blue-600 mb-8 animate-bounce">
              <Sparkles size={64} />
            </div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">歡迎使用特教數學助手</h2>
            <p className="text-slate-400 font-bold text-xl mb-12 max-w-md">請先點擊下方按鈕啟動您的 AI 金鑰，然後從左側選擇教學單元。</p>
            <button 
              onClick={handleOpenKeySelector}
              className="bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
            >
              <Key size={28} /> 🔑 點此啟動 AI 教學金鑰
            </button>
          </div>
        )}

        {!loading && !error && view === 'handout' && handout && (
          <div className="mx-auto max-w-4xl space-y-12 pb-20">
            <HandoutViewer content={handout} params={params} theme="default" />
            <div className="no-print">
              <HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} />
            </div>
          </div>
        )}

        {!loading && !error && view === 'homework' && homework && (
          <div className="mx-auto max-w-5xl pb-20">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
