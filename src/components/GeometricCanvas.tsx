import { useRef, useEffect } from 'react';

export const GeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのリサイズと高解像度対応
    const resizeCanvas = () => {
      const { innerWidth, innerHeight } = window;
      const dpr = window.devicePixelRatio || 1;

      // 表示サイズ（CSS）の指定
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;

      // 描画バッファのサイズ調整（DPR考慮）
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;

      // 座標系をDPRに合わせてスケール
      ctx.scale(dpr, dpr);

      // 描画テスト
      drawTest(ctx, innerWidth, innerHeight);
    };

    // 描画ロジックのテスト用
    const drawTest = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, w, h);

      // 中央にテスト用の円を描画
      ctx.beginPath();
      ctx.strokeStyle = '#646cff';
      ctx.lineWidth = 2;
      ctx.arc(w / 2, h / 2, 100, 0, Math.PI * 2);
      ctx.stroke();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1, // 背景として固定
      }}
    />
  );
};
