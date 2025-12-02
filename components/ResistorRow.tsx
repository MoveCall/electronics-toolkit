import React from 'react';
import { Trash2 } from 'lucide-react';
import { Resistor, UnitMultiplier } from '../types';

interface ResistorRowProps {
  resistor: Resistor;
  index: number;
  onChange: (id: string, field: keyof Resistor, value: number | UnitMultiplier) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export const ResistorRow: React.FC<ResistorRowProps> = ({ resistor, index, onChange, onRemove, canRemove }) => {
  return (
    <div className="flex items-center gap-2 mb-2 p-2 bg-white rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-300">
      <div className="flex-none w-8 text-center font-mono text-slate-400 font-bold">
        R{index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <input
          type="number"
          min="0"
          step="any"
          value={resistor.value === 0 ? '' : resistor.value}
          onChange={(e) => onChange(resistor.id, 'value', parseFloat(e.target.value) || 0)}
          placeholder="阻值"
          className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
      </div>
      <div className="flex-none w-24">
        <select
          value={resistor.multiplier}
          onChange={(e) => onChange(resistor.id, 'multiplier', Number(e.target.value) as UnitMultiplier)}
          className="w-full px-2 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer"
        >
          <option value={UnitMultiplier.Ohm}>Ω</option>
          <option value={UnitMultiplier.kOhm}>kΩ</option>
          <option value={UnitMultiplier.MOhm}>MΩ</option>
        </select>
      </div>
      <div className="flex-none">
        <button
          onClick={() => onRemove(resistor.id)}
          disabled={!canRemove}
          className={`p-2 rounded-md transition-colors ${
            canRemove
              ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
              : 'text-slate-200 cursor-not-allowed'
          }`}
          title="Remove Resistor"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};