
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface SelectionModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: T[];
  selectedItem: T;
  onSelect: (item: T) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
}

export function SelectionModal<T extends { name: string }>({
  isOpen,
  onClose,
  title,
  items,
  selectedItem,
  onSelect,
  renderItem
}: SelectionModalProps<T>) {
  const [pendingSelection, setPendingSelection] = useState<T>(selectedItem);

  // Synchronize internal state when modal opens or external selection changes
  useEffect(() => {
    if (isOpen) {
      setPendingSelection(selectedItem);
    }
  }, [isOpen, selectedItem]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(pendingSelection);
    // Note: onSelect in App.tsx typically handles closing the modal too
  };

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-in">
      <div className="relative max-w-2xl w-full h-[85vh] flex flex-col rounded-[3.5rem] bg-slate-950 border-2 border-white/10 text-white shadow-4xl overflow-hidden">
        
        {/* Header */}
        <div className="p-8 flex justify-between items-center border-b border-white/5 bg-white/5">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">SELECT</h2>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90 border border-white/20 hover:bg-white/20"
            aria-label="Close selection"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const isSelected = item.name === pendingSelection.name;
              return (
                <div 
                  key={item.name}
                  onClick={() => setPendingSelection(item)}
                  className={`
                    relative cursor-pointer transition-all duration-300 rounded-[2.5rem] border-2 group
                    ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}
                  `}
                >
                  {renderItem(item, isSelected)}
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                      <Check size={18} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-center">
           <button 
             onClick={handleConfirm}
             className="w-full h-14 bg-blue-600 rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all"
           >
             CONFIRM SELECTION
           </button>
        </div>
      </div>
    </div>
  );
}
