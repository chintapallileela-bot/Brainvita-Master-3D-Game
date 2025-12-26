// Simple sound synthesis using Web Audio API to avoid external asset dependencies
let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const triggerVibration = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
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
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    
    // Short sharp vibration for move
    triggerVibration(15);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playWinSound = () => {
  try {
    const now = 0;
    playTone(523.25, 'sine', 0.4, now, 0.2);       // C5
    playTone(659.25, 'sine', 0.4, now + 0.1, 0.2); // E5
    playTone(783.99, 'sine', 0.4, now + 0.2, 0.2); // G5
    playTone(1046.50, 'sine', 0.8, now + 0.3, 0.2); // C6
    
    // Celebratory vibration
    triggerVibration([100, 50, 100, 50, 200]);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playLoseSound = () => {
  try {
    const now = 0;
    playTone(300, 'triangle', 0.5, now, 0.2);
    playTone(200, 'triangle', 0.8, now + 0.3, 0.2);
    
    // Thud vibration
    triggerVibration(50);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playThemeSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

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
        // Very subtle tick for selection
        triggerVibration(8);
    } catch (e) {}
}

export const playInvalidSound = () => {
    try {
        playTone(150, 'sawtooth', 0.1, 0, 0.1);
        // Buzz for invalid
        triggerVibration([30, 30, 30]);
    } catch (e) {}
}