import React, { useState } from 'react';
import { Zap, RotateCcw, Calculator, ArrowRight } from 'lucide-react';

interface OhmsState {
  v: string; // Voltage
  i: string; // Current
  r: string; // Resistance
  p: string; // Power
}

export const OhmsLawCalculator: React.FC = () => {
  const [values, setValues] = useState<OhmsState>({ v: '', i: '', r: '', p: '' });
  const [calculatedKeys, setCalculatedKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof OhmsState, value: string) => {
    // If we are editing, clear previous calculations to avoid confusion
    if (calculatedKeys.length > 0) {
        setCalculatedKeys([]);
        // Keep the current input but clear calculated ones if desired, 
        // or just let user edit. Let's just reset calc state.
    }
    setError(null);
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setValues({ v: '', i: '', r: '', p: '' });
    setCalculatedKeys([]);
    setError(null);
  };

  const calculate = () => {
    // Convert to numbers, keeping track of which are valid inputs
    const inputs: Partial<Record<keyof OhmsState, number>> = {};
    let inputCount = 0;

    (Object.keys(values) as Array<keyof OhmsState>).forEach(k => {
        const val = parseFloat(values[k]);
        if (!isNaN(val)) {
            inputs[k] = val;
            inputCount++;
        }
    });

    if (inputCount !== 2) {
        setError('请输入任意 2 个参数进行计算');
        return;
    }

    let v = inputs.v;
    let i = inputs.i;
    let r = inputs.r;
    let p = inputs.p;
    
    const newValues = { ...values };
    const calculated: string[] = [];

    // Logic based on which 2 are present
    try {
        if (v !== undefined && i !== undefined) {
            r = v / i;
            p = v * i;
            calculated.push('r', 'p');
        } else if (v !== undefined && r !== undefined) {
            i = v / r;
            p = (v * v) / r;
            calculated.push('i', 'p');
        } else if (v !== undefined && p !== undefined) {
            i = p / v;
            r = (v * v) / p;
            calculated.push('i', 'r');
        } else if (i !== undefined && r !== undefined) {
            v = i * r;
            p = i * i * r;
            calculated.push('v', 'p');
        } else if (i !== undefined && p !== undefined) {
            v = p / i;
            r = p / (i * i);
            calculated.push('v', 'r');
        } else if (r !== undefined && p !== undefined) {
            v = Math.sqrt(p * r);
            i = Math.sqrt(p / r);
            calculated.push('v', 'i');
        }

        // Update state
        if (v !== undefined) newValues.v = parseFloat(v.toFixed(4)).toString();
        if (i !== undefined) newValues.i = parseFloat(i.toFixed(4)).toString();
        if (r !== undefined) newValues.r = parseFloat(r.toFixed(4)).toString();
        if (p !== undefined) newValues.p = parseFloat(p.toFixed(4)).toString();

        setValues(newValues);
        setCalculatedKeys(calculated);

    } catch (e) {
        setError('计算错误，请检查数值是否合理');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                欧姆定律计算器
            </h2>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                {/* Voltage */}
                <div className={`p-6 rounded-xl border-2 transition-all ${calculatedKeys.includes('v') ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">电压 (Voltage)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={values.v}
                            onChange={(e) => handleChange('v', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-slate-300 focus:border-blue-500 focus:outline-none py-2 text-slate-800"
                            placeholder="V"
                        />
                        <span className="absolute right-0 bottom-3 text-slate-400 font-mono">V</span>
                    </div>
                </div>

                {/* Current */}
                <div className={`p-6 rounded-xl border-2 transition-all ${calculatedKeys.includes('i') ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">电流 (Current)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={values.i}
                            onChange={(e) => handleChange('i', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-slate-300 focus:border-emerald-500 focus:outline-none py-2 text-slate-800"
                            placeholder="I"
                        />
                        <span className="absolute right-0 bottom-3 text-slate-400 font-mono">A</span>
                    </div>
                </div>

                {/* Resistance */}
                <div className={`p-6 rounded-xl border-2 transition-all ${calculatedKeys.includes('r') ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">电阻 (Resistance)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={values.r}
                            onChange={(e) => handleChange('r', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-slate-300 focus:border-amber-500 focus:outline-none py-2 text-slate-800"
                            placeholder="R"
                        />
                        <span className="absolute right-0 bottom-3 text-slate-400 font-mono">Ω</span>
                    </div>
                </div>

                {/* Power */}
                <div className={`p-6 rounded-xl border-2 transition-all ${calculatedKeys.includes('p') ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">功率 (Power)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={values.p}
                            onChange={(e) => handleChange('p', e.target.value)}
                            className="w-full text-2xl font-bold bg-transparent border-b border-slate-300 focus:border-rose-500 focus:outline-none py-2 text-slate-800"
                            placeholder="P"
                        />
                        <span className="absolute right-0 bottom-3 text-slate-400 font-mono">W</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={calculate}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 text-lg"
                >
                    <Calculator size={24} />
                    计算 (Calculate)
                </button>
                <button
                    onClick={handleClear}
                    className="px-8 py-4 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs text-slate-500">
                <div className="p-2 bg-slate-50 rounded">V = I × R</div>
                <div className="p-2 bg-slate-50 rounded">P = V × I</div>
                <div className="p-2 bg-slate-50 rounded">P = I² × R</div>
                <div className="p-2 bg-slate-50 rounded">P = V² / R</div>
            </div>
        </div>
    </div>
  );
};