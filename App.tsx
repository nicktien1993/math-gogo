
import React, { useState, useCallback, useEffect } from 'react';
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
  "正在準備教學內容...",
  "正在排版微步化步驟...",
  "正在優化視覺圖示...",
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

  useEffect(() => {
    const autoLoadChapters = async () => {
      const data = await fetchChapters(params);
      setChapters(data);
    };
    autoLoadChapters();
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

  const handleSelectUnit = useCallback(async (chapter: string, sub: string) => {
    setCurrentChapter({ title: chapter, sub });
    
    // 預先取得本地內容，判斷是否需要 API
    // 為了極速體驗，我們這裡直接呼叫，geminiService 會處理本地優先
    setLoading(true);
    try {
      const data = await generateHandoutFromText(params, chapter, sub);
      setHandout(data);
      setView('handout');
    } catch (error: any) {
      console.error("Load handout error:", error);
      alert('講義載入失敗。');
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
              <SelectionForm params={params} onChange={setParams} isLoading={loading} />
              <ChapterSelector chapters={chapters} onSelect={handleSelectUnit} isLoading={loading} />
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
                  1. 教學講義 (已就緒)
                </button>
                <button 
                  onClick={() => homework && setView('homework')} 
                  disabled={!homework}
                  className={`px-4 py-3 rounded-xl font-bold transition text-left ${view === 'homework' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'} ${!homework ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  2. 練習卷 {homework ? '(已生成)' : ''}
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
            API 金鑰設定
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50 scroll-smooth">
        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-6 animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="font-black text-slate-700 text-2xl mb-2">{LOADING_MESSAGES[loadingMsgIdx]}</p>
            </div>
          </div>
        )}
        {view === 'welcome' && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center select-none opacity-30">
            <LayoutDashboard size={100} className="mb-8 text-slate-400 mx-auto" />
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
