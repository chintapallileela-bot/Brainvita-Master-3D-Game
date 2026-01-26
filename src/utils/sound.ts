
// Simple sound synthesis using Web Audio API to avoid external asset dependencies
let audioCtx: AudioContext | null = null;
let musicOscillators: OscillatorNode[] = [];
let musicGainNodes: GainNode[] = [];
let masterMusicGain: GainNode | null = null;
let currentMusicVolume = 0.5;
let vibrationEnabled = true;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const setVibrationEnabled = (enabled: boolean) => {
  vibrationEnabled = enabled;
};

const triggerVibration = (pattern: number | number[]) => {
  if (vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
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

export const setMusicVolume = (volume: number) => {
  currentMusicVolume = volume;
  if (masterMusicGain && audioCtx) {
    masterMusicGain.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.1);
  }
};

export const startBackgroundMusic = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  
  stopBackgroundMusic(); // Ensure we don't double up

  masterMusicGain = ctx.createGain();
  masterMusicGain.gain.setValueAtTime(0, ctx.currentTime);
  masterMusicGain.gain.linearRampToValueAtTime(currentMusicVolume, ctx.currentTime + 2);
  masterMusicGain.connect(ctx.destination);

  const createLayer = (freq: number, vol: number, type: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    
    osc.connect(gain);
    if (masterMusicGain) gain.connect(masterMusicGain);
    osc.start();
    
    musicOscillators.push(osc);
    musicGainNodes.push(gain);
  };

  // Atmospheric ambient drone
  createLayer(110, 0.4); // A2
  createLayer(164.81, 0.3); // E3
  createLayer(220, 0.2); // A3
};

export const stopBackgroundMusic = () => {
  if (masterMusicGain && audioCtx) {
    masterMusicGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
  }
  
  const oldOscillators = musicOscillators;
  musicOscillators = [];
  musicGainNodes = [];
  
  setTimeout(() => {
    oldOscillators.forEach(o => {
      try { o.stop(); } catch(e) {}
    });
    if (masterMusicGain) {
        masterMusicGain.disconnect();
        masterMusicGain = null;
    }
  }, 600);
};

export const playMoveSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

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
    
    triggerVibration(15);
  } catch (e) {}
};

export const playWinSound = () => {
  try {
    const now = 0;
    playTone(523.25, 'sine', 0.4, now, 0.2);       // C5
    playTone(659.25, 'sine', 0.4, now + 0.1, 0.2); // E5
    playTone(783.99, 'sine', 0.4, now + 0.2, 0.2); // G5
    playTone(1046.50, 'sine', 0.8, now + 0.3, 0.2); // C6
    
    triggerVibration([100, 50, 100, 50, 200]);
    stopBackgroundMusic();
  } catch (e) {}
};

/**
 * Enhanced "Bomb Blast" sound for Game Over
 */
export const playLoseSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    // 1. Noise Blast (High-pass filtered white noise)
    const duration = 2.0;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1500, ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Low Boom (Sub-frequency oscillator)
    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(150, ctx.currentTime);
    boom.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.8);

    boomGain.gain.setValueAtTime(1.0, ctx.currentTime);
    boomGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    boom.connect(boomGain);
    boomGain.connect(ctx.destination);

    noise.start();
    boom.start();
    boom.stop(ctx.currentTime + 1.5);

    triggerVibration([150, 100, 250]);
    stopBackgroundMusic();
  } catch (e) {}
};

export const playThemeSound = () => {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') ctx.resume();

    playTone(1200, 'sine', 0.5, 0, 0.05);
    playTone(1500, 'sine', 0.5, 0.05, 0.05);
    playTone(1800, 'sine', 0.8, 0.1, 0.05);
  } catch (e) {}
};

export const playStopSound = () => {
    try {
        const ctx = getContext();
        if (ctx.state === 'suspended') ctx.resume();
        playTone(400, 'triangle', 0.2, 0, 0.1);
        playTone(300, 'triangle', 0.3, 0.1, 0.1);
        triggerVibration([20, 10]);
    } catch (e) {}
}

export const playSelectSound = () => {
    try {
        playTone(400, 'sine', 0.05, 0, 0.1);
        triggerVibration(8);
    } catch (e) {}
}

export const playInvalidSound = () => {
    try {
        playTone(150, 'sawtooth', 0.1, 0, 0.1);
        triggerVibration([30, 30, 30]);
    } catch (e) {}
}
