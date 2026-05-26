let audioCtx: AudioContext | null = null;
let bgInterval: number | null = null;
let vibrationOn = true;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setVibrationEnabled(enabled: boolean) {
  vibrationOn = enabled;
}

function triggerVibrate(pattern: number | number[]) {
  if (vibrationOn && typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // safe catching for browser/TWA restrictions
    }
  }
}

export function playSelectSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    triggerVibrate(15);
  } catch (e) {}
}

export function playMoveSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Warm wooden thud sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    triggerVibrate(30);
  } catch (e) {}
}

export function playInvalidSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
    triggerVibrate([40, 30, 40]);
  } catch (e) {}
}

export function playThemeSound() {
  try {
    const ctx = getAudioContext();
    const opt = ctx.currentTime;
    
    // Play an elegant major chord sweep
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord arpeggio
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, opt + i * 0.08);
      
      gain.gain.setValueAtTime(0, opt + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, opt + i * 0.08 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, opt + i * 0.08 + 0.35);
      
      osc.start(opt + i * 0.08);
      osc.stop(opt + i * 0.08 + 0.35);
    });
    triggerVibrate(40);
  } catch (e) {}
}

export function playWinSound() {
  try {
    const ctx = getAudioContext();
    const opt = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, opt + i * 0.1);
      
      gain.gain.setValueAtTime(0, opt + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, opt + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, opt + i * 0.1 + 0.5);
      
      osc.start(opt + i * 0.1);
      osc.stop(opt + i * 0.1 + 0.5);
    });
    triggerVibrate([100, 50, 100, 50, 200]);
  } catch (e) {}
}

export function playLoseSound() {
  try {
    const ctx = getAudioContext();
    const opt = ctx.currentTime;
    const notes = [293.66, 277.18, 246.94, 220.00]; 
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, opt + i * 0.15);
      
      gain.gain.setValueAtTime(0, opt + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, opt + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, opt + i * 0.15 + 0.6);
      
      osc.start(opt + i * 0.15);
      osc.stop(opt + i * 0.15 + 0.6);
    });
    triggerVibrate([120, 80, 120]);
  } catch (e) {}
}

export function playStopSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
}

/**
 * Generative ambient background music synthesizer loop
 */
export function startBackgroundMusic() {
  try {
    const ctx = getAudioContext();
    if (bgInterval) return;

    const pentatonic = [196.00, 220.00, 293.66, 329.63, 392.00, 440.00, 587.33]; // G major pentatonic
    bgInterval = window.setInterval(() => {
      try {
        if (ctx.state === 'suspended') return;
        
        const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panned = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        
        if (panned) {
          osc.connect(gain);
          gain.connect(panned);
          panned.connect(ctx.destination);
          panned.pan.setValueAtTime((Math.random() * 2) - 1, ctx.currentTime);
        } else {
          osc.connect(gain);
          gain.connect(ctx.destination);
        }
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        const attack = 1.2;
        const sustain = 2.5;
        
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + attack + sustain);
        
        osc.start();
        osc.stop(ctx.currentTime + attack + sustain);
      } catch (err) {}
    }, 2800);
  } catch (e) {}
}

export function stopBackgroundMusic() {
  if (bgInterval !== null) {
    clearInterval(bgInterval);
    bgInterval = null;
  }
}
