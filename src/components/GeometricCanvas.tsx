// src/components/geometriccanvas.tsx
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
  // 基本（横長・壁紙向け）
  'FHD (1080p)': { w: 1920, h: 1080 },
  'WQHD (1440p)': { w: 2560, h: 1440 },
  '4K (2160p)': { w: 3840, h: 2160 },
  // 正方形（SNS投稿向け）
  'Square (2048×2048)': { w: 2048, h: 2048 },
  // スマホ縦（壁紙向け）
  'iPhone (1290×2796)': { w: 1290, h: 2796 },
  'Android (1080×2400)': { w: 1080, h: 2400 },
};

// ============================================

export const GeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeCanvasRef = useRef<() => void>(() => { });
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
    paramsRef.current = params
    resizeCanvasRef.current()
  }, [params])
  const canvasSizeRef = useRef({ w: window.innerWidth, h: window.innerHeight });

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
          radius = currentParams.baseRadius / Math.cos(a - (angle % (2 * a))) + Math.sin(t) * 20; // a から引くのはゼロ除算回避
          break;
        }

        case 'Butterfly': // 蝶の羽模様
          radius = currentParams.baseRadius * ( // Roseと同じく完全上書き
            Math.pow(Math.E, Math.cos(angle)) // 自然体数の底 e の-1~1乗(0.37 ~ 2.71)
            - 2 * Math.cos(currentParams.waves * angle)
            + Math.pow(Math.sin(angle / 12), 5)
          ) * 0.3;
          break;

        case 'Lissajous': // リサジュー図形
          // 媒介変数表示
          x = currentParams.baseRadius * Math.sin(currentParams.waves * angle + t);
          y = currentParams.baseRadius * Math.sin((currentParams.waves + 1) * angle);
          break; // xとyを直接計算したのでここでbreak

        case 'Web': // クモの巣
          radius += (i % Math.max(1, currentParams.waves) === 0 ? currentParams.waveHeight : 0) * Math.cos(t);
          break;

        case 'Heart': { // ハート型
          const r = currentParams.baseRadius * 0.1; // スケール調整
          x = r * 16 * Math.pow(Math.sin(angle), 3);
          y = -r * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
          // 波のエッセンスを加える(円軌道の平行移動)
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

      // 最初だけmoveTo、あとはlineTo
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.closePath(); // 最後の点と最初の点を自動で繋ぐ
    ctx.stroke(); // 経路を実際に描画
    ctx.restore(); // ctx.save()で保存した状態に戻す
  };

  // ============================================

  // アニメーションループ
  useEffect(
    () => { // 関数部分
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;

      const resizeCanvas = () => {
        // まずウィンドウサイズを取得
        const { innerWidth, innerHeight } = window;
        const dpr = window.devicePixelRatio || 1;

        // アスペクト比を計算
        const { w: resW, h: resH } = RESOLUTIONS[paramsRef.current.resolution];
        const aspectRatio = resW / resH;

        // ウィンドウに収まる最大サイズを計算
        const panelHeight = 100  // パネルの高さの概算
        const availableH = innerHeight - panelHeight

        let canvasW = innerWidth;
        let canvasH = innerWidth / aspectRatio;

        if (canvasH > availableH) {
          canvasH = availableH;
          canvasW = availableH * aspectRatio;
        }

        // キャンバスのサイズを設定
        canvas.style.width = `${canvasW}px`;
        canvas.style.height = `${canvasH}px`;
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // refに保存（renderから読むため）
        canvasSizeRef.current = { w: canvasW, h: canvasH };

        // 背景を黒く塗る
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvasW, canvasH);
      };
      resizeCanvasRef.current = resizeCanvas;

      // リサイズ時に呼ぶ
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas(); // 初回用呼び出し

      const render = () => {
        timeRef.current += 0.01;
        drawPath(ctx, canvasSizeRef.current.w, canvasSizeRef.current.h, paramsRef.current, timeRef.current);
        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        cancelAnimationFrame(animationFrameId);
      };
    },
    // 配列部分
    []);

  const updateParam = (key: keyof Params, value: Params[keyof Params]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

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
        style={{
          display: 'block',
          position: 'fixed',
          top: 'calc(50% - 60px)',  // 60px上にずらす
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: -1
        }}
      />

      {/* UIパネル */}
      <div className="fixed bottom-0 left-0 right-0 z-10 px-6 py-3 bg-[#111111]/80 font-sans text-sm">

        {/* スライダー7列 */}
        <div className="grid grid-cols-7 gap-4 mb-3">
          <Slider label="頂点数" value={params.points} min={10} max={2000} step={1} onChange={(v) => updateParam('points', v)} />
          <Slider label="波の数 / 頂点係数" value={params.waves} min={1} max={50} step={1} onChange={(v) => updateParam('waves', v)} />
          <Slider label="振幅 / 歪み" value={params.waveHeight} min={0} max={500} step={1} onChange={(v) => updateParam('waveHeight', v)} />
          <Slider label="基本半径" value={params.baseRadius} min={10} max={1500} step={1} onChange={(v) => updateParam('baseRadius', v)} />
          <Slider label="回転速度" value={params.rotationSpeed} min={-2} max={2} step={0.1} onChange={(v) => updateParam('rotationSpeed', v)} />
          <Slider label="時間変化速度" value={params.waveSpeed} min={-10} max={10} step={0.1} onChange={(v) => updateParam('waveSpeed', v)} />
          <Slider label="残像の濃さ" value={params.fadeOpacity} min={0.01} max={0.5} step={0.01} onChange={(v) => updateParam('fadeOpacity', v)} />
        </div>

        <div className="flex gap-4 items-end">
          {/* アルゴリズム */}
          <div className="flex-1">
            <label className="block mb-1 text-gray-400">アルゴリズム</label>
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
          {/* 出力サイズ */}
          <div className="flex-1">
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

          {/* ボタン */}
          <button
            onClick={handleDownload}
            className="px-8 py-2 bg-[#00b259] hover:bg-[#00994d] text-white font-bold rounded transition-colors whitespace-nowrap"
          >
            画像を保存
          </button>
        </div>
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
