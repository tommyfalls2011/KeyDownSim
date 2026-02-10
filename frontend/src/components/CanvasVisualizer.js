import { useRef, useEffect, useCallback } from 'react';
import { useRF } from '@/context/RFContext';
import { getRadiationPattern, VEHICLES } from '@/lib/rfEngine';

export default function CanvasVisualizer() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const intensityRef = useRef(0);
  const { config, keyed, metrics } = useRF();

  const drawVehicle = useCallback((ctx, cx, cy, vehicleKey, scale) => {
    const v = VEHICLES[vehicleKey];
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0,240,255,0.03)';

    const s = scale * 0.4;
    if (v?.shape === 'truck') {
      // Cab
      ctx.beginPath();
      ctx.roundRect(cx - 22*s, cy - 50*s, 44*s, 45*s, 4*s);
      ctx.fill(); ctx.stroke();
      // Bed
      ctx.beginPath();
      ctx.rect(cx - 24*s, cy, 48*s, 50*s);
      ctx.fill(); ctx.stroke();
      // Wheels
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - 28*s, cy - 40*s, 5*s, 12*s);
      ctx.fillRect(cx + 23*s, cy - 40*s, 5*s, 12*s);
      ctx.fillRect(cx - 28*s, cy + 30*s, 5*s, 12*s);
      ctx.fillRect(cx + 23*s, cy + 30*s, 5*s, 12*s);
    } else if (v?.shape === 'van') {
      ctx.beginPath();
      ctx.roundRect(cx - 24*s, cy - 55*s, 48*s, 110*s, 6*s);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - 28*s, cy - 40*s, 5*s, 12*s);
      ctx.fillRect(cx + 23*s, cy - 40*s, 5*s, 12*s);
      ctx.fillRect(cx - 28*s, cy + 30*s, 5*s, 12*s);
      ctx.fillRect(cx + 23*s, cy + 30*s, 5*s, 12*s);
    } else if (v?.shape === 'wagon') {
      ctx.beginPath();
      ctx.roundRect(cx - 22*s, cy - 45*s, 44*s, 90*s, 5*s);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - 26*s, cy - 35*s, 5*s, 10*s);
      ctx.fillRect(cx + 21*s, cy - 35*s, 5*s, 10*s);
      ctx.fillRect(cx - 26*s, cy + 28*s, 5*s, 10*s);
      ctx.fillRect(cx + 21*s, cy + 28*s, 5*s, 10*s);
    } else {
      // SUV (default)
      ctx.beginPath();
      ctx.roundRect(cx - 24*s, cy - 52*s, 48*s, 104*s, 6*s);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#333';
      ctx.fillRect(cx - 28*s, cy - 40*s, 5*s, 12*s);
      ctx.fillRect(cx + 23*s, cy - 40*s, 5*s, 12*s);
      ctx.fillRect(cx - 28*s, cy + 30*s, 5*s, 12*s);
      ctx.fillRect(cx + 23*s, cy + 30*s, 5*s, 12*s);
    }

    // Antenna dot on roof center
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.arc(cx, cy - 52*s - 4*s, 3, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      time += 0.016;

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.42;

      // Smooth intensity transition
      const targetIntensity = keyed ? 1 : 0;
      intensityRef.current += (targetIntensity - intensityRef.current) * 0.08;
      const intensity = intensityRef.current;

      // Polar grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let r = maxR * 0.2; r <= maxR; r += maxR * 0.2) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Radial lines
      for (let a = 0; a < 360; a += 30) {
        const rad = (a * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR);
        ctx.stroke();
      }

      // Distance labels
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      for (let i = 1; i <= 5; i++) {
        const r = maxR * i * 0.2;
        ctx.fillText(`${i * 20}%`, cx + r + 2, cy - 4);
      }

      // Compass labels
      ctx.fillStyle = 'rgba(0,240,255,0.4)';
      ctx.font = '10px "Chakra Petch"';
      ctx.textAlign = 'center';
      ctx.fillText('N', cx, cy - maxR - 8);
      ctx.fillText('S', cx, cy + maxR + 14);
      ctx.fillText('E', cx + maxR + 12, cy + 4);
      ctx.fillText('W', cx - maxR - 12, cy + 4);

      // Ground plane line
      if (!config.bonding) {
        ctx.strokeStyle = 'rgba(255,42,109,0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx - maxR, cy + 20);
        ctx.lineTo(cx + maxR, cy + 20);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255,42,109,0.5)';
        ctx.font = '8px "JetBrains Mono"';
        ctx.fillText('POOR BONDING', cx, cy + 32);
      }

      // Draw vehicle
      drawVehicle(ctx, cx, cy, config.vehicle, 1.2);

      // Radiation pattern
      if (intensity > 0.01) {
        const power = keyed ? metrics.deadKeyWatts : 0;
        const pattern = getRadiationPattern(config.vehicle, config.bonding, power, config.antenna);
        const pulse = 1 + Math.sin(time * 4) * 0.05 * intensity;

        // Fill
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        const hue = power > 3000 ? 339 : power > 1000 ? 48 : 186;
        gradient.addColorStop(0, `hsla(${hue},100%,50%,${0.02 * intensity})`);
        gradient.addColorStop(0.5, `hsla(${hue},100%,50%,${0.08 * intensity})`);
        gradient.addColorStop(1, `hsla(${hue},100%,50%,0)`);
        ctx.fillStyle = gradient;

        ctx.beginPath();
        pattern.forEach((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const r = Math.min(p.gain * maxR * intensity * pulse, maxR);
          const x = cx + Math.cos(rad) * r;
          const y = cy + Math.sin(rad) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();

        // Stroke
        ctx.strokeStyle = `hsla(${hue},100%,60%,${0.6 * intensity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pattern.forEach((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const r = Math.min(p.gain * maxR * intensity * pulse, maxR);
          const x = cx + Math.cos(rad) * r;
          const y = cy + Math.sin(rad) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();

        // Voltage nodes (hot spots)
        if (intensity > 0.5 && power > 500) {
          const nodeCount = Math.min(Math.floor(power / 1000), 6);
          for (let i = 0; i < nodeCount; i++) {
            const angle = (i / nodeCount) * Math.PI * 2 + time;
            const nr = 20 + Math.sin(time * 3 + i) * 5;
            const nx = cx + Math.cos(angle) * nr;
            const ny = cy + Math.sin(angle) * nr;
            ctx.fillStyle = `rgba(255,214,0,${0.3 + Math.sin(time * 5 + i) * 0.2})`;
            ctx.beginPath();
            ctx.arc(nx, ny, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Voltage drop warning
      if (metrics.overloaded && keyed) {
        const flash = Math.sin(time * 6) > 0;
        if (flash) {
          ctx.fillStyle = 'rgba(255,42,109,0.8)';
          ctx.font = 'bold 11px "Chakra Petch"';
          ctx.textAlign = 'center';
          ctx.fillText('VOLTAGE DROP WARNING', cx, 24);
        }
      }

      // Power readout overlay
      if (keyed) {
        ctx.fillStyle = `rgba(0,240,255,${0.7 * intensity})`;
        ctx.font = 'bold 14px "JetBrains Mono"';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(metrics.deadKeyWatts)}W`, 12, 24);
        ctx.font = '9px "Chakra Petch"';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('DEAD KEY', 12, 36);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [config, keyed, metrics, drawVehicle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      data-testid="rf-canvas"
    />
  );
}
