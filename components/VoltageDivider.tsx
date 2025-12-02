import React, { useState } from 'react';
import { RotateCcw, Calculator, AlertCircle, ArrowRight } from 'lucide-react';

interface DividerState {
  vin: string;
  ra: string;
  rb: string;
  vout: string;
}

export const VoltageDivider: React.FC = () => {
  const [values, setValues] = useState<DividerState>({
    vin: '',
    ra: '',
    rb: '',
    vout: '',
  });
  
  const [calculatedField, setCalculatedField] = useState<keyof DividerState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof DividerState, value: string) => {
    // Reset calculation state if user edits any field
    if (calculatedField) {
        setCalculatedField(null);
        // Keep the value being edited, but allow others to be edited too
        // If the user starts editing, we treat it as a new input session, 
        // but practically we just update the field.
    }
    setError(null);
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setValues({ vin: '', ra: '', rb: '', vout: '' });
    setCalculatedField(null);
    setError(null);
  };

  const calculate = () => {
    const vin = parseFloat(values.vin);
    const ra = parseFloat(values.ra);
    const rb = parseFloat(values.rb);
    const vout = parseFloat(values.vout);

    const inputs = { vin, ra, rb, vout };
    const validInputs = Object.entries(inputs).filter(([_, v]) => !isNaN(v));

    if (validInputs.length !== 3) {
      setError('请准确输入其中任意 3 个数值进行计算');
      return;
    }

    if (isNaN(vout)) {
      // Calculate Vout
      // Vout = Vin * (Rb / (Ra + Rb))
      if (ra + rb === 0) { setError('电阻和不能为 0'); return; }
      const res = vin * (rb / (ra + rb));
      setValues(prev => ({ ...prev, vout: res.toFixed(3) }));
      setCalculatedField('vout');
    } else if (isNaN(ra)) {
      // Calculate Ra
      // Ra = Rb * (Vin / Vout - 1)
      if (vout === 0) { setError('Vout 不能为 0 (无法计算 Ra)'); return; }
      if (Math.abs(vin - vout) < 0.000001) { setError('Vin 不能等于 Vout'); return; }
      const res = rb * (vin / vout - 1);
      if (res < 0) { setError('计算结果 Ra 为负值，请输入合理的电压参数 (Vin 必须大于 Vout)'); return; }
      setValues(prev => ({ ...prev, ra: res.toFixed(3) }));
      setCalculatedField('ra');
    } else if (isNaN(rb)) {
      // Calculate Rb
      // Rb = (Vout * Ra) / (Vin - Vout)
      if (vin === vout) { setError('Vin 不能等于 Vout (分母为 0)'); return; }
      const res = (vout * ra) / (vin - vout);
      if (res < 0) { setError('计算结果 Rb 为负值，请输入合理的电压参数 (Vin 必须大于 Vout)'); return; }
      setValues(prev => ({ ...prev, rb: res.toFixed(3) }));
      setCalculatedField('rb');
    } else if (isNaN(vin)) {
      // Calculate Vin
      // Vin = Vout * (Ra + Rb) / Rb
      if (rb === 0) { setError('Rb 不能为 0'); return; }
      const res = vout * (ra + rb) / rb;
      setValues(prev => ({ ...prev, vin: res.toFixed(3) }));
      setCalculatedField('vin');
    }
  };

  const isReadOnly = (field: keyof DividerState) => {
    return calculatedField === field;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Left: Circuit Diagram */}
      <div className="md:col-span-5 flex flex-col items-center justify-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            电路图示
        </h3>
        
        <div className="relative w-64 h-80 select-none">
            <svg width="100%" height="100%" viewBox="0 0 200 340" className="drop-shadow-sm">
                {/* Wires */}
                <path d="M100 40 L100 80" stroke="#64748b" strokeWidth="3" fill="none" />
                <path d="M100 130 L100 180" stroke="#64748b" strokeWidth="3" fill="none" />
                <path d="M100 230 L100 300" stroke="#64748b" strokeWidth="3" fill="none" />
                
                {/* Vout tap (moved to y=155, middle of Ra and Rb) */}
                <path d="M100 155 L160 155" stroke="#64748b" strokeWidth="3" fill="none" />
                <circle cx="100" cy="155" r="3" fill="#64748b" />
                
                {/* Terminals */}
                <circle cx="100" cy="40" r="4" fill="#64748b" />
                <circle cx="160" cy="155" r="4" fill="#64748b" />
                
                {/* Ground */}
                <path d="M80 300 L120 300" stroke="#64748b" strokeWidth="3" />
                <path d="M86 308 L114 308" stroke="#64748b" strokeWidth="3" />
                <path d="M92 316 L108 316" stroke="#64748b" strokeWidth="3" />

                {/* Resistor Ra */}
                <rect x="85" y="80" width="30" height="50" rx="4" fill="white" stroke="#3b82f6" strokeWidth="3" />
                
                {/* Resistor Rb */}
                <rect x="85" y="180" width="30" height="50" rx="4" fill="white" stroke="#10b981" strokeWidth="3" />
                
                {/* Labels */}
                <text x="100" y="25" textAnchor="middle" className="text-sm font-bold fill-slate-700">Vin (+)</text>
                <text x="175" y="155" alignmentBaseline="middle" className="text-sm font-bold fill-slate-700">Vout</text>
                <text x="100" y="335" textAnchor="middle" className="text-xs fill-slate-400">GND</text>
                
                <text x="65" y="110" textAnchor="end" alignmentBaseline="middle" className="text-sm font-bold fill-blue-600">Ra</text>
                <text x="65" y="210" textAnchor="end" alignmentBaseline="middle" className="text-sm font-bold fill-emerald-600">Rb</text>
            </svg>
        </div>
        
        <div className="mt-8 text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100 w-full">
            <p className="font-semibold text-slate-700 mb-1">分压公式:</p>
            <p className="font-mono text-slate-600">Vout = Vin × [Rb / (Ra + Rb)]</p>
        </div>
      </div>

      {/* Right: Inputs & Controls */}
      <div className="md:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                参数设置
            </h2>
            
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 border border-red-100">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Vin */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-600">Vin (输入电压)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            value={values.vin}
                            readOnly={isReadOnly('vin')}
                            onChange={(e) => handleChange('vin', e.target.value)}
                            className={`w-full pl-4 pr-12 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                isReadOnly('vin') 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                            placeholder="输入数值"
                        />
                        <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">V</div>
                    </div>
                </div>

                {/* Vout */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-600">Vout (输出电压)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            value={values.vout}
                            readOnly={isReadOnly('vout')}
                            onChange={(e) => handleChange('vout', e.target.value)}
                            className={`w-full pl-4 pr-12 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                isReadOnly('vout') 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                            placeholder="输入数值"
                        />
                        <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">V</div>
                    </div>
                </div>

                {/* Ra */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-600">Ra (上拉电阻)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            value={values.ra}
                            readOnly={isReadOnly('ra')}
                            onChange={(e) => handleChange('ra', e.target.value)}
                            className={`w-full pl-4 pr-12 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                isReadOnly('ra') 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                            placeholder="输入数值"
                        />
                        <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">Ω</div>
                    </div>
                </div>

                {/* Rb */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-600">Rb (下拉电阻)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="any"
                            value={values.rb}
                            readOnly={isReadOnly('rb')}
                            onChange={(e) => handleChange('rb', e.target.value)}
                            className={`w-full pl-4 pr-12 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                isReadOnly('rb') 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                            placeholder="输入数值"
                        />
                        <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">Ω</div>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex gap-4">
                <button
                    onClick={calculate}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Calculator size={20} />
                    计算 (Calculate)
                </button>
                <button
                    onClick={handleClear}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors flex items-center gap-2"
                >
                    <RotateCcw size={18} />
                    清除
                </button>
            </div>
            
            <div className="mt-6 text-xs text-slate-400 text-center">
                * 输入任意 3 个参数，自动计算第 4 个参数
            </div>
        </div>
        
        {/* Info Card */}
        <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
             <div className="flex items-start gap-3">
                 <div className="bg-white p-1.5 rounded-full shadow-sm text-blue-500 mt-0.5">
                    <ArrowRight size={16} />
                 </div>
                 <div className="text-sm text-slate-600 space-y-1">
                     <p className="font-semibold text-slate-800">计算说明</p>
                     <p>输入 Vin, Ra, Rb <span className="text-slate-400">→</span> 计算 <span className="font-medium text-indigo-600">Vout</span></p>
                     <p>输入 Vin, Vout, Rb <span className="text-slate-400">→</span> 计算 <span className="font-medium text-blue-600">Ra</span></p>
                     <p>输入 Vin, Vout, Ra <span className="text-slate-400">→</span> 计算 <span className="font-medium text-emerald-600">Rb</span></p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};