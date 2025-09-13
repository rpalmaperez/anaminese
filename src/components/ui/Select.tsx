'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

function useSelect() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useSelect must be used within a Select component');
  }
  return context;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select = ({ value = '', onValueChange, disabled, children }: SelectProps) => {
  const [open, setOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        open,
        setOpen: disabled ? () => {} : setOpen,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  placeholder?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    const { open, setOpen } = useSelect();

    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children || <span className="text-gray-500">{placeholder}</span>}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = ({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) => {
  const { value } = useSelect();
  
  if (children) {
    return <>{children}</>;
  }
  
  return value ? <span>{value}</span> : <span className="text-gray-500">{placeholder}</span>;
};

export interface SelectContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useSelect();

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute top-full z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

export interface SelectItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useSelect();
    const isSelected = selectedValue === value;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100',
          isSelected && 'bg-gray-100',
          className
        )}
        onClick={() => onValueChange(value)}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    );
  }
);
SelectItem.displayName = 'SelectItem';

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};