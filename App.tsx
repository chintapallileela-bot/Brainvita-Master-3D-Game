import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Board } from './components/Board';
import { BoardState, CellState, Position, GameStatus } from './types';
import { createInitialBoard, isMoveValid, checkGameStatus, countMarbles } from './utils/gameLogic';
import { 
  RotateCcw, HelpCircle, Trophy, AlertCircle, Sparkles, Volume2, VolumeX, X, Square,
  Fish, Anchor, Shell, Waves, Cloud, Compass, Timer as TimerIcon, Play, ShieldCheck, Mail, Info
} from 'lucide-react';
import { TOTAL_MARBLES, THEMES } from './constants';
import { playMoveSound, playWinSound, playLoseSound, playThemeSound, playSelectSound, playInvalidSound } from './utils/sound';

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [helpTab, setHelpTab] = useState<'rules' | 'legal'>('rules');
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
    let animationFrameId: number;
    const animate = () => {
      const { x, y } = mouseRef.current;
      const targetX = x === 0 ? 0 : (x / window.innerWidth) * 2 - 1;
      const targetY = y === 0 ? 0 : (y / window.innerHeight) * 2 - 1;
      if (boardRef.current) {
        boardRef.current.style.transform = `rotateX(${15 + targetY * -5}deg) rotateY(${targetX * 5}deg)`;
      }
      if (bgLayerRef.current) {
         bgLayerRef.current.style.transform = `translate(${-targetX * 10}px, ${-targetY * 10}px) scale(1.1)`;
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
  const marblesRemoved = TOTAL_MARBLES - marblesRemaining;

  const bubbles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 15 + 5}px`,
      duration: `${Math.random() * 15 + 10}s`,
      delay: `${Math.random() * 10}s`,
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
    setBoard(createInitialBoard());
    setGameStatus(GameStatus.PLAYING);
    setSelectedPos(null);
    setTimer(0);
    let newTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
    if (THEMES.length > 1) {
        while (newTheme.name === currentTheme.name) {
            newTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
        }
    }
    setCurrentTheme(newTheme);
    if (soundEnabled) playThemeSound();
  };

  const stopGame = () => {
    setGameStatus(GameStatus.IDLE);
    setTimer(0);
    setBoard(createInitialBoard());
    setSelectedPos(null);
    if (soundEnabled) playLoseSound();
  };

  return (
    <div className={`h-[100dvh] w-full flex flex-col items-center py-2 px-4 font-sans relative overflow-x-hidden overflow-y-auto ${currentTheme.appBg} ${currentTheme.isDark ? 'text-white' : 'text-slate-900'}`}>
      <div ref={bgLayerRef} className="fixed inset-[-5%] w-[110%] h-[110%] bg-cover bg-center transition-all duration-100 ease-out z-0 will-change-transform" style={{ backgroundImage: currentTheme.backgroundImage ? `url(${currentTheme.backgroundImage})` : 'none' }}></div>
      <div className="fixed inset-0 bg-blue-950/40 mix-blend-multiply z-0 pointer-events-none"></div>
      <div className="caustics-overlay z-0 fixed"></div>
      <div ref={floatLayerRef} className="fixed inset-0 pointer-events-none z-0 overflow-hidden will-change-transform">
         {bubbles.map((b, i) => (
          <div key={i} className="bubble" style={{ left: b.left, width: b.size, height: b.size, animationDuration: b.duration, animationDelay: b.delay }} />
        ))}
        <div className="absolute top-16 left-4 md:left-24 lg:left-32 animate-[bounce_6s_infinite]">
             <div className="transform -rotate-12 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
                 <Fish size={48} className="text-orange-300 drop-shadow-lg" />
             </div>
        </div>
        <div className="absolute bottom-24 right-6 md:right-24 lg:right-40 animate-[bounce_5s_infinite]">
             <div className="transform rotate-12 bg-white/10 p-4 rounded-full backdrop-blur-md border border-white/20 shadow-2xl">
                 <Compass size={42} className="text-red-300 drop-shadow-lg" />
             </div>
        </div>
      </div>

      <div className="w-full max-w-2xl flex justify-between items-center mb-2 relative z-10 shrink-0 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
           <button onClick={() => setSoundEnabled(!soundEnabled)} title="Toggle Sound" className={`p-3 rounded-full transition-colors ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} backdrop-blur-md shadow-lg border border-white/10`}>
             {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
           </button>
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentTheme.isDark ? 'bg-white/10' : 'bg-black/10'} backdrop-blur-md border border-white/10 shadow-lg`}>
             <Sparkles size={16} className="text-yellow-300"/>
             <span className="text-xs font-bold uppercase tracking-widest text-white/90 shadow-black drop-shadow-md">{currentTheme.name}</span>
           </div>
        </div>
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${currentTheme.isDark ? 'bg-white/10' : 'bg-black/10'} backdrop-blur-md border border-white/10 shadow-lg`}>
              <TimerIcon size={18} className="text-green-400" />
              <span className="font-mono font-bold text-white/90 shadow-black drop-shadow-md min-w-[50px] text-center">{formatTime(timer)}</span>
          </div>
          <button onClick={() => { setHelpTab('rules'); setShowHelp(true); }} title="How to play & Legal" className={`p-3 rounded-full transition-colors ${currentTheme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} backdrop-blur-md shadow-lg border border-white/10`}>
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      <div ref={titleRef} className="text-center mb-2 relative z-10 pointer-events-none will-change-transform shrink-0">
        <h1 className="text-5xl md:text-7xl font-black mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
          Brainvita<span className="text-blue-400">3D</span>
        </h1>
        <p className={`text-xl font-bold text-blue-100 drop-shadow-lg tracking-wide`}>
          Marbles: <span className="text-3xl text-white ml-2">{marblesRemaining}</span>
        </p>
      </div>

      <div className="relative z-40 shrink-0 pointer-events-none">
         <Board board={board} selectedPos={selectedPos} validMoves={validDestinations} onCellClick={handleCellClick} theme={currentTheme} animatingMove={animatingMove} boardRef={boardRef} removedCount={marblesRemoved} />
      </div>

      <div className="flex gap-6 -mt-20 mb-6 relative z-50 pointer-events-none shrink-0">
        <button onClick={stopGame} disabled={gameStatus === GameStatus.IDLE} className="btn-3d group relative w-32 h-14 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto">
          <div className="btn-edge bg-red-900 shadow-xl group-hover:bg-red-800"></div>
          <div className="btn-surface w-full h-full rounded-full bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center gap-2 text-white font-bold shadow-inner border-t border-red-400 group-hover:from-red-400 group-hover:to-red-500">
            <Square size={18} fill="currentColor" /> STOP
          </div>
        </button>
        <button onClick={startGame} className="btn-3d group relative w-40 h-14 pointer-events-auto">
          <div className={`btn-edge shadow-xl ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
          <div className={`btn-surface w-full h-full rounded-full bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} flex items-center justify-center gap-2 text-white font-bold shadow-inner border-t group-hover:brightness-110`}>
            <Play size={20} fill="currentColor" /> START
          </div>
        </button>
      </div>

      {(gameStatus === GameStatus.WON || gameStatus === GameStatus.LOST) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in duration-300">
          <div className={`relative max-w-sm w-full p-8 rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center transform scale-100 animate-in zoom-in-95 duration-300 border border-white/10 ${currentTheme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent"></div>
            </div>
            {gameStatus === GameStatus.WON ? (
              <div className="mb-6 inline-flex p-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 text-white shadow-[0_10px_20px_rgba(234,179,8,0.3)] animate-bounce">
                <Trophy size={64} fill="currentColor" />
              </div>
            ) : (
              <div className="mb-6 inline-flex p-6 rounded-full bg-gradient-to-br from-red-500 to-red-800 text-white shadow-[0_10px_20px_rgba(239,68,68,0.3)]">
                <AlertCircle size={64} />
              </div>
            )}
            <h2 className="text-5xl font-black mb-3 text-white drop-shadow-md tracking-tight">{gameStatus === GameStatus.WON ? 'VICTORY!' : 'GAME OVER'}</h2>
            <p className={`mb-2 text-xl font-medium ${currentTheme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>{gameStatus === GameStatus.WON ? "You are a Master!" : `Marbles left: ${marblesRemaining}`}</p>
            <p className={`mb-8 text-lg ${currentTheme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>Time: {formatTime(timer)}</p>
            <button onClick={startGame} className="btn-3d group relative w-full h-16">
              <div className={`btn-edge shadow-xl ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
              <div className={`btn-surface w-full h-full rounded-2xl bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} flex items-center justify-center gap-3 text-white text-xl font-bold shadow-inner border-t group-hover:brightness-110`}>PLAY AGAIN</div>
            </button>
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
           <div className={`relative max-w-md w-full p-0 rounded-[32px] shadow-2xl overflow-hidden border border-white/10 ${currentTheme.isDark ? 'bg-slate-950' : 'bg-white'}`}>
              
              <div className="flex p-2 bg-white/5 backdrop-blur-sm border-b border-white/10">
                <button 
                  onClick={() => setHelpTab('rules')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${helpTab === 'rules' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                >
                  <Info size={16} /> Game Rules
                </button>
                <button 
                  onClick={() => setHelpTab('legal')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-all ${helpTab === 'legal' ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-white'}`}
                >
                  <ShieldCheck size={16} /> Legal & Privacy
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {helpTab === 'rules' ? (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <h2 className="text-3xl font-black mb-6 text-white tracking-tight">How to Play</h2>
                    <div className={`space-y-6 text-sm leading-relaxed ${currentTheme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <p>The goal is to eliminate as many marbles as possible. Ideally, you want to leave just <strong>one marble in the center</strong>.</p>
                      <div className="grid gap-3">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                              <p>Select a marble you wish to move.</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                              <p>Jump over an adjacent marble into an empty hole.</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                              <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                              <p>The marble you jumped over is removed from the board.</p>
                          </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h2 className="text-3xl font-black mb-6 text-white tracking-tight">Legal & Privacy</h2>
                    <div className={`space-y-6 text-xs leading-relaxed ${currentTheme.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      <section>
                        <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                          <ShieldCheck size={16} className="text-green-400" /> Privacy Policy
                        </h3>
                        <p>Brainvita Master 3D respects your privacy. This application is designed as an <strong>offline experience</strong>. We do not collect, process, or transmit any personal data, location information, or device identifiers.</p>
                      </section>

                      <section>
                        <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                          <RotateCcw size={16} className="text-blue-400" /> Data Deletion
                        </h3>
                        <p>Because the app does not collect or store any user data on its servers, there is no personal data to delete. Any locally stored game progress is deleted when you uninstall the application from your device.</p>
                      </section>

                      <section>
                        <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                          <Mail size={16} className="text-red-400" /> Contact Support
                        </h3>
                        <p>For questions regarding the Digital Services Act (DSA) or technical support, please contact the developer via the official Google Play Store contact form or the developer email listed on the store page.</p>
                      </section>

                      <div className="pt-4 border-t border-white/10 italic opacity-50 text-[10px]">
                        Version 1.0.0 | Compliance Ref: EU-DSA-2025-V1
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 pt-0">
                <button onClick={() => { setShowHelp(false); if (gameStatus === GameStatus.IDLE) startGame(); }} className="btn-3d group relative w-full h-16">
                  <div className={`btn-edge shadow-xl ${currentTheme.isDark ? 'bg-cyan-900' : 'bg-blue-900'}`}></div>
                  <div className={`btn-surface w-full h-full rounded-2xl bg-gradient-to-b ${currentTheme.isDark ? 'from-cyan-500 to-cyan-600 border-cyan-400' : 'from-blue-500 to-blue-600 border-blue-400'} flex items-center justify-center gap-2 text-white font-black shadow-inner border-t group-hover:brightness-110`}>
                      {gameStatus === GameStatus.PLAYING ? 'BACK TO GAME' : "START PLAYING"}
                  </div>
                </button>
              </div>

              <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-white/10 text-white transition-colors z-10">
                <X size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
