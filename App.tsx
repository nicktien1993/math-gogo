
import React, { useState, useCallback } from 'react';
import { BookOpen, ArrowLeft, Layers, FileText, AlertCircle, RefreshCw, ChevronLeft, Menu, Wand2, Search } from 'lucide-react';
import { SelectionParams, Chapter, HandoutContent, HomeworkContent, HomeworkConfig } from './types.ts';
import { fetchChapters, generateHandoutFromText, generateHomework } from './geminiService.ts';
import SelectionForm from './SelectionForm.tsx';
import ChapterSelector from './ChapterSelector.tsx';
import ManualUnitInput from './ManualUnitInput.tsx';
import HandoutViewer from './HandoutViewer.tsx';
import HomeworkViewer from './HomeworkViewer.tsx';
import HomeworkConfigSection from './HomeworkConfigSection.tsx';

const App: React.FC = () => {
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

  const handleSyncChapters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChapters(params);
      setChapters(data);
    } catch (e: any) {
      setError(`目錄加載失敗：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUnit = useCallback(async (chapter: string, sub: string) => {
    setCurrentChapter({ title: chapter, sub });
    setShowSettings(false);
    setError(null);
    setLoading(true);
    if (window.innerWidth < 1024) setIsSidebarCollapsed(true);
    
    try {
      const data = await generateHandoutFromText(params, chapter, sub);
      setHandout(data);
      setView('handout');
    } catch (err: any) {
      setError(`[API 報錯] ${err.message}`);
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
      setError(`練習卷生成失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {!isSidebarCollapsed && (
        <aside className="w-96 bg-white p-6 border-r flex flex-col h-screen shrink-0 overflow-y-auto shadow-2xl z-50 transition-all duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 text-blue-600">
              <BookOpen size={32} strokeWidth={3} />
              <h1 className="text-2xl font-black tracking-tighter italic">特教數學助手</h1>
            </div>
            <button onClick={() => setIsSidebarCollapsed(true)} className="p-2 hover:bg-slate-100 rounded-lg">
              <ChevronLeft />
            </button>
          </div>

          {showSettings ? (
            <div className="space-y-6">
              <SelectionForm params={params} onChange={setParams} isLoading={loading} />
              
              <button 
                onClick={handleSyncChapters}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Search size={20} /> 同步課程目錄
              </button>

              <ChapterSelector chapters={chapters} onSelect={handleSelectUnit} isLoading={loading} />
              <ManualUnitInput onGenerate={handleSelectUnit} isLoading={loading} />
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-600 transition-colors">
                <ArrowLeft size={20} /> 返回設定
              </button>
              <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl">
                <div className="text-[10px] font-black opacity-60 uppercase mb-1">正在教學</div>
                <div className="text-xl font-black leading-tight">{currentChapter?.sub}</div>
              </div>
              <nav className="space-y-3">
                <button onClick={() => setView('handout')} className={`w-full p-5 rounded-2xl font-black flex items-center gap-3 transition-all ${view === 'handout' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}><Layers size={20} /> 教學講義</button>
                <button onClick={() => setView('homework')} disabled={!homework} className={`w-full p-5 rounded-2xl font-black flex items-center gap-3 transition-all ${view === 'homework' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 opacity-50'}`}><FileText size={20} /> 練習卷</button>
              </nav>
            </div>
          )}
        </aside>
      )}

      <main className="flex-1 p-6 lg:p-12 overflow-y-auto relative bg-[#f8fafc]">
        {isSidebarCollapsed && (
          <button onClick={() => setIsSidebarCollapsed(false)} className="fixed left-6 top-6 p-4 bg-white rounded-2xl border shadow-xl z-50 hover:scale-110 active:scale-95 transition-all">
            <Menu size={24} className="text-blue-600" />
          </button>
        )}

        {loading && (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-3xl font-black text-slate-800 animate-pulse">AI 老師正在努力製作中...</h2>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="bg-white p-12 rounded-[3rem] border-4 border-rose-100 shadow-2xl">
              <AlertCircle size={64} className="text-rose-500 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-slate-900 mb-4">API 連線問題</h2>
              <div className="bg-rose-50 p-6 rounded-2xl text-rose-700 font-bold mb-8 break-all font-mono text-sm leading-relaxed">
                {error}
              </div>
              <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto hover:bg-black transition-all">
                <RefreshCw size={24} /> 點此重整頁面
              </button>
            </div>
          </div>
        )}

        {!loading && !error && view === 'welcome' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center text-blue-600 shadow-2xl mb-8">
              <Wand2 size={64} />
            </div>
            <h2 className="text-5xl font-black text-slate-900 mb-4 italic tracking-tighter">請在左側選取教學單元</h2>
            <p className="text-slate-400 font-bold text-xl">點擊「同步課程目錄」後開始製作教材</p>
          </div>
        )}

        {!loading && !error && view === 'handout' && handout && (
          <div className="max-w-4xl mx-auto space-y-12">
            <HandoutViewer content={handout} params={params} theme="default" />
            <div className="no-print"><HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} /></div>
          </div>
        )}

        {!loading && !error && view === 'homework' && homework && (
          <div className="max-w-4xl mx-auto">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
