import React, { useState } from 'react';
import { Lightbulb, RotateCcw, Calculator, Info } from 'lucide-react';

interface LEDState {
  sourceVoltage: string;
  ledVoltage: string;
  ledCurrent: string;
}

interface LEDResult {
  resistance: number;
  resistorPower: number;
  ledPower: number;
}

const LED_PRESETS = [
  { name: '红色 (Red)', voltage: '2.0', color: 'bg-red-500' },
  { name: '绿色 (Green)', voltage: '2.1', color: 'bg-green-500' },
  { name: '蓝色 (Blue)', voltage: '3.2', color: 'bg-blue-500' },
  { name: '白色 (White)', voltage: '3.2', color: 'bg-slate-200' },
  { name: '黄色 (Yellow)', voltage: '2.1', color: 'bg-yellow-400' },
];

export const LEDCalculator: React.FC = () => {
  const [values, setValues] = useState<LEDState>({
    sourceVoltage: '5',
    ledVoltage: '2.0',
    ledCurrent: '20', // mA
  });
  
  const [result, setResult] = useState<LEDResult | null>(null);

  const calculate = () => {
    const vs = parseFloat(values.sourceVoltage);
    const vf = parseFloat(values.ledVoltage);
    const if_mA = parseFloat(values.ledCurrent);

    if (isNaN(vs) || isNaN(vf) || isNaN(if_mA)) return;

    if (vs <= vf) {
        alert('电源电压必须大于 LED 导通电压');
        return;
    }

    const if_A = if_mA / 1000;
    const r = (vs - vf) / if_A;
    const p_res = (vs - vf) * if_A;
    const p_led = vf * if_A;

    setResult({
      resistance: r,
      resistorPower: p_res,
      ledPower: p_led
    });
  };

  const handlePreset = (voltage: string) => {
      setValues(prev => ({ ...prev, ledVoltage: voltage }));
      // Auto calculate when preset is clicked if other values are present
      if (values.sourceVoltage && values.ledCurrent) {
          // We need to use the new voltage in calculation, so we can't just call calculate() which uses state
          // A simple effect or just waiting for user to click calculate is safer UI UX
      }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Left Column: Visualization */}
      <div className="md:col-span-5 flex flex-col items-center bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Lightbulb className="text-amber-500" size={24} />
            LED 电路图
        </h3>

        <div className="relative w-64 h-64 select-none mb-4">
             <svg width="100%" height="100%" viewBox="0 0 200 200">
                {/* Wires */}
                <path d="M40 100 L40 40 L80 40" stroke="#64748b" strokeWidth="3" fill="none" />
                <path d="M120 40 L160 40 L160 80" stroke="#64748b" strokeWidth="3" fill="none" />
                <path d="M160 120 L160 160 L40 160 L40 120" stroke="#64748b" strokeWidth="3" fill="none" />
                
                {/* Source V+ */}
                <circle cx="40" cy="80" r="4" fill="#ef4444" />
                <text x="25" y="85" textAnchor="end" className="text-sm font-bold fill-slate-700">Vs +</text>

                {/* Resistor */}
                <rect x="80" y="30" width="40" height="20" rx="2" fill="white" stroke="#3b82f6" strokeWidth="3" />
                <text x="100" y="20" textAnchor="middle" className="text-xs font-bold fill-blue-600">R</text>

                {/* LED Symbol */}
                <path d="M145 80 L175 80 L160 105 Z" fill="none" stroke="#f59e0b" strokeWidth="3" />
                <line x1="145" y1="105" x2="175" y2="105" stroke="#f59e0b" strokeWidth="3" />
                {/* LED Arrows */}
                <path d="M170 90 L185 85" stroke="#f59e0b" strokeWidth="2" />
                <path d="M172 100 L187 95" stroke="#f59e0b" strokeWidth="2" />
                
                <text x="180" y="100" textAnchor="start" className="text-xs font-bold fill-amber-600 ml-2">LED</text>
             </svg>
        </div>
        
        {result && (
            <div className="w-full bg-slate-50 p-4 rounded-xl border border-blue-100">
                <div className="text-center mb-3">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">所需电阻值</p>
                    <p className="text-3xl font-bold text-blue-600 my-1">
                        {result.resistance < 1000 
                            ? `${result.resistance.toFixed(1)} Ω` 
                            : `${(result.resistance/1000).toFixed(2)} kΩ`}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-slate-500 text-xs">电阻功率</p>
                        <p className="font-semibold text-slate-700">{result.resistorPower.toFixed(3)} W</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                        <p className="text-slate-500 text-xs">LED 功率</p>
                        <p className="font-semibold text-slate-700">{result.ledPower.toFixed(3)} W</p>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Right Column: Inputs */}
      <div className="md:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
            参数设置
        </h2>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                    电源电压 (Vs)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={values.sourceVoltage}
                        onChange={(e) => setValues({...values, sourceVoltage: e.target.value})}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                        placeholder="例如: 5, 12, 24"
                    />
                    <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">V</div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                    LED 导通电压 (Vf)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                    {LED_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => handlePreset(preset.voltage)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                                values.ledVoltage === preset.voltage 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${preset.color}`}></span>
                            {preset.name}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <input
                        type="number"
                        value={values.ledVoltage}
                        onChange={(e) => setValues({...values, ledVoltage: e.target.value})}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                        placeholder="例如: 2.0"
                    />
                    <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">V</div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                    LED 工作电流 (If)
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={values.ledCurrent}
                        onChange={(e) => setValues({...values, ledCurrent: e.target.value})}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                        placeholder="通常为 10-20mA"
                    />
                    <div className="absolute right-4 top-3.5 text-slate-400 font-bold text-sm">mA</div>
                </div>
                <p className="mt-1.5 text-xs text-slate-400">大多数标准 LED 的工作电流在 20mA 左右。</p>
            </div>

            <div className="flex gap-4 mt-8">
                <button
                    onClick={calculate}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2"
                >
                    <Calculator size={20} />
                    计算电阻
                </button>
                <button
                    onClick={() => {
                        setValues({ sourceVoltage: '', ledVoltage: '', ledCurrent: '' });
                        setResult(null);
                    }}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50"
                >
                    <RotateCcw size={18} />
                </button>
            </div>
        </div>

        <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-100 flex items-start gap-3">
            <Info className="text-slate-400 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-slate-600">
                <p className="font-semibold mb-1">计算公式:</p>
                <p>R = (Vs - Vf) / If</p>
                <p className="mt-1 text-xs text-slate-400">注意：请选择最接近的标准电阻值（例如 E24 系列），并确保电阻的额定功率大于计算出的电阻功率。</p>
            </div>
        </div>
      </div>
    </div>
  );
};