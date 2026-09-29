"use client";

// Единый AudioContext на вкладку. Браузеры разрешают его создание/возобновление
// только внутри настоящего пользовательского жеста (клик по переключателю
// звука) — поэтому unlockNotificationSound() нужно вызывать прямо из
// обработчика клика, а не откладывать на момент прихода заказа.
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

/** Вызывать синхронно из обработчика клика — "разблокирует" звук в браузере. */
export function unlockNotificationSound(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

/** Протяжный тройной сигнал для нового заказа — заметный, даже если не смотреть на экран. */
export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const toneDuration = 0.4;
  const gap = 0.08;

  const playBeep = (startAt: number, frequency: number) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.6, startAt + 0.03);
    gain.gain.linearRampToValueAtTime(0.6, startAt + toneDuration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startAt + toneDuration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + toneDuration);
  };

  const now = ctx.currentTime;
  playBeep(now, 880);
  playBeep(now + (toneDuration + gap), 1046.5);
  playBeep(now + (toneDuration + gap) * 2, 1318.5);
}
