
import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, ArrowLeft, Layers, FileText, AlertCircle, RefreshCw, ChevronLeft, Menu, Wand2, Search, Key, ExternalLink } from 'lucide-react';
// Updated import to use renamed AIStudio interface
import { SelectionParams, Chapter, HandoutContent, HomeworkContent, HomeworkConfig, AIStudio } from './types.ts';
import { fetchChapters, generateHandoutFromText, generateHomework } from './geminiService.ts';
import SelectionForm from './SelectionForm.tsx';
import ChapterSelector from './ChapterSelector.tsx';
import ManualUnitInput from './ManualUnitInput.tsx';
import HandoutViewer from './HandoutViewer.tsx';
import HomeworkViewer from './HomeworkViewer.tsx';
import HomeworkConfigSection from './HomeworkConfigSection.tsx';

declare global {
  interface Window {
    // Fixed type declaration to match the expected AIStudio type from the environment and resolved any modifier conflicts
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const checkKey = async () => {
      try {
        // 優先檢查 AI Studio 橋接器
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } else {
          // 如果不在 AI Studio 環境，檢查環境變數是否已注入金鑰
          const isEnvKeySet = !!process.env.API_KEY && process.env.API_KEY !== '';
          setHasKey(isEnvKeySet);
        }
      } catch (e) {
        setHasKey(false);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
      }
      // 根據規範，呼叫選取後立即假設金鑰已準備好以繼續
      setHasKey(true);
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  const handleGlobalError = (err: any) => {
    const msg = err.message || String(err);
    // 擷取 SDK 的金鑰缺失錯誤或權限錯誤
    if (msg.includes("API Key must be set") || msg.includes("Requested entity was not found") || msg.includes("API_KEY_INVALID")) {
      setHasKey(false);
    }
    setError(msg);
  };

  const handleSyncChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChapters(params);
      setChapters(data);
    } catch (e: any) {
      handleGlobalError(e);
      setError(`[目錄獲取失敗] ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUnit = useCallback(async (chapter: string, sub: string) => {
    setCurrentChapter({ title: chapter, sub });
    setShowSettings(false);
    setError(null);
    setLoading(true);
    
    try {
      const data = await generateHandoutFromText(params, chapter, sub);
      setHandout(data);
      setView('handout');
    } catch (err: any) {
      handleGlobalError(err);
      setError(`[講義生成失敗] ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleGenerateHomework = useCallback(async (config: HomeworkConfig) => {
    if (!currentChapter) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateHomework(params, currentChapter.title, currentChapter.sub, config);
      setHomework(data);
      setView('homework');
    } catch (err: any) {
      handleGlobalError(err);
      setError(`[練習卷製作失敗] ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full bg-slate-800 p-12 rounded-[3.5rem] border border-slate-700 shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center mb-10 shadow-xl shadow-blue-500/20">
            <Key size={48} className="animate-pulse" />
          </div>
          <h1 className="text-4xl font-black mb-6 italic tracking-tighter">啟動教學助理</h1>
          <p className="text-slate-400 font-bold mb-10 leading-relaxed px-4">
            本系統使用付費版 Gemini 3 模型。請先透過您的 Google 專案選取 API 金鑰以進行教學講義生成。
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-[2rem] font-black text-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group"
          >
            <ExternalLink size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
            點此選取 API 金鑰
          </button>
          <div className="mt-8">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-500 text-xs hover:text-blue-400 transition-colors underline underline-offset-4"
            >
              瞭解 Google Cloud 計費與 API 授權方式
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-blue-100">
      {!isSidebarCollapsed && (
        <aside className="w-96 bg-white p-6 border-r flex flex-col h-screen shrink-0 overflow-y-auto shadow-2xl z-50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-blue-600">
              <BookOpen size={32} strokeWidth={3} />
              <h1 className="text-2xl font-black italic tracking-tighter">特教數學助手</h1>
            </div>
            <button onClick={() => setIsSidebarCollapsed(true)} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft />
            </button>
          </div>

          {showSettings ? (
            <div className="space-y-6">
              <SelectionForm params={params} onChange={setParams} isLoading={loading} />
              <button onClick={handleSyncChapters} disabled={loading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Search size={20} /> 同步課程目錄
              </button>
              <ChapterSelector chapters={chapters} onSelect={handleSelectUnit} isLoading={loading} />
              <ManualUnitInput onGenerate={handleSelectUnit} isLoading={loading} />
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => { setShowSettings(true); setView('welcome'); }} className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-600 transition-colors">
                <ArrowLeft size={20} /> 返回設定
              </button>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-xl">
                <div className="text-[10px] font-black opacity-60 uppercase mb-2 tracking-widest">目前單元</div>
                <div className="text-2xl font-black leading-tight">{currentChapter?.sub}</div>
              </div>
              <nav className="space-y-3">
                <button onClick={() => setView('handout')} className={`w-full p-6 rounded-3xl font-black flex items-center gap-4 transition-all ${view === 'handout' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><Layers size={24} /> 教學講義</button>
                <button onClick={() => setView('homework')} disabled={!homework} className={`w-full p-6 rounded-3xl font-black flex items-center gap-4 transition-all ${view === 'homework' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 opacity-50'}`}><FileText size={24} /> 練習卷</button>
              </nav>
            </div>
          )}
        </aside>
      )}

      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative bg-slate-50/50">
        {isSidebarCollapsed && (
          <button onClick={() => setIsSidebarCollapsed(false)} className="fixed left-6 top-6 p-4 bg-white rounded-2xl border shadow-xl z-50 hover:scale-110 active:scale-95 transition-all no-print">
            <Menu size={24} className="text-blue-600" />
          </button>
        )}

        {loading && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-8"></div>
            <h2 className="text-4xl font-black text-slate-900 mb-2 italic">AI 正在計算並撰寫講義...</h2>
            <p className="text-slate-400 font-bold italic">這可能需要 10-15 秒鐘的時間</p>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="bg-white p-12 rounded-[4rem] border-4 border-rose-100 shadow-2xl text-center w-full">
              <AlertCircle size={80} className="text-rose-500 mx-auto mb-8" />
              <h2 className="text-4xl font-black text-slate-900 mb-4">執行時發生錯誤</h2>
              <div className="bg-rose-50 p-6 rounded-3xl text-rose-700 font-mono text-sm mb-10 text-left overflow-auto max-h-40 leading-relaxed">
                {error}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl">
                  <RefreshCw size={24} /> 重新整理網頁
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && view === 'welcome' && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-40 h-40 bg-white rounded-[3.5rem] flex items-center justify-center text-blue-600 shadow-2xl mb-12 border-8 border-blue-50">
              <Wand2 size={80} strokeWidth={2.5} />
            </div>
            <h2 className="text-6xl font-black text-slate-900 mb-6 italic tracking-tighter">選取單元開始上課</h2>
            <p className="text-slate-400 font-bold text-2xl max-w-xl leading-relaxed">
              點擊左側單元目錄，AI 將為您生成適合學生的「微步化」教學講義。
            </p>
          </div>
        )}

        {!loading && !error && view === 'handout' && handout && (
          <div className="max-w-5xl mx-auto space-y-16">
            <HandoutViewer content={handout} params={params} theme="default" />
            <div className="no-print"><HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} /></div>
          </div>
        )}

        {!loading && !error && view === 'homework' && homework && (
          <div className="max-w-5xl mx-auto">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
