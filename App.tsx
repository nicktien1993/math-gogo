
import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, ArrowLeft, LayoutDashboard, Settings, Layers, FileText, AlertCircle, RefreshCw, ChevronLeft, Menu, History, Clock, Sparkles, Wand2 } from 'lucide-react';
import { SelectionParams, Chapter, HandoutContent, HomeworkContent, HomeworkConfig, HistoryItem } from './types.ts';
import { fetchChapters, generateHandoutFromText, generateHomework } from './geminiService.ts';
import SelectionForm from './SelectionForm.tsx';
import ChapterSelector from './ChapterSelector.tsx';
import ManualUnitInput from './ManualUnitInput.tsx';
import HandoutViewer from './HandoutViewer.tsx';
import HomeworkViewer from './HomeworkViewer.tsx';
import HomeworkConfigSection from './HomeworkConfigSection.tsx';

const LOADING_MESSAGES = [
  "正在運用 AI 老師的智慧排版...",
  "正在準備微步化教學步驟...",
  "優化視覺圖示中，請稍候...",
  "正在為特教學生調整內容...",
];

const HISTORY_KEY = 'MATH_HISTORY_V18_FINAL';

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

  const loadChapters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChapters(params);
      setChapters(data);
    } catch (e: any) {
      setError("連線至 AI 服務時發生錯誤，請確認網路狀態並重新嘗試。");
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

  const handleSelectUnit = useCallback(async (chapter: string, sub: string) => {
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
      
      const item: HistoryItem = { timestamp: Date.now(), params: { ...params }, chapter, sub, content: data };
      setHistory(prev => {
        const filtered = prev.filter(h => h.sub !== sub);
        const updated = [item, ...filtered].slice(0, 10);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err: any) {
      setError("講義生成失敗。AI 目前回應異常，請點擊下方的重試按鈕。");
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
        handleSelectUnit(currentChapter.title, currentChapter.sub);
      }
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
      setError("練習卷生成失敗，AI 服務暫時無法處理您的請求。");
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  return (
    <div className="min-h-screen flex bg-slate-50 transition-all duration-500 overflow-hidden font-['Noto_Sans_TC']">
      
      {/* 側邊欄開啟按鈕 (手機版顯眼按鈕) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed left-6 top-6 z-[90] p-5 bg-blue-600 text-white rounded-[2rem] shadow-2xl hover:scale-110 active:scale-95 transition-all no-print border-4 border-blue-500"
        >
          <Menu size={28} strokeWidth={3} />
        </button>
      )}

      {/* 側邊欄 */}
      <aside className={`
        ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none -translate-x-full' : 'w-full md:w-96 opacity-100 translate-x-0'}
        bg-white no-print p-6 flex flex-col h-screen fixed md:sticky top-0 border-r border-slate-200 shadow-2xl z-[80]
        transition-all duration-500 overflow-hidden shrink-0
      `}>
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3 text-blue-600">
            <BookOpen size={32} strokeWidth={3} />
            <h1 className="text-2xl font-black tracking-tighter italic text-slate-900">特教數學助手</h1>
          </div>
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400"
          >
            <ChevronLeft size={28} strokeWidth={3} />
          </button>
        </div>

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
                className="group flex items-center gap-4 text-slate-500 font-black py-6 hover:text-blue-600 transition-all border-b-4 border-slate-50"
              >
                <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" /> 
                <span className="text-lg">返回課程設定</span>
              </button>
              
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[2.5rem] shadow-xl text-white">
                <div className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">目前正在製作</div>
                <div className="text-2xl font-black leading-tight">{currentChapter?.sub || '未選擇單元'}</div>
              </div>

              <nav className="flex flex-col gap-4">
                <button 
                  onClick={() => setView('handout')} 
                  className={`flex items-center gap-5 px-8 py-6 rounded-[2.5rem] font-black transition-all text-xl ${
                    view === 'handout' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 bg-slate-50'
                  }`}
                >
                  <Layers size={26} /> 教學講義
                </button>
                <button 
                  onClick={() => homework && setView('homework')} 
                  disabled={!homework} 
                  className={`flex items-center gap-5 px-8 py-6 rounded-[2.5rem] font-black transition-all text-xl ${
                    view === 'homework' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 bg-slate-50 opacity-50'
                  }`}
                >
                  <FileText size={26} /> 練習卷
                </button>
              </nav>
            </div>
          )}
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-20 relative scroll-smooth">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
            <div className="relative mb-12">
               <div className="w-28 h-28 border-[10px] border-blue-100 rounded-full animate-pulse"></div>
               <div className="absolute inset-0 w-28 h-28 border-[10px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-4xl font-black text-slate-800 italic tracking-tighter mb-4">{LOADING_MESSAGES[loadingMsgIdx]}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-sm">正在對齊教學單元資料...</p>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto animate-in zoom-in-95">
            <div className="bg-white p-12 rounded-[4rem] border-4 border-rose-100 shadow-2xl text-center w-full relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-rose-500"></div>
              <AlertCircle size={80} className="text-rose-500 mx-auto mb-8" />
              <h3 className="text-3xl font-black text-slate-900 mb-4">生成遇到阻礙</h3>
              <p className="text-slate-500 font-bold mb-12 leading-relaxed text-lg">{error}</p>
              <div className="flex flex-col gap-4">
                <button onClick={handleRetry} className="bg-rose-500 text-white p-6 rounded-[2rem] font-black text-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4">
                  <RefreshCw size={28} /> 再次重試生成
                </button>
                <button onClick={() => { setShowSettings(true); setError(null); setView('welcome'); }} className="text-slate-400 font-black hover:text-slate-600 text-lg py-2 transition-colors">
                  返回課程目錄重新選擇
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && view === 'welcome' && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-10 select-none">
            <div className="relative mb-16">
               <div className="absolute -inset-12 bg-blue-100/40 rounded-full blur-[80px] animate-pulse"></div>
               <div className="w-48 h-48 bg-white border-[12px] border-blue-50 rounded-[5rem] flex items-center justify-center text-blue-600 shadow-2xl relative transition-transform hover:rotate-6 duration-500">
                 <Wand2 size={100} strokeWidth={2.5} />
               </div>
            </div>
            <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-8 tracking-tighter italic drop-shadow-sm">歡迎開始製作教材</h2>
            <p className="text-slate-400 font-bold text-2xl mb-16 max-w-lg leading-relaxed">
              點擊左側目錄選取章節，AI 老師將立即為您設計專屬資源班的「微步化」講義與練習。
            </p>
            {!isSidebarCollapsed && (
               <div className="flex items-center gap-6 text-slate-300 font-black text-sm uppercase tracking-[0.4em] animate-pulse">
                 <Sparkles size={20} /> 請從左側選單開始
               </div>
            )}
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="bg-blue-600 text-white px-16 py-8 rounded-[2.5rem] font-black text-3xl shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-6"
              >
                <Menu size={32} /> 開啟章節清單
              </button>
            )}
          </div>
        )}

        {!loading && !error && view === 'handout' && handout && (
          <div className="mx-auto max-w-4xl space-y-12 pb-32 animate-in fade-in duration-1000">
            <HandoutViewer content={handout} params={params} theme="default" />
            <div className="no-print">
              <HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} />
            </div>
          </div>
        )}

        {!loading && !error && view === 'homework' && homework && (
          <div className="mx-auto max-w-5xl pb-32 animate-in fade-in duration-1000">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
