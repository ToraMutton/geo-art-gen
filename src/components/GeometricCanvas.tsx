// src/components/GeometricCanvas.tsx
import { useRef, useEffect, useState } from 'react';

// パラメータの型定義
type Params = {
  mode: string;
  points: number;
  waves: number;
  waveHeight: number;
  baseRadius: number;
  rotationSpeed: number;
  waveSpeed: number;
  fadeOpacity: number;
};

export const GeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 状態管理
  const [params, setParams] = useState<Params>({
    mode: 'Chaos',
    points: 890,
    waves: 7,
    waveHeight: 30,
    baseRadius: 226,
    rotationSpeed: -0.5,
    waveSpeed: -6.6,
    fadeOpacity: 0.22,
  });

  // アニメーションループ内で最新のparamsを参照するためのRef
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    const draw = (w: number, h: number) => {
      const currentParams = paramsRef.current; // 最新のパラメータを取得

      ctx.fillStyle = `rgba(26, 26, 26, ${currentParams.fadeOpacity})`;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(time * currentParams.rotationSpeed);

      ctx.beginPath();
      ctx.strokeStyle = `hsl(${(time * 50) % 360}, 70%, 60%)`;
      ctx.lineWidth = 2;

      for (let i = 0; i <= currentParams.points; i++) {
        const angle = (i / currentParams.points) * Math.PI * 2;
        let radius = currentParams.baseRadius;

        if (currentParams.mode === 'Wave') {
          radius += Math.sin(angle * currentParams.waves + time * currentParams.waveSpeed) * currentParams.waveHeight;
        } else if (currentParams.mode === 'Chaos') {
          radius += Math.tan(angle * currentParams.waves + time * currentParams.waveSpeed) * currentParams.waveHeight;
        } else if (currentParams.mode === 'Star') {
          radius += (i % 2 === 0 ? currentParams.waveHeight : -currentParams.waveHeight) * Math.sin(time);
        }

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    };

    const render = () => {
      time += 0.01;
      draw(window.innerWidth, window.innerHeight);
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // パラメータ更新用のヘルパー関数
  const updateParam = (key: keyof Params, value: number | string) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `toramatsu-art-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'fixed', top: 0, left: 0, zIndex: -1 }}
      />

      {/* Modrinth風UIパネル */}
      <div className="fixed top-4 right-4 z-10 w-80 p-5 bg-[#1e1e1e] border border-[#2d2d2d] rounded shadow-2xl font-sans text-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-200">Geometry Settings</h2>

        <div className="mb-4">
          <label className="block mb-1 text-gray-400">アルゴリズム</label>
          <select
            value={params.mode}
            onChange={(e) => updateParam('mode', e.target.value)}
            className="w-full bg-[#2d2d2d] border border-[#3d3d3d] text-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#00b259]"
          >
            <option value="Wave">Wave (サイン波)</option>
            <option value="Chaos">Chaos (タンジェント)</option>
            <option value="Star">Star (星型)</option>
          </select>
        </div>

        <Slider label="頂点数" value={params.points} min={10} max={2000} step={1} onChange={(v) => updateParam('points', v)} />
        <Slider label="波の数" value={params.waves} min={1} max={50} step={1} onChange={(v) => updateParam('waves', v)} />
        <Slider label="振幅" value={params.waveHeight} min={0} max={500} step={1} onChange={(v) => updateParam('waveHeight', v)} />
        <Slider label="基本半径" value={params.baseRadius} min={10} max={800} step={1} onChange={(v) => updateParam('baseRadius', v)} />
        <Slider label="回転速度" value={params.rotationSpeed} min={-2} max={2} step={0.1} onChange={(v) => updateParam('rotationSpeed', v)} />
        <Slider label="波の速度" value={params.waveSpeed} min={-10} max={10} step={0.1} onChange={(v) => updateParam('waveSpeed', v)} />
        <Slider label="残像の濃さ" value={params.fadeOpacity} min={0.01} max={0.5} step={0.01} onChange={(v) => updateParam('fadeOpacity', v)} />

        <button
          onClick={handleDownload}
          className="w-full mt-4 px-4 py-2 bg-[#00b259] hover:bg-[#00994d] text-white font-bold rounded transition-colors"
        >
          画像を保存
        </button>
      </div>
    </>
  );
};

// スライダー用コンポーネント
const Slider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
  <div className="mb-3">
    <div className="flex justify-between text-gray-400 mb-1">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full accent-[#00b259]"
    />
  </div>
);
