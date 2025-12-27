
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, Trophy, AlertCircle, Volume2, VolumeX, X, Square,
  Timer as TimerIcon, Play, Pause, Palette, Check, LayoutGrid, Sliders
} from 'lucide-react';
import { THEMES, LAYOUTS } from './constants';
import { 
  playMoveSound, 
  playWinSound, 
  playLoseSound, 
  playThemeSound, 
  playSelectSound, 
  playInvalidSound,
  startBackgroundMusic,
  stopBackgroundMusic,
  setMusicVolume
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
  const [showMusicControls, setShowMusicControls] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicPaused, setMusicPaused] = useState(false);
  const [musicVol, setMusicVol] = useState(0.5);
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
    if (status === GameStatus.WON) {
      if (soundEnabled) playWinSound();
      stopBackgroundMusic();
    }
    if (status === GameStatus.LOST) {
      if (soundEnabled) playLoseSound();
      stopBackgroundMusic();
    }
  };

  const startGame = () => {
    setBoard(createInitialBoard(currentLayout.board));
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    setMusicPaused(false);
    if (soundEnabled) {
      playThemeSound();
      startBackgroundMusic();
    }
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
    setMusicPaused(false);
    stopBackgroundMusic();
  };

  const toggleMusic = () => {
    if (musicPaused) {
      setMusicPaused(false);
      if (soundEnabled) startBackgroundMusic();
    } else {
      setMusicPaused(true);
      stopBackgroundMusic();
    }
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setMusicVol(val);
    setMusicVolume(val);
  };

  const handleThemeChange = (theme: Theme) => { setCurrentTheme(theme); setShowThemeModal(false); if (soundEnabled) playSelectSound(); };
  const handleLayoutChange = (layout: GameLayout) => { setCurrentLayout(layout); setBoard(createInitialBoard(layout.board)); setGameStatus(GameStatus.IDLE); setTimer(0); setShowLayoutModal(false); if (soundEnabled) playSelectSound(); };

  useEffect(() => {
    if (!soundEnabled) {
      stopBackgroundMusic();
    } else if (gameStatus === GameStatus.PLAYING && !musicPaused) {
      startBackgroundMusic();
    }
  }, [soundEnabled]);

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-auto custom-scrollbar-prominent ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} pb-2`}>
      {/* Background Layer */}
      <div ref={bgLayerRef} className="fixed inset-[-10%] w-[120%] h-[120%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/40' : 'bg-white/10'}`}></div>
      </div>

      {/* Header */}
      <header className="w-full flex justify-between items-start relative z-[100] shrink-0 pointer-events-none pt-2 px-1">
        {/* Unified Frame for Theme & Layout Buttons */}
        <div className="flex flex-col gap-1.5 p-1.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl pointer-events-auto items-stretch">
           <button onClick={() => setShowThemeModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500 shadow-md hover:bg-pink-400 active:scale-95 transition-all">
             <Palette size={12} className="text-white"/>
             <span className="text-[9px] font-black uppercase text-white whitespace-nowrap">{currentTheme.name}</span>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 shadow-md hover:bg-blue-400 active:scale-95 transition-all">
             <LayoutGrid size={12} className="text-white"/>
             <span className="text-[9px] font-black uppercase text-white whitespace-nowrap">{currentLayout.name}</span>
           </button>
        </div>
        
        <div className="flex items-start gap-1.5 pointer-events-auto pr-1">
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 shadow-xl">
              <TimerIcon size={12} className="text-green-500" />
              <span className="font-mono text-[10px] font-bold text-white">{formatTime(timer)}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 items-center relative">
            <button onClick={() => setShowRules(true)} className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform"><HelpCircle size={18} /></button>
            
            <button 
                onClick={() => setShowMusicControls(!showMusicControls)} 
                className={`p-1.5 rounded-full transition-all backdrop-blur-md border border-white/20 shadow-lg active:scale-95 ${showMusicControls ? 'bg-indigo-600 text-white' : 'bg-black/40 text-white'}`}
            >
                <Sliders size={18} />
            </button>

            {/* Floating Music Control Panel */}
            {showMusicControls && (
                <div className="absolute top-0 right-10 w-48 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl animate-in fade-in zoom-in slide-in-from-right-2 origin-right pointer-events-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Audio Settings</span>
                        <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-white/80 hover:text-white">
                            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                           <button 
                            disabled={!soundEnabled || gameStatus !== GameStatus.PLAYING}
                            onClick={toggleMusic} 
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all active:scale-90"
                           >
                               {musicPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                           </button>
                           <div className="flex-1">
                               <p className="text-[8px] font-bold text-white/50 uppercase mb-1">Music Volume</p>
                               <input 
                                 type="range" 
                                 min="0" 
                                 max="1" 
                                 step="0.01" 
                                 value={musicVol} 
                                 onChange={handleMusicVolumeChange}
                                 className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                               />
                           </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </header>

      {/* Compressed Title Section */}
      <div ref={titleRef} className="text-center relative z-10 pointer-events-none shrink-0 -mt-6">
        <h1 className="text-xl font-black tracking-tighter text-white drop-shadow-2xl leading-none">
          Brainvita<span className={currentTheme.isDark ? "text-blue-400" : "text-fuchsia-400"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm mt-0.5 border border-white/10">
          <span className="text-[8px] font-bold uppercase text-white/70 tracking-widest">Left:</span>
          <span className="text-xs font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 w-full flex justify-center items-center min-h-0 relative z-40 overflow-visible py-2">
         <div className="scale-[0.55] xs:scale-[0.6] sm:scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer Area */}
      <footer className="w-full max-w-lg flex flex-col gap-2 relative z-50 shrink-0 px-4 pointer-events-auto items-center">
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-28 h-12 disabled:opacity-50">
            <div className="btn-edge bg-red-900"></div>
            <div className="btn-surface bg-red-600 border-t border-red-400">
              <Square size={14} fill="currentColor" className="mr-2 text-white" />
              <span className="text-white text-xs font-black uppercase">Stop</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-36 h-12">
            <div className="btn-edge bg-blue-900"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400">
              <Play size={16} fill="currentColor" className="mr-2 text-white" />
              <span className="text-white text-xs font-black uppercase">Start</span>
            </div>
          </button>
        </div>

        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </footer>

      {/* Modals remain the same ... */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/95 backdrop-blur-2xl animate-in fade-in">
          <div className="relative max-w-2xl w-full p-6 rounded-[2rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-white/20 bg-slate-900 text-white">
             <div className="flex justify-between items-center mb-6 shrink-0 px-1">
                <h2 className="text-xl font-black uppercase tracking-tight">Select Theme</h2>
                <button onClick={() => setShowThemeModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={28} /></button>
             </div>
             <div className="grid grid-cols-2 xs:grid-cols-3 gap-3 overflow-y-auto p-1 custom-scrollbar">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className={`relative rounded-xl overflow-hidden text-left border-4 transition-all ${currentTheme.name === t.name ? 'border-green-400 scale-[1.05]' : 'border-transparent'}`}>
                        <div className="h-28 w-full bg-cover bg-center" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                        <div className="p-3 bg-slate-800"><p className="font-bold text-[10px] uppercase truncate">{t.name}</p></div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
           <div className="relative max-w-sm w-full p-8 rounded-[2rem] bg-slate-900 border border-white/20 text-white">
              <button onClick={() => setShowRules(false)} className="absolute top-6 right-6 p-2"><X size={28} /></button>
              <h2 className="text-2xl font-black mb-6">Game Rules</h2>
              <div className="space-y-4 text-sm font-medium text-slate-300">
                <p>Jump over a neighbor marble into an empty hole to remove it. Win by clearing the board until only 1 remains in the center!</p>
              </div>
           </div>
        </div>
      )}

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in fade-in">
          <div className="relative max-w-xs w-full p-10 rounded-[2.5rem] text-center border border-white/20 bg-slate-900 text-white shadow-3xl">
            <h2 className="text-3xl font-black mb-2 uppercase">{gameStatus === GameStatus.WON ? 'You Won!' : 'Game Over'}</h2>
            <p className="mb-8 text-lg font-bold opacity-70">Marbles Left: {marblesRemaining}</p>
            <button onClick={startGame} className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-lg shadow-2xl hover:brightness-110">PLAY AGAIN</button>
          </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="relative max-w-md w-full p-6 rounded-[2rem] bg-slate-900 border border-white/20 text-white">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase">Select Layout</h2>
                <button onClick={() => setShowLayoutModal(false)}><X size={28} /></button>
             </div>
             <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className={`w-full p-5 rounded-2xl text-left border-2 flex items-center justify-between transition-all ${currentLayout.name === layout.name ? 'border-green-400 bg-green-400/20' : 'border-transparent bg-white/5'}`}>
                      <p className="font-black text-base uppercase">{layout.name}</p>
                      {currentLayout.name === layout.name && <Check size={20} className="text-green-400" strokeWidth={4} />}
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
