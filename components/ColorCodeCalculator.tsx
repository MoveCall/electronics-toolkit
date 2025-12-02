import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';

type BandType = 'digit' | 'multiplier' | 'tolerance';

interface ColorDef {
  name: string;
  cnName: string;
  hex: string;
  textClass: string; // text color for contrast
  value?: number;
  multiplier?: number;
  tolerance?: number;
}

const COLORS: Record<string, ColorDef> = {
  black:  { name: 'Black', cnName: '黑', hex: '#000000', textClass: 'text-white', value: 0, multiplier: 1 },
  brown:  { name: 'Brown', cnName: '棕', hex: '#8B4513', textClass: 'text-white', value: 1, multiplier: 10, tolerance: 1 },
  red:    { name: 'Red', cnName: '红', hex: '#DC2626', textClass: 'text-white', value: 2, multiplier: 100, tolerance: 2 },
  orange: { name: 'Orange', cnName: '橙', hex: '#F97316', textClass: 'text-white', value: 3, multiplier: 1000 },
  yellow: { name: 'Yellow', cnName: '黄', hex: '#FACC15', textClass: 'text-black', value: 4, multiplier: 10000 },
  green:  { name: 'Green', cnName: '绿', hex: '#16A34A', textClass: 'text-white', value: 5, multiplier: 100000, tolerance: 0.5 },
  blue:   { name: 'Blue', cnName: '蓝', hex: '#2563EB', textClass: 'text-white', value: 6, multiplier: 1000000, tolerance: 0.25 },
  violet: { name: 'Violet', cnName: '紫', hex: '#7C3AED', textClass: 'text-white', value: 7, multiplier: 10000000, tolerance: 0.1 },
  grey:   { name: 'Grey', cnName: '灰', hex: '#64748B', textClass: 'text-white', value: 8, multiplier: 100000000, tolerance: 0.05 },
  white:  { name: 'White', cnName: '白', hex: '#FFFFFF', textClass: 'text-black', value: 9, multiplier: 1000000000 },
  gold:   { name: 'Gold', cnName: '金', hex: '#D4AF37', textClass: 'text-white', multiplier: 0.1, tolerance: 5 },
  silver: { name: 'Silver', cnName: '银', hex: '#C0C0C0', textClass: 'text-black', multiplier: 0.01, tolerance: 10 },
};

// Order for selectors
const COLOR_KEYS = [
  'black', 'brown', 'red', 'orange', 'yellow', 
  'green', 'blue', 'violet', 'grey', 'white', 
  'gold', 'silver'
];

export const ColorCodeCalculator: React.FC = () => {
  const [bands, setBands] = useState<number>(4);
  const [colors, setColors] = useState<string[]>(['brown', 'black', 'red', 'gold']); // 1k 5%

  const handleModeChange = (newBands: number) => {
    // Atomic update simulation: update both states at once to minimize render tearing
    setBands(newBands);
    if (newBands === 4) {
      setColors(['brown', 'black', 'red', 'gold']);
    } else {
      setColors(['brown', 'black', 'black', 'brown', 'brown']);
    }
  };

  const updateColor = (index: number, colorKey: string) => {
    const newColors = [...colors];
    newColors[index] = colorKey;
    setColors(newColors);
  };

  const calculate = () => {
    let resistance = 0;
    let tolerance = 0;

    // Strict bounds check
    if (bands === 4 && colors.length >= 4) {
      const d1 = COLORS[colors[0]]?.value || 0;
      const d2 = COLORS[colors[1]]?.value || 0;
      const mult = COLORS[colors[2]]?.multiplier || 0;
      tolerance = COLORS[colors[3]]?.tolerance || 20;
      resistance = (d1 * 10 + d2) * mult;
    } else if (bands === 5 && colors.length >= 5) {
      const d1 = COLORS[colors[0]]?.value || 0;
      const d2 = COLORS[colors[1]]?.value || 0;
      const d3 = COLORS[colors[2]]?.value || 0;
      const mult = COLORS[colors[3]]?.multiplier || 0;
      tolerance = COLORS[colors[4]]?.tolerance || 20;
      resistance = (d1 * 100 + d2 * 10 + d3) * mult;
    }

    return { resistance, tolerance };
  };

  const result = calculate();

  const formatResistance = (ohms: number) => {
    if (ohms >= 1e9) return `${(ohms / 1e9).toFixed(2).replace(/\.00$/, '')} GΩ`;
    if (ohms >= 1e6) return `${(ohms / 1e6).toFixed(2).replace(/\.00$/, '')} MΩ`;
    if (ohms >= 1e3) return `${(ohms / 1e3).toFixed(2).replace(/\.00$/, '')} kΩ`;
    return `${ohms.toFixed(2).replace(/\.00$/, '')} Ω`;
  };

  const isValidColor = (colorKey: string, position: number, totalBands: number) => {
    const def = COLORS[colorKey];
    if (position === totalBands - 1) return def.tolerance !== undefined;
    if (position === totalBands - 2) return def.multiplier !== undefined;
    return def.value !== undefined;
  };

  const BandSelector = ({ index, label }: { index: number, label: string }) => (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-2">
        {COLOR_KEYS.map((key) => {
          if (!isValidColor(key, index, bands)) return null;
          const def = COLORS[key];
          const isSelected = colors[index] === key;
          
          return (
            <button
              key={key}
              onClick={() => updateColor(index, key)}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center shadow-sm ${
                isSelected 
                  ? 'border-slate-800 scale-110 ring-2 ring-blue-200 ring-offset-1' 
                  : 'border-transparent hover:scale-105 hover:border-slate-200'
              }`}
              style={{ backgroundColor: def.hex }}
              title={`${def.cnName} (${def.name})`}
            >
              {isSelected && <Check size={14} className={def.textClass} strokeWidth={3} />}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-1 h-6 bg-pink-500 rounded-full"></div>
              色环电阻计算器
           </h2>
           <div className="flex bg-slate-100 p-1 rounded-lg">
             <button
               onClick={() => handleModeChange(4)}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${bands === 4 ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               4 环电阻 (常用)
             </button>
             <button
               onClick={() => handleModeChange(5)}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${bands === 5 ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               5 环电阻 (精密)
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
            
            <div className="lg:col-span-5 bg-slate-50 p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100 relative">
               
               <div className="relative w-full max-w-sm h-48 select-none my-8 drop-shadow-xl">
                  <svg width="100%" height="100%" viewBox="0 0 400 150">
                    <line x1="0" y1="75" x2="400" y2="75" stroke="#94a3b8" strokeWidth="8" />
                    <path 
                      d="M 50 40 Q 50 20 70 20 L 330 20 Q 350 20 350 40 L 350 110 Q 350 130 330 130 L 70 130 Q 50 130 50 110 Z" 
                      fill="#fde047" 
                      stroke="#d4d4d8"
                      strokeWidth="1"
                      className="fill-[#e8d5b5]"
                    />

                    {colors.map((colorKey, i) => {
                       // Safety: Ensure we don't render if index is out of bounds relative to mode
                       if (i >= bands) return null;

                       let xPos = 0;
                       if (bands === 4) {
                         const positions = [90, 130, 200, 310];
                         xPos = positions[i] || 0;
                       } else {
                         const positions = [80, 120, 160, 220, 310];
                         xPos = positions[i] || 0;
                       }

                       return (
                         <rect
                           key={i}
                           x={xPos}
                           y="20"
                           width={bands === 4 && i === 2 ? 20 : 15}
                           height="110"
                           fill={COLORS[colorKey]?.hex || '#000'}
                           opacity="0.9"
                         />
                       );
                    })}
                    
                    <path 
                      d="M 60 30 L 340 30" 
                      stroke="white" 
                      strokeWidth="4" 
                      strokeOpacity="0.3" 
                      strokeLinecap="round" 
                    />
                  </svg>
               </div>

               <div className="text-center w-full bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">阻值 (Resistance)</p>
                  <div className="text-4xl font-bold text-slate-800 mb-2 font-mono">
                     {formatResistance(result.resistance)}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-sm font-semibold text-slate-600">
                     <span>误差 (Tolerance):</span>
                     <span className={result.tolerance <= 1 ? "text-emerald-600" : "text-amber-600"}>
                       ±{result.tolerance}%
                     </span>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-7 p-6 md:p-8 space-y-6">
               <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                 <Palette size={18} />
                 配置色环
               </h3>
               
               <div className="space-y-6">
                 <BandSelector index={0} label="第 1 环 (有效数字 1)" />
                 
                 <BandSelector index={1} label="第 2 环 (有效数字 2)" />
                 
                 {bands === 5 && (
                    <BandSelector index={2} label="第 3 环 (有效数字 3)" />
                 )}

                 <BandSelector 
                    index={bands === 4 ? 2 : 3} 
                    label={`第 ${bands === 4 ? 3 : 4} 环 (倍率 Multiplier)`} 
                 />

                 <BandSelector 
                    index={bands === 4 ? 3 : 4} 
                    label={`第 ${bands === 4 ? 4 : 5} 环 (误差 Tolerance)`} 
                 />
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-100 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                     <span className="w-4 h-4 rounded-full bg-yellow-400 inline-block"></span> 4 环电阻：前两位数字 × 倍率
                  </p>
                  <p className="flex items-center gap-2 mt-2">
                     <span className="w-4 h-4 rounded-full bg-blue-500 inline-block"></span> 5 环电阻：前三位数字 × 倍率 (通常用于精密电阻)
                  </p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};