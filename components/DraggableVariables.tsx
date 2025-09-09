'use client';

import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

interface DraggableVariablesProps {
  variables: string[];
  onVariablesChange: (variables: string[]) => void;
  onVariableDrag: (variable: string) => void;
}

export default function DraggableVariables({ 
  variables, 
  onVariablesChange, 
  onVariableDrag 
}: DraggableVariablesProps) {
  const [newVariable, setNewVariable] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      onVariablesChange([...variables, newVariable.trim()]);
      setNewVariable('');
      setIsAdding(false);
    }
  };

  const removeVariable = (variableToRemove: string) => {
    onVariablesChange(variables.filter(v => v !== variableToRemove));
  };

  const handleDragStart = (e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.effectAllowed = 'copy';
    onVariableDrag(variable);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addVariable();
    } else if (e.key === 'Escape') {
      setNewVariable('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Template Variables
        </label>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus className="h-4 w-4" />
          <span>Add Variable</span>
        </button>
      </div>

      {/* Add Variable Input */}
      {isAdding && (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter variable name"
            className="flex-1 input-field text-sm"
            autoFocus
          />
          <button
            type="button"
            onClick={addVariable}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setNewVariable('');
              setIsAdding(false);
            }}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Variable Tags */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-200 rounded-lg bg-gray-50">
        {variables.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No variables added yet. Click "Add Variable" to create one.
          </div>
        ) : (
          variables.map((variable) => (
            <div
              key={variable}
              draggable
              onDragStart={(e) => handleDragStart(e, variable)}
              className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm cursor-move hover:bg-blue-200 transition-colors"
            >
              <Tag className="h-3 w-3" />
              <span>{variable}</span>
              <button
                type="button"
                onClick={() => removeVariable(variable)}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-500">
        Drag variables into the content area to insert them. Variables will be wrapped with curly braces: {`{variable_name}`}
      </p>
    </div>
  );
}
