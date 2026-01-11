
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
  
  const state = useRef({
    lastX: 0,
    lastY: 0,
    history: [] as ImageData[],
    maxHistory: 20,
  });

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let snapshot: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      try {
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch(e) {}
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(ctx, rect.width, height);

    if (snapshot) {
      try {
        ctx.putImageData(snapshot, 0, 0);
      } catch(e) {}
    }
  };

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    state.current.history.push(snapshot);
    if (state.current.history.length > state.current.maxHistory) state.current.history.shift();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
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
    ctx.lineWidth = tool === 'eraser' ? 40 : 4;
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

  const handleClearAll = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !containerRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = containerRef.current.getBoundingClientRect();

    // Reset transform before clearRect to wipe physical pixels correctly
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Restore scaling and redraw grid
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(ctx, rect.width, height);
    
    state.current.history = [];
  };

  return (
    <div ref={containerRef} className="w-full bg-white rounded-[3rem] border-4 border-slate-100 overflow-hidden shadow-inner no-print">
      <div className="p-4 bg-slate-50 border-b flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-200">
          <button onClick={() => setTool('pen')} className={`px-6 py-2 rounded-xl font-black text-sm transition ${tool === 'pen' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>🖊️ 筆</button>
          <button onClick={() => setTool('eraser')} className={`px-6 py-2 rounded-xl font-black text-sm transition ${tool === 'eraser' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}>🧽 擦</button>
        </div>
        <div className="flex gap-3 px-4">
          {['#000000', '#ef4444', '#3b82f6', '#10b981'].map(c => (
            <button key={c} onClick={() => { setBrushColor(c); setTool('pen'); }} className={`w-10 h-10 rounded-full border-4 transition ${brushColor === c && tool === 'pen' ? 'border-slate-900 scale-125 shadow-md' : 'border-white'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={handleClearAll} className="ml-auto px-6 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-sm hover:bg-rose-100 transition border border-rose-100 active:scale-95 transition-all">🗑️ 全擦</button>
      </div>
      <canvas ref={canvasRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => setIsDrawing(false)} className="w-full cursor-crosshair block touch-none" />
    </div>
  );
};

export default DrawingCanvas;
