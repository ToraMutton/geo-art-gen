import { useRef, useEffect } from 'react';

export const GeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0; // アニメーション用の時間変数

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
      // 完全に消さず、薄い黒で上塗りして残像を作る
      ctx.fillStyle = 'rgba(26, 26, 26, 0.05)';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);

      // 全体をゆっくり回転させる
      ctx.rotate(time * 0.2);

      ctx.beginPath();
      // 時間経過で色を変化させる (HSL色空間)
      ctx.strokeStyle = `hsl(${(time * 50) % 360}, 70%, 60%)`;
      ctx.lineWidth = 2;

      const points = 200;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;

        // 波の式に時間を足して、うねりを動かす
        const radius = 150 + Math.sin(angle * 20 + time * 3) * 50;

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
      const { innerWidth, innerHeight } = window;
      time += 0.1; // フレームごとに時間を進める
      draw(innerWidth, innerHeight);
      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 初回のみ完全に黒で塗りつぶす（背景リセット用）
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    render(); // 描画ループ開始！

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId); // コンポーネント破棄時にループを止める
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
      }}
    />
  );
};
