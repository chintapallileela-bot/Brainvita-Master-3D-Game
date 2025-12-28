
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
    let interval: number | undefined;
    if (gameStatus === GameStatus.PLAYING) {
      interval = window.setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus === GameStatus.WON && soundEnabled) playWinSound();
    if (gameStatus === GameStatus.LOST && soundEnabled) playLoseSound();
  }, [gameStatus, soundEnabled]);

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
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 12}px, ${-targetY * 12}px) scale(1.05)`;
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 8}px, ${targetY * 8}px) translateZ(100px)`;
      
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
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden perspective-[1500px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Background */}
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none transition-transform duration-100 ease-out">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/40' : 'bg-white/5'}`}></div>
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-start relative z-[5000] shrink-0 pointer-events-none pt-4 px-5">
        <div className="flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-11 w-40">
             <div className="btn-edge bg-pink-950 rounded-2xl"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-2xl flex items-center justify-start px-4 gap-2">
               <Palette size={16} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-11 w-40">
             <div className="btn-edge bg-cyan-950 rounded-2xl"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-2xl flex items-center justify-start px-4 gap-2">
               <LayoutGrid size={16} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-11 h-11">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-800' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-500 border-amber-300' : 'bg-slate-700 border-slate-500'} border-t rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={20} className="text-white"/> : <VolumeX size={20} className="text-white"/>}
              </div>
            </button>
            <button onClick={() => setShowRules(true)} className="btn-3d w-11 h-11">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full flex items-center justify-center">
                <HelpCircle size={20} className="text-white" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-lg border border-white/20 shadow-lg">
              <TimerIcon size={12} className="text-green-400 animate-pulse" />
              <span className="font-mono text-[11px] font-black text-green-400 tracking-wider">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Title & Stats */}
      <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none shrink-0 pt-2 transition-transform duration-100 ease-out">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] italic uppercase select-none">
          BRAINVITA<span className="text-fuchsia-500 ml-1">3D</span>
        </h1>
        <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-stone-900/90 backdrop-blur-xl mt-3 border border-white/10 shadow-2xl pointer-events-auto">
          <span className="text-[10px] font-black uppercase text-white/50 tracking-[0.2em]">MARBLES LEFT</span>
          <span className="text-xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game */}
      <main className="flex-1 w-full flex justify-center items-center relative z-[3000] overflow-visible perspective-[1500px]">
         <div className="scale-[0.5] xs:scale-[0.6] sm:scale-75 md:scale-90 origin-center">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer controls & small tray */}
      <footer className="w-full max-w-xl flex flex-col gap-3 relative z-[4500] shrink-0 px-6 pb-6 pointer-events-auto items-center">
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-36 h-14 disabled:opacity-40">
            <div className="btn-edge bg-red-950 rounded-2xl"></div>
            <div className="btn-surface bg-rose-500/80 backdrop-blur-md border-t border-rose-300 rounded-2xl flex items-center justify-center gap-2">
              <Square size={16} fill="currentColor" className="text-white" />
              <span className="text-white text-[12px] font-black uppercase tracking-widest">QUIT</span>
            </div>
          </button>
          <button onClick={startGame} className="btn-3d w-36 h-14">
            <div className="btn-edge bg-blue-950 rounded-2xl"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-2xl flex items-center justify-center gap-2">
              <Play size={18} fill="currentColor" className="text-white" />
              <span className="text-white text-[12px] font-black uppercase tracking-widest">START</span>
            </div>
          </button>
        </div>
        <div className="w-full">
            <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
        </div>
      </footer>

      {/* Game Over Modal */}
      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
           <div className="relative max-w-xs w-full p-8 rounded-[2.5rem] bg-slate-900 border border-white/20 text-white shadow-4xl text-center animate-in">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${gameStatus === GameStatus.WON ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameStatus === GameStatus.WON ? <Trophy size={32} /> : <X size={32} />}
              </div>
              <h2 className="text-2xl font-black mb-1 uppercase italic">{gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER'}</h2>
              <p className="text-slate-400 font-bold mb-6 text-xs">{gameStatus === GameStatus.WON ? "Perfect Score!" : `Left ${marblesRemaining} pieces.`}</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">TIME</p>
                    <p className="text-sm font-black">{formatTime(timer)}</p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">REMAINING</p>
                    <p className="text-sm font-black">{marblesRemaining}</p>
                 </div>
              </div>
              <button onClick={startGame} className="w-full btn-3d h-12">
                <div className="btn-edge bg-blue-950 rounded-xl"></div>
                <div className="btn-surface bg-blue-600 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw size={14} />
                  <span>PLAY AGAIN</span>
                </div>
              </button>
           </div>
        </div>
      )}

      {/* Selection Modals */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
          <div className="relative max-w-xl w-full p-6 rounded-[2.5rem] border border-white/10 bg-slate-950 text-white overflow-hidden flex flex-col max-h-[70vh]">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black uppercase italic tracking-widest">WORLD THEMES</h2>
                <button onClick={() => setShowThemeModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><X size={16}/></button>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto custom-scrollbar p-1">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="relative aspect-video rounded-xl overflow-hidden border-2 transition-transform active:scale-95 group" style={{ borderColor: currentTheme.name === t.name ? '#4ade80' : 'rgba(255,255,255,0.1)' }}>
                      <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                      <div className="absolute inset-0 bg-black/40"></div>
                      <span className="absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-widest">{t.name}</span>
                      {currentTheme.name === t.name && <div className="absolute top-2 right-2 text-green-400"><Check size={14}/></div>}
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl">
          <div className="relative max-w-sm w-full p-6 rounded-[2.5rem] bg-slate-950 border border-white/10 text-white">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black uppercase italic tracking-widest">MAPS</h2>
                <button onClick={() => setShowLayoutModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X size={16}/></button>
             </div>
             <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-4 rounded-xl text-left border transition-all ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                      <p className="font-black text-sm uppercase">{layout.name}</p>
                      <p className="text-[9px] opacity-40 uppercase tracking-widest mt-1">{layout.description}</p>
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
