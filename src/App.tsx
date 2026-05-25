import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board.tsx';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types.ts';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic.ts';
import { 
  X, Timer as TimerIcon, Play, Palette, LayoutGrid, Clipboard, CheckCircle2,
  Trophy, RefreshCw, Award, Volume2, VolumeX, HelpCircle, Frown, Check, Menu, Settings, ShieldCheck, Bug
} from 'lucide-react';
import { THEMES, LAYOUTS } from './constants.ts';
import { Tutorial } from './components/Tutorial.tsx';
import { SelectionModal } from './components/SelectionModal.tsx';
import { RemovedMarbles } from './components/RemovedMarbles.tsx';
import { 
  playMoveSound, 
  playWinSound, 
  playLoseSound, 
  playThemeSound, 
  playSelectSound, 
  playInvalidSound,
  playStopSound,
  startBackgroundMusic,
  stopBackgroundMusic,
  setVibrationEnabled
} from './utils/sound.ts';

const VERSION = "1.9.9";
const TUTORIAL_KEY = `brainvita_tutorial_v${VERSION.replace(/\./g, '')}`;

// High-fidelity Gold Medal Badge with 3D reflection
const GoldMedalBadge: React.FC<{ size?: string, glow?: boolean }> = ({ size = "w-24 h-24", glow = true }) => (
  <div className={`relative ${size} flex items-center justify-center shrink-0`}>
    {glow && (
      <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-3xl animate-pulse"></div>
    )}
    <div className="relative w-full h-full rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 p-[2.5px] shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-white/40 ring-1 ring-amber-500/50">
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#8a5b00] to-[#cc8400] flex items-center justify-center shadow-inner relative overflow-hidden">
        <div className="w-[60%] h-[60%] rounded-b-3xl rounded-t-xl bg-[#4d3200] border-t-2 border-amber-900/40 flex items-center justify-center shadow-2xl">
            <div className="w-[40%] h-[40%] rounded-full bg-[#3d2800] opacity-60"></div>
        </div>
        <div className="absolute top-[8%] left-[18%] w-[25%] h-[15%] bg-white/60 rounded-full blur-[1.5px] rotate-[25deg]"></div>
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>
        <div className="absolute bottom-[5%] right-[20%] w-[15%] h-[10%] bg-amber-200/40 rounded-full blur-[2px]"></div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => THEMES[0]);
  const [currentLayout, setCurrentLayout] = useState<GameLayout>(() => LAYOUTS[0]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard(LAYOUTS[0].board));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTwaHub, setShowTwaHub] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Custom package name / SHA-256 for developer testing
  const [pkgName, setPkgName] = useState("com.brainvita.master3d");
  const [shaFingerprint, setShaFingerprint] = useState("A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2:C3:D4:E5:F6:A1:B2");
  
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TUTORIAL_KEY) !== 'true';
    } catch (e) {
      return true; 
    }
  });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [timer, setTimer] = useState(0);
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});
  const [totalWins, setTotalWins] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [animatingMove, setAnimatingMove] = useState<{from: Position, to: Position, mid: Position} | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Load local state configuration
  useEffect(() => {
    const savedTimes = localStorage.getItem('brainvita_best_times');
    if (savedTimes) {
      try { setBestTimes(JSON.parse(savedTimes)); } catch (e) {}
    }
    const savedWins = localStorage.getItem('brainvita_total_wins');
    if (savedWins) {
      setTotalWins(parseInt(savedWins, 10) || 0);
    }
    const savedVibe = localStorage.getItem('brainvita_vibration');
    if (savedVibe !== null) {
      const isOn = savedVibe === 'true';
      setVibrationOn(isOn);
      setVibrationEnabled(isOn);
    }
    const savedPkg = localStorage.getItem('twa_package_name');
    if (savedPkg) setPkgName(savedPkg);
    const savedSha = localStorage.getItem('twa_sha_fingerprint');
    if (savedSha) setShaFingerprint(savedSha);
  }, []);

  const completeTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (e) {}
  };

  // Timer run loop
  useEffect(() => {
    let interval: number;
    if (gameStatus === GameStatus.PLAYING) {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sound loop generator
  useEffect(() => {
    if (soundEnabled && gameStatus === GameStatus.PLAYING) {
      startBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
    return () => {
      stopBackgroundMusic();
    };
  }, [soundEnabled, gameStatus]);

  // Tilt/Pan responsive parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { 
      mouseRef.current = { x: e.clientX, y: e.clientY }; 
    };
    const handleTouchMove = (e: TouchEvent) => { 
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; 
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    let animationFrameId: number;
    const animate = () => {
      const { x, y } = mouseRef.current;
      const targetX = x === 0 ? 0 : (x / window.innerWidth) * 2 - 1;
      const targetY = y === 0 ? 0 : (y / window.innerHeight) * 2 - 1;
      
      if (boardRef.current) {
        if (gameStatus === GameStatus.WON) {
          const spin = (Date.now() / 20) % 360;
          boardRef.current.style.transform = `rotateX(12deg) rotateY(${spin}deg)`;
        } else {
          boardRef.current.style.transform = `rotateX(${16 + targetY * -6}deg) rotateY(${targetX * 6}deg)`;
        }
      }
      
      if (bgLayerRef.current) {
        bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.06)`;
      }
      if (titleRef.current) {
        titleRef.current.style.transform = `translate(${targetX * 3}px, ${targetY * 3}px) translateZ(30px)`;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStatus]);

  const marblesRemaining = useMemo(() => countMarbles(board), [board]);

  const totalMarblesInLayout = useMemo(() => {
    return currentLayout.board.flat().filter(v => v === 1).length;
  }, [currentLayout]);

  const validDestinations = useMemo(() => {
    if (!selectedPos || animatingMove) return [];
    const potentialMoves = [
        { r: selectedPos.row - 2, c: selectedPos.col },
        { r: selectedPos.row + 2, c: selectedPos.col },
        { r: selectedPos.row, c: selectedPos.col - 2 },
        { r: selectedPos.row, c: selectedPos.col + 2 },
    ];
    return potentialMoves
      .map(p => ({ row: p.r, col: p.c }))
      .filter(dest => isMoveValid(board, selectedPos, dest));
  }, [board, selectedPos, animatingMove]);

  const handleCellClick = (pos: Position) => {
    let actualStatus = gameStatus;
    if (gameStatus === GameStatus.IDLE) {
      setGameStatus(GameStatus.PLAYING);
      actualStatus = GameStatus.PLAYING;
    }

    if (actualStatus !== GameStatus.PLAYING || animatingMove) return;

    const cell = board[pos.row][pos.col];
    if (cell === CellState.MARBLE) {
      if (selectedPos?.row === pos.row && selectedPos?.col === pos.col) {
        setSelectedPos(null);
      } else {
        setSelectedPos(pos);
        if (soundEnabled) playSelectSound();
      }
      return;
    }
    if (cell === CellState.EMPTY && selectedPos) {
      if (isMoveValid(board, selectedPos, pos)) {
        initiateMove(selectedPos, pos);
      } else {
        setSelectedPos(null);
        if (soundEnabled) playInvalidSound();
      }
    }
  };

  const initiateMove = (from: Position, to: Position) => {
    const midRow = (from.row + to.row) / 2;
    const midCol = (from.col + to.col) / 2;
    const mid = { row: midRow, col: midCol };
    
    if (soundEnabled) playMoveSound();
    setAnimatingMove({ from, to, mid });
    setSelectedPos(null);

    setTimeout(() => { 
      finalizeMove(from, to, mid); 
      setAnimatingMove(null); 
    }, 150);
  };

  const finalizeMove = (from: Position, to: Position, mid: Position) => {
    const newBoard = board.map(row => [...row]);
    newBoard[from.row][from.col] = CellState.EMPTY;
    newBoard[mid.row][mid.col] = CellState.EMPTY;
    newBoard[to.row][to.col] = CellState.MARBLE;
    setBoard(newBoard);

    const status = checkGameStatus(newBoard);
    if (status !== GameStatus.PLAYING) {
      setGameStatus(status);
      if (status === GameStatus.WON) {
        if (soundEnabled) playWinSound();
        const wins = totalWins + 1;
        setTotalWins(wins);
        localStorage.setItem('brainvita_total_wins', wins.toString());

        const best = bestTimes[currentLayout.id];
        if (best === undefined || timer < best) {
          setIsNewRecord(true);
          const nextRecords = { ...bestTimes, [currentLayout.id]: timer };
          setBestTimes(nextRecords);
          localStorage.setItem('brainvita_best_times', JSON.stringify(nextRecords));
        } else {
          setIsNewRecord(false);
        }
      } else if (status === GameStatus.LOSE) {
        if (soundEnabled) playLoseSound();
      }
      setShowResultsModal(true);
    }
  };

  const startNewGame = (layout = currentLayout) => {
    setBoard(createInitialBoard(layout.board));
    setSelectedPos(null);
    setTimer(0);
    setGameStatus(GameStatus.PLAYING);
    setShowResultsModal(false);
    setIsNewRecord(false);
    if (soundEnabled) playStopSound();
  };

  const handleLayoutSelect = (layoutId: string) => {
    const lay = LAYOUTS.find(l => l.id === layoutId);
    if (lay) {
      setCurrentLayout(lay);
      startNewGame(lay);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    const th = THEMES.find(t => t.id === themeId);
    if (th) {
      setCurrentTheme(th);
      if (soundEnabled) playThemeSound();
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (!next) stopBackgroundMusic();
  };

  const toggleVibration = () => {
    const next = !vibrationOn;
    setVibrationOn(next);
    setVibrationEnabled(next);
    localStorage.setItem('brainvita_vibration', next ? 'true' : 'false');
    if (next) playSelectSound();
  };

  const getAssetlinksSnippet = () => {
    return JSON.stringify([
      {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
          "namespace": "android_app",
          "package_name": pkgName,
          "sha256_cert_fingerprints": [shaFingerprint.toUpperCase().trim()]
        }
      }
    ], null, 2);
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getAssetlinksSnippet());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-between text-slate-100 overflow-x-hidden antialiased bg-gradient-to-b ${currentTheme.bgGradient} p-4 sm:p-6 duration-700 select-none pb-[safe-area-inset-bottom]`}>
      
      {/* Background layer */}
      <div 
        ref={bgLayerRef}
        className="absolute inset-0 bg-cover bg-center pointer-events-none transform transition-transform duration-300 ease-out opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, transparent 70%)'
        }}
      />

      {/* Embedded Floating Header */}
      <header className="relative z-20 w-full max-w-lg flex items-center justify-between mt-2 pt-safe">
        <div ref={titleRef} className="flex flex-col transform-gpu transition-all duration-300">
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-300 to-cyan-405 tracking-tight flex items-center gap-1.5 font-sans">
            Brainvita 3D <span className="text-[10px] bg-indigo-500/30 text-indigo-300 py-0.5 px-2 rounded-full border border-indigo-500/20 font-mono">v{VERSION}</span>
          </h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currentLayout.name}</p>
        </div>

        {/* Action controllers */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowTutorial(true)}
            className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 cursor-pointer shadow-lg active:scale-95 transition"
            aria-label="Tutorial"
          >
            <HelpCircle size={18} />
          </button>
          
          <button
            onClick={toggleSound}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer shadow-lg active:scale-95 transition ${
              soundEnabled 
                ? 'bg-indigo-950/40 border-indigo-800 text-indigo-400 hover:bg-indigo-900/50' 
                : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={() => setShowMenu(m => !m)}
            className="w-10 h-10 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shadow-lg active:scale-95 transition"
            aria-label="Menu"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Settings Dashboard Menu */}
      {showMenu && (
        <div className="absolute top-20 right-4 sm:right-6 md:right-auto z-40 bg-slate-900/95 border border-slate-850 p-5 rounded-2xl shadow-2xl w-64 text-slate-100 backdrop-blur-md animate-modal">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-black tracking-widest uppercase text-slate-400">Settings Dashboard</span>
            <button onClick={() => setShowMenu(false)} className="text-slate-500 hover:text-white transition p-1 rounded-full"><X size={16} /></button>
          </div>
          
          <div className="space-y-3.5 text-sm">
            <button
              onClick={() => { setShowLayoutModal(true); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-800/80 transition uppercase font-black text-xs text-indigo-400 cursor-pointer"
            >
              <LayoutGrid size={16} /> Choose Board Layout
            </button>
            <button
              onClick={() => { setShowThemeModal(true); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-800/80 transition uppercase font-black text-xs text-pink-400 cursor-pointer"
            >
              <Palette size={16} /> Customize Skins
            </button>

            {/* Play Store specific PWA configuration */}
            <button
              onClick={() => { setShowTwaHub(true); setShowMenu(false); }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-slate-800/80 bg-cyan-950/20 border border-cyan-900/50 hover:border-cyan-500/30 transition uppercase font-black text-[10px] text-cyan-400 cursor-pointer"
            >
              <ShieldCheck size={16} className="text-cyan-400" /> PWA Play Verification Setup
            </button>

            <div className="border-t border-slate-800/85 my-2 pt-2">
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-slate-400 font-medium">Haptic Vibration</span>
                <input
                  type="checkbox"
                  checked={vibrationOn}
                  onChange={toggleVibration}
                  className="w-4 h-4 text-cyan-500 rounded border-slate-750 bg-slate-950 focus:ring-cyan-500"
                />
              </div>
            </div>
            
            <div className="pt-2 text-[10px] text-slate-500 flex justify-between uppercase font-mono tracking-wider">
              <span>Best Time:</span>
              <span className="text-cyan-400 font-bold">{bestTimes[currentLayout.id] !== undefined ? formatTime(bestTimes[currentLayout.id]) : '--:--'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Header Panel */}
      <section className="relative z-10 w-full max-w-lg grid grid-cols-3 gap-3 my-4">
        {/* Timer */}
        <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-2xl flex flex-col items-center justify-center shadow-lg">
          <div className="flex items-center gap-1.5 text-indigo-400 mb-0.5">
            <TimerIcon size={14} className="animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Timer</span>
          </div>
          <span className="font-mono text-base font-black tracking-wide text-white">{formatTime(timer)}</span>
        </div>

        {/* Marbles Remaining */}
        <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-1.5 text-pink-400 mb-0.5">
            <Award size={14} />
            <span className="text-[10px] uppercase font-bold tracking-wider">LeftPegs</span>
          </div>
          <span className="font-mono text-base font-black tracking-wide text-white">{marblesRemaining}</span>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-pink-500 to-indigo-505 opacity-20 group-hover:opacity-45 animate-pulse" />
        </div>

        {/* Best Level Score */}
        <div className="bg-slate-950/40 border border-slate-850 p-2.5 rounded-2xl flex flex-col items-center justify-center shadow-lg">
          <div className="flex items-center gap-1.5 text-amber-500 mb-0.5">
            <Trophy size={14} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Best</span>
          </div>
          <span className="font-mono text-base font-black tracking-wide text-white">
            {bestTimes[currentLayout.id] !== undefined ? formatTime(bestTimes[currentLayout.id]) : '--:--'}
          </span>
        </div>
      </section>

      {/* PWA Play Store Verification & Diagnostic Setup Hub */}
      {showTwaHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowTwaHub(false)} />
          
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg p-5 sm:p-6 rounded-3xl text-left flex flex-col gap-4 animate-modal z-10 text-slate-100 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck size={20} />
                <h2 className="text-sm font-bold uppercase tracking-wider">Play Store PWA Verification</h2>
              </div>
              <button onClick={() => setShowTwaHub(false)} className="text-slate-500 hover:text-white transition p-1"><X size={18} /></button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-350 leading-relaxed overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40">
                <p className="font-bold text-cyan-400 mb-1">💡 Resolving the 404 Error After Downloading:</p>
                <p>When downloaded from the Google Play Store, Android requires the app to verify its package signatures. Without verification, the system will fall back to open in a web browser, or fail with a 404 error if offline. To make this fully compatible, you must serve the <b>assetlinks.json</b> config correctly on your domain.</p>
              </div>

              {/* Dev input boxes */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400">Android Package Name (Application ID):</label>
                <input 
                  type="text" 
                  value={pkgName} 
                  onChange={(e) => {
                    setPkgName(e.target.value);
                    localStorage.setItem('twa_package_name', e.target.value);
                  }}
                  placeholder="e.g. com.company.brainvita"
                  className="w-full bg-slate-950/80 text-white border border-slate-800 hover:border-slate-700/80 focus:border-cyan-500 font-mono p-2.5 rounded-xl outline-none"
                />

                <label className="block text-[10px] font-black tracking-widest uppercase text-slate-400 mt-2">Android signing Certificate SHA-256 Fingerprint:</label>
                <input 
                  type="text" 
                  value={shaFingerprint} 
                  onChange={(e) => {
                    setShaFingerprint(e.target.value);
                    localStorage.setItem('twa_sha_fingerprint', e.target.value);
                  }}
                  placeholder="XX:XX:XX:..."
                  className="w-full bg-slate-950/80 text-white border border-slate-800 hover:border-slate-700/80 focus:border-cyan-500 font-mono p-2.5 rounded-xl outline-none text-[11px]"
                />
              </div>

              {/* Live JSON preview block */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">
                  <span>Generated assetlinks.json snippet:</span>
                  <button onClick={copySnippet} className="flex items-center gap-1.5 text-cyan-405 hover:text-cyan-300 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {copiedText ? "Copied!" : <><Clipboard size={12} /> Copy JSON</>}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto max-h-36 no-scrollbar">
                  {getAssetlinksSnippet()}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                <p className="font-bold text-white mb-1">🏁 Deployment Step-by-Step Instructions:</p>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                  <li>Input your App Package name & Certificate fingerprint above.</li>
                  <li>Click Copy JSON to extract snippet.</li>
                  <li>Write this text exact config into <code>/public/.well-known/assetlinks.json</code> in this project folder.</li>
                  <li>Run a clean production build & deploy! Google will verify and allow offline capabilities instantly.</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowTwaHub(false)}
              className="w-full py-3 rounded-xl bg-slate-850 hover:bg-slate-800 text-white font-bold text-xs uppercase cursor-pointer text-center"
              style={{ minHeight: '44px' }}
            >
              Back to Game
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <main className="relative z-10 flex-grow flex items-center justify-center w-full max-w-lg aspect-square board-container-3d py-4">
        
        {/* Core rim layout */}
        <div 
          ref={boardRef}
          className="board-base transition-transform duration-200 ease-out w-full max-w-[85%] sm:max-w-[75%]"
        >
          <Board
            board={board}
            selectedPos={selectedPos}
            validDestinations={validDestinations}
            onCellClick={handleCellClick}
            theme={currentTheme}
          />
        </div>

        {/* Start Game Shield Overlay */}
        {gameStatus === GameStatus.IDLE && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-full pointer-events-none z-20 max-w-[85%] mx-auto aspect-square ring-1 ring-white/5 shadow-inner">
            <button
              onClick={() => setGameStatus(GameStatus.PLAYING)}
              className="pointer-events-auto bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-550 text-white font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl animate-bounce hover:scale-105 transition duration-300 text-xs uppercase tracking-widest cursor-pointer"
              style={{ minHeight: '44px' }}
            >
              <Play size={16} fill="currentColor" /> Tap to Start
            </button>
          </div>
        )}
      </main>

      {/* Bottom Tray */}
      <footer className="relative z-20 w-full max-w-lg flex flex-col items-center gap-4 mt-4 pb-safe">
        
        <RemovedMarbles
          totalCount={totalMarblesInLayout}
          currentCount={marblesRemaining}
          theme={currentTheme}
        />

        <div className="flex gap-4 w-full">
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to restart the board?")) {
                startNewGame();
              }
            }}
            className="flex-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 text-white uppercase font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition py-3 px-4 shadow-lg active:scale-98"
            style={{ minHeight: '44.8px' }}
          >
            <RefreshCw size={14} /> Restart Board
          </button>
        </div>
      </footer>

      <SelectionModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Choose Style Theme"
        items={THEMES}
        selectedId={currentTheme.id}
        onSelect={handleThemeSelect}
        type="theme"
      />

      <SelectionModal
        isOpen={showLayoutModal}
        onClose={() => setShowLayoutModal(false)}
        title="Choose Board Layout"
        items={LAYOUTS}
        selectedId={currentLayout.id}
        onSelect={handleLayoutSelect}
        type="layout"
      />

      {/* Post game results */}
      {showResultsModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowResultsModal(false)} />
          
          <div className="relative bg-slate-900 border border-slate-80 w-full max-w-sm p-6 sm:p-8 rounded-[36px] overflow-hidden shadow-2xl text-center flex flex-col items-center gap-6 animate-modal z-10 text-slate-100">
            
            {gameStatus === GameStatus.WON ? (
              <div className="flex flex-col items-center gap-4">
                <GoldMedalBadge glow={true} size="w-20 h-20" />
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-700 uppercase tracking-tight leading-none">
                  Legendary Victory!
                </h2>
                <p className="text-slate-350 text-xs max-w-xs font-semibold">
                  Outstanding skill! You cleared the entire board down to exactly 1 marble peg!
                </p>
                
                {isNewRecord && (
                  <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full animate-pulse my-1">
                    🎉 New Best Record Time! 🎉
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-inner animate-[bounce_1s_infinite]">
                  <Frown size={32} />
                </div>
                <h2 className="text-xl font-black text-rose-500 uppercase tracking-tight col-cyan-500">
                  No Moves Left
                </h2>
                <p className="text-slate-350 text-xs max-w-xs font-semibold">
                  Well tried! You left <span className="text-rose-450 font-bold">{marblesRemaining} pegs</span>. Aim to clear down to exactly 1 peg next time!
                </p>
              </div>
            )}

            {/* Match metrics display */}
            <div className="grid grid-cols-2 gap-4 w-full bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Time Duration</span>
                <span className="text-white font-black font-mono text-base">{formatTime(timer)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Pegs Captured</span>
                <span className="text-cyan-400 font-black font-mono text-base">+{totalMarblesInLayout - marblesRemaining}</span>
              </div>
            </div>

            {/* Button actions */}
            <div className="flex flex-col gap-2 w-full pt-2">
              <button
                onClick={() => startNewGame()}
                className="w-full bg-gradient-to-r from-cyan-502 to-indigo-650 hover:from-cyan-400 hover:to-indigo-500 text-white font-black uppercase text-xs tracking-wider py-3.5 px-4 rounded-2xl shadow-xl transition cursor-pointer transform hover:scale-102"
                style={{ minHeight: '44px' }}
              >
                Start New Match
              </button>
              <button
                onClick={() => setShowResultsModal(false)}
                className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold uppercase text-xs py-3 px-4 rounded-2xl transition cursor-pointer"
                style={{ minHeight: '44px' }}
              >
                View Board
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Onboarding Intro Layer Screen */}
      <Tutorial 
        isOpen={showTutorial} 
        onClose={completeTutorial} 
      />

    </div>
  );
};

export default App;
