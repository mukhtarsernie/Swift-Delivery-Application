import { useCallback } from 'react';

export function useNotification() {
  const notify = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined') return;
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(p => {
            if (p === 'granted') new Notification(title, { body });
          }).catch(() => {});
        }
      }
    } catch {}
  }, []);

  return notify;
}

export function playSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(); osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}
