
import React, { useState, useCallback } from 'react';
import { BookOpen, ArrowLeft, Layers, FileText, AlertCircle, RefreshCw, ChevronLeft, Menu, Wand2, Search, Bug } from 'lucide-react';
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
      setError(`[目錄錯誤] ${e.message}`);
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
      setError(`[講義生成失敗] 此問題已紀錄並會嘗試修復。錯誤詳情：${err.message}`);
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
      setError(`[練習卷錯誤] ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [params, currentChapter]);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-blue-100">
      {!isSidebarCollapsed && (
        <aside className="w-96 bg-white p-6 border-r flex flex-col h-screen shrink-0 overflow-y-auto shadow-2xl z-50 transition-all">
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
              <button onClick={() => { setShowSettings(true); setView('welcome'); }} className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-600">
                <ArrowLeft size={20} /> 返回設定
              </button>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-xl">
                <div className="text-[10px] font-black opacity-60 uppercase mb-2 tracking-widest">目前單元</div>
                <div className="text-2xl font-black leading-tight">{currentChapter?.sub}</div>
              </div>
              <nav className="space-y-3">
                <button onClick={() => setView('handout')} className={`w-full p-6 rounded-3xl font-black flex items-center gap-4 transition-all ${view === 'handout' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400'}`}><Layers size={24} /> 教學講義</button>
                <button onClick={() => setView('homework')} disabled={!homework} className={`w-full p-6 rounded-3xl font-black flex items-center gap-4 transition-all ${view === 'homework' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400 opacity-50'}`}><FileText size={24} /> 練習卷</button>
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
            <h2 className="text-4xl font-black text-slate-900 mb-2 italic">AI 老師正在撰寫講義...</h2>
            <p className="text-slate-400 font-bold">這通常需要 5-10 秒，請稍候</p>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-6">
            <div className="bg-white p-12 rounded-[4rem] border-4 border-rose-100 shadow-2xl text-center w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Bug size={120} />
              </div>
              <AlertCircle size={80} className="text-rose-500 mx-auto mb-8" />
              <h2 className="text-4xl font-black text-slate-900 mb-4">生成失敗</h2>
              <p className="text-slate-500 font-bold mb-8">別擔心，這通常是 AI 回傳格式不穩。請再試一次或更換單元。</p>
              <div className="bg-rose-50 p-8 rounded-3xl text-rose-700 font-mono text-left text-sm mb-10 overflow-auto max-h-48 leading-relaxed border border-rose-100">
                {error}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl">
                  <RefreshCw size={24} /> 點此重試
                </button>
                <button onClick={() => { setShowSettings(true); setError(null); setView('welcome'); }} className="bg-slate-100 text-slate-600 px-10 py-5 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all">
                  <Search size={24} /> 換個單元試試
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
            <h2 className="text-6xl font-black text-slate-900 mb-6 italic tracking-tighter">準備好開始上課了嗎？</h2>
            <p className="text-slate-400 font-bold text-2xl max-w-xl leading-relaxed">
              請從左側選取一個單元。AI 會根據您的學期、出版社，自動產出最適合學生的教學資源。
            </p>
          </div>
        )}

        {!loading && !error && view === 'handout' && handout && (
          <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-12 duration-700">
            <HandoutViewer content={handout} params={params} theme="default" />
            <div className="no-print"><HomeworkConfigSection onGenerate={handleGenerateHomework} isLoading={loading} /></div>
          </div>
        )}

        {!loading && !error && view === 'homework' && homework && (
          <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-700">
            <HomeworkViewer content={homework} params={params} theme="default" />
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
