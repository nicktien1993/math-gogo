
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

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
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
      const errorMsg = error.message || String(error);
      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API_KEY")) {
        setHasKey(false);
        alert('API Key 無效或未選取，請重新點擊「啟動」並選取正確的付費專案金鑰。');
      } else {
        alert(`連線失敗：${errorMsg.substring(0, 100)}`);
      }
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
      alert('講義生成失敗。若問題持續發生，請嘗試更換 API 金鑰。');
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
            您已有 API Key。請點擊下方按鈕在選單中選取您的付費專案（Paid Project）金鑰。
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
          <h1 className="text-xl font-black">特教數學助手</h1>
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
                <ArrowLeft size={18} /> 返回設定單元
              </button>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 font-bold text-sm text-blue-700">
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
            className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors"
          >
            <Settings size={16} />
            管理 API 金鑰設定
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 md:p-12 overflow-y-auto bg-slate-50">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-600">AI 老師處理中...</p>
          </div>
        )}
        {view === 'welcome' && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
            <LayoutDashboard size={80} className="mb-6" />
            <h2 className="text-3xl font-black italic">請於左側面板選擇單元開始教學</h2>
          </div>
        )}
        {view === 'handout' && handout && !loading && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <HandoutViewer content={handout} params={params} theme="default" />
            <HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} />
          </div>
        )}
        {view === 'homework' && homework && !loading && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
