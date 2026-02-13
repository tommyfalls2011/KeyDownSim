import { useState, useRef, useCallback, useEffect } from 'react';

export function useMic() {
  const [micEnabled, setMicEnabled] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);

  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        // RMS-style average of frequency data
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length) / 255;
        // Normalize: quiet = 0, normal talking = 0.5-0.8, loud = 1.0
        // Apply curve so normal speech sits in the middle range
        const level = Math.min(1.0, rms * 3.0);
        setMicLevel(level);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      setMicEnabled(true);
    } catch (err) {
      console.error('Mic access denied:', err);
      setMicEnabled(false);
    }
  }, []);

  const stopMic = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setMicLevel(0);
    setMicEnabled(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (micEnabled) stopMic();
    else startMic();
  }, [micEnabled, startMic, stopMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMic();
  }, [stopMic]);

  return { micEnabled, micLevel, toggleMic };
}
