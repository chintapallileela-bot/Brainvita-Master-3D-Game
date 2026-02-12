
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board.tsx';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types.ts';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic.ts';
import { 
  X, Timer as TimerIcon, Play, Palette, LayoutGrid,
  Trophy, RefreshCw, Award, Volume2, VolumeX, HelpCircle, Frown, Check, Medal, Menu, Settings, Trash2, ShieldAlert
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

const VERSION = "1.9.8";
const TUTORIAL_KEY = `brainvita_tutorial_v${VERSION.replace(/\./g, '')}`;

// High-fidelity Gold Medal Badge with 3D shine and extreme lighting effects
const GoldMedalBadge: React.FC<{ size?: string, glow?: boolean }> = ({ size = "w-16 h-16", glow = true }) => (
  <div className={`relative ${size} flex items-center justify-center shrink-0`}>
    {glow && (
      <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-3xl animate-pulse"></div>
    )}
    <div className="relative w-full h-full rounded-full bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 p-[2.5px] shadow-[0_10px_25px_rgba(0,0,0,0.6)] border border-white/40 ring-1 ring-amber-500/50">
      <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#8a5b00] to-[#cc8400] flex items-center justify-center shadow-inner relative overflow-hidden">
        {/* Inner 3D Pocket */}
        <div className="w-[60%] h-[60%] rounded-b-3xl rounded-t-xl bg-[#4d3200] border-t-2 border-amber-900/40 flex items-center justify-center shadow-2xl">
            <div className="w-[40%] h-[40%] rounded-full bg-[#3d2800] opacity-60"></div>
        </div>
        {/* Extreme Specular Highlights */}
        <div className="absolute top-[8%] left-[18%] w-[25%] h-[15%] bg-white/60 rounded-full blur-[1.5px] rotate-[25deg]"></div>
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>
        {/* Bottom edge reflection */}
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
      
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 8}px, ${-targetY * 8}px) scale(1.05)`;
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
    setShowMenu(false);
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

  const resetProgress = () => {
    if (confirm("Reset all game records and victories?")) {
        setTotalWins(0);
        setBestTimes({});
        localStorage.removeItem('brainvita_total_wins');
        localStorage.removeItem('brainvita_best_times');
        if (soundEnabled) playInvalidSound();
    }
  }

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

  return (
    <div className={`relative h-full w-full flex flex-col items-center justify-between ${currentTheme.appBg} font-poppins overflow-hidden select-none`}>
      
      {showTutorial && <Tutorial onComplete={completeTutorial} />}

      <div ref={bgLayerRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
      </div>

      {/* HEADER */}
      <header className="w-full flex justify-between items-start z-[5000] p-4 pt-[calc(var(--safe-top)+1rem)] shrink-0 min-w-[320px]">
        <div className="flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="h-10 w-36 sm:h-12 sm:w-44 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 shadow-xl border border-white/20 flex items-center px-4 gap-2 active:scale-95 transition-all group overflow-hidden">
             <Palette size={16} className="text-white shrink-0 group-hover:rotate-12 transition-transform"/>
             <span className="text-[10px] font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="h-10 w-36 sm:h-12 sm:w-44 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 shadow-xl border border-white/20 flex items-center px-4 gap-2 active:scale-95 transition-all group overflow-hidden">
             <LayoutGrid size={16} className="text-white shrink-0 group-hover:scale-110 transition-transform"/>
             <span className="text-[10px] font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
           </button>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowMenu(true)} 
              className="w-11 h-11 rounded-2xl bg-[#0ea5e9] border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-sky-400"
            >
               <Menu size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="w-11 h-11 rounded-2xl bg-amber-500 border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-amber-400"
            >
               {soundEnabled ? <Volume2 size={20} strokeWidth={2.5} /> : <VolumeX size={20} strokeWidth={2.5} />}
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
              <TimerIcon size={14} className="text-emerald-400" />
              <span className="font-mono text-sm font-black text-emerald-400 tracking-wider leading-none">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* CENTERED GAME CONTENT */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-[3000] px-4 overflow-visible min-h-0">
          <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none mb-6 shrink-0">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] uppercase italic leading-none">
              BRAINVITA <span className="text-fuchsia-500">3D</span>
            </h1>
            <div className="inline-flex items-center bg-black/80 backdrop-blur-xl rounded-full border border-white/10 mt-6 shadow-2xl overflow-hidden pointer-events-auto">
              <div className="px-6 py-2 border-r border-white/10"><span className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">REMAINING</span></div>
              <div className="px-8 py-2 min-w-[60px] text-center"><span className="text-xl font-black text-white">{marblesRemaining}</span></div>
            </div>
          </div>

          <main className="w-full flex-1 flex justify-center items-center relative perspective-[1500px] overflow-visible mb-6">
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

      {/* FOOTER ACTIONS */}
      <footer className="w-full max-w-lg flex flex-col gap-4 relative z-[4500] shrink-0 px-6 pb-[calc(var(--safe-bottom)+1.5rem)] pointer-events-auto items-center">
        <div className="flex justify-center gap-4 w-full h-16">
          <button 
            onClick={stopGame} 
            className={`flex-1 rounded-[1.5rem] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-all text-white/50 text-[11px] font-black uppercase tracking-widest ${gameStatus === GameStatus.IDLE ? 'hidden' : ''}`}
          >
            QUIT
          </button>
          <button 
            id="start-button"
            onClick={startGame} 
            className="flex-[2] rounded-[1.5rem] bg-blue-600 border-t-2 border-blue-400 shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Play size={18} fill="currentColor" className="text-white" />
            <span className="text-white text-sm font-black uppercase tracking-[0.2em]">{gameStatus === GameStatus.IDLE ? 'START' : 'RESTART'}</span>
          </button>
        </div>
        <div className="flex items-center gap-4 opacity-40">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">V{VERSION}</span>
            {totalWins > 0 && <div className="flex items-center gap-1"><Medal size={12} className="text-yellow-400" /> <span className="text-[10px] font-black text-yellow-400">{totalWins}</span></div>}
        </div>
      </footer>

      {/* MODALS: THEME, LAYOUT, MENU */}
      {showMenu && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
           <div className="relative max-w-sm w-full p-8 rounded-[3.5rem] bg-[#0c1220] border-2 border-white/10 text-white shadow-4xl flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h2 className="text-xl font-black uppercase tracking-tighter leading-none">MASTER</h2>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-[#10b981] leading-none">MENU</h2>
                </div>
                <button onClick={() => setShowMenu(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 active:scale-90 transition-all"><X size={20}/></button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-6 no-scrollbar">
                <div className="bg-[#1a2333] p-6 rounded-[2.5rem] border border-white/5">
                   <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-6 flex items-center gap-2">
                     <Award size={14}/> REWARDS
                   </h3>
                   <div className="flex flex-col items-center gap-6">
                      <div className="flex items-center justify-center w-full">
                        {totalWins > 0 ? (
                          <GoldMedalBadge size="w-24 h-24" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-black/30 border border-white/5 flex items-center justify-center opacity-10">
                             <Award size={48} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="inline-flex items-center gap-2 px-6 py-2 bg-black/40 rounded-full border border-white/5">
                         <Trophy size={14} className="text-amber-500" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white/70">TOTAL VICTORIES: {totalWins}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-[#1a2333] p-6 rounded-[2.5rem] border border-white/5">
                   <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-6 flex items-center gap-2">
                     <Settings size={14}/> PREFERENCES
                   </h3>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Sound FX</span>
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-14 h-7 rounded-full transition-all relative ${soundEnabled ? 'bg-blue-500' : 'bg-slate-800'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${soundEnabled ? 'left-8' : 'left-1'}`}></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Haptics</span>
                        <button onClick={() => setVibrationOn(!vibrationOn)} className={`w-14 h-7 rounded-full transition-all relative ${vibrationOn ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${vibrationOn ? 'left-8' : 'left-1'}`}></div>
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-red-500/5 p-6 rounded-[2.5rem] border border-red-500/10">
                   <h3 className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-4 flex items-center gap-2">
                     <Trash2 size={14}/> DANGER ZONE
                   </h3>
                   <div className="space-y-3">
                    <button onClick={resetProgress} className="w-full h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">RESET RECORDS</button>
                    <button onClick={() => location.reload()} className="w-full h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"><ShieldAlert size={14}/> WIPE & REFRESH</button>
                   </div>
                </div>
              </div>

              <button onClick={() => setShowMenu(false)} className="mt-8 w-full h-16 bg-[#2563eb] rounded-[2.5rem] text-white text-xs font-black uppercase tracking-[0.4em] active:scale-95 transition-all shadow-xl shadow-blue-500/20">CLOSE</button>
           </div>
        </div>
      )}

      {/* REFINED VICTORY MODAL - High Quality 3D Gold Lighting Overlay */}
      {showResultsModal && (gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-[60px] animate-in fade-in zoom-in duration-700">
           <div className="relative max-w-sm w-full p-10 rounded-[4rem] bg-[#070b14] border-2 border-white/5 text-white shadow-[0_0_150px_rgba(0,0,0,1)] text-center flex flex-col items-center">
              
              {/* Intense Golden Glow Header */}
              <div className="relative mb-12 mt-4 flex items-center justify-center scale-110">
                {gameStatus === GameStatus.WON ? (
                  <div className="relative group">
                    {/* Background Radial Glow mimicking the "shining gold" look */}
                    <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-[40px] group-hover:bg-amber-400/40 transition-all duration-1000 scale-150"></div>
                    <div className="absolute inset-0 rounded-full bg-white/10 blur-[20px] scale-110"></div>
                    
                    {/* Trophy Icon */}
                    <Trophy size={110} className="text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-in slide-in-from-top-6 duration-1000" strokeWidth={1.2} />
                    
                    {/* Overlapping Gold Medal with extreme shine */}
                    <div className="absolute -bottom-2 -right-6 transform rotate-[18deg] shadow-[0_20px_40px_rgba(0,0,0,0.8)] transition-transform duration-500 hover:rotate-[25deg]">
                      <GoldMedalBadge size="w-18 h-18" glow={true} />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/10 blur-3xl scale-125"></div>
                    <Frown size={100} className="text-slate-500 drop-shadow-[0_0_15px_rgba(100,116,139,0.3)]" strokeWidth={1.2} />
                  </div>
                )}
              </div>

              {/* Congratulations Typography precisely matching image */}
              <div className="space-y-1 mb-8">
                <h2 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase tracking-tighter italic drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] skew-x-[-4deg]">
                  {gameStatus === GameStatus.WON ? 'CONGRATULATIONS' : 'COMPLETED'}
                </h2>
                <h3 className="text-3xl sm:text-4xl font-bold tracking-[0.25em] text-white/70 uppercase leading-none opacity-90 italic">
                  {gameStatus === GameStatus.WON ? 'VICTORY' : 'GAME OVER'}
                </h3>
              </div>

              {/* Gold Medal Earned Label */}
              {gameStatus === GameStatus.WON && (
                <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-amber-400/30 bg-black/60 mb-10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95 cursor-default">
                   <Award size={14} className="text-amber-400" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-amber-400/90">GOLD MEDAL EARNED!</span>
                </div>
              )}

              {/* Stats Cards exactly as per screenshot */}
              <div className="grid grid-cols-2 gap-4 w-full mb-12">
                <div className="p-8 rounded-[3.5rem] bg-[#1a2333]/40 border border-white/5 flex flex-col items-center justify-center min-h-[170px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30"></div>
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] mb-4">TIME</p>
                    <p className="text-3xl font-black text-amber-400 tabular-nums tracking-tighter">{formatTime(timer)}</p>
                    {isNewRecord && (
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-amber-400 mt-3 animate-pulse">NEW RECORD!</p>
                    )}
                </div>
                <div className="p-8 rounded-[3.5rem] bg-[#1a2333]/40 border border-white/5 flex flex-col items-center justify-center min-h-[170px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-30"></div>
                    <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] mb-4">REMAINED</p>
                    <p className="text-5xl font-black text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]">{marblesRemaining}</p>
                    {marblesRemaining === 1 && (
                      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-400 mt-3">PERFECT</p>
                    )}
                </div>
              </div>

              {/* Action Buttons styled like high-quality gaming UI */}
              <div className="w-full space-y-6">
                <button 
                  onClick={startGame} 
                  className="w-full h-20 bg-gradient-to-b from-[#3b82f6] to-[#2563eb] rounded-[2.5rem] text-white text-[13px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.4)] border-t-[1.5px] border-white/25 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -left-1/2 w-full h-full bg-white/20 skew-x-[45deg] group-hover:left-full transition-all duration-700 pointer-events-none"></div>
                  <RefreshCw size={26} strokeWidth={3} className="group-hover:rotate-180 transition-transform duration-700" />
                  <span>PLAY AGAIN</span>
                </button>

                <button 
                  onClick={stopGame}
                  className="w-full py-4 text-slate-500 hover:text-slate-200 text-[12px] font-bold uppercase tracking-[0.6em] transition-all"
                >
                  BACK TO MAIN MENU
                </button>
              </div>
           </div>
        </div>
      )}

      {/* OTHER MODALS: SELECTION */}
      <SelectionModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="BACKGROUND THEMES"
        items={THEMES}
        selectedItem={currentTheme}
        onSelect={handleThemeChange}
        renderItem={(theme) => (
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-white/20 shadow-xl overflow-hidden shrink-0" style={{ background: `radial-gradient(circle at 35% 35%, ${theme.marbleStart} 0%, ${theme.marbleEnd} 85%)` }}></div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-widest text-white">{theme.name}</span>
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">3D Background</span>
            </div>
          </div>
        )}
      />

      <SelectionModal
        isOpen={showLayoutModal}
        onClose={() => setShowLayoutModal(false)}
        title="BOARD LAYOUTS"
        items={LAYOUTS}
        selectedItem={currentLayout}
        onSelect={handleLayoutChange}
        renderItem={(layout) => (
          <div className="p-5 flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest text-white">{layout.name}</span>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">{layout.description}</span>
          </div>
        )}
      />
    </div>
  );
};

export default App;
