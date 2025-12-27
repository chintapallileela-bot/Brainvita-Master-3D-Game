import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, Trophy, AlertCircle, Volume2, VolumeX, X, Square,
  Timer as TimerIcon, Play, Palette, Check, LayoutGrid
} from 'lucide-react';
import { THEMES, LAYOUTS } from './constants';
import { playMoveSound, playWinSound, playLoseSound, playThemeSound, playSelectSound, playInvalidSound } from './utils/sound';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => THEMES[0]);
  const [currentLayout, setCurrentLayout] = useState<GameLayout>(() => LAYOUTS[0]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [board, setBoard] = useState<BoardState>(() => createInitialBoard(LAYOUTS[0].board));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 15}px, ${-targetY * 15}px) scale(1.05)`;
      if (floatLayerRef.current) {
         Array.from(floatLayerRef.current.children).forEach((child: any, i) => {
             const depth = (i % 3) + 1;
             child.style.transform = `translate(${targetX * 20 * depth}px, ${targetY * 20 * depth}px)`;
         });
      }
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 8}px, ${targetY * 8}px)`;
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

  const bubbles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 12 + 6}px`,
    duration: `${Math.random() * 12 + 8}s`,
    delay: `${Math.random() * 6}s`,
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
    if (status === GameStatus.WON && soundEnabled) playWinSound();
    if (status === GameStatus.LOST && soundEnabled) playLoseSound();
  };

  const startGame = () => {
    setBoard(createInitialBoard(currentLayout.board));
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    if (soundEnabled) playThemeSound();
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
  };

  const handleThemeChange = (theme: Theme) => { setCurrentTheme(theme); setShowThemeModal(false); if (soundEnabled) playSelectSound(); };
  const handleLayoutChange = (layout: GameLayout) => { setCurrentLayout(layout); setBoard(createInitialBoard(layout.board)); setGameStatus(GameStatus.IDLE); setTimer(0); setShowLayoutModal(false); if (soundEnabled) playSelectSound(); };

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Background Layer */}
      <div ref={bgLayerRef} className="fixed inset-[-10%] w-[120%] h-[120%] z-0 pointer-events-none">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-all duration-700 bg-slate-900" 
            style={{ backgroundImage: `url(${currentTheme.bgImage})`, opacity: 1 }}
          ></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/30' : 'bg-white/10'}`}></div>
      </div>

      <div ref={floatLayerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         {bubbles.map((b, i) => (
          <div key={i} className="bubble opacity-20" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay, background: 'white' }} />
        ))}
      </div>

      {/* Optimized Header */}
      <header className="w-full flex justify-between items-start relative z-50 shrink-0 pointer-events-none pt-4 px-4">
        {/* Top Left Buttons - Extreme Left */}
        <div className="flex flex-col gap-2 pointer-events-auto items-start">
           <button onClick={() => setShowThemeModal(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full hover:scale-105 transition-all bg-gradient-to-r from-pink-500 to-rose-600 backdrop-blur-xl border border-white/40 shadow-xl`}>
             <Palette size={14} className="text-white"/>
             <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">{currentTheme.name}</span>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full hover:scale-105 transition-all bg-gradient-to-r from-blue-500 to-cyan-600 backdrop-blur-xl border border-white/40 shadow-xl`}>
             <LayoutGrid size={14} className="text-white"/>
             <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">{currentLayout.name}</span>
           </button>
        </div>
        
        {/* Top Right Buttons - Stacked Volume Below Help */}
        <div className="flex items-start gap-2 pointer-events-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentTheme.isDark ? 'bg-black/40' : 'bg-white/70'} backdrop-blur-md border border-white/20 shadow-xl`}>
              <TimerIcon size={14} className="text-green-500" />
              <span className="font-mono text-xs font-bold">{formatTime(timer)}</span>
          </div>
          
          <div className="flex flex-col gap-2 items-center">
            <button onClick={() => setShowRules(true)} className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-800'} backdrop-blur-md border border-white/10 shadow-lg`}><HelpCircle size={18} /></button>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/5 hover:bg-black/10 text-slate-800'} backdrop-blur-md border border-white/10 shadow-lg`}>
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Compressed Title Section */}
      <div ref={titleRef} className="text-center relative z-10 pointer-events-none shrink-0 -mt-6">
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
          Brainvita<span className={currentTheme.isDark ? "text-blue-400" : "text-fuchsia-400"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md mt-1 border border-white/10">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Remaining:</span>
          <span className="text-sm font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game Area - Scaled for visibility without overlap */}
      <main className="flex-1 w-full flex justify-center items-center min-h-0 relative z-40 overflow-visible py-2">
         <div className="scale-[0.45] xs:scale-[0.5] sm:scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Ultra Compact Footer */}
      <footer className="w-full max-w-lg flex flex-col gap-3 relative z-50 shrink-0 pb-8 px-6 pointer-events-auto items-center">
        {/* Control Buttons - Centered */}
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-28 h-12 disabled:opacity-50">
            <div className="btn-edge bg-red-900"></div>
            <div className="btn-surface bg-gradient-to-b from-red-500 to-red-600 border-t border-red-400">
              <Square size={14} fill="currentColor" className="mr-2 text-white" />
              <span className="text-white text-xs font-black uppercase">Stop</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-36 h-12">
            <div className={`btn-edge ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
            <div className={`btn-surface bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} border-t`}>
              <Play size={16} fill="currentColor" className="mr-2 text-white" />
              <span className="text-white text-xs font-black uppercase">Start</span>
            </div>
          </button>
        </div>

        {/* Collection Tray - Absolute bottom, below buttons */}
        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </footer>

      {/* Modals */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className={`relative max-w-2xl w-full p-6 rounded-[2rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-white/20 animate-in zoom-in ${currentTheme.isDark ? 'bg-slate-900/90' : 'bg-white/90'}`}>
             <div className="flex justify-between items-center mb-6 shrink-0 px-1">
                <h2 className={`text-xl font-black uppercase tracking-tight ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>Select Theme</h2>
                <button onClick={() => setShowThemeModal(false)} className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}><X size={28} /></button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto p-1 custom-scrollbar">
                {THEMES.map(t => {
                   const isActive = currentTheme.name === t.name;
                   return (
                     <button key={t.name} onClick={() => handleThemeChange(t)} className={`relative group rounded-xl overflow-hidden text-left transition-all border-4 ${isActive ? 'border-green-400 scale-[1.05]' : 'border-transparent hover:scale-[1.02]'}`}>
                        <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}>
                           <div className={`absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors`}></div>
                           {isActive && <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full border-2 border-white"><Check size={12} strokeWidth={4} /></div>}
                        </div>
                        <div className={`p-2.5 ${t.isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}><p className="font-bold text-[10px] uppercase truncate">{t.name}</p></div>
                     </button>
                   );
                })}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
           <div className={`relative max-w-md w-full p-8 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in ${currentTheme.isDark ? 'bg-slate-900/95' : 'bg-white/95'}`}>
              <button onClick={() => setShowRules(false)} className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}><X size={28} /></button>
              <h2 className={`text-2xl font-black mb-6 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>How to Play</h2>
              <div className={`space-y-4 text-sm font-medium ${currentTheme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <p><strong>Goal:</strong> Remove marbles until only <strong>one</strong> remains in the center!</p>
                <ul className="list-disc pl-5 space-y-3 font-bold">
                  <li>Jump over a neighbor into an empty hole.</li>
                  <li>The jumped marble is removed.</li>
                  <li>Moves must be horizontal or vertical.</li>
                </ul>
              </div>
           </div>
        </div>
      )}

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl animate-in fade-in">
          <div className={`relative max-w-xs w-full p-8 rounded-[2rem] text-center border border-white/20 animate-in zoom-in ${currentTheme.isDark ? 'bg-slate-900/90' : 'bg-white/95'}`}>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">{gameStatus === GameStatus.WON ? 'You Won!' : 'Out of Moves'}</h2>
            <p className="mb-6 text-lg font-bold opacity-70">Marbles Left: {marblesRemaining}</p>
            <button onClick={startGame} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-xl hover:brightness-110">REPLAY</button>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className={`relative max-w-lg w-full p-6 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in ${currentTheme.isDark ? 'bg-slate-900/90' : 'bg-white/90'}`}>
             <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className={`text-xl font-black uppercase tracking-tight ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>Select Layout</h2>
                <button onClick={() => setShowLayoutModal(false)} className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}><X size={28} /></button>
             </div>
             <div className="space-y-3 overflow-y-auto p-1 custom-scrollbar">
                {LAYOUTS.map(layout => {
                   const isActive = currentLayout.name === layout.name;
                   return (
                     <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full relative group rounded-xl p-4 text-left transition-all border-2 flex items-center justify-between shadow-lg ${isActive ? 'border-green-400 bg-green-400/20' : `border-transparent ${currentTheme.isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50'}`}`}>
                        <div><p className={`font-black text-base uppercase tracking-tight ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>{layout.name}</p></div>
                        {isActive && <div className="bg-green-500 text-white p-1 rounded-full shadow-2xl border-2 border-white"><Check size={16} strokeWidth={4} /></div>}
                     </button>
                   );
                })}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;