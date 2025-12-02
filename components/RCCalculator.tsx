import React, { useState } from 'react';
import { Activity, RotateCcw, Calculator, ArrowRight, Waves, Timer, LineChart } from 'lucide-react';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';

interface RCState {
  r: string; // Resistance value
  rUnit: number; // Multiplier
  c: string; // Capacitance value
  cUnit: number; // Multiplier
  f: string; // Frequency value
  fUnit: number; // Multiplier
}

interface DelayState {
    vin: string; // Supply Voltage
    vtarget: string; // Target Threshold Voltage
    r: string; 
    rUnit: number;
    c: string;
    cUnit: number;
    t: string; // Time
    tUnit: number; // 1 (s), 0.001 (ms), 0.000001 (us)
}

const UNITS = {
  R: [
    { label: 'Ω', value: 1 },
    { label: 'kΩ', value: 1e3 },
    { label: 'MΩ', value: 1e6 },
  ],
  C: [
    { label: 'pF', value: 1e-12 },
    { label: 'nF', value: 1e-9 },
    { label: 'µF', value: 1e-6 },
    { label: 'mF', value: 1e-3 },
  ],
  F: [
    { label: 'Hz', value: 1 },
    { label: 'kHz', value: 1e3 },
    { label: 'MHz', value: 1e6 },
  ],
  T: [
      { label: 's', value: 1 },
      { label: 'ms', value: 1e-3 },
      { label: 'µs', value: 1e-6 },
  ]
};

export const RCCalculator: React.FC = () => {
  const [tab, setTab] = useState<'filter' | 'delay'>('filter');

  // Filter Mode State
  const [values, setValues] = useState<RCState>({
    r: '', rUnit: 1000,
    c: '', cUnit: 0.000001,
    f: '', fUnit: 1,
  });
  const [result, setResult] = useState<{ tau: number; fc: number } | null>(null);

  // Delay Mode State
  const [delayValues, setDelayValues] = useState<DelayState>({
      vin: '5',
      vtarget: '3.16', // ~63.2% default
      r: '10', rUnit: 1000,
      c: '100', cUnit: 0.000001,
      t: '', tUnit: 1
  });
  const [delayResult, setDelayResult] = useState<{ t: number, tau: number } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // --- Filter Logic ---
  const handleFilterChange = (field: keyof RCState, value: string | number) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setResult(null);
    setError(null);
  };

  const calculateFilter = () => {
    const rVal = parseFloat(values.r);
    const cVal = parseFloat(values.c);
    const fVal = parseFloat(values.f);

    const r = !isNaN(rVal) ? rVal * values.rUnit : NaN;
    const c = !isNaN(cVal) ? cVal * values.cUnit : NaN;
    const f = !isNaN(fVal) ? fVal * values.fUnit : NaN;

    if (!isNaN(r) && !isNaN(c)) {
      const tau = r * c;
      const fc = 1 / (2 * Math.PI * r * c);
      setResult({ tau, fc });
      
      let bestFUnit = 1;
      if (fc >= 1e6) bestFUnit = 1e6;
      else if (fc >= 1e3) bestFUnit = 1e3;
      setValues(prev => ({ ...prev, f: (fc / bestFUnit).toFixed(2), fUnit: bestFUnit }));
    }
    else if (!isNaN(r) && !isNaN(f)) {
      if (f === 0) { setError("频率不能为 0"); return; }
      const cCalc = 1 / (2 * Math.PI * r * f);
      const tau = r * cCalc;
      setResult({ tau, fc: f });
      
      let bestCUnit = 1e-6;
      if (cCalc < 1e-9) bestCUnit = 1e-12;
      else if (cCalc < 1e-6) bestCUnit = 1e-9;
      else if (cCalc < 1e-3) bestCUnit = 1e-6;
      else bestCUnit = 1e-3;

      setValues(prev => ({ ...prev, c: (cCalc / bestCUnit).toFixed(2), cUnit: bestCUnit }));
    }
    else if (!isNaN(c) && !isNaN(f)) {
      if (f === 0) { setError("频率不能为 0"); return; }
      if (c === 0) { setError("电容不能为 0"); return; }
      const rCalc = 1 / (2 * Math.PI * c * f);
      const tau = rCalc * c;
      setResult({ tau, fc: f });

      let bestRUnit = 1;
      if (rCalc >= 1e6) bestRUnit = 1e6;
      else if (rCalc >= 1e3) bestRUnit = 1e3;

      setValues(prev => ({ ...prev, r: (rCalc / bestRUnit).toFixed(2), rUnit: bestRUnit }));
    } else {
      setError("请输入任意 2 个参数进行计算");
    }
  };

  // --- Delay Logic ---
  const handleDelayChange = (field: keyof DelayState, value: string | number) => {
      setDelayValues(prev => ({ ...prev, [field]: value }));
      setError(null);
  };

  const calculateDelay = () => {
      const vin = parseFloat(delayValues.vin);
      const vtarget = parseFloat(delayValues.vtarget);
      const r = parseFloat(delayValues.r) * delayValues.rUnit;
      const c = parseFloat(delayValues.c) * delayValues.cUnit;
      const t = parseFloat(delayValues.t) * delayValues.tUnit;

      const hasR = !isNaN(r) && r > 0;
      const hasC = !isNaN(c) && c > 0;
      const hasVin = !isNaN(vin);
      const hasTarget = !isNaN(vtarget);
      const hasTime = !isNaN(t) && t > 0;

      if (!hasVin) { setError("请输入电源电压 (Vin)"); return; }
      if (!hasR || !hasC) { setError("请输入电阻和电容值"); return; }

      const tau = r * c;

      // Mode 1: Calculate Time (if Time is empty or user wants to recalc time based on Target)
      // Logic: If user input R, C, Vin, Vtarget -> Calculate Time.
      if (hasTarget && !hasTime) {
          if (vtarget >= vin) { setError("目标电压必须小于电源电压 (充电模式)"); return; }
          if (vtarget <= 0) { setError("目标电压必须大于 0"); return; }
          // Vc = Vin(1 - e^-t/tau)  =>  e^-t/tau = 1 - Vc/Vin  => -t/tau = ln(1 - Vc/Vin) => t = -tau * ln(1 - Vc/Vin)
          const ratio = vtarget / vin;
          const timeCalc = -tau * Math.log(1 - ratio);
          
          let bestTUnit = 1;
          if (timeCalc < 1e-3) bestTUnit = 1e-6;
          else if (timeCalc < 1) bestTUnit = 1e-3;

          setDelayValues(prev => ({
              ...prev,
              t: (timeCalc / bestTUnit).toFixed(3),
              tUnit: bestTUnit
          }));
          setDelayResult({ t: timeCalc, tau });
      }
      // Mode 2: Calculate Voltage (if Time is entered, calculate V at that time)
      else if (hasTime) {
          const vCalc = vin * (1 - Math.exp(-t / tau));
          setDelayValues(prev => ({ ...prev, vtarget: vCalc.toFixed(3) }));
          setDelayResult({ t: t, tau });
      }
      else {
           // Default calculate Tau only if enough info
           setDelayResult({ t: tau, tau }); // Just show 1 tau
      }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 1e-6) return `${(seconds * 1e9).toFixed(2)} ns`;
    if (seconds < 1e-3) return `${(seconds * 1e6).toFixed(2)} µs`;
    if (seconds < 1) return `${(seconds * 1e3).toFixed(2)} ms`;
    return `${seconds.toFixed(3)} s`;
  };

  // --- Generate Chart Data for Delay ---
  const generateDelayChart = () => {
      if (!delayResult) return [];
      const { tau } = delayResult;
      const vin = parseFloat(delayValues.vin) || 5;
      const data = [];
      const steps = 30;
      const maxTime = tau * 5; // 5 Tau is fully charged
      
      for (let i = 0; i <= steps; i++) {
          const t = (maxTime / steps) * i;
          const v = vin * (1 - Math.exp(-t / tau));
          data.push({
              time: t,
              voltage: v,
              label: formatTime(t)
          });
      }
      return data;
  };

  return (
    <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             {/* Tabs Header */}
             <div className="flex border-b border-slate-100">
                <button 
                    onClick={() => setTab('filter')}
                    className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 transition-colors ${tab === 'filter' ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Waves size={18} />
                    滤波器 / 截止频率
                </button>
                <button 
                     onClick={() => setTab('delay')}
                     className={`flex-1 py-4 text-center font-bold text-sm flex items-center justify-center gap-2 transition-colors ${tab === 'delay' ? 'bg-cyan-50 text-cyan-700 border-b-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Timer size={18} />
                    RC 延时 / 充放电
                </button>
             </div>

             <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* ------------------------ FILTER MODE ------------------------ */}
                {tab === 'filter' && (
                    <>
                    <div className="md:col-span-5 flex flex-col items-center">
                        <div className="relative w-64 h-48 select-none mb-6">
                            <svg width="100%" height="100%" viewBox="0 0 200 160">
                                <path d="M20 40 L60 40" stroke="#64748b" strokeWidth="3" />
                                <circle cx="20" cy="40" r="3" fill="#64748b" />
                                <text x="20" y="25" textAnchor="middle" className="text-xs font-bold fill-slate-500">Vin</text>
                                <rect x="60" y="30" width="40" height="20" rx="2" fill="white" stroke="#3b82f6" strokeWidth="3" />
                                <text x="80" y="20" textAnchor="middle" className="text-xs font-bold fill-blue-600">R</text>
                                <path d="M100 40 L160 40" stroke="#64748b" strokeWidth="3" />
                                <circle cx="160" cy="40" r="3" fill="#64748b" />
                                <text x="160" y="25" textAnchor="middle" className="text-xs font-bold fill-slate-500">Vout</text>
                                <path d="M130 40 L130 70" stroke="#64748b" strokeWidth="3" />
                                <line x1="115" y1="70" x2="145" y2="70" stroke="#06b6d4" strokeWidth="3" />
                                <line x1="115" y1="80" x2="145" y2="80" stroke="#06b6d4" strokeWidth="3" />
                                <text x="155" y="80" textAnchor="start" className="text-xs font-bold fill-cyan-600">C</text>
                                <path d="M130 80 L130 110" stroke="#64748b" strokeWidth="3" />
                                <path d="M115 110 L145 110" stroke="#64748b" strokeWidth="3" />
                                <path d="M120 116 L140 116" stroke="#64748b" strokeWidth="3" />
                                <path d="M126 122 L134 122" stroke="#64748b" strokeWidth="3" />
                            </svg>
                        </div>

                        {result && (
                            <div className="w-full space-y-3">
                                <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 text-center">
                                    <p className="text-xs uppercase font-bold text-cyan-700 tracking-wider mb-1">截止频率 (-3dB)</p>
                                    <p className="text-2xl font-bold text-cyan-700">
                                        {result.fc < 1000 ? `${result.fc.toFixed(1)} Hz` : 
                                        result.fc < 1000000 ? `${(result.fc/1000).toFixed(2)} kHz` :
                                        `${(result.fc/1000000).toFixed(2)} MHz`}
                                    </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs uppercase font-bold text-slate-500">时间常数 (τ)</span>
                                        <span className="font-mono font-bold text-slate-700">{formatTime(result.tau)}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-7 space-y-6">
                        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>}
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">电阻 (R)</label>
                            <div className="flex gap-2">
                                <input type="number" value={values.r} onChange={(e) => handleFilterChange('r', e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="输入阻值" />
                                <select value={values.rUnit} onChange={(e) => handleFilterChange('rUnit', Number(e.target.value))} className="w-24 px-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                                    {UNITS.R.map(u => <option key={u.label} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">电容 (C)</label>
                            <div className="flex gap-2">
                                <input type="number" value={values.c} onChange={(e) => handleFilterChange('c', e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="输入容值" />
                                <select value={values.cUnit} onChange={(e) => handleFilterChange('cUnit', Number(e.target.value))} className="w-24 px-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                                    {UNITS.C.map(u => <option key={u.label} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="relative flex items-center py-2"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold uppercase">或输入频率反推</span><div className="flex-grow border-t border-slate-100"></div></div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">截止频率 (fc)</label>
                            <div className="flex gap-2">
                                <input type="number" value={values.f} onChange={(e) => handleFilterChange('f', e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="输入频率" />
                                <select value={values.fUnit} onChange={(e) => handleFilterChange('fUnit', Number(e.target.value))} className="w-24 px-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                                    {UNITS.F.map(u => <option key={u.label} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button onClick={calculateFilter} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-cyan-200 transition-all flex items-center justify-center gap-2">
                                <Calculator size={20} /> 计算
                            </button>
                            <button onClick={() => { setValues({r:'', rUnit:1000, c:'', cUnit:1e-6, f:'', fUnit:1}); setResult(null); setError(null); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50">
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>
                    </>
                )}


                {/* ------------------------ DELAY MODE ------------------------ */}
                {tab === 'delay' && (
                    <>
                    <div className="md:col-span-12 lg:col-span-5 flex flex-col">
                        {/* Chart Area */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 h-64 w-full mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={delayResult ? generateDelayChart() : []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="time" 
                                        tickFormatter={(val) => formatTime(val)} 
                                        type="number" 
                                        domain={[0, 'dataMax']} 
                                        tick={{fontSize: 10, fill: '#94a3b8'}}
                                    />
                                    <YAxis 
                                        domain={[0, parseFloat(delayValues.vin) || 5]} 
                                        tick={{fontSize: 10, fill: '#94a3b8'}}
                                    />
                                    <RechartsTooltip 
                                        labelFormatter={(val) => formatTime(val as number)}
                                        formatter={(val: number) => [val.toFixed(2) + ' V', '电压']}
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <Line type="monotone" dataKey="voltage" stroke="#06b6d4" strokeWidth={3} dot={false} />
                                    {delayResult && (
                                        <ReferenceLine y={parseFloat(delayValues.vtarget)} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Vth', fill: '#ef4444', fontSize: 10 }} />
                                    )}
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Result Stats */}
                        {delayResult && (
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-100">
                                    <p className="text-xs font-bold text-cyan-700 uppercase mb-1">时间常数 (τ)</p>
                                    <p className="font-mono font-semibold text-cyan-900">{formatTime(delayResult.tau)}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">5τ (99% Charged)</p>
                                    <p className="font-mono font-semibold text-slate-700">{formatTime(delayResult.tau * 5)}</p>
                                </div>
                             </div>
                        )}
                        {!delayResult && (
                             <div className="bg-slate-50 p-6 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center h-32 text-slate-400">
                                <LineChart size={24} className="mb-2 opacity-50" />
                                <span className="text-sm">输入参数查看充电曲线</span>
                             </div>
                        )}
                    </div>

                    <div className="md:col-span-12 lg:col-span-7 space-y-6">
                        {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">{error}</div>}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">电源电压 (Vin)</label>
                                <div className="relative">
                                    <input type="number" value={delayValues.vin} onChange={(e) => handleDelayChange('vin', e.target.value)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">V</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">目标/阈值电压 (Vth)</label>
                                <div className="relative">
                                    <input type="number" value={delayValues.vtarget} onChange={(e) => handleDelayChange('vtarget', e.target.value)} className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-semibold shadow-sm" />
                                    <span className="absolute right-3 top-2.5 text-slate-400 text-xs font-bold">V</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">电阻 (R)</label>
                                <div className="flex gap-2">
                                    <input type="number" value={delayValues.r} onChange={(e) => handleDelayChange('r', e.target.value)} className="flex-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                    <select value={delayValues.rUnit} onChange={(e) => handleDelayChange('rUnit', Number(e.target.value))} className="w-20 px-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                                        {UNITS.R.map(u => <option key={u.label} value={u.value}>{u.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">电容 (C)</label>
                                <div className="flex gap-2">
                                    <input type="number" value={delayValues.c} onChange={(e) => handleDelayChange('c', e.target.value)} className="flex-1 w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                                    <select value={delayValues.cUnit} onChange={(e) => handleDelayChange('cUnit', Number(e.target.value))} className="w-20 px-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                                        {UNITS.C.map(u => <option key={u.label} value={u.value}>{u.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex items-center py-2"><div className="flex-grow border-t border-slate-100"></div><span className="flex-shrink-0 mx-4 text-slate-300 text-xs font-bold uppercase">计算结果 (时间)</span><div className="flex-grow border-t border-slate-100"></div></div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">延时时间 (t)</label>
                            <div className="flex gap-2">
                                <input type="number" value={delayValues.t} onChange={(e) => handleDelayChange('t', e.target.value)} className="flex-1 px-4 py-3 bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="计算结果" />
                                <select value={delayValues.tUnit} onChange={(e) => handleDelayChange('tUnit', Number(e.target.value))} className="w-24 px-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                                    {UNITS.T.map(u => <option key={u.label} value={u.value}>{u.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button onClick={calculateDelay} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-cyan-200 transition-all flex items-center justify-center gap-2">
                                <Calculator size={20} /> 计算时间
                            </button>
                            <button onClick={() => { setDelayValues({vin:'5', vtarget:'3.16', r:'10', rUnit:1000, c:'100', cUnit:1e-6, t:'', tUnit:1}); setDelayResult(null); setError(null); }} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50">
                                <RotateCcw size={18} />
                            </button>
                        </div>
                        
                        <div className="text-xs text-slate-400 mt-2">
                           * 输入 R, C, Vin, Vtarget 可计算时间 t。<br/>
                           * 输入 R, C, Vin, t 可计算当前电压 Vth。
                        </div>
                    </div>
                    </>
                )}
             </div>
        </div>
    </div>
  );
};