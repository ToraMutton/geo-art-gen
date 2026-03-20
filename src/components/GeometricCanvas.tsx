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
  resolution: keyof typeof RESOLUTIONS;
};

// 解像度の定義
const RESOLUTIONS = {
  'FHD (1080p)': { w: 1920, h: 1080 },
  'WQHD (1440p)': { w: 2560, h: 1440 },
  '4K (2160p)': { w: 3840, h: 2160 },
};

// ============================================

export const GeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0); // アニメーションの時間を保持

  // 初期状態
  const [params, setParams] = useState<Params>({ // 分割代入
    mode: 'Chaos',
    points: 890,
    waves: 7,
    waveHeight: 30,
    baseRadius: 226,
    rotationSpeed: -0.5,
    waveSpeed: -6.6,
    fadeOpacity: 0.22,
    resolution: 'FHD (1080p)',
  });

  const paramsRef = useRef(params); // 

  useEffect(() => {
    paramsRef.current = params; // paramsが変わるたびに更新
  }, [params]);

  // 描画ロジック（画面用とダウンロード用で使い回すため分離）
  const drawPath = (ctx: CanvasRenderingContext2D, w: number, h: number, currentParams: Params, time: number) => {
    ctx.fillStyle = `rgba(26, 26, 26, ${currentParams.fadeOpacity})`; // 残像効果
    ctx.fillRect(0, 0, w, h); // キャンバス全体を指定色で塗りつぶす

    ctx.save(); // 現在の状態を保存
    ctx.translate(w / 2, h / 2); // 原点を左上(デフォルト)→画面の中心に移動
    ctx.rotate(time * currentParams.rotationSpeed); // キャンバス全体を回転(経過時間×回転速度)

    ctx.beginPath(); // 新しいパスを開始
    // 色も時間経過で変わるように
    ctx.strokeStyle = `hsl(${(time * 50) % 360}, 70%, 60%)`; // 色相変化、彩度と明度は固定
    ctx.lineWidth = 2; // 線の太さ

    // iを0からpoints(頂点数)まで1ずつ増やす
    for (let i = 0; i <= currentParams.points; i++) {
      // angleが 0 から 2π まで一周
      const angle = (i / currentParams.points) * Math.PI * 2;

      let radius = currentParams.baseRadius; // 基本半径      
      let x = 0;
      let y = 0;
      // time × 速度の省略
      const t = time * currentParams.waveSpeed;

      // 10種類の描画アルゴリズム
      switch (currentParams.mode) {
        case 'Wave': // サイン波
          radius += Math.sin(angle * currentParams.waves + t) * currentParams.waveHeight;
          break;

        case 'Chaos': // タンジェント
          radius += Math.tan(angle * currentParams.waves + t) * currentParams.waveHeight;
          break;

        case 'Star': // 星型
          radius += (i % 2 === 0 ? currentParams.waveHeight : -currentParams.waveHeight) * Math.sin(time);
          break;

        case 'Rose': // バラ曲線
          // += ではなく = 、完全に上書き
          radius = currentParams.baseRadius * Math.sin(currentParams.waves * angle + t * 0.5);
          break;

        case 'Spirograph': // スピログラフ風(Waveとほぼ同じ)
          radius += currentParams.waveHeight * Math.cos(angle * (currentParams.waves * 2.5) + t);
          break;

        case 'Polygon': { // 多角形風（カクカクする）
          const sides = Math.max(3, currentParams.waves);
          const a = Math.PI / sides;
          radius = currentParams.baseRadius / Math.cos(a - (angle % (2 * a))) + Math.sin(t) * 20;
          break;
        }

        case 'Butterfly': // 蝶の羽模様
          radius = currentParams.baseRadius * (Math.pow(Math.E, Math.cos(angle)) - 2 * Math.cos(4 * angle) + Math.pow(Math.sin(angle / 12), 5)) * 0.3;
          break;

        case 'Lissajous': // リサジュー図形
          // 媒介変数表示
          x = currentParams.baseRadius * Math.sin(currentParams.waves * angle + t);
          y = currentParams.baseRadius * Math.sin((currentParams.waves + 1) * angle);
          break; // xとyを直接計算したのでここでbreak

        case 'Web': // クモの巣
          radius += (i % Math.max(1, currentParams.waves) === 0 ? currentParams.waveHeight : 0) * Math.cos(t);
          break;

        case 'Heart': { // ハート型（数式ベース）
          const r = currentParams.baseRadius * 0.1;
          x = r * 16 * Math.pow(Math.sin(angle), 3);
          y = -r * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
          // 波のエッセンスを加える
          x += Math.sin(t) * currentParams.waveHeight * 0.1;
          y += Math.cos(t) * currentParams.waveHeight * 0.1;
          break;
        }
      }

      // LissajousとHeart以外は通常の極座標からXYを計算
      if (currentParams.mode !== 'Lissajous' && currentParams.mode !== 'Heart') {
        x = Math.cos(angle) * radius;
        y = Math.sin(angle) * radius;
      }

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  // ============================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window;
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.scale(dpr, dpr);

      // リサイズ時に背景を一度黒く塗りつぶす
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const render = () => {
      timeRef.current += 0.01;
      drawPath(ctx, window.innerWidth, window.innerHeight, paramsRef.current, timeRef.current);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const updateParam = (key: keyof Params, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => {
    const { w, h } = RESOLUTIONS[params.resolution];

    // オフスクリーンキャンバス（裏口の透明なキャンバス）を作成
    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    // ベースの背景色を塗る
    oCtx.fillStyle = '#1a1a1a';
    oCtx.fillRect(0, 0, w, h);

    // 残像（軌跡）を再現するために、過去60フレーム分を高速でシミュレーション描画する
    const framesToSimulate = 60;
    for (let i = framesToSimulate; i >= 0; i--) {
      const simTime = timeRef.current - (i * 0.01);
      drawPath(oCtx, w, h, params, simTime);
    }

    // 画像化してダウンロード
    const link = document.createElement('a');
    link.download = `toramatsu-art-${params.resolution.split(' ')[0]}-${Date.now()}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'fixed', top: 0, left: 0, zIndex: -1 }}
      />

      {/* Modrinth風UIパネル */}
      <div className="fixed top-4 right-4 z-10 w-80 p-5 bg-[#1e1e1e] border border-[#2d2d2d] rounded shadow-2xl font-sans text-sm h-max max-h-[90vh] overflow-y-auto custom-scrollbar">
        <h2 className="mb-4 text-lg font-bold text-gray-200">Geometry Settings</h2>

        <div className="mb-4">
          <label className="block mb-1 text-gray-400">アルゴリズム (10種)</label>
          <select
            value={params.mode}
            onChange={(e) => updateParam('mode', e.target.value)}
            className="w-full bg-[#2d2d2d] border border-[#3d3d3d] text-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#00b259]"
          >
            <option value="Wave">Wave (サイン波)</option>
            <option value="Chaos">Chaos (タンジェント)</option>
            <option value="Star">Star (星型)</option>
            <option value="Rose">Rose (バラ曲線)</option>
            <option value="Spirograph">Spirograph (トロコイド風)</option>
            <option value="Polygon">Polygon (多角形)</option>
            <option value="Butterfly">Butterfly (蝶の羽)</option>
            <option value="Lissajous">Lissajous (リサジュー)</option>
            <option value="Web">Web (クモの巣)</option>
            <option value="Heart">Heart (ハート型)</option>
          </select>
        </div>

        <Slider label="頂点数" value={params.points} min={10} max={2000} step={1} onChange={(v) => updateParam('points', v)} />
        <Slider label="波の数 / 頂点係数" value={params.waves} min={1} max={50} step={1} onChange={(v) => updateParam('waves', v)} />
        <Slider label="振幅 / 歪み" value={params.waveHeight} min={0} max={500} step={1} onChange={(v) => updateParam('waveHeight', v)} />
        <Slider label="基本半径" value={params.baseRadius} min={10} max={1500} step={1} onChange={(v) => updateParam('baseRadius', v)} />
        <Slider label="回転速度" value={params.rotationSpeed} min={-2} max={2} step={0.1} onChange={(v) => updateParam('rotationSpeed', v)} />
        <Slider label="時間変化速度" value={params.waveSpeed} min={-10} max={10} step={0.1} onChange={(v) => updateParam('waveSpeed', v)} />
        <Slider label="残像の濃さ" value={params.fadeOpacity} min={0.01} max={0.5} step={0.01} onChange={(v) => updateParam('fadeOpacity', v)} />

        <div className="mt-6 mb-2 border-t border-[#3d3d3d] pt-4">
          <label className="block mb-1 text-gray-400">出力サイズ</label>
          <select
            value={params.resolution}
            onChange={(e) => updateParam('resolution', e.target.value)}
            className="w-full bg-[#2d2d2d] border border-[#3d3d3d] text-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-[#00b259]"
          >
            {Object.keys(RESOLUTIONS).map(res => (
              <option key={res} value={res}>{res}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownload}
          className="w-full mt-2 px-4 py-2 bg-[#00b259] hover:bg-[#00994d] text-white font-bold rounded transition-colors"
        >
          高画質で保存
        </button>
      </div>
    </>
  );
};

// スライダー用コンポーネント
const Slider = ({ label, value, min, max, step, onChange }: { label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }) => (
  <div className="mb-3">
    <div className="flex justify-between text-gray-400 mb-1 text-xs">
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
