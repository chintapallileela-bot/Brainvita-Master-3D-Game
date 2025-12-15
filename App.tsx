import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { RemovedMarbles } from './components/RemovedMarbles';
import { BoardState, CellState, Position, GameStatus, Theme, GameLayout } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  RotateCcw, HelpCircle, Trophy, AlertCircle, Sparkles, Volume2, VolumeX, X, Square,
  Timer as TimerIcon, Play, Palette, Check, LayoutGrid
} from 'lucide-react';
import { TOTAL_MARBLES, THEMES, LAYOUTS } from './constants';
import { playMoveSound, playWinSound, playLoseSound, playThemeSound, playSelectSound, playInvalidSound } from './utils/sound';

const App: React.FC = () => {
  // Initialize with the first theme or random
  const [currentTheme, setCurrentTheme] = useState(() => THEMES[0]);
  const [currentLayout, setCurrentLayout] = useState(() => LAYOUTS[0]);
  
  // Start in IDLE state so timer doesn't run automatically
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  
  const [board, setBoard] = useState<BoardState>(createInitialBoard(LAYOUTS[0].board));
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timer, setTimer] = useState(0);
  
  // Animation State
  const [animatingMove, setAnimatingMove] = useState<{from: Position, to: Position, mid: Position} | null>(null);

  // --- PERFORMANCE OPTIMIZED REFS ---
  const boardRef = useRef<HTMLDivElement>(null);
  const bgLayerRef = useRef<HTMLDivElement>(null);
  const floatLayerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  
  // Mouse position tracker
  const mouseRef = useRef({ x: 0, y: 0 });

  // Timer Effect
  useEffect(() => {
    let interval: number;
    if (gameStatus === GameStatus.PLAYING) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        if(e.touches[0]) {
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    // Animation Loop
    let animationFrameId: number;
    
    const animate = () => {
      const { x, y } = mouseRef.current;
      const targetX = x === 0 ? 0 : (x / window.innerWidth) * 2 - 1;
      const targetY = y === 0 ? 0 : (y / window.innerHeight) * 2 - 1;

      if (boardRef.current) {
        boardRef.current.style.transform = `rotateX(${15 + targetY * -5}deg) rotateY(${targetX * 5}deg)`;
      }

      if (bgLayerRef.current) {
         bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.05)`;
      }

      if (floatLayerRef.current) {
         Array.from(floatLayerRef.current.children).forEach((child: any, i) => {
             const depth = (i % 3) + 1;
             child.style.transform = `translate(${targetX * 15 * depth}px, ${targetY * 15 * depth}px)`;
         });
      }
      
      if (titleRef.current) {
        titleRef.current.style.transform = `translate(${targetX * 8}px, ${targetY * 8}px)`;
      }
      
      if (trayRef.current) {
        trayRef.current.style.transform = `translate(${targetX * 5}px, ${targetY * 5}px)`;
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
  // Calculate total initial marbles for the CURRENT LAYOUT
  const totalLayoutMarbles = useMemo(() => {
     let count = 0;
     currentLayout.board.forEach(row => row.forEach(cell => { if(cell === CellState.MARBLE) count++ }));
     return count;
  }, [currentLayout]);
  
  const marblesRemoved = totalLayoutMarbles - marblesRemaining;

  const bubbles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 15 + 5}px`,
      duration: `${Math.random() * 15 + 10}s`,
      delay: `${Math.random() * 10}s`,
      depth: Math.random()
    }));
  }, []);

  const validDestinations = useMemo(() => {
    if (!selectedPos || animatingMove) return [];
    
    const potentialMoves = [
        { r: selectedPos.row - 2, c: selectedPos.col },
        { r: selectedPos.row + 2, c: selectedPos.col },
        { r: selectedPos.row, c: selectedPos.col - 2 },
        { r: selectedPos.row, c: selectedPos.col + 2 },
    ];

    return potentialMoves.map(p => ({ row: p.r, col: p.c })).filter(dest => 
        isMoveValid(board, selectedPos, dest)
    );
  }, [board, selectedPos, animatingMove]);

  const handleCellClick = (pos: Position) => {
    if (gameStatus !== GameStatus.PLAYING || animatingMove) return;

    const cell = board[pos.row][pos.col];

    if (cell === CellState.MARBLE) {
      if (selectedPos?.row === pos.row && selectedPos?.col === pos.col) {
        setSelectedPos(null);
      } else {
        setSelectedPos(pos);
        if (soundEnabled) playSelectSound();
      }
      return;
    }

    if (cell === CellState.EMPTY && selectedPos) {
      if (isMoveValid(board, selectedPos, pos)) {
        initiateMove(selectedPos, pos);
      } else {
        setSelectedPos(null); 
        if (soundEnabled) playInvalidSound();
      }
    }
  };

  const initiateMove = (from: Position, to: Position) => {
    const midRow = (from.row + to.row) / 2;
    const midCol = (from.col + to.col) / 2;
    const mid = { row: midRow, col: midCol };

    if (soundEnabled) playMoveSound();

    setAnimatingMove({ from, to, mid });
    setSelectedPos(null);

    setTimeout(() => {
      finalizeMove(from, to, mid);
      setAnimatingMove(null);
    }, 150);
  };

  const finalizeMove = (from: Position, to: Position, mid: Position) => {
    const newBoard = board.map(row => [...row]);
    newBoard[from.row][from.col] = CellState.EMPTY;
    newBoard[mid.row][mid.col] = CellState.EMPTY;
    newBoard[to.row][to.col] = CellState.MARBLE;

    setBoard(newBoard);

    const status = checkGameStatus(newBoard);
    setGameStatus(status);

    if (status === GameStatus.WON && soundEnabled) playWinSound();
    if (status === GameStatus.LOST && soundEnabled) playLoseSound();
  };

  const startGame = () => {
    // Reset to the current layout's initial state
    setBoard(createInitialBoard(currentLayout.board));
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    if (soundEnabled) playThemeSound();
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    // Reset to current layout
    setBoard(createInitialBoard(currentLayout.board));
    setSelectedPos(null);
    if (soundEnabled) playLoseSound();
  };

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    setShowThemeModal(false);
    if (soundEnabled) playSelectSound();
  };
  
  const handleLayoutChange = (layout: GameLayout) => {
    setCurrentLayout(layout);
    // Reset board immediately when layout changes
    setBoard(createInitialBoard(layout.board));
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setShowLayoutModal(false);
    if (soundEnabled) playSelectSound();
  };

  return (
    <div 
      className={`min-h-[100dvh] w-full flex flex-col items-center py-2 px-3 font-sans relative overflow-auto ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}
    >
      
      {/* --- 3D Background Layers (Parallax) --- */}
      <div 
        ref={bgLayerRef}
        className="fixed inset-[-5%] w-[110%] h-[110%] transition-all duration-300 ease-out z-0 will-change-transform"
      >
          {/* Base Image Layer */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
            style={{ backgroundImage: `url(${currentTheme.bgImage})`, opacity: 1 }} 
          ></div>

          {/* Animated Gradient Overlay - Very subtle (10%) */}
          <div className={`absolute inset-0 ${currentTheme.bgAnimClass} opacity-10 mix-blend-overlay`}></div>
          
          {/* Readability Layer - Very minimal (5-10%) */}
          <div className={`absolute inset-0 ${currentTheme.isDark ? 'bg-black/10' : 'bg-white/5'}`}></div>
      </div>

      <div className={`overlay-base z-0 fixed ${currentTheme.overlayClass} opacity-40 pointer-events-none`}></div>

      {/* Floating Elements (Particles) */}
      <div ref={floatLayerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden will-change-transform">
         {bubbles.map((b, i) => (
          <div 
            key={i} 
            className="bubble" 
            style={{ 
              left: b.left, 
              width: b.size, 
              height: b.size, 
              animationDuration: b.duration,
              animationDelay: b.delay,
              background: currentTheme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>

      {/* Header Controls */}
      <div className="w-full max-w-xl flex justify-between items-center mb-1 relative z-10 shrink-0 pointer-events-none scale-90 md:scale-100 origin-top">
        <div className="flex items-center gap-2 pointer-events-auto">
           <button 
             onClick={() => setSoundEnabled(!soundEnabled)} 
             className={`p-2.5 rounded-full transition-colors ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} backdrop-blur-md shadow-lg border border-white/10`}
           >
             {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
           </button>
           
           <button 
             onClick={() => setShowThemeModal(true)}
             className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer hover:scale-105 transition-transform ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/60 hover:bg-white/80'} backdrop-blur-md border border-white/20 shadow-lg`}
           >
             <Palette size={16} className={currentTheme.isDark ? "text-yellow-300" : "text-fuchsia-600"}/>
             <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-black drop-shadow-md ${currentTheme.isDark ? 'text-white/90' : 'text-slate-800'}`}>
               {currentTheme.name}
             </span>
           </button>
           
           {/* Layout Selector */}
           <button 
             onClick={() => setShowLayoutModal(true)}
             className={`flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer hover:scale-105 transition-transform ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/60 hover:bg-white/80'} backdrop-blur-md border border-white/20 shadow-lg`}
           >
             <LayoutGrid size={16} className={currentTheme.isDark ? "text-cyan-300" : "text-blue-600"}/>
             <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-black drop-shadow-md ${currentTheme.isDark ? 'text-white/90' : 'text-slate-800'}`}>
               {currentLayout.name}
             </span>
           </button>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${currentTheme.isDark ? 'bg-white/10' : 'bg-white/60'} backdrop-blur-md border border-white/10 shadow-lg`}>
              <TimerIcon size={16} className={currentTheme.isDark ? "text-green-400" : "text-green-600"} />
              <span className={`font-mono text-sm font-bold shadow-black drop-shadow-md min-w-[45px] text-center ${currentTheme.isDark ? 'text-white/90' : 'text-slate-800'}`}>
                {formatTime(timer)}
              </span>
          </div>

          <button 
             onClick={() => setShowRules(true)}
             className={`p-2.5 rounded-full transition-colors ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} backdrop-blur-md shadow-lg border border-white/10`}
          >
            <HelpCircle size={22} />
          </button>
        </div>
      </div>

      {/* Game Title */}
      <div ref={titleRef} className="text-center mb-1 relative z-10 pointer-events-none will-change-transform shrink-0">
        <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] leading-tight">
          Brainvita<span className={currentTheme.isDark ? "text-blue-400" : "text-fuchsia-500"}>3D</span>
        </h1>
        <p className={`text-sm md:text-lg font-bold drop-shadow-lg tracking-wide ${currentTheme.isDark ? 'text-blue-100' : 'text-slate-700'}`}>
          Marbles Left: <span className={`text-xl md:text-2xl ml-1 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>{marblesRemaining}</span>
        </p>
      </div>

      {/* Main Content Area - Flexible Space */}
      <div className="flex-1 w-full flex flex-col justify-center items-center min-h-0 relative z-40">
         {/* 3D Board */}
         <div className="scale-90 md:scale-100 origin-center transition-transform duration-300">
             <Board 
                board={board} 
                selectedPos={selectedPos} 
                validMoves={validDestinations} 
                onCellClick={handleCellClick}
                theme={currentTheme}
                animatingMove={animatingMove}
                boardRef={boardRef}
             />
         </div>
      </div>

      {/* 3D Physical Buttons */}
      <div className="flex gap-4 -mt-16 mb-2 relative z-50 pointer-events-none shrink-0 scale-90 md:scale-100 origin-bottom">
        <button
          onClick={stopGame}
          disabled={gameStatus === GameStatus.IDLE}
          className="btn-3d group relative w-28 h-12 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
        >
          <div className="btn-edge bg-red-900 shadow-xl group-hover:bg-red-800"></div>
          <div className="btn-surface w-full h-full rounded-full bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center gap-2 text-white text-sm font-bold shadow-inner border-t border-red-400 group-hover:from-red-400 group-hover:to-red-500">
            <Square size={14} fill="currentColor" /> STOP
          </div>
        </button>

        <button
          onClick={startGame}
          className="btn-3d group relative w-36 h-12 pointer-events-auto"
        >
          <div className={`btn-edge shadow-xl ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
          <div className={`btn-surface w-full h-full rounded-full bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} flex items-center justify-center gap-2 text-white text-sm font-bold shadow-inner border-t group-hover:brightness-110`}>
            <Play size={16} fill="currentColor" /> START
          </div>
        </button>
      </div>

      {/* Removed Marbles Tray - Compact */}
      <div ref={trayRef} className="relative z-30 w-full will-change-transform pb-4 shrink-0 pointer-events-none">
        <RemovedMarbles count={marblesRemoved} theme={currentTheme} />
      </div>

      {/* Game Over Modal */}
      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
          <div className={`relative max-w-xs w-full p-6 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center transform scale-100 animate-in zoom-in-95 duration-300 border border-white/10 ${currentTheme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent"></div>
            </div>

            {gameStatus === GameStatus.WON ? (
              <div className="mb-4 inline-flex p-4 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 text-white shadow-[0_10px_20px_rgba(234,179,8,0.3)] animate-bounce">
                <Trophy size={48} fill="currentColor" />
              </div>
            ) : (
              <div className="mb-4 inline-flex p-4 rounded-full bg-gradient-to-br from-red-500 to-red-800 text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)]">
                <AlertCircle size={48} />
              </div>
            )}

            <h2 className={`text-4xl font-black mb-2 drop-shadow-md tracking-tight ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
              {gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER'}
            </h2>
            <p className={`mb-2 text-lg font-medium ${currentTheme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {gameStatus === GameStatus.WON 
                ? "You are a Master!" 
                : `Marbles left: ${marblesRemaining}`}
            </p>
            <p className={`mb-6 text-base ${currentTheme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Time: {formatTime(timer)}
            </p>

            <button
              onClick={startGame}
              className="btn-3d group relative w-full h-14"
            >
              <div className={`btn-edge shadow-xl ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
              <div className={`btn-surface w-full h-full rounded-2xl bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} flex items-center justify-center gap-3 text-white text-lg font-bold shadow-inner border-t group-hover:brightness-110`}>
                PLAY AGAIN
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className={`relative max-w-md w-full p-6 rounded-3xl shadow-2xl border border-white/10 ${currentTheme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
              <button 
                onClick={() => setShowRules(false)}
                className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}
              >
                <X size={24} />
              </button>
              
              <h2 className={`text-2xl font-bold mb-4 flex items-center gap-3 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle size={28} className="text-cyan-400" />
                How to Play
              </h2>
              
              <div className={`space-y-3 text-sm leading-relaxed ${currentTheme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <p><strong>Goal:</strong> Eliminate marbles until only <strong>one</strong> remains (center is best!).</p>
                <div className={`p-4 rounded-xl border ${currentTheme.isDark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <ul className="list-disc pl-5 space-y-2">
                    <li>Select a marble to see valid moves.</li>
                    <li>Jump over a neighbor into an empty hole.</li>
                    <li>The jumped marble is removed.</li>
                    <li>No diagonal moves allowed.</li>
                    </ul>
                </div>
              </div>

              <button
                onClick={() => {
                   setShowRules(false);
                   if (gameStatus === GameStatus.IDLE) startGame();
                }}
                className="mt-6 btn-3d group relative w-full h-12"
              >
                <div className={`btn-edge shadow-xl ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
                <div className={`btn-surface w-full h-full rounded-xl bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} flex items-center justify-center gap-2 text-white font-bold shadow-inner border-t group-hover:brightness-110`}>
                    LET'S PLAY
                </div>
              </button>
           </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`relative max-w-2xl w-full p-5 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-white/10 ${currentTheme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
             
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
                   <Palette className="text-fuchsia-500"/> Select Theme
                </h2>
                <button 
                  onClick={() => setShowThemeModal(false)}
                  className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}
                >
                  <X size={24} />
                </button>
             </div>

             {/* Theme Grid */}
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto p-1 custom-scrollbar">
                {THEMES.map(t => {
                   const isActive = currentTheme.name === t.name;
                   return (
                     <button 
                       key={t.name} 
                       onClick={() => handleThemeChange(t)}
                       className={`relative group rounded-xl overflow-hidden text-left transition-all duration-200 border-2 ${isActive ? 'border-green-400 ring-2 ring-green-400/30 scale-[1.02]' : 'border-transparent hover:border-white/30 hover:scale-[1.02]'}`}
                     >
                        {/* Preview Animation (Thumbnail) */}
                        <div 
                          className={`h-24 w-full ${t.bgAnimClass} bg-cover bg-center`}
                          style={{ backgroundImage: `url(${t.bgImage})` }}
                        >
                           <div className={`absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors`}></div>
                           {/* Active Checkmark */}
                           {isActive && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                 <Check size={12} strokeWidth={4} />
                              </div>
                           )}
                        </div>
                        {/* Label */}
                        <div className={`p-2 ${t.isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`}>
                           <p className="font-bold text-xs truncate">{t.name}</p>
                        </div>
                     </button>
                   );
                })}
             </div>

          </div>
        </div>
      )}

      {/* Layout Selector Modal */}
      {showLayoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`relative max-w-lg w-full p-5 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10 ${currentTheme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
             
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
                   <LayoutGrid className="text-cyan-500"/> Select Layout
                </h2>
                <button 
                  onClick={() => setShowLayoutModal(false)}
                  className={`p-2 rounded-full transition-colors ${currentTheme.isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/10 text-slate-800'}`}
                >
                  <X size={24} />
                </button>
             </div>

             {/* Layout List */}
             <div className="space-y-3 overflow-y-auto p-1 custom-scrollbar">
                {LAYOUTS.map(layout => {
                   const isActive = currentLayout.name === layout.name;
                   return (
                     <button 
                       key={layout.name} 
                       onClick={() => handleLayoutChange(layout)}
                       className={`w-full relative group rounded-xl p-4 text-left transition-all duration-200 border-2 flex items-center justify-between ${isActive ? 'border-green-400 bg-green-400/10' : `border-transparent ${currentTheme.isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}`}
                     >
                        <div>
                          <p className={`font-bold text-base ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>{layout.name}</p>
                          <p className={`text-xs mt-1 ${currentTheme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>{layout.description}</p>
                        </div>
                        {isActive && (
                          <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                              <Check size={16} strokeWidth={4} />
                          </div>
                        )}
                     </button>
                   );
                })}
             </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default App;