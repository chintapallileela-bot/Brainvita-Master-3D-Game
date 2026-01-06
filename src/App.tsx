
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, X, 
  Timer as TimerIcon, Play, Palette, Check, LayoutGrid,
  Volume2, VolumeX, Trophy, RefreshCw
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
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timer, setTimer] = useState(0);
  const [animatingMove, setAnimatingMove] = useState<{from: Position, to: Position, mid: Position} | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
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
      
      // Extremely subtle tilt
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${3 + targetY * -1}deg) rotateY(${targetX * 0.5}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 1}px, ${-targetY * 1}px) scale(1.005)`;
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 0.2}px, ${targetY * 0.2}px) translateZ(10px)`;
      
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
    if (status === GameStatus.WON) { if (soundEnabled) playWinSound(); stopBackgroundMusic(); }
    if (status === GameStatus.LOST) { if (soundEnabled) playLoseSound(); stopBackgroundMusic(); }
  };

  const startGame = () => {
    setBoard(createInitialBoard(currentLayout.board));
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    if (soundEnabled) { playThemeSound(); startBackgroundMusic(); }
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
    if (soundEnabled) playStopSound();
    stopBackgroundMusic();
  };

  const handleThemeChange = (theme: Theme) => { setCurrentTheme(theme); setShowThemeModal(false); if (soundEnabled) playSelectSound(); };
  const handleLayoutChange = (layout: GameLayout) => { setCurrentLayout(layout); setBoard(createInitialBoard(layout.board)); setGameStatus(GameStatus.IDLE); setTimer(0); setShowLayoutModal(false); if (soundEnabled) playSelectSound(); };

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-start overflow-hidden perspective-[400px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} font-poppins`}>
      
      {/* Background Layers */}
      <div ref={bgLayerRef} className="fixed inset-0 w-full h-full z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/10' : 'bg-white/5'}`}></div>
      </div>

      {/* Header - Scaled down */}
      <header className="w-full flex justify-between items-start relative z-[5000] shrink-0 pointer-events-none p-1 sm:p-2">
        <div className="flex flex-col gap-0.5 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-3.5 w-14 sm:h-5 sm:w-20">
             <div className="btn-edge bg-pink-900/40 rounded shadow-sm"></div>
             <div className="btn-surface bg-pink-500 border-t border-pink-300 rounded flex items-center justify-start px-1 gap-0.5">
               <Palette size={5} className="text-white"/>
               <span className="text-[3.5px] sm:text-[4.5px] font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-3.5 w-14 sm:h-5 sm:w-20">
             <div className="btn-edge bg-cyan-900/40 rounded shadow-sm"></div>
             <div className="btn-surface bg-cyan-500 border-t border-cyan-300 rounded flex items-center justify-start px-1 gap-0.5">
               <LayoutGrid size={5} className="text-white"/>
               <span className="text-[3.5px] sm:text-[4.5px] font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-0.5 pointer-events-auto">
          <div className="flex gap-0.5">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-amber-500 shadow-sm flex items-center justify-center border-b border-amber-700 active:translate-y-0.5 active:border-b-0 transition-all">
                {soundEnabled ? <Volume2 size={6} className="text-white"/> : <VolumeX size={6} className="text-white"/>}
            </button>
            <button onClick={() => setShowRules(true)} className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-slate-700 shadow-sm flex items-center justify-center border-b border-slate-900 active:translate-y-0.5 active:border-b-0 transition-all">
                <HelpCircle size={6} className="text-white" />
            </button>
          </div>
          <div className="flex items-center gap-0.5 px-0.5 py-0.2 rounded-full bg-black/30 backdrop-blur-sm border border-white/5 shadow-sm">
              <TimerIcon size={4} className="text-green-400" />
              <span className="font-mono text-[4px] sm:text-[5px] font-bold text-green-400 tracking-wider">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Main Container - More space for board */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-[3000] px-2 min-h-0 overflow-visible">
          
          {/* Title Area - Minimal height */}
          <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none mb-0.5 shrink-0">
            <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-tighter text-white drop-shadow-sm uppercase italic leading-none">
              BRAINVITA <span className="text-fuchsia-500">3D</span>
            </h1>
            
            {/* REMAINING PILL - Compact */}
            <div className="inline-flex items-center bg-stone-950/80 backdrop-blur-sm rounded-full mt-0.5 border border-white/5 shadow-sm overflow-hidden pointer-events-auto scale-[0.6]">
              <div className="px-1.5 py-0.2 border-r border-white/10">
                <span className="text-[4px] font-black uppercase text-white/40 tracking-[0.05em]">REMAINING</span>
              </div>
              <div className="px-1.5 py-0.2">
                <span className="text-[7px] font-black text-white">{marblesRemaining}</span>
              </div>
            </div>
          </div>

          {/* Board Area - Central piece */}
          <main className="w-full flex justify-center items-center py-0 relative flex-shrink-0 overflow-visible">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
          </main>
      </div>

      {/* Footer Area - Compressed height */}
      <footer className="w-full max-w-xs flex flex-col gap-0.5 relative z-[4500] shrink-0 px-4 pb-0.5 pointer-events-auto items-center mt-auto">
        
        {/* Action Buttons: QUIT and START - Even more compact */}
        <div className="flex justify-center gap-1.5 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="flex-1 h-5 rounded bg-rose-500/10 backdrop-blur-sm border border-rose-500/20 flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-5">
            <div className="w-0.5 h-0.5 bg-white/70 rounded-sm"></div>
            <span className="text-white text-[5px] font-black uppercase tracking-widest">QUIT</span>
          </button>
          
          <button onClick={startGame} className="flex-1 h-5 rounded bg-blue-600 border-t border-blue-400 shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-transform">
            <Play size={6} fill="currentColor" className="text-white" />
            <span className="text-white text-[5px] font-black uppercase tracking-widest">START</span>
          </button>
        </div>

        {/* CLEARED PILL INDICATOR - Tiny */}
        <div className="flex items-center bg-stone-950/80 backdrop-blur-sm rounded-full border border-white/5 shadow-sm overflow-hidden h-3.5 mb-1">
           <div className="flex items-center gap-0.5 px-1 h-full border-r border-white/5">
              <div className="w-0.5 h-0.5 rounded-full bg-fuchsia-500"></div>
              <span className="text-[3.5px] font-black text-white/40 uppercase tracking-widest">CLEARED</span>
           </div>
           <div className="px-1.5 h-full flex items-center">
              <span className="text-[6px] font-black text-white">{marblesRemoved}</span>
           </div>
        </div>
      </footer>

      {/* Modals */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="relative max-w-4xl w-full p-4 rounded-[2rem] border border-white/10 bg-slate-950 text-white overflow-hidden flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="text-lg font-black uppercase italic tracking-widest">THEMES</h2>
                <button onClick={() => setShowThemeModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"><X size={18}/></button>
             </div>
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar p-1 pb-8">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} 
                        className={`group relative flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-300 active:scale-95 ${currentTheme.name === t.name ? 'border-green-400 bg-green-400/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                        {currentTheme.name === t.name && <div className="absolute top-2 right-2 bg-green-400 text-black p-1 rounded-full z-20"><Check size={12} strokeWidth={4} /></div>}
                      </div>
                      <div className="p-2 text-center bg-black/60 backdrop-blur-xl border-t border-white/5">
                        <span className="block text-[8px] font-black uppercase tracking-[0.1em] text-white truncate">{t.name}</span>
                      </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-sm w-full p-6 rounded-[2rem] bg-slate-950 border border-white/10 text-white shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black uppercase italic tracking-widest">BOARDS</h2>
                <button onClick={() => setShowLayoutModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90"><X size={18}/></button>
             </div>
             <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-3 rounded-xl text-left border transition-all active:scale-[0.98] ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                      <div className="flex justify-between items-center">
                        <p className="font-black text-xs uppercase tracking-tight">{layout.name}</p>
                        {currentLayout.name === layout.name && <Check size={14} className="text-green-400" strokeWidth={3}/>}
                      </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-xs w-full p-6 rounded-[2rem] bg-slate-950 border border-white/10 text-white shadow-4xl text-center">
              <h2 className="text-xl font-black mb-4 uppercase italic tracking-tighter">RULES</h2>
              <div className="text-xs font-bold text-slate-400 text-center leading-relaxed">
                <p className="uppercase text-[10px] tracking-wide">Jump one marble over another into an empty hole to remove it.</p>
                <p className="mt-2 text-white">Win by leaving exactly <span className="underline decoration-fuchsia-500 underline-offset-4">ONE</span> marble.</p>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-6 w-full h-10 bg-blue-600 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em]">GOT IT</button>
           </div>
        </div>
      )}

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
           <div className="relative max-w-xs w-full p-6 rounded-[2rem] bg-slate-950 border border-white/20 text-white shadow-2xl text-center">
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${gameStatus === GameStatus.WON ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameStatus === GameStatus.WON ? <Trophy size={24} /> : <X size={24} />}
              </div>
              <h2 className="text-xl font-black mb-1 uppercase italic tracking-tighter">{gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER'}</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                 <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[6px] font-black text-white/30 uppercase tracking-[0.1em]">TIME</p>
                    <p className="text-xs font-black">{formatTime(timer)}</p>
                 </div>
                 <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                    <p className="text-[6px] font-black text-white/30 uppercase tracking-[0.1em]">REMAINING</p>
                    <p className="text-xs font-black">{marblesRemaining}</p>
                 </div>
              </div>
              <button onClick={startGame} className="w-full h-10 bg-blue-600 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <RefreshCw size={14} />
                <span>PLAY AGAIN</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
