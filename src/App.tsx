
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
      
      // Fixed 3D tilt for a more stable board view
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -4}deg) rotateY(${targetX * 4}deg)`;
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
    if (status !== GameStatus.PLAYING) {
      if (status === GameStatus.WON) { if (soundEnabled) playWinSound(); }
      else if (status === GameStatus.LOST) { if (soundEnabled) playLoseSound(); }
      stopBackgroundMusic();
    }
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

  // Helper to determine the game end message
  const getWinnerInfo = () => {
    return gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER';
  };

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-start perspective-[1200px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} font-poppins`}>
      
      {/* Background Layers */}
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${currentTheme.isDark ? 'bg-black/30' : 'bg-white/10'}`}></div>
      </div>

      {/* Header - Standard Sizes */}
      <header className="w-full flex justify-between items-start relative z-[5000] shrink-0 pointer-events-auto p-4 sm:p-6">
        <div className="flex flex-col gap-2">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 w-40 sm:w-48">
             <div className="btn-edge bg-pink-900 rounded-xl shadow-lg"></div>
             <div className="btn-surface bg-pink-500 border-t border-pink-300 rounded-xl flex items-center justify-start px-3 gap-2">
               <Palette size={16} className="text-white"/>
               <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 w-40 sm:w-48">
             <div className="btn-edge bg-cyan-900 rounded-xl shadow-lg"></div>
             <div className="btn-surface bg-cyan-500 border-t border-cyan-300 rounded-xl flex items-center justify-start px-3 gap-2">
               <LayoutGrid size={16} className="text-white"/>
               <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-10 h-10 rounded-full bg-amber-500 shadow-lg flex items-center justify-center border-b-4 border-amber-700 active:translate-y-1 active:border-b-0 transition-all">
                {soundEnabled ? <Volume2 size={18} className="text-white"/> : <VolumeX size={18} className="text-white"/>}
            </button>
            <button onClick={() => setShowRules(true)} className="w-10 h-10 rounded-full bg-slate-700 shadow-lg flex items-center justify-center border-b-4 border-slate-900 active:translate-y-1 active:border-b-0 transition-all">
                <HelpCircle size={18} className="text-white" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 shadow-lg">
              <TimerIcon size={12} className="text-green-400" />
              <span className="font-mono text-xs font-bold text-green-400 tracking-wider">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Main Container - Ensuring height isn't squashed */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-[3000] px-4 min-h-[400px]">
          
          {/* Title Area */}
          <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none mb-6 shrink-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-white drop-shadow-xl uppercase italic leading-none">
              BRAINVITA <span className="text-fuchsia-500">3D</span>
            </h1>
            
            <div className="inline-flex items-center bg-stone-950/90 backdrop-blur-md rounded-full mt-4 border border-white/10 shadow-2xl overflow-hidden pointer-events-auto">
              <div className="px-5 py-2 border-r border-white/10">
                <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em]">REMAINING</span>
              </div>
              <div className="px-5 py-2 min-w-[50px] text-center">
                <span className="text-xl font-black text-white">{marblesRemaining}</span>
              </div>
            </div>
          </div>

          {/* Board Area - Centralizing and sizing */}
          <main className="w-full flex-1 flex justify-center items-center relative overflow-visible mt-2">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
          </main>
      </div>

      {/* Footer Area */}
      <footer className="w-full max-w-lg flex flex-col gap-4 relative z-[4500] shrink-0 px-8 pb-8 pointer-events-auto items-center mt-auto">
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="flex-1 h-14 rounded-2xl bg-rose-500/10 backdrop-blur-md border border-rose-500/30 flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-5">
            <div className="w-3 h-3 bg-white/80 rounded-sm"></div>
            <span className="text-white text-xs font-black uppercase tracking-widest">QUIT</span>
          </button>
          
          <button onClick={startGame} className="flex-1 h-14 rounded-2xl bg-blue-600 border-t border-blue-400 shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
            <Play size={18} fill="currentColor" className="text-white" />
            <span className="text-white text-xs font-black uppercase tracking-widest">START</span>
          </button>
        </div>

        <div className="flex items-center bg-stone-950/90 backdrop-blur-md rounded-full border border-white/10 shadow-xl overflow-hidden h-9">
           <div className="flex items-center gap-2 px-4 h-full border-r border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">CLEARED</span>
           </div>
           <div className="px-5 h-full flex items-center">
              <span className="text-base font-black text-white">{marblesRemoved}</span>
           </div>
        </div>
      </footer>

      {/* Modals for Themes/Layouts/Rules */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="relative max-w-4xl w-full p-8 rounded-[3rem] border border-white/10 bg-slate-950 text-white overflow-hidden flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-black uppercase italic tracking-widest">THEMES</h2>
                <button onClick={() => setShowThemeModal(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"><X size={20}/></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-2 pb-10">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} 
                        className={`group relative flex flex-col rounded-3xl overflow-hidden border-4 transition-all duration-300 active:scale-95 ${currentTheme.name === t.name ? 'border-green-400 bg-green-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                        {currentTheme.name === t.name && <div className="absolute top-3 right-3 bg-green-400 text-black p-1.5 rounded-full z-20"><Check size={16} strokeWidth={4} /></div>}
                      </div>
                      <div className="p-3 text-center bg-black/80 backdrop-blur-md border-t border-white/10">
                        <span className="block text-[11px] font-black uppercase tracking-widest text-white truncate">{t.name}</span>
                      </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

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
                        <p className="font-black text-base uppercase tracking-tight">{layout.name}</p>
                        {currentLayout.name === layout.name && <Check size={18} className="text-green-400" strokeWidth={3}/>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{layout.description}</p>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-10 rounded-[3rem] bg-slate-950 border border-white/20 text-white shadow-4xl text-center">
              <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">RULES</h2>
              <div className="text-xs font-bold text-slate-400 text-center leading-relaxed uppercase tracking-widest">
                <p className="mb-4">
                   Jump one marble over another into an empty hole to remove it. Leave only one to win!
                </p>
                <div className="h-px w-1/2 mx-auto bg-white/10 mb-4"></div>
                <p className="text-white italic tracking-normal italic">Concentrate and master the board.</p>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-8 w-full h-14 bg-blue-600 rounded-3xl text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">GOT IT</button>
           </div>
        </div>
      )}

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-10 rounded-[3.5rem] bg-slate-950 border border-white/20 text-white shadow-2xl text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${gameStatus === GameStatus.WON ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameStatus === GameStatus.WON ? <Trophy size={32} /> : <X size={32} />}
              </div>
              <h2 className="text-2xl font-black mb-4 uppercase italic tracking-tighter drop-shadow-lg">{getWinnerInfo()}</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white/10 p-4 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">TIME</p>
                    <p className="text-lg font-black">{formatTime(timer)}</p>
                </div>
                <div className="bg-white/10 p-4 rounded-3xl border border-white/5">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">REMAINING</p>
                    <p className="text-lg font-black">{marblesRemaining}</p>
                </div>
              </div>
              
              <button onClick={startGame} className="w-full h-16 bg-blue-600 rounded-3xl text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 shadow-xl">
                <RefreshCw size={20} />
                <span>PLAY AGAIN</span>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
