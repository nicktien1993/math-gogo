
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

    const dpr = window.devicePixelRatio || 2; // 手機版強制高解析
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(ctx, rect.width, height);

    if (snapshot) {
      try { ctx.putImageData(snapshot, 0, 0); } catch(e) {}
    }
  };

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height]);

  const handlePointerDown = (e: React.PointerEvent) => {
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
    const rect = containerRef.current.getBoundingClientRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, rect.width, height);
  };

  return (
    <div ref={containerRef} className="w-full bg-white rounded-[2.5rem] border-4 border-slate-100 overflow-hidden shadow-inner no-print touch-none">
      <div className="p-3 bg-slate-50 border-b flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => setTool('pen')} className={`px-4 py-2 rounded-lg font-black text-xs ${tool === 'pen' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>🖊️</button>
          <button onClick={() => setTool('eraser')} className={`px-4 py-2 rounded-lg font-black text-xs ${tool === 'eraser' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}>🧽</button>
        </div>
        <div className="flex gap-2">
          {['#000000', '#ef4444', '#3b82f6'].map(c => (
            <button key={c} onClick={() => { setBrushColor(c); setTool('pen'); }} className={`w-8 h-8 rounded-full border-2 ${brushColor === c && tool === 'pen' ? 'border-slate-800 scale-110' : 'border-white'}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <button onClick={handleClearAll} className="ml-auto px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-black text-xs">🗑️</button>
      </div>
      <canvas 
        ref={canvasRef} 
        onPointerDown={handlePointerDown} 
        onPointerMove={handlePointerMove} 
        onPointerUp={() => setIsDrawing(false)} 
        className="w-full cursor-crosshair block bg-transparent" 
        style={{ touchAction: 'none' }}
      />
    </div>
  );
};

export default DrawingCanvas;
