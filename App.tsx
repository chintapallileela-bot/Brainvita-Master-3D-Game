
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
    const handleTouchMove = (e: TouchEvent) => { if(e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    let animationFrameId: number;
    const animate = () => {
      const { x, y } = mouseRef.current;
      const targetX = x === 0 ? 0 : (x / window.innerWidth) * 2 - 1;
      const targetY = y === 0 ? 0 : (y / window.innerHeight) * 2 - 1;
      
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -6}deg) rotateY(${targetX * 6}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 8}px, ${-targetY * 8}px) scale(1.05)`;
      
      if (titleRef.current) {
        titleRef.current.style.transform = `translate(${targetX * 5}px, ${targetY * 5}px) translateZ(200px)`;
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

  useEffect(() => {
    if (!soundEnabled) stopBackgroundMusic();
    else if (gameStatus === GameStatus.PLAYING) startBackgroundMusic();
  }, [soundEnabled, gameStatus]);

  return (
    <div className={`fixed inset-0 w-full h-full flex flex-col items-center justify-between overflow-hidden perspective-[1500px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Background Layer */}
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] z-0 pointer-events-none transition-transform duration-100 ease-out">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/60' : 'bg-white/10'}`}></div>
      </div>

      {/* Header Controls */}
      <header className="w-full flex justify-between items-start relative z-[5000] pt-6 px-6 pointer-events-none">
        <div className="flex flex-col gap-2 p-2 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 w-32">
             <div className="btn-edge bg-pink-950 rounded-full"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-full flex items-center justify-center gap-2">
               <Palette size={16} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 w-32">
             <div className="btn-edge bg-cyan-950 rounded-full"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-full flex items-center justify-center gap-2">
               <LayoutGrid size={16} className="text-white"/>
               <span className="text-[10px] font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-11 h-11">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-900' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-600 border-amber-400' : 'bg-slate-700 border-slate-500'} border-t rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={22} className="text-white"/> : <VolumeX size={22} className="text-white"/>}
              </div>
            </button>
            <button onClick={() => setShowRules(true)} className="btn-3d w-11 h-11">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full flex items-center justify-center">
                <HelpCircle size={22} className="text-white" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-lg border border-white/10 shadow-lg tray-inset">
              <TimerIcon size={14} className="text-green-400 animate-pulse" />
              <span className="font-mono text-xs font-black text-green-400 tracking-wider">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div 
        ref={titleRef} 
        className="text-center relative z-[4000] pointer-events-none transition-transform duration-100 ease-out mt-4"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] italic uppercase select-none">
          Brainvita<span className={currentTheme.isDark ? "text-cyan-400" : "text-fuchsia-500"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-3 px-6 py-1.5 rounded-full bg-black/70 backdrop-blur-xl mt-2 border border-white/10 shadow-xl pointer-events-auto">
          <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em]">Marbles Left</span>
          <span className="text-2xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 w-full flex justify-center items-center relative z-[3000] overflow-visible perspective-[1500px] min-h-0">
         <div className="scale-[0.5] xs:scale-[0.6] sm:scale-75 md:scale-90 lg:scale-[1.0] origin-center transition-transform duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer Area */}
      <footer className="w-full max-w-xl flex flex-col gap-5 relative z-[4500] px-6 pb-8 pointer-events-auto items-center">
        <div className="flex justify-center gap-5 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-32 h-14 disabled:opacity-40">
            <div className="btn-edge bg-red-950 rounded-2xl"></div>
            <div className="btn-surface bg-red-700 border-t border-red-400 rounded-2xl flex items-center justify-center gap-2">
              <Square size={16} fill="currentColor" className="text-white" />
              <span className="text-white text-sm font-black uppercase tracking-widest">Quit</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-44 h-14">
            <div className="btn-edge bg-blue-950 rounded-2xl"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-2xl flex items-center justify-center gap-2">
              <Play size={20} fill="currentColor" className="text-white" />
              <span className="text-white text-base font-black uppercase tracking-widest">Start</span>
            </div>
          </button>
        </div>

        <div className="w-full">
            <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
        </div>
      </footer>

      {/* Modals */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-2xl w-full p-8 rounded-[3rem] shadow-4xl overflow-hidden max-h-[85vh] flex flex-col border border-white/10 bg-slate-950 text-white">
             <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">World Themes</h2>
                <button onClick={() => setShowThemeModal(false)} className="btn-3d w-10 h-10">
                  <div className="btn-edge bg-slate-900 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full flex items-center justify-center"><X size={24} /></div>
                </button>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 overflow-y-auto p-1 custom-scrollbar">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="btn-3d h-40 group">
                        <div className={`btn-edge rounded-3xl ${currentTheme.name === t.name ? 'bg-green-800' : 'bg-black'}`}></div>
                        <div className={`btn-surface flex flex-col rounded-3xl overflow-hidden border-2 ${currentTheme.name === t.name ? 'border-green-400 ring-2 ring-green-500/20' : 'border-white/5 bg-slate-900'}`}>
                            <div className="flex-1 w-full bg-cover bg-center group-hover:scale-110 transition-transform duration-700" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                            <div className="p-3 w-full bg-black/90 flex justify-between items-center border-t border-white/5">
                              <span className="font-black text-[10px] uppercase truncate tracking-[0.1em]">{t.name}</span>
                              {currentTheme.name === t.name && <Check size={16} className="text-green-400" strokeWidth={4} />}
                            </div>
                        </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-sm w-full p-10 rounded-[3rem] bg-slate-950 border border-white/10 text-white shadow-4xl">
              <h2 className="text-3xl font-black mb-8 uppercase italic tracking-tighter">Rulebook</h2>
              <div className="space-y-6 text-sm font-bold text-slate-400">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-sm font-black shadow-lg">1</div>
                  <p className="pt-2 leading-relaxed">Select a marble and jump over its neighbor into an empty hole.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-sm font-black shadow-lg">2</div>
                  <p className="pt-2 leading-relaxed">The jumped marble is vaporized and added to your tray.</p>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-sm font-black shadow-lg">3</div>
                  <p className="pt-2 leading-relaxed">Win by leaving exactly ONE marble on the board!</p>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-10 w-full py-6 btn-3d h-16">
                <div className="btn-edge bg-blue-950 rounded-[2rem]"></div>
                <div className="btn-surface bg-blue-600 rounded-[2rem] text-white text-lg font-black uppercase tracking-[0.2em]">Understood</div>
              </button>
           </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
          <div className="relative max-w-md w-full p-10 rounded-[4rem] bg-slate-950 border border-white/10 text-white shadow-4xl">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Map Selection</h2>
                <button onClick={() => setShowLayoutModal(false)} className="btn-3d w-10 h-10">
                  <div className="btn-edge bg-slate-900 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full flex items-center justify-center"><X size={24} /></div>
                </button>
             </div>
             <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className="btn-3d w-full h-24 block">
                      <div className={`btn-edge rounded-[2rem] ${currentLayout.name === layout.name ? 'bg-green-800' : 'bg-black'}`}></div>
                      <div className={`btn-surface flex items-center justify-between px-8 rounded-[2rem] border-2 ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/40' : 'border-white/5 bg-slate-900'}`}>
                        <div className="text-left">
                          <p className="font-black text-xl uppercase tracking-tight">{layout.name}</p>
                          <p className="text-xs opacity-40 font-black tracking-widest mt-1 uppercase">{layout.description}</p>
                        </div>
                        {currentLayout.name === layout.name && <Check size={28} className="text-green-400" strokeWidth={4} />}
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
