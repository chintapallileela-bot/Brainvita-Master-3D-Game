import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, X, Square,
  Timer as TimerIcon, Play, Palette, Check, LayoutGrid,
  Volume2, VolumeX
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
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const animate = () => {
      const { x, y } = mouseRef.current;
      const targetX = x === 0 ? 0 : (x / window.innerWidth) * 2 - 1;
      const targetY = y === 0 ? 0 : (y / window.innerHeight) * 2 - 1;
      
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -6}deg) rotateY(${targetX * 6}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.05)`;
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 5}px, ${targetY * 5}px) translateZ(50px)`;
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const marblesRemaining = useMemo(() => countMarbles(board), [board]);
  const marblesRemoved = useMemo(() => {
    let total = 0;
    currentLayout.board.forEach(row => row.forEach(cell => { if(cell === CellState.MARBLE) total++ }));
    return total - marblesRemaining;
  }, [board, currentLayout]);

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
    const mid = { row: (from.row + to.row) / 2, col: (from.col + to.col) / 2 };
    if (soundEnabled) playMoveSound();
    setAnimatingMove({ from, to, mid });
    setSelectedPos(null);
    setTimeout(() => {
      const newBoard = board.map(row => [...row]);
      newBoard[from.row][from.col] = CellState.EMPTY;
      newBoard[mid.row][mid.col] = CellState.EMPTY;
      newBoard[to.row][to.col] = CellState.MARBLE;
      setBoard(newBoard);
      const status = checkGameStatus(newBoard);
      setGameStatus(status);
      if (status === GameStatus.WON) { if (soundEnabled) playWinSound(); stopBackgroundMusic(); }
      if (status === GameStatus.LOST) { if (soundEnabled) playLoseSound(); stopBackgroundMusic(); }
      setAnimatingMove(null);
    }, 200);
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

  useEffect(() => {
    if (!soundEnabled) stopBackgroundMusic();
    else if (gameStatus === GameStatus.PLAYING) startBackgroundMusic();
  }, [soundEnabled, gameStatus]);

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden perspective-[1200px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/60' : 'bg-white/5'}`}></div>
      </div>

      <header className="w-full flex justify-between items-start relative z-[5000] pt-4 px-4">
        <div className="flex flex-col gap-2 p-2 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-9 w-32">
             <div className="btn-edge bg-pink-950 rounded-full"></div>
             <div className="btn-surface bg-pink-600 rounded-full flex items-center justify-center gap-2">
               <Palette size={14} className="text-white"/>
               <span className="text-[10px] font-black uppercase tracking-widest text-white truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-9 w-32">
             <div className="btn-edge bg-cyan-950 rounded-full"></div>
             <div className="btn-surface bg-cyan-600 rounded-full flex items-center justify-center gap-2">
               <LayoutGrid size={14} className="text-white"/>
               <span className="text-[10px] font-black uppercase tracking-widest text-white truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-10 h-10">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-900' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-600' : 'bg-slate-700'} rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={18} className="text-white"/> : <VolumeX size={18} className="text-white"/>}
              </div>
            </button>
            <button onClick={() => setShowRules(true)} className="btn-3d w-10 h-10">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 rounded-full flex items-center justify-center">
                <HelpCircle size={18} className="text-white" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-lg border border-white/10 shadow-lg tray-inset">
              <TimerIcon size={12} className="text-green-400 animate-pulse" />
              <span className="font-mono text-xs font-black text-green-400">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      <div ref={titleRef} className="text-center relative z-[4000] py-2">
        <h1 className="text-3xl md:text-5xl font-black italic uppercase text-white drop-shadow-2xl">
          Brainvita<span className={currentTheme.isDark ? "text-cyan-400" : "text-fuchsia-500"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-black/60 backdrop-blur-xl mt-4 border border-white/10">
          <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Marbles Left</span>
          <span className="text-xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      <main className="flex-1 w-full flex justify-center items-center relative z-[3000] min-h-0">
         <div className="scale-[0.3] xs:scale-[0.35] sm:scale-45 md:scale-55 lg:scale-75 origin-center transition-all duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      <footer className="w-full flex flex-col gap-4 items-center relative z-[4500] pb-8">
        <div className="flex justify-center gap-4">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-28 h-12 disabled:opacity-50">
            <div className="btn-edge bg-red-950 rounded-2xl"></div>
            <div className="btn-surface bg-red-700 rounded-2xl flex items-center justify-center gap-2">
              <Square size={14} fill="currentColor" className="text-white" />
              <span className="text-white text-[11px] font-black uppercase tracking-widest">Quit</span>
            </div>
          </button>
          <button onClick={startGame} className="btn-3d w-36 h-12">
            <div className="btn-edge bg-blue-950 rounded-2xl"></div>
            <div className="btn-surface bg-blue-600 rounded-2xl flex items-center justify-center gap-2">
              <Play size={16} fill="currentColor" className="text-white" />
              <span className="text-white text-[12px] font-black uppercase tracking-widest">Start</span>
            </div>
          </button>
        </div>
        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </footer>

      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="relative max-w-2xl w-full p-8 rounded-[3rem] bg-slate-950 border border-white/10 text-white shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Themes</h2>
                <button onClick={() => setShowThemeModal(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-2">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="flex flex-col gap-2 group">
                      <div className={`aspect-square rounded-3xl overflow-hidden border-2 transition-all ${currentTheme.name === t.name ? 'border-cyan-400 ring-4 ring-cyan-400/20' : 'border-white/5 opacity-60 group-hover:opacity-100'}`}>
                         <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-center truncate">{t.name}</span>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="relative max-w-md w-full p-8 rounded-[3rem] bg-slate-950 border border-white/10 text-white shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Map Selection</h2>
                <button onClick={() => setShowLayoutModal(false)} className="text-white/40 hover:text-white transition-colors"><X size={24} /></button>
             </div>
             <div className="space-y-3">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-6 rounded-3xl border-2 transition-all text-left ${currentLayout.name === layout.name ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/5 hover:bg-white/5'}`}>
                      <p className="font-black text-lg uppercase">{layout.name}</p>
                      <p className="text-xs opacity-50 font-bold">{layout.description}</p>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
           <div className="relative max-w-sm w-full p-10 rounded-[4rem] bg-slate-950 border border-white/10 text-white shadow-2xl text-center">
              <h2 className="text-3xl font-black mb-6 uppercase italic">Rulebook</h2>
              <div className="space-y-6 text-sm font-bold opacity-70 leading-relaxed text-left">
                <p>1. Select a marble and jump over its neighbor into an empty hole.</p>
                <p>2. The jumped marble is removed from the board.</p>
                <p>3. Win by leaving exactly ONE marble on the board!</p>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-10 w-full py-4 bg-cyan-600 rounded-3xl font-black uppercase tracking-widest">Start Playing</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;