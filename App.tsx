import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, ArrowLeft, LayoutDashboard, Key, ExternalLink } from 'lucide-react';
import { SelectionParams, Chapter, HandoutContent, HomeworkContent, HomeworkConfig } from './types.ts';
import { fetchChapters, generateHandoutFromText, generateHomework } from './geminiService.ts';
import SelectionForm from './SelectionForm.tsx';
import ChapterSelector from './ChapterSelector.tsx';
import ManualUnitInput from './ManualUnitInput.tsx';
import HandoutViewer from './HandoutViewer.tsx';
import HomeworkViewer from './HomeworkViewer.tsx';
import HomeworkConfigSection from './HomeworkConfigSection.tsx';

// 定義 window.aistudio 的類型，確保與全域定義一致並避免重複宣告衝突
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // Add readonly modifier to match the ambient Window interface declaration and fix identical modifiers error
    readonly aistudio: AIStudio;
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

  // 檢查是否已選擇 API Key
  useEffect(() => {
    const checkKey = async () => {
      try {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        // 如果不在 AI Studio 環境中，預設為 true (假設環境變數已注入)
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeyDialog = async () => {
    await window.aistudio.openSelectKey();
    setHasKey(true); // 根據規範，觸發後直接假設成功
  };

  const handleSearchChapters = useCallback(async (newParams: SelectionParams) => {
    setParams(newParams);
    setLoading(true);
    try {
      const data = await fetchChapters(newParams);
      setChapters(data);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert('API Key 效期已過或專案不存在，請重新選擇。');
      } else {
        alert('連線失敗，請檢查網路或 API Key 設定。');
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
    } catch (error) {
      console.error(error);
      alert('講義生成失敗。');
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
    } catch (error) {
      console.error(error);
      alert('練習卷生成失敗。');
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  // 如果還沒選擇 Key，顯示啟動畫面
  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full bg-slate-800 rounded-[2.5rem] p-10 shadow-2xl border border-slate-700 text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-900/20">
            <Key size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black mb-4">啟動 AI 教學助手</h1>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed">
            為了提供高品質的 AI 教材生成服務，請先選取您的 API Key 專案。
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
            className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 font-bold transition-colors text-sm"
          >
            查看計費與 API 說明 <ExternalLink size={14} />
          </a>
        </div>
      </div>
    );
  }

  // 載入狀態
  if (hasKey === null) return null;

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-80 bg-white border-r no-print p-6 flex flex-col gap-6 h-screen sticky top-0 overflow-y-auto">
        <div className="flex items-center gap-3 text-blue-600 mb-4">
          <BookOpen size={24} />
          <h1 className="text-xl font-black">特教數學助手</h1>
        </div>
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
              當前單元：{currentChapter?.title} - {currentChapter?.sub}
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
        {view === 'handout' && handout && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <HandoutViewer content={handout} params={params} theme="default" />
            <HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} />
          </div>
        )}
        {view === 'homework' && homework && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;