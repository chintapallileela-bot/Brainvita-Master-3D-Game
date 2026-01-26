
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  Menu, X, Timer as TimerIcon, Play, Palette, Check, LayoutGrid,
  Volume2, VolumeX, Trophy, RefreshCw, Star, Info, Settings,
  Zap, Trash2
} from 'lucide-react';
import { THEMES, LAYOUTS } from './constants';
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
} from './utils/sound';

const VERSION = "1.2.3";

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => THEMES[0]);
  const [currentLayout, setCurrentLayout] = useState<GameLayout>(() => LAYOUTS[0]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard(LAYOUTS[0].board));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [timer, setTimer] = useState(0);
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});
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
    const savedVibe = localStorage.getItem('brainvita_vibration');
    if (savedVibe !== null) {
      const isOn = savedVibe === 'true';
      setVibrationOn(isOn);
      setVibrationEnabled(isOn);
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (gameStatus === GameStatus.PLAYING) {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const formatTime = (seconds: number) => {
    if (seconds === Infinity || seconds === 0) return "--:--";
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
  const totalLayoutMarbles = useMemo(() => {
     let count = 0;
     currentLayout.board.forEach(row => row.forEach(cell => { if(cell === CellState.MARBLE) count++ }));
     return count;
  }, [currentLayout]);
  const marblesRemoved = totalLayoutMarbles - marblesRemaining;

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
      if (status === GameStatus.WON) { if (soundEnabled) playWinSound(); handleWin(); }
      else if (status === GameStatus.LOST) { if (soundEnabled) playLoseSound(); }
      stopBackgroundMusic();
    }
  };

  const handleWin = () => {
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
    if (soundEnabled) { playThemeSound(); startBackgroundMusic(); }
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
    setIsNewRecord(false);
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

  const resetAllProgress = () => {
    if (window.confirm("Are you sure you want to reset all records?")) {
      setBestTimes({});
      localStorage.removeItem('brainvita_best_times');
      if (soundEnabled) playInvalidSound();
    }
  };

  const handleMenuOpen = () => {
    setShowMenu(true);
    if (vibrationOn && navigator.vibrate) navigator.vibrate(10);
    if (soundEnabled) playSelectSound();
  };

  const getWinnerInfo = () => {
    if (gameStatus === GameStatus.WON) return marblesRemaining === 1 ? "PERFECT SCORE!" : "VICTORY!";
    return "GAME OVER";
  };

  const handleThemeChange = (theme: Theme) => { setCurrentTheme(theme); setShowThemeModal(false); if (soundEnabled) playSelectSound(); };
  const handleLayoutChange = (layout: GameLayout) => { setCurrentLayout(layout); setBoard(createInitialBoard(layout.board)); setGameStatus(GameStatus.IDLE); setTimer(0); setShowLayoutModal(false); if (soundEnabled) playSelectSound(); };

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} font-poppins overflow-hidden`}>
      
      {/* Background Layers */}
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentTheme.isDark ? 'bg-black/40' : 'bg-white/10'}`}></div>
      </div>

      {/* Modern Header */}
      <header className="w-full flex justify-between items-start relative z-[5000] p-4 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 w-36 sm:w-44">
             <div className="btn-edge bg-pink-900 rounded-xl shadow-lg"></div>
             <div className="btn-surface bg-pink-500 border-t border-pink-300 rounded-xl flex items-center justify-start px-3 gap-2">
               <Palette size={16} className="text-white"/>
               <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 w-36 sm:w-44">
             <div className="btn-edge bg-cyan-900 rounded-xl shadow-lg"></div>
             <div className="btn-surface bg-cyan-500 border-t border-cyan-300 rounded-xl flex items-center justify-start px-3 gap-2">
               <LayoutGrid size={16} className="text-white"/>
               <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <button onClick={handleMenuOpen} className="flex items-center gap-2 px-4 h-11 rounded-2xl bg-amber-500 border-t border-amber-300 text-white shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all active:scale-95">
             <Menu size={18} strokeWidth={3} />
             <span className="text-[11px] font-black uppercase tracking-widest">Master Menu</span>
          </button>
          
          <div className="flex flex-col items-end gap-1.5 mt-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 shadow-lg">
                <TimerIcon size={12} className="text-green-400" />
                <span className="font-mono text-xs font-bold text-green-400 tracking-wider">{formatTime(timer)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-[3000] px-4 min-h-0">
          <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none mb-4 shrink-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white drop-shadow-xl uppercase italic leading-none">
              BRAINVITA <span className="text-fuchsia-500">3D</span>
            </h1>
            <div className="inline-flex items-center bg-stone-950/90 backdrop-blur-md rounded-full border border-white/10 mt-6 shadow-2xl overflow-hidden pointer-events-auto">
              <div className="px-5 py-1.5 border-r border-white/10"><span className="text-[9px] font-black uppercase text-white/50 tracking-[0.2em]">REMAINING</span></div>
              <div className="px-5 py-1.5 min-w-[40px] text-center"><span className="text-lg font-black text-white">{marblesRemaining}</span></div>
            </div>
          </div>
          <main className="w-full flex-1 flex justify-center items-center relative min-h-[300px] overflow-visible perspective-[1200px]">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
          </main>
      </div>

      {/* Primary Footer Controls */}
      <footer className="w-full max-w-lg flex flex-col gap-4 relative z-[4500] shrink-0 px-8 pb-8 pointer-events-auto items-center">
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="flex-1 h-14 rounded-2xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-5">
            <div className="w-2 h-2 bg-white/80 rounded-sm"></div>
            <span className="text-white text-xs font-black uppercase tracking-widest">QUIT</span>
          </button>
          <button onClick={startGame} className="flex-1 h-14 rounded-2xl bg-blue-600 border-t border-blue-400 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
            <Play size={18} fill="currentColor" className="text-white" />
            <span className="text-white text-xs font-black uppercase tracking-widest">START</span>
          </button>
        </div>
        <div className="w-full flex items-center justify-between px-2 opacity-40">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></div>
               <span className="text-[8px] font-black uppercase tracking-widest">BUILD {VERSION}</span>
            </div>
            {bestTimes[currentLayout.name] && <span className="text-[8px] font-black uppercase tracking-widest">BEST: {formatTime(bestTimes[currentLayout.name])}</span>}
        </div>
      </footer>

      {/* MASTER MENU MODAL (UNIFIED PANEL) */}
      {showMenu && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-8 rounded-[3.5rem] bg-slate-950 border border-white/20 text-white shadow-4xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase italic tracking-widest">MASTER MENU</h2>
                <button onClick={() => setShowMenu(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90"><X size={20}/></button>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 space-y-6">
                {/* PREFERENCES SECTION */}
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                   <h3 className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-4 flex items-center gap-2"><Settings size={12}/>PREFERENCES</h3>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest">Sound FX</span>
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-12 h-6 rounded-full transition-all relative ${soundEnabled ? 'bg-blue-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${soundEnabled ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest">Vibration</span>
                        <button onClick={toggleVibration} className={`w-12 h-6 rounded-full transition-all relative ${vibrationOn ? 'bg-green-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${vibrationOn ? 'left-7' : 'left-1'}`}></div>
                        </button>
                      </div>
                   </div>
                </div>

                {/* RULES SECTION */}
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                   <h3 className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest mb-4 flex items-center gap-2"><Info size={12}/>HOW TO PLAY</h3>
                   <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                      Jump marbles over each other into empty holes to remove them. Leave only <span className="text-white italic underline">ONE</span> to win!
                   </p>
                </div>

                {/* DANGER SECTION */}
                <div className="bg-red-500/5 p-6 rounded-3xl border border-red-500/20">
                   <h3 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-4 flex items-center gap-2"><Trash2 size={12}/>DANGER ZONE</h3>
                   <button onClick={resetAllProgress} className="w-full h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
                      RESET ALL RECORDS
                   </button>
                </div>
              </div>

              <button onClick={() => setShowMenu(false)} className="mt-8 w-full h-14 bg-blue-600 rounded-3xl text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">CLOSE</button>
           </div>
        </div>
      )}

      {/* THEME SELECTOR */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="relative max-w-4xl w-full p-8 rounded-[3rem] border border-white/10 bg-slate-950 text-white overflow-hidden flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-black uppercase italic tracking-widest">THEMES</h2>
                <button onClick={() => setShowThemeModal(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90"><X size={20}/></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-2 pb-10">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} 
                        className={`group relative flex flex-col rounded-3xl overflow-hidden border-4 transition-all duration-300 active:scale-95 ${currentTheme.name === t.name ? 'border-green-400 bg-green-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                        {currentTheme.name === t.name && <div className="absolute top-3 right-3 bg-green-400 text-black p-1.5 rounded-full z-20"><Check size={16} strokeWidth={4} /></div>}
                      </div>
                      <div className="p-3 text-center bg-black/80 backdrop-blur-md border-t border-white/10"><span className="block text-[11px] font-black uppercase tracking-widest text-white truncate">{t.name}</span></div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* BOARD SELECTOR */}
      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-md w-full p-8 rounded-[3rem] bg-slate-950 border border-white/10 text-white shadow-2xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black uppercase italic tracking-widest">BOARDS</h2>
                <button onClick={() => setShowLayoutModal(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90"><X size={20}/></button>
             </div>
             <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-2">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-5 rounded-2xl text-left border-2 transition-all active:scale-[0.98] ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/40' : 'border-white/10 bg-white/5 hover:bg-white/20'}`}>
                      <div className="flex justify-between items-center">
                        <div><p className="font-black text-base uppercase tracking-tight">{layout.name}</p>
                        {bestTimes[layout.name] && <p className="text-[8px] text-yellow-400/70 font-black uppercase mt-0.5 tracking-widest">BEST: {formatTime(bestTimes[layout.name])}</p>}</div>
                        {currentLayout.name === layout.name && <Check size={18} className="text-green-400" strokeWidth={3}/>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{layout.description}</p>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* VICTORY/DEFEAT OVERLAY */}
      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-10 rounded-[3.5rem] bg-slate-950 border border-white/20 text-white shadow-2xl text-center">
              {isNewRecord && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-[0_10px_30px_rgba(234,179,8,0.5)] z-30 animate-bounce">NEW RECORD!</div>}
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${gameStatus === GameStatus.WON ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameStatus === GameStatus.WON ? <Trophy size={32} /> : <X size={32} />}
              </div>
              <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter drop-shadow-lg">{getWinnerInfo()}</h2>
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className={`p-4 rounded-3xl border transition-colors ${isNewRecord ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/10 border-white/5'}`}>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">TIME</p>
                    <p className={`text-lg font-black ${isNewRecord ? 'text-yellow-400' : ''}`}>{formatTime(timer)}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">REMAINING</p>
                    <p className="text-lg font-black">{marblesRemaining}</p>
                </div>
              </div>
              <button onClick={startGame} className="w-full h-16 bg-blue-600 rounded-3xl text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-xl">
                <RefreshCw size={20} /><span>PLAY AGAIN</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
