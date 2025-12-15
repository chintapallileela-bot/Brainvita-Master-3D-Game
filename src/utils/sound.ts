// Simple sound synthesis using Web Audio API to avoid external asset dependencies
let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.1) => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
  
  gain.gain.setValueAtTime(volume, ctx.currentTime + startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
};

export const playMoveSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    // Woodblock/Pop sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Pitch drop for "knock" effect
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playWinSound = () => {
  try {
    const now = 0;
    // C Major Arpeggio
    playTone(523.25, 'sine', 0.4, now, 0.2);       // C5
    playTone(659.25, 'sine', 0.4, now + 0.1, 0.2); // E5
    playTone(783.99, 'sine', 0.4, now + 0.2, 0.2); // G5
    playTone(1046.50, 'sine', 0.8, now + 0.3, 0.2); // C6
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playLoseSound = () => {
  try {
    const now = 0;
    // Descending diminished/minor feel
    playTone(300, 'triangle', 0.5, now, 0.2);
    playTone(200, 'triangle', 0.8, now + 0.3, 0.2);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playThemeSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    // Magical shimmer (high frequency chimes)
    playTone(1200, 'sine', 0.5, 0, 0.05);
    playTone(1500, 'sine', 0.5, 0.05, 0.05);
    playTone(1800, 'sine', 0.8, 0.1, 0.05);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playSelectSound = () => {
    try {
        playTone(400, 'sine', 0.05, 0, 0.1);
    } catch (e) {}
}

export const playInvalidSound = () => {
    try {
        playTone(150, 'sawtooth', 0.1, 0, 0.1);
    } catch (e) {}
}