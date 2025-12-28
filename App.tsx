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
      
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -10}deg) rotateY(${targetX * 10}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 15}px, ${-targetY * 15}px) scale(1.1)`;
      
      if (floatLayerRef.current) {
         Array.from(floatLayerRef.current.children).forEach((child: any, i) => {
             const depth = (i % 3) + 1;
             child.style.transform = `translate(${targetX * 25 * depth}px, ${targetY * 25 * depth}px)`;
         });
      }
      
      if (titleRef.current) {
        titleRef.current.style.transform = `translate(${targetX * 20}px, ${targetY * 20}px) translateZ(800px)`;
      }
      
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

  const bubbles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 12 + 6}px`,
    duration: `${Math.random() * 12 + 8}s`,
    delay: `${Math.random() * 5}s`,
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
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden perspective-[3000px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Background Layers */}
      <div ref={bgLayerRef} className="fixed inset-[-15%] w-[130%] h-[130%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/50' : 'bg-white/10'}`}></div>
      </div>

      <div ref={floatLayerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         {bubbles.map((b, i) => (
          <div key={i} className="bubble opacity-25" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay, background: currentTheme.isDark ? 'white' : '#94a3b8' }} />
        ))}
      </div>

      {/* Header Controls - Ensuring highest Z-Index */}
      <header className="w-full flex justify-between items-start relative z-[5000] shrink-0 pointer-events-none pt-6 px-6">
        <div className="flex flex-col gap-4 p-3 rounded-[2.5rem] bg-black/60 backdrop-blur-2xl border border-white/20 shadow-4xl pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-12 w-44">
             <div className="btn-edge bg-pink-900 rounded-full"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-full flex items-center justify-center gap-3">
               <Palette size={18} className="text-white"/>
               <span className="text-[11px] font-black uppercase text-white tracking-[0.2em] truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-12 w-44">
             <div className="btn-edge bg-cyan-900 rounded-full"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-full flex items-center justify-center gap-3">
               <LayoutGrid size={18} className="text-white"/>
               <span className="text-[11px] font-black uppercase text-white tracking-[0.2em] truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          <div className="flex gap-4">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-14 h-14">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-900' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-600 border-amber-400' : 'bg-slate-700 border-slate-500'} border-t rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={26} className="text-white"/> : <VolumeX size={26} className="text-white"/>}
              </div>
            </button>
            <button onClick={() => setShowRules(true)} className="btn-3d w-14 h-14">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full">
                <HelpCircle size={26} className="text-white" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 shadow-2xl tray-inset">
              <TimerIcon size={18} className="text-green-400 animate-pulse" />
              <span className="font-mono text-base font-black text-green-400 tracking-widest">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Floating Title Section */}
      <div 
        ref={titleRef} 
        className="text-center relative z-[4000] pointer-events-none shrink-0 pt-4 pb-4 transition-transform duration-100 ease-out"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] leading-none italic uppercase select-none">
          Brainvita<span className={currentTheme.isDark ? "text-cyan-400" : "text-fuchsia-500"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-4 px-10 py-3 rounded-full bg-black/80 backdrop-blur-2xl mt-8 border border-white/20 shadow-4xl pointer-events-auto">
          <span className="text-[12px] font-black uppercase text-white/40 tracking-[0.4em]">Remaining</span>
          <span className="text-3xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Game Board container with responsive scaling */}
      <main className="flex-1 w-full flex justify-center items-center relative z-[3000] overflow-visible perspective-[2000px] mb-8">
         <div className="scale-[0.45] xs:scale-[0.5] sm:scale-65 md:scale-80 lg:scale-100 origin-center transition-transform duration-700">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer / Removed Marbles Tray */}
      <footer className="w-full max-w-2xl flex flex-col gap-8 relative z-[4500] shrink-0 px-8 pb-10 pointer-events-auto items-center">
        <div className="flex justify-center gap-10 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-40 h-16 disabled:opacity-40">
            <div className="btn-edge bg-red-950 rounded-[2rem]"></div>
            <div className="btn-surface bg-red-700 border-t border-red-400 rounded-[2rem] flex items-center justify-center gap-3">
              <Square size={20} fill="currentColor" className="text-white" />
              <span className="text-white text-lg font-black uppercase tracking-widest">Quit</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-60 h-16">
            <div className="btn-edge bg-blue-950 rounded-[2rem]"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-[2rem] flex items-center justify-center gap-4">
              <Play size={28} fill="currentColor" className="text-white" />
              <span className="text-white text-xl font-black uppercase tracking-[0.3em]">Restart</span>
            </div>
          </button>
        </div>

        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </footer>

      {/* Modals with very high Z-index */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-4xl w-full p-12 rounded-[5rem] shadow-4xl overflow-hidden max-h-[85vh] flex flex-col border border-white/20 bg-slate-950 text-white">
             <div className="flex justify-between items-center mb-12 shrink-0">
                <h2 className="text-4xl font-black uppercase tracking-tighter italic">World Themes</h2>
                <button onClick={() => setShowThemeModal(false)} className="btn-3d w-14 h-14">
                  <div className="btn-edge bg-slate-900 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full"><X size={36} /></div>
                </button>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 overflow-y-auto p-6 custom-scrollbar">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="btn-3d h-60 group">
                        <div className={`btn-edge rounded-[3rem] ${currentTheme.name === t.name ? 'bg-green-800' : 'bg-black'}`}></div>
                        <div className={`btn-surface flex flex-col rounded-[3rem] overflow-hidden border-2 ${currentTheme.name === t.name ? 'border-green-400 ring-8 ring-green-500/20' : 'border-white/10 bg-slate-900'}`}>
                            <div className="flex-1 w-full bg-cover bg-center group-hover:scale-125 transition-transform duration-1000" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                            <div className="p-5 w-full bg-black/90 flex justify-between items-center border-t border-white/10">
                              <span className="font-black text-[13px] uppercase truncate tracking-[0.2em]">{t.name}</span>
                              {currentTheme.name === t.name && <Check size={24} className="text-green-400" strokeWidth={5} />}
                            </div>
                        </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-md w-full p-16 rounded-[6rem] bg-slate-950 border border-white/20 text-white shadow-4xl">
              <h2 className="text-5xl font-black mb-12 uppercase italic tracking-tighter">Rulebook</h2>
              <div className="space-y-10 text-xl font-bold text-slate-400">
                <div className="flex gap-8 items-start">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xl font-black shadow-3xl">1</div>
                  <p className="pt-2 leading-relaxed">Select any marble and jump over its neighbor into an empty hole.</p>
                </div>
                <div className="flex gap-8 items-start">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xl font-black shadow-3xl">2</div>
                  <p className="pt-2 leading-relaxed">The jumped marble is vaporized and added to your collection tray.</p>
                </div>
                <div className="flex gap-8 items-start">
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xl font-black shadow-3xl">3</div>
                  <p className="pt-2 leading-relaxed">Leave exactly ONE marble on the board to achieve Master status!</p>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-16 w-full py-8 btn-3d h-24">
                <div className="btn-edge bg-blue-950 rounded-[2.5rem]"></div>
                <div className="btn-surface bg-blue-600 rounded-[2.5rem] text-white text-2xl font-black uppercase tracking-[0.4em]">Let's Play</div>
              </button>
           </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="relative max-w-xl w-full p-12 rounded-[5rem] bg-slate-950 border border-white/20 text-white shadow-4xl">
             <div className="flex justify-between items-center mb-12">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Map Selection</h2>
                <button onClick={() => setShowLayoutModal(false)} className="btn-3d w-14 h-14">
                  <div className="btn-edge bg-slate-900 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full"><X size={36} /></div>
                </button>
             </div>
             <div className="space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar p-6">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className="btn-3d w-full h-32 block">
                      <div className={`btn-edge rounded-[3rem] ${currentLayout.name === layout.name ? 'bg-green-800' : 'bg-black'}`}></div>
                      <div className={`btn-surface flex items-center justify-between px-12 rounded-[3rem] border-2 ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/40' : 'border-white/10 bg-slate-900'}`}>
                        <div className="text-left">
                          <p className="font-black text-2xl uppercase tracking-tight">{layout.name}</p>
                          <p className="text-[13px] opacity-50 font-black tracking-widest mt-2 uppercase">{layout.description}</p>
                        </div>
                        {currentLayout.name === layout.name && <Check size={40} className="text-green-400" strokeWidth={5} />}
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