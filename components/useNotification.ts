import { useEffect, useRef, useCallback } from 'react';

export function useNotification() {
  const permitted = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { permitted.current = p === 'granted'; });
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      permitted.current = true;
    }
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (typeof window === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', badge: '/favicon.ico' });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
      });
    }
  }, []);

  return notify;
}

export function playSound() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 800; osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}
