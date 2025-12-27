import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  HelpCircle, Trophy, AlertCircle, X, Square,
  Timer as TimerIcon, Play, Palette, Check, LayoutGrid,
  Volume2, VolumeX, Heart, Snowflake, Sparkles, Cloud, Droplets
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
      if (boardRef.current) boardRef.current.style.transform = `rotateX(${15 + targetY * -8}deg) rotateY(${targetX * 8}deg)`;
      if (bgLayerRef.current) bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.05)`;
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

  // Optimized Particle Generation
  const particles = useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 12 + 8,
    duration: Math.random() * 12 + 8,
    delay: Math.random() * 10,
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 100,
  })), []);

  const renderParticles = () => {
    const overlay = currentTheme.overlayClass;
    return (
      <div className="particle-container">
        {particles.map((p) => {
          let Content = null;
          let animClass = "particle-fall";
          let extraStyle: any = {
            "--drift-start": "0px",
            "--drift-end": `${p.drift}px`,
            "--max-opacity": currentTheme.isDark ? "0.4" : "0.3",
            left: p.left,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          };

          switch (overlay) {
            case 'overlay-hearts':
              Content = <Heart size={p.size} fill="currentColor" className="text-pink-400 opacity-60" />;
              break;
            case 'overlay-snowflakes':
              Content = <Snowflake size={p.size} className="text-blue-100 opacity-60" />;
              break;
            case 'overlay-fireflies':
              animClass = "particle-rise";
              Content = <div className="rounded-full bg-amber-300 blur-[2px] shadow-[0_0_10px_#fcd34d] glow-pulse" style={{ width: p.size/2, height: p.size/2 }} />;
              break;
            case 'overlay-bubbles':
              animClass = "particle-rise";
              Content = <div className="rounded-full border border-white/40 bg-white/5 backdrop-blur-[1px]" style={{ width: p.size, height: p.size }} />;
              break;
            case 'overlay-crystals':
              Content = <Sparkles size={p.size} className="text-cyan-200 opacity-50" />;
              break;
            case 'overlay-sparkles':
              animClass = "particle-rise";
              Content = <Sparkles size={p.size} className="text-yellow-200 opacity-70" />;
              break;
            case 'overlay-clouds':
              Content = <Cloud size={p.size * 2} fill="currentColor" className="text-white opacity-20" />;
              break;
            default:
              Content = <div className="rounded-full bg-white opacity-20" style={{ width: p.size/4, height: p.size/4 }} />;
          }

          return (
            <div 
              key={p.id} 
              className={`particle ${animClass}`} 
              style={extraStyle}
            >
              <div style={{ transform: `rotate(${p.rotation}deg)` }}>
                {Content}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
    if (soundEnabled) {
      playStopSound();
    }
    stopBackgroundMusic();
  };

  const handleThemeChange = (theme: Theme) => { setCurrentTheme(theme); setShowThemeModal(false); if (soundEnabled) playSelectSound(); };
  const handleLayoutChange = (layout: GameLayout) => { setCurrentLayout(layout); setBoard(createInitialBoard(layout.board)); setGameStatus(GameStatus.IDLE); setTimer(0); setShowLayoutModal(false); if (soundEnabled) playSelectSound(); };

  useEffect(() => {
    if (!soundEnabled) {
      stopBackgroundMusic();
    } else if (gameStatus === GameStatus.PLAYING) {
      startBackgroundMusic();
    }
  }, [soundEnabled, gameStatus]);

  return (
    <div className={`fixed inset-0 w-full flex flex-col items-center justify-between overflow-hidden ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'} pb-2 pt-safe`}>
      {/* Background & Particles Layer */}
      <div ref={bgLayerRef} className="fixed inset-[-10%] w-[120%] h-[120%] z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 bg-slate-900" style={{ backgroundImage: `url(${currentTheme.bgImage})` }}></div>
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/40' : 'bg-white/10'}`}></div>
      </div>
      
      {/* Ambient Theme Particles */}
      {renderParticles()}

      {/* Header - Compact Single Row */}
      <header className="w-full flex justify-between items-center relative z-[100] shrink-0 pointer-events-none pt-2 sm:pt-4 px-3 gap-2">
        <div className="flex flex-row items-center gap-2 p-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 shadow-xl pointer-events-auto">
           <button onClick={() => setShowThemeModal(true)} className="btn-3d h-9 w-24 xs:w-28">
             <div className="btn-edge bg-pink-900 rounded-full"></div>
             <div className="btn-surface bg-pink-600 border-t border-pink-400 rounded-full flex items-center justify-center gap-1">
               <Palette size={12} className="text-white"/>
               <span className="text-[8px] xs:text-[9px] font-black uppercase text-white tracking-widest truncate">{currentTheme.name}</span>
             </div>
           </button>
           <button onClick={() => setShowLayoutModal(true)} className="btn-3d h-9 w-24 xs:w-28">
             <div className="btn-edge bg-cyan-900 rounded-full"></div>
             <div className="btn-surface bg-cyan-600 border-t border-cyan-400 rounded-full flex items-center justify-center gap-1">
               <LayoutGrid size={12} className="text-white"/>
               <span className="text-[8px] xs:text-[9px] font-black uppercase text-white tracking-widest truncate">{currentLayout.name}</span>
             </div>
           </button>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 shadow-lg tray-inset">
              <TimerIcon size={12} className="text-green-500 animate-pulse" />
              <span className="font-mono text-[10px] font-black text-green-500 tracking-widest">{formatTime(timer)}</span>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn-3d w-9 h-9">
              <div className={`btn-edge ${soundEnabled ? 'bg-amber-900' : 'bg-slate-900'} rounded-full`}></div>
              <div className={`btn-surface ${soundEnabled ? 'bg-amber-600 border-amber-400' : 'bg-slate-700 border-slate-500'} border-t rounded-full flex items-center justify-center`}>
                {soundEnabled ? <Volume2 size={16} className="text-white"/> : <VolumeX size={16} className="text-white"/>}
              </div>
            </button>

            <button onClick={() => setShowRules(true)} className="btn-3d w-9 h-9">
              <div className="btn-edge bg-slate-800 rounded-full"></div>
              <div className="btn-surface bg-slate-700 border-t border-slate-500 rounded-full">
                <HelpCircle size={16} className="text-white" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Title Section - Positioned clearly below header but above the main board area */}
      <div ref={titleRef} className="text-center relative z-50 pointer-events-none shrink-0 mt-20 sm:mt-24">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,1)] leading-none italic">
          Brainvita<span className={currentTheme.isDark ? "text-blue-400" : "text-fuchsia-400"}>3D</span>
        </h1>
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md mt-6 sm:mt-8 border border-white/10 shadow-lg">
          <span className="text-[9px] font-bold uppercase text-white/40 tracking-[0.3em]">Marbles Left</span>
          <span className="text-lg sm:text-xl font-black text-white">{marblesRemaining}</span>
        </div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 w-full flex justify-center items-center min-h-0 relative z-40 overflow-visible py-2">
         <div className="scale-[0.42] min-[370px]:scale-[0.48] xs:scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 origin-center transition-transform duration-500">
             <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} />
         </div>
      </main>

      {/* Footer Area */}
      <footer className="w-full max-w-lg flex flex-col gap-3 relative z-50 shrink-0 px-4 pointer-events-auto items-center pb-safe">
        <div className="flex justify-center gap-4 w-full">
          <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d w-28 xs:w-32 h-11 xs:h-12 disabled:opacity-50">
            <div className="btn-edge bg-red-900 rounded-2xl"></div>
            <div className="btn-surface bg-red-600 border-t border-red-400 rounded-2xl flex items-center justify-center gap-2">
              <Square size={14} fill="currentColor" className="text-white" />
              <span className="text-white text-xs font-black uppercase">Stop</span>
            </div>
          </button>
          
          <button onClick={startGame} className="btn-3d w-36 xs:w-40 h-11 xs:h-12">
            <div className="btn-edge bg-blue-900 rounded-2xl"></div>
            <div className="btn-surface bg-blue-600 border-t border-blue-400 rounded-2xl flex items-center justify-center gap-2">
              <Play size={16} fill="currentColor" className="text-white" />
              <span className="text-white text-xs font-black uppercase">Start</span>
            </div>
          </button>
        </div>

        <div className="scale-[0.85] sm:scale-100 origin-center">
          <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
        </div>
      </footer>

      {/* Modals */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-in">
          <div className="relative max-w-2xl w-full p-6 sm:p-8 rounded-[2.5rem] shadow-3xl overflow-hidden max-h-[85vh] flex flex-col border border-white/20 bg-slate-900 text-white">
             <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-black uppercase tracking-tight italic">Themes</h2>
                <button onClick={() => setShowThemeModal(false)} className="btn-3d w-10 h-10">
                  <div className="btn-edge bg-slate-950 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full"><X size={24} /></div>
                </button>
             </div>
             <div className="grid grid-cols-2 xs:grid-cols-3 gap-4 overflow-y-auto p-2 custom-scrollbar">
                {THEMES.map(t => (
                   <button key={t.name} onClick={() => handleThemeChange(t)} className="btn-3d h-32 xs:h-40 group">
                        <div className={`btn-edge rounded-3xl ${currentTheme.name === t.name ? 'bg-green-700' : 'bg-slate-950'}`}></div>
                        <div className={`btn-surface flex flex-col rounded-3xl overflow-hidden border-2 ${currentTheme.name === t.name ? 'border-green-400' : 'border-white/10 bg-slate-800'}`}>
                            <div className="flex-1 w-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: `url(${t.bgImage})` }}></div>
                            <div className="p-2 w-full bg-slate-900 flex justify-between items-center border-t border-white/10">
                              <span className="font-black text-[8px] sm:text-[10px] uppercase truncate tracking-widest">{t.name}</span>
                              {currentTheme.name === t.name && <Check className="text-green-400 w-3 h-3 sm:w-4 sm:h-4" strokeWidth={4} />}
                            </div>
                        </div>
                   </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in">
           <div className="relative max-w-sm w-full p-8 rounded-[2.5rem] bg-slate-900 border border-white/20 text-white shadow-3xl">
              <button onClick={() => setShowRules(false)} className="absolute -top-3 -right-3 btn-3d w-11 h-11">
                <div className="btn-edge bg-red-950 rounded-full"></div>
                <div className="btn-surface bg-red-700 rounded-full"><X size={22} /></div>
              </button>
              <h2 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Rules</h2>
              <div className="space-y-4 text-sm font-bold text-slate-300">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] font-black">1</div>
                  <p className="pt-0.5">Jump one marble over another into a hole.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] font-black">2</div>
                  <p className="pt-0.5">The jumped marble is removed.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] font-black">3</div>
                  <p className="pt-0.5">Finish with only one marble to win!</p>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="mt-8 w-full py-3 btn-3d h-12">
                <div className="btn-edge bg-blue-900 rounded-2xl"></div>
                <div className="btn-surface bg-blue-600 rounded-2xl text-white font-black uppercase tracking-[0.2em] shadow-inner text-xs">Got it!</div>
              </button>
           </div>
        </div>
      )}

      {showLayoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in">
          <div className="relative max-w-md w-full p-6 sm:p-8 rounded-[2.5rem] bg-slate-900 border border-white/20 text-white shadow-3xl">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Layouts</h2>
                <button onClick={() => setShowLayoutModal(false)} className="btn-3d w-10 h-10">
                  <div className="btn-edge bg-slate-950 rounded-full"></div>
                  <div className="btn-surface bg-slate-800 rounded-full"><X size={24} /></div>
                </button>
             </div>
             <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
                {LAYOUTS.map(layout => (
                   <button key={layout.name} onClick={() => handleLayoutChange(layout)} className="btn-3d w-full h-16 block">
                      <div className={`btn-edge rounded-[1.25rem] ${currentLayout.name === layout.name ? 'bg-green-700' : 'bg-slate-950'}`}></div>
                      <div className={`btn-surface flex items-center justify-between px-6 rounded-[1.25rem] border-2 ${currentLayout.name === layout.name ? 'border-green-400 bg-green-950/40' : 'border-white/10 bg-slate-800'}`}>
                        <div className="text-left">
                          <p className="font-black text-sm uppercase tracking-tight">{layout.name}</p>
                          <p className="text-[8px] opacity-60 font-black tracking-widest">{layout.description}</p>
                        </div>
                        {currentLayout.name === layout.name && <Check className="text-green-400 w-5 h-5" strokeWidth={4} />}
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