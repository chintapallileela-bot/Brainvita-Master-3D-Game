
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
      
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -4}deg) rotateY(${targetX * 4}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.05)`;
      if (titleRef.current) titleRef.current.style.transform = `translate(${targetX * 5}px, ${targetY * 5}px) translateZ(50px)`;
      
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
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden perspective-[1500px] ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} font-poppins`}>
      
      {/* Dynamic Background */}
      <div ref={bgLayerRef} className="fixed inset-[-10%] w-[120%] h-[120%] z-0 pointer-events-none transition-transform duration-300 ease-out">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/50' : 'bg-white/10'}`}></div>
      </div>

      {/* Responsive Header Container */}
      <header className="w-full flex justify-between items-start relative z-[5000] shrink-0 pointer-events-none p-4 sm:p-6 lg:px-12">
        <div className="flex flex-col gap-2 pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-10 sm:h-12 w-32 sm:w-44">
             <div className="btn-edge bg-pink-950 rounded-2xl shadow-lg"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-2xl flex items-center justify-start px-3 sm:px-4 gap-2">
               <Palette size={14} className="text-white sm:w-4 sm:h-4"/>
               <span className="text-[9px] sm:text-[11px] font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-10 sm:h-12 w-32 sm:w-44">
             <div className="btn-edge bg-cyan-950 rounded-2xl shadow-lg"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-2xl flex items-center justify-start px-3 sm:px-4 gap-2">
               <LayoutGrid size={14} className="text-white sm:w-4 sm:h-4"/>
               <span className="text-[9px] sm:text-[11px] font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-10 h-10 sm:w-12 sm:h-12">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-800' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-500 border-amber-300' : 'bg-slate-700 border-slate-500'} border-t rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={18} className="text-white sm:w-5 sm:h-5"/> : <VolumeX size={18} className="text-white sm:w-5 sm:h-5"/>}
              </div>
            </button>
            <button onClick={() => setShowRules(true)} className="btn-3d w-10 h-10 sm:w-12 sm:h-12">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full flex items-center justify-center">
                <HelpCircle size={18} className="text-white sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 backdrop-blur-lg border border-white/20 shadow-xl">
              <TimerIcon size={12} className="text-green-400 animate-pulse sm:w-4 sm:h-4" />
              <span className="font-mono text-[10px] sm:text-[12px] font-black text-green-400 tracking-widest">{formatTime(timer)}</span>
          </div>
        </div>
      </header>

      {/* Hero Stats Section */}
      <div ref={titleRef} className="text-center relative z-[4000] pointer-events-none shrink-0 transition-transform duration-300 ease-out">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white drop-shadow-[0_8px_20px_rgba(0,0,0,1)] italic uppercase leading-none">
          BRAINVITA<span className="text-fuchsia-500 ml-1">3D</span>
        </h1>
        <div className="inline-flex items-center gap-3 sm:gap-6 px-5 sm:px-8 py-2 sm:py-3 rounded-full bg-stone-900/90 backdrop-blur-2xl mt-4 border border-white/10 shadow-2xl pointer-events-auto transition-all hover:scale-105">
          <span className="text-[8px] sm:text-[11px] font-black uppercase text-white/50 tracking-[0.3em]">REMAINING</span>
          <span className="text-lg sm:text-2xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Adaptive Board Container */}
      <main className="flex-1 w-full flex justify-center items-center relative z-[3000] p-4 sm:p-8">
         <div className="w-full h-full flex items-center justify-center overflow-visible">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Floating Footer Controls */}
      <footer className="w-full max-w-4xl flex flex-col gap-4 relative z-[4500] shrink-0 px-6 pb-6 lg:pb-12 pointer-events-auto items-center">
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-32 sm:w-40 h-12 sm:h-14 disabled:opacity-40">
            <div className="btn-edge bg-red-950 rounded-2xl"></div>
            <div className="btn-surface bg-rose-500/80 backdrop-blur-md border-t border-rose-300 rounded-2xl flex items-center justify-center gap-2">
              <Square size={14} fill="currentColor" className="text-white sm:w-4 sm:h-4" />
              <span className="text-white text-[10px] sm:text-[12px] font-black uppercase tracking-widest">QUIT</span>
            </div>
          </button>
          <button onClick={startGame} className="btn-3d w-32 sm:w-40 h-12 sm:h-14">
            <div className="btn-edge bg-blue-950 rounded-2xl"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-2xl flex items-center justify-center gap-2">
              <Play size={16} fill="currentColor" className="text-white sm:w-5 sm:h-5" />
              <span className="text-white text-[10px] sm:text-[12px] font-black uppercase tracking-widest">START</span>
            </div>
          </button>
        </div>
        <div className="w-full flex justify-center">
            <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
        </div>
      </footer>

      {/* Enhanced Game Over Modal */}
      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in">
           <div className="relative max-w-xs sm:max-w-sm w-full p-8 sm:p-12 rounded-[2.5rem] bg-slate-900 border border-white/20 text-white shadow-4xl text-center transform scale-95 sm:scale-100">
              <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-6 ${gameStatus === GameStatus.WON ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                {gameStatus === GameStatus.WON ? <Trophy size={36} /> : <X size={36} />}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-2 uppercase italic tracking-tighter">{gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER'}</h2>
              <p className="text-slate-400 font-bold mb-8 text-xs sm:text-sm">{gameStatus === GameStatus.WON ? "You've mastered the logic of the board!" : `Close call! ${marblesRemaining} left on board.`}</p>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                    <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">ELAPSED</p>
                    <p className="text-lg sm:text-xl font-black font-mono">{formatTime(timer)}</p>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center">
                    <p className="text-[8px] sm:text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">CLEARED</p>
                    <p className="text-lg sm:text-xl font-black font-mono">{marblesRemoved}</p>
                 </div>
              </div>

              <button onClick={startGame} className="w-full btn-3d h-14 sm:h-16">
                <div className="btn-edge bg-blue-950 rounded-2xl"></div>
                <div className="btn-surface bg-blue-600 rounded-2xl text-white text-[12px] sm:text-[14px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                  <RefreshCw size={18} />
                  <span>NEW CHALLENGE</span>
                </div>
              </button>
           </div>
        </div>
      )}

      {/* Full-Screen Selectors */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-2xl w-full p-6 sm:p-8 rounded-[2.5rem] border border-white/10 bg-slate-950 text-white overflow-hidden flex flex-col max-h-[85vh]">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-xl font-black uppercase italic tracking-widest">WORLD THEMES</h2>
                <button onClick={() => setShowThemeModal(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"><X size={20}/></button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar p-1 pb-6">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="relative aspect-video sm:aspect-square lg:aspect-video rounded-2xl overflow-hidden border-2 transition-all active:scale-95 group shadow-xl" style={{ borderColor: currentTheme.name === t.name ? '#4ade80' : 'rgba(255,255,255,0.05)' }}>
                      <div className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-1000" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-3 left-4 text-left">
                        <span className="block text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-white shadow-sm">{t.name}</span>
                        {currentTheme.name === t.name && <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">Active</span>}
                      </div>
                      {currentTheme.name === t.name && <div className="absolute top-3 right-3 text-green-400 bg-black/50 p-1.5 rounded-full backdrop-blur-md"><Check size={16}/></div>}
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in">
          <div className="relative max-w-sm sm:max-w-md w-full p-8 rounded-[2.5rem] bg-slate-950 border border-white/10 text-white shadow-4xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-xl font-black uppercase italic tracking-widest">BOARD LAYOUTS</h2>
                <button onClick={() => setShowLayoutModal(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90"><X size={20}/></button>
             </div>
             <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 pb-2">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-5 sm:p-6 rounded-2xl text-left border-2 transition-all active:scale-[0.98] ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}>
                      <div className="flex justify-between items-center">
                        <p className="font-black text-sm sm:text-base uppercase tracking-tight">{layout.name}</p>
                        {currentLayout.name === layout.name && <Check size={18} className="text-green-400"/>}
                      </div>
                      <p className="text-[9px] sm:text-[10px] opacity-40 uppercase tracking-widest mt-1.5 leading-relaxed">{layout.description}</p>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl animate-in">
           <div className="relative max-w-xs sm:max-w-sm w-full p-8 sm:p-10 rounded-[3rem] bg-slate-950 border border-white/10 text-white shadow-4xl">
              <h2 className="text-2xl font-black mb-8 uppercase italic tracking-tighter text-center">HOW TO MASTER</h2>
              <div className="space-y-6 text-sm font-bold text-slate-400">
                <div className="flex gap-4 items-start group">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-black shadow-lg group-hover:scale-110 transition-transform">1</div>
                  <p className="pt-2 leading-relaxed uppercase text-[11px] tracking-wide">Jump one marble over another into an empty hole.</p>
                </div>
                <div className="flex gap-4 items-start group">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-xs font-black shadow-lg group-hover:scale-110 transition-transform">2</div>
                  <p className="pt-2 leading-relaxed uppercase text-[11px] tracking-wide">The jumped marble is vaporized from the board.</p>
                </div>
                <div className="flex gap-4 items-start group">
                  <div className="w-9 h-9 rounded-full bg-fuchsia-600 flex-shrink-0 flex items-center justify-center text-xs font-black shadow-lg group-hover:scale-110 transition-transform">3</div>
                  <p className="pt-2 leading-relaxed uppercase text-[11px] tracking-wide">WIN by leaving exactly <span className="text-white underline underline-offset-4">ONE</span> marble at the finish!</p>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-10 w-full btn-3d h-14">
                <div className="btn-edge bg-blue-950 rounded-2xl"></div>
                <div className="btn-surface bg-blue-600 rounded-2xl text-white text-[12px] font-black uppercase tracking-[0.2em]">LET'S PLAY</div>
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
