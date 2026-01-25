"use client";

import { useState, type ReactNode } from "react";

interface TooltipProps {
  children: ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-black rounded shadow-lg whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full right-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
} 