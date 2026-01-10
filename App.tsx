import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BookOpen, ArrowLeft, LayoutDashboard, Key, ExternalLink, Settings } from 'lucide-react';
import { SelectionParams, Chapter, HandoutContent, HomeworkContent, HomeworkConfig } from './types.ts';
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
  "AI 老師正在翻閱教材...",
  "正在根據特教原則微步化解法...",
  "正在為單元繪製直觀的圖示...",
  "正在設計適合學生的練習題...",
  "快好了！正在進行最後的排版...",
];

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [view, setView] = useState<'welcome' | 'handout' | 'homework'>('welcome');
  const [params, setParams] = useState<SelectionParams>({
    year: '113',
    publisher: '康軒',
    semester: '上',
    grade: '四年級',
    difficulty: '中',
    showBopomofo: false
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<{ title: string; sub: string } | null>(null);
  const [handout, setHandout] = useState<HandoutContent | null>(null);
  const [homework, setHomework] = useState<HomeworkContent | null>(null);

  // 動態切換載入文字
  useEffect(() => {
    let interval: number;
    if (loading) {
      interval = window.setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const checkKeyStatus = useCallback(async () => {
    try {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true);
      }
    } catch (e) {
      setHasKey(true);
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const handleOpenKeyDialog = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      setHasKey(true); 
    } catch (e) {
      console.error("Failed to open key dialog", e);
    }
  };

  const handleSearchChapters = useCallback(async (newParams: SelectionParams) => {
    setParams(newParams);
    setLoading(true);
    try {
      const data = await fetchChapters(newParams);
      setChapters(data);
    } catch (error: any) {
      console.error("Search error:", error);
      alert('課程目錄查詢失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectUnit = useCallback(async (chapter: string, sub: string) => {
    setCurrentChapter({ title: chapter, sub });
    setLoading(true);
    try {
      const data = await generateHandoutFromText(params, chapter, sub);
      setHandout(data);
      setView('handout');
    } catch (error: any) {
      console.error("Generate handout error:", error);
      alert('講義生成失敗，可能因為單元內容太複雜。');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleGenerateHomework = useCallback(async (config: HomeworkConfig) => {
    if (!currentChapter) return;
    setLoading(true);
    try {
      const data = await generateHomework(params, currentChapter.title, currentChapter.sub, config);
      setHomework(data);
      setView('homework');
    } catch (error: any) {
      console.error("Generate homework error:", error);
      alert('練習卷生成失敗。');
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl border border-slate-700 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-900/20">
            <Key size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-4">啟動 AI 教學助手</h1>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">
            請點擊下方按鈕選取您的付費專案金鑰，即可開始使用高品質教材生成服務。
          </p>
          <button 
            onClick={handleOpenKeyDialog}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all shadow-lg active:scale-95 mb-6 text-xl"
          >
            🔑 立即選取 API Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 font-bold transition-colors text-sm"
          >
            查看計費與 API 說明 <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  if (hasKey === null) return null;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-80 bg-white no-print p-6 flex flex-col h-screen sticky top-0 border-r border-slate-200">
        <div className="flex items-center gap-3 text-blue-600 mb-8 shrink-0">
          <BookOpen size={24} />
          <h1 className="text-xl font-black tracking-tight">特教數學助手</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {view === 'welcome' ? (
            <>
              <SelectionForm initialParams={params} onSubmit={handleSearchChapters} isLoading={loading} />
              {chapters.length > 0 && <ChapterSelector chapters={chapters} onSelect={handleSelectUnit} isLoading={loading} />}
              <ManualUnitInput onGenerate={handleSelectUnit} isLoading={loading} />
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <button onClick={() => setView('welcome')} className="flex items-center gap-2 text-slate-500 font-bold py-2 hover:bg-slate-100 rounded-lg px-2 transition">
                <ArrowLeft size={18} /> 返回單元設定
              </button>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 font-bold text-sm text-blue-700 shadow-sm">
                單元：{currentChapter?.title}
              </div>
              <nav className="flex flex-col gap-1 mt-4">
                <button onClick={() => setView('handout')} className={`px-4 py-3 rounded-xl font-bold transition text-left ${view === 'handout' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                  1. 教學講義
                </button>
                <button 
                  onClick={() => homework && setView('homework')} 
                  disabled={!homework}
                  className={`px-4 py-3 rounded-xl font-bold transition text-left ${view === 'homework' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'} ${!homework ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  2. 練習卷
                </button>
              </nav>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 mt-auto shrink-0">
          <button 
            onClick={handleOpenKeyDialog}
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors"
          >
            <Settings size={14} />
            管理 API 金鑰設定
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50 scroll-smooth">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-pulse">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="font-black text-slate-700 text-2xl mb-2">{LOADING_MESSAGES[loadingMsgIdx]}</p>
              <p className="text-slate-400 font-bold text-sm">這可能需要幾十秒，請老師稍坐片刻...</p>
            </div>
          </div>
        )}
        {view === 'welcome' && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
            <LayoutDashboard size={100} className="mb-8 text-slate-400" />
            <h2 className="text-4xl font-black italic tracking-tighter">請由左側選擇單元開始生成教材</h2>
          </div>
        )}
        {view === 'handout' && handout && !loading && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <HandoutViewer content={handout} params={params} theme="default" />
            <HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} />
          </div>
        )}
        {view === 'homework' && homework && !loading && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;