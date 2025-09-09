'use client';

import { useRef, useEffect, useState } from 'react';

interface DraggableContentAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export default function DraggableContentArea({
  value,
  onChange,
  placeholder = "Enter template content. Use {variable_name} for dynamic content.",
  rows = 8,
  className = "input-field"
}: DraggableContentAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const variable = e.dataTransfer.getData('text/plain');
    if (variable) {
      insertVariable(variable);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const variableText = `{${variable}}`;
    
    const newValue = before + variableText + after;
    onChange(newValue);

    // Set cursor position after the inserted variable
    setTimeout(() => {
      const newCursorPos = start + variableText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow Ctrl+V for paste
    if (e.ctrlKey && e.key === 'v') {
      return;
    }
    
    // Handle Tab key to insert spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newValue = before + '  ' + after; // Two spaces for tab
        onChange(newValue);
        
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Template Content
      </label>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`${className} resize-vertical ${isDragOver ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
        />
        <div className="absolute top-2 right-2 text-xs text-gray-400 pointer-events-none">
          Drag variables here
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Drag variables from the panel above into this area, or type {`{variable_name}`} manually.
      </p>
    </div>
  );
}
