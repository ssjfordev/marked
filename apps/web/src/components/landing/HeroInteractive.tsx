'use client';

import { useEffect, useRef } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export function HeroInteractive() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const smoothRef = useRef({ x: -1000, y: -1000 });
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const ripplesRef = useRef<Ripple[]>([]);
  const bootedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();

    const ctx = canvas.getContext('2d')!;
    const gap = 24;
    const influence = 170;

    // Auto-ripple from center on first load
    if (!bootedRef.current) {
      bootedRef.current = true;
      setTimeout(() => {
        const { w, h } = sizeRef.current;
        ripplesRef.current.push({ x: w / 2, y: h * 0.38, radius: 0, alpha: 0.7 });
      }, 600);
      setTimeout(() => {
        const { w, h } = sizeRef.current;
        ripplesRef.current.push({ x: w / 2, y: h * 0.38, radius: 0, alpha: 0.4 });
      }, 1000);
    }

    const render = () => {
      const { w, h } = sizeRef.current;
      const mouse = mouseRef.current;
      const sm = smoothRef.current;

      // Detect theme each frame (handles live toggle)
      const isLight = document.documentElement.classList.contains('light');

      // Lerp for smooth tracking
      sm.x += (mouse.x - sm.x) * 0.12;
      sm.y += (mouse.y - sm.y) * 0.12;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const { x: mx, y: my } = sm;

      // Update ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        if (!ripple) continue;
        ripple.radius += 4;
        ripple.alpha *= 0.975;
        if (ripple.alpha < 0.005) ripples.splice(i, 1);
      }

      // Spotlight glow at cursor
      if (mx > -500) {
        const spotAlpha = isLight ? 0.1 : 0.07;
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, 260);
        grd.addColorStop(0, `rgba(16, 185, 129, ${spotAlpha})`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      // Theme-aware values
      const baseAlpha = isLight ? 0.22 : 0.14;
      const activeBoost = isLight ? 0.65 : 0.5;
      const baseColor = isLight ? '80, 120, 100' : '100, 140, 125';
      const activeColor = '16, 185, 129';
      const baseR = isLight ? 1.3 : 1.1;

      // Draw dot grid
      for (let x = gap / 2; x < w; x += gap) {
        for (let y = gap / 2; y < h; y += gap) {
          // Mouse proximity
          const dx = mx - x;
          const dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let t = Math.max(0, 1 - dist / influence);

          // Ripple ring influence
          for (const rp of ripples) {
            const rdx = rp.x - x;
            const rdy = rp.y - y;
            const rDist = Math.sqrt(rdx * rdx + rdy * rdy);
            const ringDist = Math.abs(rDist - rp.radius);
            if (ringDist < 32) {
              t = Math.max(t, (1 - ringDist / 32) * rp.alpha);
            }
          }

          const r = baseR + t * 3;
          const alpha = t > 0.01 ? baseAlpha + t * activeBoost : baseAlpha;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle =
            t > 0.01 ? `rgba(${activeColor}, ${alpha})` : `rgba(${baseColor}, ${alpha})`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    // Track mouse relative to canvas
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    // Click → ripple
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        ripplesRef.current.push({ x, y, radius: 0, alpha: 1 });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 85% at 50% 40%, black 30%, transparent 80%)',
        }}
      />
    </div>
  );
}
