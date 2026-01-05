
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, X, Square,
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
      
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -6}deg) rotateY(${targetX * 6}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.05)`;
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 5}px, ${targetY * 5}px) translateZ(100px)`;
      
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
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-start overflow-x-auto overflow-y-auto lg:overflow-hidden perspective-[1500px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} font-poppins`}>
      
      {/* Background Layers */}
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/50' : 'bg-white/5'}`}></div>
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-start relative z-[5000] shrink-0 pointer-events-none p-4 sm:p-6 lg:p-4">
        <div className="flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 w-40">
             <div className="btn-edge bg-pink-950 rounded-2xl"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-2xl flex items-center justify-start px-4 gap-3">
               <Palette size={16} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-[0.1em] truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 w-40">
             <div className="btn-edge bg-cyan-950 rounded-2xl"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-2xl flex items-center justify-start px-4 gap-3">
               <LayoutGrid size={16} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-[0.1em] truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-10 h-10">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-800' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-500 border-amber-300' : 'bg-slate-700 border-slate-500'} border-t rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={20} className="text-white"/> : <VolumeX size={20} className="text-white"/>}
              </div>
            </button>
            <button onClick={() => setShowRules(true)} className="btn-3d w-10 h-10">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full flex items-center justify-center">
                <HelpCircle size={20} className="text-white" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-lg border border-white/20 shadow-xl tray-inset">
              <TimerIcon size={12} className="text-green-400 animate-pulse" />
              <span className="font-mono text-[11px] font-black text-green-400 tracking-widest">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Title */}
      <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none shrink-0 px-4 mt-2 lg:-mt-4">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white drop-shadow-[0_10px_20px_rgba(0,0,0,1)] italic uppercase leading-none">
          BRAINVITA<span className="text-fuchsia-500 ml-1">3D</span>
        </h1>
        <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-stone-950/80 backdrop-blur-2xl mt-3 border border-white/10 shadow-2xl pointer-events-auto">
          <span className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em]">REMAINING</span>
          <span className="text-lg font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Game Content Wrapper - Desktop: Side-by-Side | Mobile: Stacked */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center lg:gap-12 lg:flex-1 relative z-[3000] px-4 lg:px-8 overflow-visible">
          
          {/* Board Section */}
          <main className="shrink-0 w-full lg:w-auto flex justify-center items-center my-8 lg:my-0">
             <div className="w-full flex items-center justify-center scale-[0.9] lg:scale-100">
                 <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
             </div>
          </main>

          {/* Controls Section (Formerly Footer) */}
          <footer className="w-full lg:w-auto lg:max-w-xs flex flex-col gap-6 shrink-0 pb-12 lg:pb-0 pointer-events-auto items-center">
            <div className="flex flex-row lg:flex-col justify-center gap-6 w-full">
              <button onClick={startGame} className="btn-3d w-36 sm:w-44 lg:w-48 h-14 sm:h-16">
                <div className="btn-edge bg-blue-950 rounded-2xl"></div>
                <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-2xl flex items-center justify-center gap-3">
                  <Play size={20} fill="currentColor" className="text-white" />
                  <span className="text-white text-[12px] lg:text-[14px] font-black uppercase tracking-widest">START</span>
                </div>
              </button>
              <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-36 sm:w-44 lg:w-48 h-14 sm:h-16 disabled:opacity-40">
                <div className="btn-edge bg-red-950 rounded-2xl"></div>
                <div className="btn-surface bg-rose-500/80 backdrop-blur-md border-t border-rose-300 rounded-2xl flex items-center justify-center gap-3">
                  <Square size={16} fill="currentColor" className="text-white" />
                  <span className="text-white text-[12px] lg:text-[14px] font-black uppercase tracking-widest">QUIT</span>
                </div>
              </button>
            </div>
            <div className="w-full flex justify-center lg:mt-4">
                <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
            </div>
          </footer>
      </div>

      {/* Modals and Overlays remain fixed regardless of layout */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="relative max-w-4xl w-full p-6 sm:p-10 rounded-[3rem] border border-white/10 bg-slate-950 text-white overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_100px_rgba(0,0,0,1)]">
             <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-widest leading-none">WORLD THEMES</h2>
                  <span className="text-[10px] text-white/30 font-bold tracking-[0.2em] mt-1">CHOOSE YOUR ATMOSPHERE</span>
                </div>
                <button onClick={() => setShowThemeModal(false)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 shadow-lg"><X size={24}/></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar p-2 pb-12">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className={`group relative flex flex-col rounded-[2.5rem] overflow-hidden border-4 transition-all duration-300 active:scale-95 shadow-2xl ${currentTheme.name === t.name ? 'border-green-400 bg-green-400/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}>
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-1000" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                        {currentTheme.name === t.name && <div className="absolute top-4 right-4 bg-green-400 text-black p-2 rounded-full shadow-2xl z-20 animate-in zoom-in"><Check size={18} strokeWidth={4} /></div>}
                      </div>
                      <div className="p-5 text-center bg-black/60 backdrop-blur-xl border-t border-white/5">
                        <span className="block text-[13px] sm:text-[15px] font-black uppercase tracking-[0.15em] text-white drop-shadow-lg truncate">{t.name}</span>
                        {currentTheme.name === t.name && <span className="text-[9px] font-black text-green-400 uppercase tracking-[0.2em] mt-1 block animate-pulse">ACTIVE</span>}
                      </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-sm sm:max-w-md w-full p-10 rounded-[3.5rem] bg-slate-950 border border-white/10 text-white shadow-4xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-widest">MAPS</h2>
                <button onClick={() => setShowLayoutModal(false)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90 shadow-lg"><X size={24}/></button>
             </div>
             <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-6 sm:p-8 rounded-[2rem] text-left border-2 transition-all active:scale-[0.98] ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                      <div className="flex justify-between items-center">
                        <p className="font-black text-sm sm:text-lg uppercase tracking-tight">{layout.name}</p>
                        {currentLayout.name === layout.name && <Check size={20} className="text-green-400" strokeWidth={3}/>}
                      </div>
                      <p className="text-[10px] sm:text-[12px] opacity-40 uppercase tracking-widest mt-2 leading-relaxed">{layout.description}</p>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-xs sm:max-w-sm w-full p-10 sm:p-12 rounded-[3.5rem] bg-slate-950 border border-white/10 text-white shadow-4xl">
              <h2 className="text-2xl font-black mb-10 uppercase italic tracking-tighter text-center">RULES</h2>
              <div className="space-y-8 text-sm font-bold text-slate-400">
                <p className="uppercase text-[12px] tracking-wide leading-relaxed text-center">Jump one marble over another into an empty hole to remove it. Win by leaving exactly <span className="text-white underline decoration-fuchsia-500 underline-offset-4">ONE</span> marble.</p>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-12 w-full btn-3d h-16">
                <div className="btn-edge bg-blue-950 rounded-3xl"></div>
                <div className="btn-surface bg-blue-600 rounded-3xl text-white text-[14px] font-black uppercase tracking-[0.25em]">READY</div>
              </button>
           </div>
        </div>
      )}

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
           <div className="relative max-w-xs sm:max-w-sm w-full p-8 sm:p-12 rounded-[4rem] bg-slate-950 border border-white/20 text-white shadow-[0_0_200px_rgba(0,0,0,1)] text-center">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-10 shadow-2xl ${gameStatus === GameStatus.WON ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameStatus === GameStatus.WON ? <Trophy size={56} /> : <X size={56} />}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-4 uppercase italic tracking-tighter">{gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER'}</h2>
              <div className="grid grid-cols-2 gap-4 mb-10">
                 <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">TIME</p>
                    <p className="text-xl sm:text-2xl font-black font-mono">{formatTime(timer)}</p>
                 </div>
                 <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">CLEARED</p>
                    <p className="text-xl sm:text-2xl font-black font-mono">{marblesRemoved}</p>
                 </div>
              </div>
              <button onClick={startGame} className="w-full btn-3d h-16 sm:h-20">
                <div className="btn-edge bg-blue-950 rounded-[2.5rem]"></div>
                <div className="btn-surface bg-blue-600 rounded-[2.5rem] text-white text-[14px] sm:text-[16px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4">
                  <RefreshCw size={24} />
                  <span>PLAY AGAIN</span>
                </div>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
