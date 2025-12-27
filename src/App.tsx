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
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} py-0`}>
      {/* Background Layer */}
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/20' : 'bg-white/10'}`}></div>
      </div>

      {/* Extreme Left and Right Header Positioned for Small Screens */}
      <header className="w-full flex justify-between items-start relative z-50 shrink-0 pointer-events-none pt-2 px-1">
        {/* Top Left Buttons - Extreme Left edge */}
        <div className="flex flex-col gap-1.5 pointer-events-auto items-start">
           <button onClick={() => setShowThemeModal(true)} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-pink-500 border border-white/40 shadow-xl">
             <Palette size={12} className="text-white"/>
             <span className="text-[8px] font-black uppercase text-white whitespace-nowrap">{currentTheme.name}</span>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-500 border border-white/40 shadow-xl">
             <LayoutGrid size={12} className="text-white"/>
             <span className="text-[8px] font-black uppercase text-white whitespace-nowrap">{currentLayout.name}</span>
           </button>
        </div>
        
        {/* Top Right Buttons - Volume Stacked below Help */}
        <div className="flex items-start gap-1.5 pointer-events-auto pr-1">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-xl">
              <TimerIcon size={12} className="text-green-500" />
              <span className="font-mono text-[9px] font-bold text-white">{formatTime(timer)}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 items-center">
            <button onClick={() => setShowRules(true)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-lg"><HelpCircle size={16} /></button>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 shadow-lg">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Compressed Title Section */}
      <div ref={titleRef} className="text-center relative z-10 pointer-events-none shrink-0 -mt-8">
        <h1 className="text-xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
          Brainvita<span className={currentTheme.isDark ? "text-blue-400" : "text-fuchsia-400"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm mt-0.5 border border-white/10">
          <span className="text-[7px] font-bold uppercase text-white/70">Left:</span>
          <span className="text-xs font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game Area - Significant Board Downscaling */}
      <main className="flex-1 w-full flex justify-center items-center min-h-0 relative z-40 overflow-visible py-0">
         <div className="scale-[0.35] xs:scale-[0.4] sm:scale-65 md:scale-85 lg:scale-100 origin-center transition-transform duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer Area - Reordered: Buttons then Tray at absolute bottom */}
      <footer className="w-full max-w-lg flex flex-col gap-2 relative z-50 shrink-0 pb-1 px-4 pointer-events-auto items-center">
        {/* Buttons ABOVE the Tray */}
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-24 h-10 disabled:opacity-50">
            <div className="btn-edge bg-red-900"></div>
            <div className="btn-surface bg-red-600 border-t border-red-400">
              <Square size={12} fill="currentColor" className="mr-1.5 text-white" />
              <span className="text-white text-[10px] font-black uppercase">Stop</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-32 h-10">
            <div className="btn-edge bg-blue-900"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400">
              <Play size={14} fill="currentColor" className="mr-1.5 text-white" />
              <span className="text-white text-[10px] font-black uppercase">Start</span>
            </div>
          </button>
        </div>

        {/* Tray BELOW the Buttons at the bottom */}
        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </footer>

      {/* Modals - Condensed for small screen viewing */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 bg-black/90 backdrop-blur-xl animate-in fade-in">
          <div className="relative max-w-2xl w-full p-4 rounded-[1.5rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col border border-white/20 bg-slate-900/90 text-white">
             <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                <h2 className="text-lg font-black uppercase">Themes</h2>
                <button onClick={() => setShowThemeModal(false)} className="p-1.5 hover:bg-white/10 rounded-full"><X size={24} /></button>
             </div>
             <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 overflow-y-auto p-1 custom-scrollbar">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className={`relative rounded-xl overflow-hidden text-left border-4 ${currentTheme.name === t.name ? 'border-green-400' : 'border-transparent'}`}>
                        <div className="h-20 w-full bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                        <div className="p-1.5 bg-slate-800"><p className="font-bold text-[8px] uppercase truncate">{t.name}</p></div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
           <div className="relative max-w-xs w-full p-6 rounded-[1.5rem] bg-slate-900 border border-white/20 text-white">
              <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 p-1.5"><X size={24} /></button>
              <h2 className="text-xl font-black mb-4">How to Play</h2>
              <div className="space-y-3 text-[11px] font-medium text-slate-300">
                <p>Jump over a neighbor into an empty hole. The jumped marble is removed. Win by leaving just one!</p>
              </div>
           </div>
        </div>
      )}

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
          <div className="relative max-w-xs w-full p-8 rounded-[1.5rem] text-center border border-white/20 bg-slate-900 text-white">
            <h2 className="text-2xl font-black mb-2 uppercase">{gameStatus === GameStatus.WON ? 'You Won!' : 'Game Over'}</h2>
            <p className="mb-6 text-sm font-bold opacity-70">Marbles Left: {marblesRemaining}</p>
            <button onClick={startGame} className="w-full py-3 rounded-xl bg-blue-600 text-white font-black text-sm">REPLAY</button>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative max-w-md w-full p-5 rounded-[1.5rem] bg-slate-900 border border-white/20 text-white">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black uppercase">Layouts</h2>
                <button onClick={() => setShowLayoutModal(false)}><X size={24} /></button>
             </div>
             <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-3 rounded-xl text-left border-2 flex items-center justify-between ${currentLayout.name === layout.name ? 'border-green-400 bg-green-400/20' : 'border-transparent bg-white/5'}`}>
                      <p className="font-black text-sm uppercase">{layout.name}</p>
                      {currentLayout.name === layout.name && <Check size={14} className="text-green-400" />}
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