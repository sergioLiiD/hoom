import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleFilters({ title, children, defaultOpen = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-lg bg-card overflow-hidden text-sm ${className}`}>
      <div 
        className="p-3 border-b flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-medium flex items-center gap-2 text-sm">
          {title}
        </h3>
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground mr-2">
            {isOpen ? 'Ocultar' : 'Mostrar'}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {isOpen && (
        <div className="p-3">
          {children}
        </div>
      )}
    </div>
  );
}
