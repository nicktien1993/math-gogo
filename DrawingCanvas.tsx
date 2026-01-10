
import React, { useRef, useEffect, useState } from 'react';

interface Props {
  height?: number;
  id: string;
}

const DrawingCanvas: React.FC<Props> = ({ height = 400, id }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushColor, setBrushColor] = useState('#000000');
  
  // 歷史紀錄與狀態管理
  const state = useRef({
    lastX: 0,
    lastY: 0,
    history: [] as ImageData[],
    maxHistory: 20,
  });

  // 繪製背景輔助線
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // 儲存目前的內容快照，以便縮放後嘗試還原
      let snapshot: ImageData | null = null;
      if (canvas.width > 0 && canvas.height > 0) {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      drawBackground(ctx, rect.width, height);

      if (snapshot) {
        ctx.putImageData(snapshot, 0, 0);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [height]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    state.current.history.push(snapshot);
    
    // 限制歷史紀錄長度
    if (state.current.history.length > state.current.maxHistory) {
      state.current.history.shift();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // 在開始畫新的一筆前，先儲存當前狀態
    saveToHistory();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    state.current.lastX = x;
    state.current.lastY = y;
    setIsDrawing(true);

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? 30 : 4;
    ctx.strokeStyle = brushColor;
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const rect = canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(state.current.lastX, state.current.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    state.current.lastX = x;
    state.current.lastY = y;
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || state.current.history.length === 0) return;

    const previousState = state.current.history.pop();
    if (previousState) {
      ctx.putImageData(previousState, 0, 0);
    }
  };

  const handleClearAll = () => {
    if (!window.confirm('確定要清除所有手寫內容嗎？')) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 重新繪製背景線
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // 重設 transform 以繪製正確的背景線
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(ctx, rect.width, height);
    
    // 清空歷史紀錄
    state.current.history = [];
  };

  return (
    <div ref={containerRef} className="w-full bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-inner no-print">
      <div className="p-3 bg-slate-50 border-b flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setTool('pen')} 
            className={`px-4 py-1.5 rounded-lg font-black text-sm transition ${tool === 'pen' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            🖊️ 畫筆
          </button>
          <button 
            onClick={() => setTool('eraser')} 
            className={`px-4 py-1.5 rounded-lg font-black text-sm transition ${tool === 'eraser' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            🧽 橡皮擦
          </button>
        </div>

        <div className="flex gap-2 mx-2">
          {['#000000', '#ef4444', '#3b82f6', '#10b981'].map(c => (
            <button 
              key={c} 
              onClick={() => { setBrushColor(c); setTool('pen'); }} 
              className={`w-8 h-8 rounded-full border-2 transition ${brushColor === c && tool === 'pen' ? 'border-slate-800 scale-110 shadow-md' : 'border-white'}`} 
              style={{ backgroundColor: c }} 
            />
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <button 
            onClick={handleUndo} 
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 active:scale-95 transition"
            title="回復上一步"
          >
            ↩ 回復
          </button>
          <button 
            onClick={handleClearAll} 
            className="px-4 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl font-black text-sm hover:bg-rose-100 active:scale-95 transition"
            title="清除全部"
          >
            🗑️ 全擦
          </button>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointerDown} 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        className="w-full cursor-crosshair block touch-none" 
      />
    </div>
  );
};

export default DrawingCanvas;
