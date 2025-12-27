
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, Trophy, AlertCircle, X, Square,
  Timer as TimerIcon, Play, Palette, Check, LayoutGrid
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
  stopBackgroundMusic
} from './utils/sound';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => THEMES[0]);
  const [currentLayout, setCurrentLayout] = useState<GameLayout>(() => LAYOUTS[0]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard(LAYOUTS[0].board));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  
  const [soundEnabled] = useState(true);
  const [timer, setTimer] = useState(0);
  const [animatingMove, setAnimatingMove] = useState<{from: Position, to: Position, mid: Position} | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const floatLayerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

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
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -8}deg) rotateY(${targetX * 8}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.05)`;
      if (floatLayerRef.current) {
         Array.from(floatLayerRef.current.children).forEach((child: any, i) => {
             const depth = (i % 3) + 1;
             child.style.transform = `translate(${targetX * 15 * depth}px, ${targetY * 15 * depth}px)`;
         });
      }
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 5}px, ${targetY * 5}px)`;
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const marblesRemaining = useMemo(() => countMarbles(board), [board]);
  const totalLayoutMarbles = useMemo(() => {
     let count = 0;
     currentLayout.board.forEach(row => row.forEach(cell => { if(cell === CellState.MARBLE) count++ }));
     return count;
  }, [currentLayout]);
  const marblesRemoved = totalLayoutMarbles - marblesRemaining;

  const bubbles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 15 + 8}px`,
    duration: `${Math.random() * 15 + 10}s`,
    delay: `${Math.random() * 8}s`,
    key: i
  })), []);

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
    if (status === GameStatus.WON) {
      if (soundEnabled) playWinSound();
      stopBackgroundMusic();
    }
    if (status === GameStatus.LOST) {
      if (soundEnabled) playLoseSound();
      stopBackgroundMusic();
    }
  };

  const startGame = () => {
    setBoard(createInitialBoard(currentLayout.board));
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    if (soundEnabled) {
      playThemeSound();
      startBackgroundMusic();
    }
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
    if (soundEnabled) {
      playStopSound();
    }
    stopBackgroundMusic();
  };

  const handleThemeChange = (theme: Theme) => { setCurrentTheme(theme); setShowThemeModal(false); if (soundEnabled) playSelectSound(); };
  const handleLayoutChange = (layout: GameLayout) => { setCurrentLayout(layout); setBoard(createInitialBoard(layout.board)); setGameStatus(GameStatus.IDLE); setTimer(0); setShowLayoutModal(false); if (soundEnabled) playSelectSound(); };

  useEffect(() => {
    if (!soundEnabled) {
      stopBackgroundMusic();
    } else if (gameStatus === GameStatus.PLAYING) {
      startBackgroundMusic();
    }
  }, [soundEnabled, gameStatus]);

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} pb-4`}>
      {/* Background Layer */}
      <div ref={bgLayerRef} className="fixed inset-[-10%] w-[120%] h-[120%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/40' : 'bg-white/10'}`}></div>
      </div>

      <div ref={floatLayerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         {bubbles.map((b, i) => (
          <div key={i} className="bubble opacity-30" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay, background: currentTheme.isDark ? 'white' : '#cbd5e1' }} />
        ))}
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-start relative z-[100] shrink-0 pointer-events-none pt-4 px-3">
        {/* Unified 3D Frame for Control Buttons */}
        <div className="flex flex-col gap-3 p-2 rounded-[2rem] bg-black/60 backdrop-blur-xl border border-white/20 shadow-3xl pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 w-36">
             <div className="btn-edge bg-pink-900 rounded-full"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-full flex items-center justify-center gap-2">
               <Palette size={14} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-widest">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 w-36">
             <div className="btn-edge bg-cyan-900 rounded-full"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-full flex items-center justify-center gap-2">
               <LayoutGrid size={14} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-widest">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        {/* Right Header Section: Help & Timer */}
        <div className="flex items-start gap-3 pointer-events-auto pr-1">
          <button onClick={() => setShowRules(true)} className="btn-3d w-12 h-12">
            <div className="btn-edge bg-slate-800 rounded-full"></div>
            <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full">
              <HelpCircle size={22} className="text-white" />
            </div>
          </button>
          
          <div className="flex flex-col gap-2 items-end">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl tray-inset">
                <TimerIcon size={14} className="text-green-500 animate-pulse" />
                <span className="font-mono text-xs font-black text-green-500 tracking-widest">{formatTime(timer)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div ref={titleRef} className="text-center relative z-10 pointer-events-none shrink-0 -mt-6">
        <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,1)] leading-none italic">
          Brainvita<span className={currentTheme.isDark ? "text-blue-400" : "text-fuchsia-400"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-black/70 backdrop-blur-md mt-4 border border-white/10 shadow-lg">
          <span className="text-[10px] font-bold uppercase text-white/40 tracking-[0.3em]">Marbles Left</span>
          <span className="text-xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 w-full flex justify-center items-center min-h-0 relative z-40 overflow-visible py-4">
         <div className="scale-[0.55] xs:scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer Area */}
      <footer className="w-full max-w-lg flex flex-col gap-6 relative z-50 shrink-0 px-4 pointer-events-auto items-center">
        <div className="flex justify-center gap-6 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-32 h-14 disabled:opacity-50">
            <div className="btn-edge bg-red-900 rounded-2xl"></div>
            <div className="btn-surface bg-red-600 border-t border-red-400 rounded-2xl flex items-center justify-center gap-2">
              <Square size={16} fill="currentColor" className="text-white" />
              <span className="text-white text-sm font-black uppercase">Stop</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-40 h-14">
            <div className="btn-edge bg-blue-900 rounded-2xl"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-2xl flex items-center justify-center gap-2">
              <Play size={18} fill="currentColor" className="text-white" />
              <span className="text-white text-sm font-black uppercase">Start</span>
            </div>
          </button>
        </div>

        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </footer>

      {/* Modals */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className="relative max-w-2xl w-full p-8 rounded-[3rem] shadow-3xl overflow-hidden max-h-[85vh] flex flex-col border border-white/20 bg-slate-900 text-white">
             <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-3xl font-black uppercase tracking-tight italic">Visual Themes</h2>
                <button onClick={() => setShowThemeModal(false)} className="btn-3d w-12 h-12">
                  <div className="btn-edge bg-slate-950 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X size={28} /></div>
                </button>
             </div>
             <div className="grid grid-cols-2 xs:grid-cols-3 gap-6 overflow-y-auto p-2 custom-scrollbar">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="btn-3d h-44 group">
                        <div className={`btn-edge rounded-3xl ${currentTheme.name === t.name ? 'bg-green-700' : 'bg-slate-950'}`}></div>
                        <div className={`btn-surface flex flex-col rounded-3xl overflow-hidden border-2 ${currentTheme.name === t.name ? 'border-green-400' : 'border-white/10 bg-slate-800'}`}>
                            <div className="flex-1 w-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                            <div className="p-3 w-full bg-slate-900 flex justify-between items-center border-t border-white/10">
                              <span className="font-black text-[10px] uppercase truncate tracking-widest">{t.name}</span>
                              {currentTheme.name === t.name && <Check size={14} className="text-green-400" strokeWidth={4} />}
                            </div>
                        </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in">
           <div className="relative max-w-sm w-full p-10 rounded-[3rem] bg-slate-900 border border-white/20 text-white shadow-3xl">
              <button onClick={() => setShowRules(false)} className="absolute -top-4 -right-4 btn-3d w-14 h-14">
                <div className="btn-edge bg-red-950 rounded-full"></div>
                <div className="btn-surface bg-red-700 rounded-full"><X size={28} /></div>
              </button>
              <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter">How to Play</h2>
              <div className="space-y-6 text-base font-bold text-slate-300">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-black shadow-lg">1</div>
                  <p className="pt-1">Pick a marble and jump over an adjacent one into an empty hole.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-black shadow-lg">2</div>
                  <p className="pt-1">The jumped marble is removed and added to your collection tray.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-black shadow-lg">3</div>
                  <p className="pt-1">Win the game by leaving only 1 marble in the center hole!</p>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-12 w-full py-4 btn-3d h-16">
                <div className="btn-edge bg-blue-900 rounded-2xl"></div>
                <div className="btn-surface bg-blue-600 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-inner">Mastered It!</div>
              </button>
           </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in">
          <div className="relative max-w-md w-full p-8 rounded-[3rem] bg-slate-900 border border-white/20 text-white shadow-3xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Layouts</h2>
                <button onClick={() => setShowLayoutModal(false)} className="btn-3d w-12 h-12">
                  <div className="btn-edge bg-slate-950 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full"><X size={28} /></div>
                </button>
             </div>
             <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className="btn-3d w-full h-24 block">
                      <div className={`btn-edge rounded-[1.5rem] ${currentLayout.name === layout.name ? 'bg-green-700' : 'bg-slate-950'}`}></div>
                      <div className={`btn-surface flex items-center justify-between px-8 rounded-[1.5rem] border-2 ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/40' : 'border-white/10 bg-slate-800'}`}>
                        <div className="text-left">
                          <p className="font-black text-lg uppercase tracking-tight">{layout.name}</p>
                          <p className="text-[10px] opacity-60 font-black tracking-widest">{layout.description}</p>
                        </div>
                        {currentLayout.name === layout.name && <Check size={24} className="text-green-400" strokeWidth={4} />}
                      </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
