import { useRef, useEffect, useCallback } from 'react';
import { useRF } from '@/context/RFContext';
import { getRadiationPattern, getYagiRadiationPattern, VEHICLES, ANTENNA_POSITIONS, ANTENNAS, YAGI_ARRAY_CONFIG } from '@/lib/rfEngine';

export default function CanvasVisualizer() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const intensityRef = useRef(0);
  const smoothScaleRef = useRef(0);
  const smoothPowerRef = useRef(0);
  const { config, keyed, metrics } = useRF();

  const drawVehicle = useCallback((ctx, cx, cy, vehicleKey, scale, antennaPosKey) => {
    const v = VEHICLES[vehicleKey];
    const pos = ANTENNA_POSITIONS[antennaPosKey] || ANTENNA_POSITIONS['center'];
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

    // Antenna dot — positioned based on mount location
    const antX = cx + pos.xOffset * 22 * s;
    const antY = cy + pos.yOffset * 50 * s;
    ctx.fillStyle = '#00F0FF';
    ctx.beginPath();
    ctx.arc(antX, antY, 3, 0, Math.PI * 2);
    ctx.fill();
    // Small ring around antenna
    ctx.strokeStyle = 'rgba(0,240,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(antX, antY, 6, 0, Math.PI * 2);
    ctx.stroke();
  }, []);

  // Draw Yagi Array with beam and 5 elements
  // ANT1 = behind truck (rear support rig)
  // ANT2 = on truck bed
  // DIR1, DIR2, DIR3 = in front on forward beam
  const drawYagiArray = useCallback((ctx, cx, cy, scale, yagiConfig, keyed) => {
    const heights = yagiConfig?.elementHeights || {};
    const posOffsets = yagiConfig?.elementPositions || {};
    const stickType = yagiConfig?.stickType || 'fight-8';
    const dir1OnTruck = yagiConfig?.dir1OnTruck !== false;
    const baseHeight = stickType === 'fight-10' ? 120 : 96;
    
    const s = scale * 0.5;
    
    // DIR1 position depends on toggle:
    // On truck: 42" in front of truck center (mounted on cab/roof)
    // Front beam: 96" in front (mounted on the front beam extension)
    const dir1Pos = dir1OnTruck ? 42 : 96;
    
    const elements = [
      { id: 'ant1', name: 'ANT1', pos: -72 + (posOffsets.ant1 || 0), height: heights.ant1 || 96, color: '#00F0FF', label: 'REFLECTOR', offset: posOffsets.ant1 || 0 },
      { id: 'ant2', name: 'ANT2', pos: 0 + (posOffsets.ant2 || 0), height: heights.ant2 || 96, color: '#00F0FF', label: 'DRIVEN', offset: posOffsets.ant2 || 0 },
      { id: 'dir1', name: 'DIR1', pos: dir1Pos + (posOffsets.dir1 || 0), height: heights.dir1 || 84, color: '#FFD700', label: dir1OnTruck ? 'ON TRUCK' : 'FRONT BEAM', offset: posOffsets.dir1 || 0 },
      { id: 'dir2', name: 'DIR2', pos: dir1Pos + 96 + (posOffsets.dir2 || 0), height: heights.dir2 || 111, color: '#FF6B35', label: '', offset: posOffsets.dir2 || 0 },
      { id: 'dir3', name: 'DIR3', pos: dir1Pos + 192 + (posOffsets.dir3 || 0), height: heights.dir3 || 111, color: '#FF6B35', label: '', offset: posOffsets.dir3 || 0 },
    ];
    
    // Scale: 12 inches = 8 pixels at scale 1
    const inchToPixel = (inches) => (inches / 12) * 8 * s;
    
    // Draw rear support rig (behind truck for ANT1)
    const rearRigEnd = cy + inchToPixel(72) + 20 * s;
    ctx.strokeStyle = 'rgba(100,100,100,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 35 * s); // Start from back of truck
    ctx.lineTo(cx, rearRigEnd); // Extend backward
    ctx.stroke();
    
    // Rear support struts (V shape)
    ctx.strokeStyle = 'rgba(80,80,80,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 15 * s, cy + 45 * s);
    ctx.lineTo(cx, rearRigEnd - 10 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 15 * s, cy + 45 * s);
    ctx.lineTo(cx, rearRigEnd - 10 * s);
    ctx.stroke();
    
    // Draw front beam (in front of truck for DIR1, DIR2, DIR3)
    const lastDirPos = elements[elements.length - 1].pos;
    const frontBeamEnd = cy - inchToPixel(lastDirPos) - 30 * s;
    ctx.strokeStyle = 'rgba(100,100,100,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 45 * s); // Start from front of truck
    ctx.lineTo(cx, frontBeamEnd); // Extend forward
    ctx.stroke();
    
    // Front support struts
    ctx.strokeStyle = 'rgba(80,80,80,0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 20 * s, cy - 35 * s);
    ctx.lineTo(cx, cy - inchToPixel(100));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 20 * s, cy - 35 * s);
    ctx.lineTo(cx, cy - inchToPixel(100));
    ctx.stroke();
    
    // Draw each antenna element
    elements.forEach((el) => {
      // Position: negative = behind (down on screen), positive = in front (up on screen)
      const elY = cy - inchToPixel(el.pos);
      const elX = cx;
      
      // Height visualization (taller = longer line going up from mount point)
      const heightScale = (el.height / baseHeight) * 30 * s;
      
      // Antenna base (mount point on beam)
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(elX, elY, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      
      // Antenna element (vertical line going UP from mount)
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(elX, elY);
      ctx.lineTo(elX, elY - heightScale);
      ctx.stroke();
      
      // Antenna tip glow when keyed
      if (keyed) {
        ctx.fillStyle = el.color;
        ctx.shadowColor = el.color;
        ctx.shadowBlur = 8;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(elX, elY - heightScale, 3 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Element label (to the side)
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `${8 * s}px "JetBrains Mono"`;
      ctx.textAlign = 'left';
      ctx.fillText(el.name, elX + 8 * s, elY);
      
      // Height label
      ctx.fillStyle = el.color;
      ctx.font = `${7 * s}px "JetBrains Mono"`;
      ctx.fillText(`${el.height}"`, elX + 8 * s, elY - heightScale + 3);
      
      // Position offset label (show if non-zero)
      if (el.offset !== 0) {
        ctx.fillStyle = el.offset > 0 ? 'rgba(0,255,150,0.7)' : 'rgba(255,100,100,0.7)';
        ctx.font = `${6 * s}px "JetBrains Mono"`;
        ctx.fillText(`${el.offset > 0 ? '+' : ''}${el.offset}"`, elX + 8 * s, elY + 10 * s);
      }
    });
    
    // "YAGI ARRAY" label at the front
    ctx.fillStyle = 'rgba(255,215,0,0.7)';
    ctx.font = `bold ${10 * s}px "Chakra Petch"`;
    ctx.textAlign = 'center';
    ctx.fillText('YAGI ARRAY', cx, frontBeamEnd - 10 * s);
    
    // Direction arrow (forward)
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const arrowY = frontBeamEnd - 20 * s;
    ctx.moveTo(cx, arrowY);
    ctx.lineTo(cx - 10 * s, arrowY + 12 * s);
    ctx.moveTo(cx, arrowY);
    ctx.lineTo(cx + 10 * s, arrowY + 12 * s);
    ctx.stroke();
    
    // "REAR" label
    ctx.fillStyle = 'rgba(100,100,100,0.5)';
    ctx.font = `${8 * s}px "JetBrains Mono"`;
    ctx.fillText('REAR', cx, rearRigEnd + 15 * s);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      // Cap DPR at 1 on mobile for performance
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let lastFrame = 0;
    const targetFPS = window.innerWidth < 768 ? 24 : 60;
    const frameInterval = 1000 / targetFPS;

    const draw = (timestamp) => {
      animRef.current = requestAnimationFrame(draw);
      if (timestamp - lastFrame < frameInterval) return;
      lastFrame = timestamp;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
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
      drawVehicle(ctx, cx, cy, config.vehicle, 1.2, config.antennaPosition);

      // Draw Yagi Array if enabled
      if (config.yagiMode) {
        drawYagiArray(ctx, cx, cy, 1.2, {
          stickType: config.yagiStickType,
          elementHeights: config.yagiElementHeights,
          dir1OnTruck: config.yagiDir1OnTruck,
          elementPositions: config.yagiElementPositions,
        }, keyed);
      }

      // Radiation pattern
      if (intensity > 0.01) {
        // Use modulated power when mic is active, otherwise dead key
        const rawPower = keyed ? metrics.modulatedWatts : 0;
        // Smooth the power to prevent frame-to-frame jitter at high wattage
        smoothPowerRef.current += (rawPower - smoothPowerRef.current) * 0.15;
        const power = smoothPowerRef.current;
        
        // Choose pattern based on Yagi mode
        const pattern = config.yagiMode 
          ? getYagiRadiationPattern(config.vehicle, config.bonding, power, {
              stickType: config.yagiStickType,
              swrTuned: true,
              elementPositions: config.yagiElementPositions,
              dir1OnTruck: config.yagiDir1OnTruck,
            })
          : getRadiationPattern(config.vehicle, config.bonding, power, config.antenna, config.antennaPosition);
        
        const pulse = 1 + Math.sin(time * 4) * 0.02 * intensity;

        // Auto-scale: find max pattern gain and scale to fit within 90% of maxR
        const maxGain = Math.max(...pattern.map(p => p.gain));
        const targetScale = maxGain > 0 ? (maxR * 0.9) / maxGain : 1;
        // Smooth scale factor to prevent jittery resizing at high power
        if (smoothScaleRef.current === 0) smoothScaleRef.current = targetScale;
        smoothScaleRef.current += (targetScale - smoothScaleRef.current) * 0.12;
        const scaleFactor = smoothScaleRef.current;

        // Distance model: base range in feet, scaled by antenna gain
        // ~500W with 0dBi rear mount ≈ 20ft forward / 6ft back
        const antennaObj = ANTENNAS[config.antenna] || ANTENNAS['whip-102'];
        const antGainLinear = Math.pow(10, antennaObj.gainDBI / 10);
        const baseRangeFt = Math.sqrt(Math.max(1, power) * antGainLinear) * 0.9;

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
          const r = p.gain * scaleFactor * intensity * pulse;
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
          const r = p.gain * scaleFactor * intensity * pulse;
          const x = cx + Math.cos(rad) * r;
          const y = cy + Math.sin(rad) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();

        // Distance labels (feet) at N/S/E/W edges of the pattern
        if (keyed && power > 0) {
          ctx.font = 'bold 10px "JetBrains Mono"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Find gain at cardinal directions (N=270°, S=90°, E=0°, W=180°)
          const cardinals = [
            { label: 'N', angle: 270, dir: 'FRONT' },
            { label: 'S', angle: 90,  dir: 'REAR' },
            { label: 'E', angle: 0,   dir: 'RIGHT' },
            { label: 'W', angle: 180, dir: 'LEFT' },
          ];

          cardinals.forEach(c => {
            // Find the pattern point closest to this cardinal angle
            const idx = Math.round(c.angle / 2) % 180;
            const p = pattern[idx] || pattern[0];
            const distFt = Math.round((p.gain / maxGain) * baseRangeFt);
            const r = p.gain * scaleFactor * intensity * pulse;
            const rad = (c.angle * Math.PI) / 180;
            const lx = cx + Math.cos(rad) * (r + 16);
            const ly = cy + Math.sin(rad) * (r + 16);

            if (distFt > 0) {
              ctx.fillStyle = `hsla(${hue},100%,70%,${0.7 * intensity})`;
              ctx.fillText(`${distFt}ft`, lx, ly);
            }
          });
        }

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

      // Under-driven amplifier warning
      if (metrics.underDriven && config.finalAmp !== 'none') {
        const flash = Math.sin(time * 4) > -0.3;
        if (flash) {
          ctx.save();
          ctx.fillStyle = 'rgba(255,165,0,0.85)';
          ctx.font = 'bold 10px "Chakra Petch"';
          ctx.textAlign = 'center';
          ctx.fillText('UNDER-DRIVEN AMP', cx, h - 40);
          ctx.font = '8px "JetBrains Mono"';
          ctx.fillStyle = 'rgba(255,165,0,0.6)';
          ctx.fillText(`Drive: ${metrics.driveWatts}W / Need: ${metrics.idealDrive}W (${Math.round(metrics.driveRatio * 100)}%)`, cx, h - 28);
          ctx.restore();
        }
      }

      // High voltage warning (>19V)
      if (metrics.highVoltageWarn) {
        const flash = Math.sin(time * 6) > 0;
        if (flash) {
          ctx.save();
          ctx.fillStyle = 'rgba(255,60,60,0.9)';
          ctx.font = 'bold 10px "Chakra Petch"';
          ctx.textAlign = 'right';
          ctx.fillText(`HIGH VOLTAGE: ${metrics.ampVoltage}V`, w - 12, 24);
          ctx.restore();
        }
      }

      // Blown pill warning
      if (metrics.driverBlown || metrics.finalBlown) {
        const flash = Math.sin(time * 8) > -0.2;
        ctx.save();
        ctx.fillStyle = flash ? 'rgba(255,30,30,0.95)' : 'rgba(255,30,30,0.4)';
        ctx.font = 'bold 12px "Chakra Petch"';
        ctx.textAlign = 'center';
        const which = metrics.driverBlown && metrics.finalBlown ? 'DRIVER + FINAL' : metrics.driverBlown ? 'DRIVER' : 'FINAL';
        ctx.fillText(`BLOWN PILL — ${which}`, cx, h - 55);
        ctx.font = '8px "JetBrains Mono"';
        ctx.fillStyle = 'rgba(255,100,100,0.6)';
        ctx.fillText('Reset amp in equipment rack to continue', cx, h - 42);
        ctx.restore();
      }

      // Take-off angle visualization (mini side-view in bottom-right corner)
      {
        const taSize = Math.min(w, h) * 0.15;
        const taX = w - taSize - 16;
        const taY = h - taSize - 16;
        const angleRad = (metrics.takeoffAngle * Math.PI) / 180;

        // Background
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(taX - 8, taY - 20, taSize + 16, taSize + 28, 4);
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.fillStyle = 'rgba(0,240,255,0.5)';
        ctx.font = '8px "Chakra Petch"';
        ctx.textAlign = 'center';
        ctx.fillText('TAKE-OFF', taX + taSize / 2, taY - 8);

        // Ground line
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(taX, taY + taSize);
        ctx.lineTo(taX + taSize, taY + taSize);
        ctx.stroke();

        // Vehicle dot
        ctx.fillStyle = '#00F0FF';
        ctx.beginPath();
        ctx.arc(taX + taSize * 0.3, taY + taSize - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Take-off angle beam
        const beamLen = taSize * 0.8;
        const beamEndX = taX + taSize * 0.3 + Math.cos(-angleRad) * beamLen;
        const beamEndY = taY + taSize - 2 + Math.sin(-angleRad) * beamLen;

        ctx.strokeStyle = keyed ? `hsla(186,100%,50%,${0.4 + intensity * 0.4})` : 'rgba(0,240,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(taX + taSize * 0.3, taY + taSize - 2);
        ctx.lineTo(beamEndX, beamEndY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Angle arc
        ctx.strokeStyle = 'rgba(0,240,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(taX + taSize * 0.3, taY + taSize - 2, taSize * 0.25, -angleRad, 0);
        ctx.stroke();

        // Angle label
        ctx.fillStyle = metrics.takeoffAngle > 40 ? 'rgba(255,200,0,0.8)' : 'rgba(0,240,255,0.7)';
        ctx.font = 'bold 10px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(`${metrics.takeoffAngle}°`, taX + taSize * 0.7, taY + taSize - 8);
        ctx.restore();
      }

      // Power readout overlay
      if (keyed) {
        const showWatts = Math.round(metrics.modulatedWatts);
        const isModulating = metrics.micLevel > 0.05;
        const hueW = showWatts > metrics.deadKeyWatts * 1.2 ? 48 : 186;
        ctx.fillStyle = `hsla(${hueW},100%,60%,${0.7 * intensity})`;
        ctx.font = 'bold 14px "JetBrains Mono"';
        ctx.textAlign = 'left';
        ctx.fillText(`${showWatts}W`, 12, 24);
        ctx.font = '9px "Chakra Petch"';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(isModulating ? 'MODULATED' : 'DEAD KEY', 12, 36);
      }
    };
    animRef.current = requestAnimationFrame(draw);

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
