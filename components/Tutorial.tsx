
import React, { useState } from 'react';
import { X, ChevronRight, Play, Info } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  targetId?: string;
  icon: React.ReactNode;
}

interface TutorialProps {
  onComplete: () => void;
}

export const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      title: "WELCOME MASTER",
      description: "Welcome to Brainvita 3D. A classic logic puzzle designed to sharpen your mind.",
      icon: <Info className="text-blue-400" size={32} />
    },
    {
      title: "THE OBJECTIVE",
      description: "Jump marbles over neighbors into empty holes. The goal is to leave exactly ONE marble remaining.",
      targetId: "cell-3-3",
      icon: <ChevronRight className="text-emerald-400" size={32} />
    },
    {
      title: "CUSTOMIZE",
      description: "Use these buttons to switch between beautiful 3D themes and various board layouts.",
      targetId: "theme-layout-controls",
      icon: <ChevronRight className="text-pink-400" size={32} />
    },
    {
      title: "READY TO START?",
      description: "Press START to begin your first challenge. Good luck, Master!",
      targetId: "start-button",
      icon: <Play className="text-blue-400" size={32} fill="currentColor" />
    }
  ];

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[30000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in">
      <div className="relative max-w-sm w-full p-8 rounded-[3rem] bg-slate-950 border-2 border-white/20 text-white shadow-4xl flex flex-col items-center text-center">
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
          aria-label="Skip tutorial"
        >
          <X size={24} />
        </button>

        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 shadow-inner">
          {step.icon}
        </div>

        <h2 className="text-2xl font-black italic tracking-tighter mb-4 uppercase leading-none">
          {step.title}
        </h2>
        
        <p className="text-sm font-bold text-slate-400 leading-relaxed uppercase tracking-widest mb-10">
          {step.description}
        </p>

        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'}`} 
            />
          ))}
        </div>

        <button 
          onClick={next}
          className="w-full h-16 bg-blue-600 rounded-[2rem] text-white text-sm font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {currentStep === steps.length - 1 ? 'GET STARTED' : 'NEXT STEP'}
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
