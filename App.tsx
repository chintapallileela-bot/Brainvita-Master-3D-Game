import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board.tsx';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types.ts';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic.ts';
import { 
  Menu, X, Timer as TimerIcon, Play, Palette, LayoutGrid,
  Trophy, RefreshCw, Settings, Trash2, ShieldAlert, Award, Medal,
  Volume2, VolumeX, Smartphone
} from 'lucide-react';
import { THEMES, LAYOUTS } from './constants.ts';
import { Tutorial } from './components/Tutorial.tsx';
import { SelectionModal } from './components/SelectionModal.tsx';
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

const VERSION = "1.8.0";
const TUTORIAL_KEY = `brainvita_tutorial_v${VERSION.replace(/\./g, '')}`;

const MedalBadge: React.FC<{ size?: string }> = ({ size = "w-12 h-12" }) => (
  <div className={`${size} rounded-full bg-gradient-to-b from-amber-400 to-amber-600 p-0.5 shadow-lg border border-white/20 relative`}>
    <div className="w-full h-full rounded-full bg-[#8b4513] flex items-center justify-center">
      <div className="w-[70%] h-[70%] rounded-full bg-[#5d2e0d] border border-black/20"></div>
    </div>
    <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full"></div>
  </div>
);

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => THEMES[0]);
  const [currentLayout, setCurrentLayout] = useState<GameLayout>(() => LAYOUTS[0]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard(LAYOUTS[0].board));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  
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
  }, []);

  const completeTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (e) {}
  };

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const handleTouchMove = (e: TouchEvent) => { if(e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
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
          boardRef.current.style.transform = `rotateX(15deg) rotateY(${spin}deg)`;
        } else {
          boardRef.current.style.transform = `rotateX(${12 + targetY * -4}deg) rotateY(${targetX * 4}deg)`;
        }
      }
      
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 8}px, ${-targetY * 8}px) scale(1.03)`;
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 3}px, ${targetY * 3}px) translateZ(40px)`;
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStatus]);

  const marblesRemaining = countMarbles(board);

  const validDestinations = useMemo(() => {
    if (!selectedPos || animatingMove) return [];
    const potentialMoves = [
        { r: selectedPos.row - 2, c: selectedPos.col },
        { r: selectedPos.row + 2, c: selectedPos.col },
        { r: selectedPos.row, c: selectedPos.col - 2 },
        { r: selectedPos.row, c: selectedPos.col + 2 },
    ];
    return potentialMoves.map(p => ({ row: p.r, col: p.c })).filter(dest => isMoveValid(board, selectedPos, dest));
  }, [board, selectedPos, animatingMove]);

  const handleCellClick = (pos: Position) => {
    if (gameStatus !== GameStatus.PLAYING || animatingMove) return;
    const cell = board[pos.row][pos.col];
    if (cell === CellState.MARBLE) {
      if (selectedPos?.row === pos.row && selectedPos?.col === pos.col) setSelectedPos(null);
      else { setSelectedPos(pos); if (soundEnabled) playSelectSound(); }
      return;
    }
    if (cell === CellState.EMPTY && selectedPos) {
      if (isMoveValid(board, selectedPos, pos)) initiateMove(selectedPos, pos);
      else { setSelectedPos(null); if (soundEnabled) playInvalidSound(); }
    }
  };

  const initiateMove = (from: Position, to: Position) => {
    const midRow = (from.row + to.row) / 2;
    const midCol = (from.col + to.col) / 2;
    const mid = { row: midRow, col: midCol };
    if (soundEnabled) playMoveSound();
    setAnimatingMove({ from, to, mid });
    setSelectedPos(null);
    setTimeout(() => { finalizeMove(from, to, mid); setAnimatingMove(null); }, 150);
  };

  const finalizeMove = (from: Position, to: Position, mid: Position) => {
    const newBoard = board.map(row => [...row]);
    newBoard[from.row][from.col] = CellState.EMPTY;
    newBoard[mid.row][mid.col] = CellState.EMPTY;
    newBoard[to.row][to.col] = CellState.MARBLE;
    setBoard(newBoard);
    const status = checkGameStatus(newBoard);
    setGameStatus(status);
    if (status !== GameStatus.PLAYING) {
      if (status === GameStatus.WON) { 
        if (soundEnabled) playWinSound(); 
        handleWin(); 
      }
      else if (status === GameStatus.LOST) { 
        if (soundEnabled) playLoseSound(); 
      }
      stopBackgroundMusic();
      setTimeout(() => setShowResultsModal(true), 1500);
    }
  };

  const handleWin = () => {
    const newWins = totalWins + 1;
    setTotalWins(newWins);
    localStorage.setItem('brainvita_total_wins', String(newWins));

    const currentBest = bestTimes[currentLayout.name] || Infinity;
    if (timer < currentBest) {
      setIsNewRecord(true);
      const updated = { ...bestTimes, [currentLayout.name]: timer };
      setBestTimes(updated);
      localStorage.setItem('brainvita_best_times', JSON.stringify(updated));
    } else {
      setIsNewRecord(false);
    }
  };

  const startGame = () => {
    setBoard(createInitialBoard(currentLayout.board));
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    setIsNewRecord(false);
    setShowResultsModal(false);
    if (soundEnabled) { playThemeSound(); startBackgroundMusic(); }
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
    setIsNewRecord(false);
    setShowResultsModal(false);
    if (soundEnabled) playStopSound();
    stopBackgroundMusic();
  };

  const toggleVibration = () => {
    const newValue = !vibrationOn;
    setVibrationOn(newValue);
    setVibrationEnabled(newValue);
    localStorage.setItem('brainvita_vibration', String(newValue));
    if (soundEnabled) playSelectSound();
    if (newValue && navigator.vibrate) navigator.vibrate(50);
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setShowThemeModal(false);
    if (soundEnabled) playThemeSound();
  };

  const handleLayoutChange = (layout: GameLayout) => {
    setCurrentLayout(layout);
    setBoard(createInitialBoard(layout.board));
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setSelectedPos(null);
    setIsNewRecord(false);
    setShowLayoutModal(false);
    if (soundEnabled) playSelectSound();
    stopBackgroundMusic();
  };

  const handleMenuOpen = () => {
    setShowMenu(true);
    if (vibrationOn && navigator.vibrate) navigator.vibrate(25);
    if (soundEnabled) playSelectSound();
  };

  const resetAllProgress = () => {
    if (window.confirm("Delete all records and medals?")) {
      setBestTimes({});
      setTotalWins(0);
      localStorage.removeItem('brainvita_best_times');
      localStorage.removeItem('brainvita_total_wins');
      if (soundEnabled) playInvalidSound();
    }
  };

  const clearAppCache = async () => {
    if (window.confirm("Clear all data and refresh app?")) {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(key => caches.delete(key)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        }
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        window.location.reload();
      }
    }
  };

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center justify-between ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} font-poppins overflow-hidden`}>
      
      {showTutorial && <Tutorial onComplete={completeTutorial} />}

      <div ref={bgLayerRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentTheme.isDark ? 'bg-black/50' : 'bg-white/10'}`}></div>
      </div>

      <header className="w-full flex justify-between items-start relative z-[5000] p-4 lg:px-8 pointer-events-none shrink-0 min-w-[320px]">
        <div className="flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 w-32 sm:h-12 sm:w-44">
             <div className="absolute inset-0 top-1.5 bg-pink-900 rounded-2xl shadow-lg"></div>
             <div className="relative h-full bg-pink-500 border-t border-pink-300 rounded-2xl flex items-center justify-start px-3 gap-2">
               <Palette size={16} className="text-white shrink-0"/>
               <span className="text-[9px] sm:text-xs font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 w-32 sm:h-12 sm:w-44">
             <div className="absolute inset-0 top-1.5 bg-cyan-900 rounded-2xl shadow-lg"></div>
             <div className="relative h-full bg-cyan-500 border-t border-cyan-300 rounded-2xl flex items-center justify-start px-3 gap-2">
               <LayoutGrid size={16} className="text-white shrink-0"/>
               <span className="text-[9px] sm:text-xs font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <button 
            onClick={handleMenuOpen} 
            className="flex items-center gap-2 px-4 h-12 rounded-2xl bg-emerald-600 border-t-2 border-emerald-400 text-white shadow-xl hover:bg-emerald-500 transition-all active:scale-90"
          >
             <Menu size={20} strokeWidth={4} />
             <span className="text-[10px] font-black uppercase tracking-widest hidden xs:inline">MENU</span>
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 border border-white/20 shadow-xl">
              <TimerIcon size={12} className="text-green-400" />
              <span className="font-mono text-xs font-bold text-green-400 tracking-wider leading-none">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-[3000] px-4 py-4 lg:py-8 overflow-visible min-h-0 min-w-[320px]">
          <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none mb-4 lg:mb-8 shrink-0">
            <h1 className="text-xl sm:text-3xl lg:text-5xl font-black tracking-tighter text-white drop-shadow-2xl uppercase italic leading-none">
              BRAINVITA <span className="text-fuchsia-500">MASTER 3D</span>
            </h1>
            <div className="inline-flex items-center bg-stone-950/90 rounded-full border border-white/20 mt-2 lg:mt-3 shadow-2xl overflow-hidden pointer-events-auto scale-90 sm:scale-100">
              <div className="px-3 py-1 border-r border-white/20"><span className="text-[8px] font-black uppercase text-white/50 tracking-[0.2em]">PEGS</span></div>
              <div className="px-4 py-1 min-w-[30px] text-center"><span className="text-sm lg:text-base font-black text-white">{marblesRemaining}</span></div>
            </div>
          </div>

          <main className="w-full flex-1 flex justify-center items-center relative perspective-[1500px] overflow-visible mb-4 lg:mb-12">
             <Board 
               board={board} 
               selectedPos={selectedPos} 
               validMoves={validDestinations} 
               onCellClick={handleCellClick} 
               theme={currentTheme} 
               animatingMove={animatingMove} 
               boardRef={boardRef} 
               disabled={gameStatus === GameStatus.IDLE}
             />
          </main>
      </div>

      <footer className="w-full max-w-lg flex flex-col gap-3 relative z-[4500] shrink-0 px-6 pb-6 lg:pb-12 pointer-events-auto items-center min-w-[320px]">
        <div className="flex justify-center gap-3 w-full">
          <button 
            onClick={stopGame} 
            disabled={gameStatus === GameStatus.IDLE} 
            className="flex-1 h-12 lg:h-16 rounded-3xl bg-rose-500/20 backdrop-blur-md border border-rose-500/40 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-0 disabled:translate-y-4 pointer-events-auto disabled:pointer-events-none"
          >
            <span className="text-white text-[10px] lg:text-xs font-black uppercase tracking-widest">QUIT</span>
          </button>
          <button 
            id="start-button"
            onClick={startGame} 
            className="flex-1 h-12 lg:h-16 rounded-3xl bg-blue-600 border-t-2 border-blue-400 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Play size={16} fill="currentColor" className="text-white" />
            <span className="text-white text-[10px] lg:text-xs font-black uppercase tracking-widest">{gameStatus === GameStatus.IDLE ? 'START' : 'RESTART'}</span>
          </button>
        </div>
        <div className="w-full flex items-center justify-between px-2 opacity-50">
            <span className="text-[7px] font-black uppercase tracking-widest text-fuchsia-300">V{VERSION}</span>
            {bestTimes[currentLayout.name] && <span className="text-[7px] font-black uppercase tracking-widest text-white/40">BEST: {formatTime(bestTimes[currentLayout.name])}</span>}
        </div>
      </footer>

      {showMenu && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-8 rounded-[3rem] bg-[#0c1220] border-2 border-white/10 text-white shadow-4xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-none">MASTER</h2>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-[#10b981] leading-none">MENU</h2>
                </div>
                <button onClick={() => setShowMenu(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 active:scale-90 transition-all"><X size={20}/></button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 space-y-6 no-scrollbar">
                {/* Rewards Section */}
                <div className="bg-[#1a1f2e]/40 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                   <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-4 flex items-center gap-2"><Award size={14}/> REWARDS</h3>
                   <div className="flex items-center gap-4 mb-4">
                      {totalWins > 0 ? (
                        <MedalBadge size="w-14 h-14" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-black/20 border border-white/5 flex items-center justify-center opacity-20">
                           <Award size={24} className="text-white/20" />
                        </div>
                      )}
                   </div>
                   <div className="flex items-center justify-center gap-1.5 py-1 bg-black/20 rounded-full">
                      <Trophy size={12} className="text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">TOTAL VICTORIES: {totalWins}</span>
                   </div>
                </div>

                {/* Preferences Section */}
                <div className="bg-[#1a1f2e]/40 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                   <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-6 flex items-center gap-2"><Settings size={14}/> PREFERENCES</h3>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Sound FX</span>
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-14 h-7 rounded-full transition-all relative ${soundEnabled ? 'bg-[#3b82f6]' : 'bg-[#1a1f2e] border border-white/10'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${soundEnabled ? 'left-8 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'left-1'}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Haptics</span>
                        <button onClick={toggleVibration} className={`w-14 h-7 rounded-full transition-all relative ${vibrationOn ? 'bg-[#10b981]' : 'bg-[#1a1f2e] border border-white/10'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${vibrationOn ? 'left-8 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'left-1'}`}></div>
                        </button>
                      </div>
                   </div>
                </div>

                {/* Danger Zone Section */}
                <div className="bg-red-500/5 p-6 rounded-[2rem] border border-red-500/20">
                   <h3 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-4 flex items-center gap-2"><Trash2 size={14}/> DANGER ZONE</h3>
                   <div className="space-y-3">
                    <button onClick={resetAllProgress} className="w-full h-11 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">RESET RECORDS</button>
                    <button onClick={clearAppCache} className="w-full h-11 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><ShieldAlert size={14}/> WIPE & REFRESH</button>
                   </div>
                </div>
              </div>

              <button onClick={() => setShowMenu(false)} className="mt-8 w-full h-16 bg-[#3b82f6] rounded-[2rem] text-white text-xs font-black uppercase tracking-[0.4em] active:scale-95 transition-all shadow-xl shadow-blue-500/20">CLOSE</button>
           </div>
        </div>
      )}

      {showResultsModal && (gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-10 rounded-[3rem] bg-[#0c1220] border-2 border-white/10 text-white shadow-4xl text-center flex flex-col items-center">
              
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                  <Trophy size={48} className="text-amber-400" strokeWidth={1.5} />
                </div>
                {gameStatus === GameStatus.WON && (
                  <div className="absolute -bottom-2 -right-2 transform rotate-12 scale-110">
                    <MedalBadge size="w-10 h-10" />
                  </div>
                )}
              </div>

              <h2 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2 drop-shadow-md">CONGRATULATIONS</h2>
              <h3 className="text-4xl font-black italic tracking-tighter text-white mb-6 uppercase leading-none">VICTORY</h3>

              {gameStatus === GameStatus.WON && (
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-amber-500/40 bg-amber-500/10 mb-10">
                   <Award size={14} className="text-amber-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">GOLD MEDAL EARNED!</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 w-full mb-12">
                <div className="p-6 rounded-[2rem] bg-[#1a1f2e] border border-white/5 flex flex-col items-center justify-center min-h-[120px]">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">TIME</p>
                    <p className={`text-2xl font-black ${isNewRecord ? 'text-amber-500' : 'text-white'}`}>{formatTime(timer)}</p>
                    {isNewRecord && (
                      <p className="text-[8px] font-black uppercase tracking-widest text-amber-500 mt-1">NEW RECORD!</p>
                    )}
                </div>
                <div className="p-6 rounded-[2rem] bg-[#1a1f2e] border border-white/5 flex flex-col items-center justify-center min-h-[120px]">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">REMAINED</p>
                    <p className="text-3xl font-black text-white">{marblesRemaining}</p>
                    {marblesRemaining === 1 && (
                      <p className="text-[8px] font-black uppercase tracking-widest text-blue-400 mt-1">PERFECT</p>
                    )}
                </div>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={startGame} 
                  className="w-full h-16 bg-[#3b82f6] rounded-[2rem] text-white text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                >
                  <RefreshCw size={18} strokeWidth={3} />
                  <span>PLAY AGAIN</span>
                </button>

                <button 
                  onClick={stopGame}
                  className="w-full py-4 text-white/20 hover:text-white/40 text-[10px] font-black uppercase tracking-[0.3em] transition-colors"
                >
                  BACK TO MAIN MENU
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;