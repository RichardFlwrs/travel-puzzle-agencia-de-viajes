'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDownIcon } from '@/assets/svg/ChevronDownIcon';

interface DropdownProps {
  buttonContent: ReactNode;
  children: ReactNode;
  className?: string;
  dropdownClassName?: string;
}

export const Dropdown = ({ 
  buttonContent, 
  children, 
  className = '',
  dropdownClassName = ''
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
      >
        {buttonContent}
        <ChevronDownIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 bg-background border border-border rounded-md shadow-lg overflow-hidden ${dropdownClassName}`}>
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

