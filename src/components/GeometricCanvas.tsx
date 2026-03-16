// src/components/GeometricCanvas.tsx
import { useRef, useEffect } from 'react';
import { useControls, button } from 'leva';

export const GeometricCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const params = useControls('Geometry Settings', {
    mode: { options: ['Wave', 'Chaos', 'Star'], label: 'アルゴリズム' },
    points: { value: 200, min: 10, max: 2000, step: 1, label: '頂点数' },
    waves: { value: 20, min: 1, max: 50, step: 1, label: '波の数' },
    waveHeight: { value: 50, min: 0, max: 500, step: 1, label: '振幅' },
    baseRadius: { value: 150, min: 10, max: 800, step: 1, label: '基本半径' },
    rotationSpeed: { value: 0.2, min: -2, max: 2, step: 0.1, label: '回転速度' },
    waveSpeed: { value: 3, min: -10, max: 10, step: 0.1, label: '波の速度' },
    fadeOpacity: { value: 0.05, min: 0.01, max: 0.5, step: 0.01, label: '残像の濃さ' },
    '画像を保存': button(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `art.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }),
  });

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
      ctx.fillStyle = `rgba(26, 26, 26, ${params.fadeOpacity})`;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(time * params.rotationSpeed);

      ctx.beginPath();
      ctx.strokeStyle = `hsl(${(time * 50) % 360}, 70%, 60%)`;
      ctx.lineWidth = 2;

      for (let i = 0; i <= params.points; i++) {
        const angle = (i / params.points) * Math.PI * 2;
        let radius = params.baseRadius;

        // 選択されたアルゴリズムで半径を計算
        if (params.mode === 'Wave') {
          radius += Math.sin(angle * params.waves + time * params.waveSpeed) * params.waveHeight;
        } else if (params.mode === 'Chaos') {
          radius += Math.tan(angle * params.waves + time * params.waveSpeed) * params.waveHeight;
        } else if (params.mode === 'Star') {
          radius += (i % 2 === 0 ? params.waveHeight : -params.waveHeight) * Math.sin(time);
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
  }, [params]);

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
