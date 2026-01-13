
import React, { useState, useCallback } from 'react';
import { BookOpen, ArrowLeft, Layers, FileText, AlertCircle, ChevronLeft, Menu, Wand2 } from 'lucide-react';
import { SelectionParams, HandoutContent, HomeworkContent, HomeworkConfig } from './types.ts';
import { generateHandout, generateHomework } from './geminiService.ts';
import SelectionForm from './components/SelectionForm.tsx';
import HandoutViewer from './components/HandoutViewer.tsx';
import HomeworkViewer from './components/HomeworkViewer.tsx';
import HomeworkConfigSection from './components/HomeworkConfigSection.tsx';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'welcome' | 'handout' | 'homework'>('welcome');
  const [showSettings, setShowSettings] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Initialize with all required fields for SelectionParams
  const [params, setParams] = useState<SelectionParams>({
    publisher: '康軒',
    year: '113',
    grade: '一年級',
    semester: '上',
    difficulty: '中',
    unitTitle: ''
  });
  
  const [handout, setHandout] = useState<HandoutContent | null>(null);
  const [homework, setHomework] = useState<HomeworkContent | null>(null);

  const handleStartGenerate = useCallback(async () => {
    if (!params.unitTitle.trim()) {
      setError("請輸入單元名稱！");
      return;
    }
    setLoading(true);
    setShowSettings(false);
    setError(null);
    try {
      const data = await generateHandout(params);
      setHandout(data);
      setView('handout');
    } catch (err: any) {
      setError(err.message);
      setShowSettings(true);
    } finally {
      setLoading(false);
    }
  }, [params]);

  const handleGenerateHomework = useCallback(async (config: HomeworkConfig) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateHomework(params, config);
      setHomework(data);
      setView('homework');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-blue-100">
      {!isSidebarCollapsed && (
        <aside className="w-96 bg-white p-6 border-r flex flex-col h-screen shrink-0 overflow-y-auto shadow-2xl z-50 no-print">
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
              <SelectionForm 
                params={params} 
                onChange={setParams} 
                onGenerate={handleStartGenerate}
                isLoading={loading} 
              />
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => { setShowSettings(true); setView('welcome'); }} className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-600 transition-colors">
                <ArrowLeft size={20} /> 修改單元設定
              </button>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-[2.5rem] text-white shadow-xl">
                <div className="text-[10px] font-black opacity-60 uppercase mb-2 tracking-widest">目前單元</div>
                <div className="text-2xl font-black leading-tight">{params.unitTitle}</div>
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
            <h2 className="text-4xl font-black text-slate-900 mb-2 italic">正在生成教學內容...</h2>
            <p className="text-slate-400 font-bold italic">這大約需要 15-30 秒</p>
          </div>
        )}

        {error && !loading && (
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
            <div className="bg-white p-12 rounded-[4rem] border-4 border-rose-100 shadow-2xl text-center w-full">
              <AlertCircle size={80} className="text-rose-500 mx-auto mb-8" />
              <h2 className="text-4xl font-black text-slate-900 mb-4">發生錯誤</h2>
              <p className="text-slate-600 font-bold mb-10">{error}</p>
              <button onClick={() => setError(null)} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-black transition-all shadow-xl">
                重新嘗試
              </button>
            </div>
          </div>
        )}

        {!loading && !error && view === 'welcome' && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-40 h-40 bg-white rounded-[3.5rem] flex items-center justify-center text-blue-600 shadow-2xl mb-12 border-8 border-blue-50">
              <Wand2 size={80} strokeWidth={2.5} />
            </div>
            <h2 className="text-6xl font-black text-slate-900 mb-6 italic tracking-tighter">歡迎使用特教數學助手</h2>
            <p className="text-slate-400 font-bold text-2xl max-w-xl leading-relaxed">
              請在左側輸入年級與單元名稱，AI 將自動為您編寫微步化教材。
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
