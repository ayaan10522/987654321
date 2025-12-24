import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SlidePanel: React.FC<SlidePanelProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-full ${sizeClasses[size]} bg-card border-l border-border shadow-2xl animate-slide-in-right flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlidePanel;
