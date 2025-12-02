import React, { useState } from 'react';
import { Battery, BatteryCharging, Clock, Calculator, RotateCcw } from 'lucide-react';

export const BatteryLifeCalculator: React.FC = () => {
  const [capacity, setCapacity] = useState<string>('2000');
  const [current, setCurrent] = useState<string>('100');
  const [efficiency, setEfficiency] = useState<number>(0.85); // 85% default
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const cap = parseFloat(capacity);
    const curr = parseFloat(current);

    if (isNaN(cap) || isNaN(curr) || curr === 0) return;

    // Formula: Time = (Capacity * Efficiency) / Current
    // If Capacity is mAh and Current is mA, result is hours.
    const hours = (cap * efficiency) / curr;
    
    // Format Result
    const days = Math.floor(hours / 24);
    const remHours = Math.floor(hours % 24);
    const minutes = Math.round((hours - Math.floor(hours)) * 60);

    let resString = '';
    if (days > 0) resString += `${days} 天 `;
    if (remHours > 0) resString += `${remHours} 小时 `;
    resString += `${minutes} 分钟`;

    // Also just pure hours for reference
    const totalHours = hours.toFixed(1);

    setResult(`${resString} (${totalHours} hours)`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left: Inputs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-lime-500 rounded-full"></div>
                电池续航计算
              </h2>

              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">电池容量 (Capacity)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-lg text-slate-800 font-semibold"
                            placeholder="2000"
                        />
                        <div className="absolute right-4 top-4 text-slate-400 font-bold text-xs">mAh</div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">设备电流消耗 (Load)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={current}
                            onChange={(e) => setCurrent(e.target.value)}
                            className="w-full pl-4 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 text-lg text-slate-800 font-semibold"
                            placeholder="100"
                        />
                        <div className="absolute right-4 top-4 text-slate-400 font-bold text-xs">mA</div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-600">
                             放电效率/安全系数
                        </label>
                        <span className="text-xs font-bold text-lime-600 bg-lime-100 px-2 py-0.5 rounded">{(efficiency * 100).toFixed(0)}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="1.0" 
                        step="0.05" 
                        value={efficiency}
                        onChange={(e) => setEfficiency(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-lime-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">通常建议预留 15-30% 的余量 (0.7 ~ 0.85)</p>
                </div>

                <div className="pt-4 flex gap-4">
                     <button
                        onClick={calculate}
                        className="flex-1 bg-lime-600 hover:bg-lime-700 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-lime-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Calculator size={20} />
                        估算时间
                    </button>
                    <button
                        onClick={() => { setCapacity(''); setCurrent(''); setResult(null); }}
                        className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
              </div>
          </div>

          {/* Right: Results */}
          <div className="flex flex-col gap-6">
              {/* Result Card */}
              <div className="bg-slate-800 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden min-h-[200px] flex flex-col justify-center items-center text-center">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-lime-500/20 rounded-full blur-3xl"></div>
                  <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10">
                      <Clock className="mx-auto mb-4 text-lime-400" size={48} />
                      <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">预估续航时间</h3>
                      {result ? (
                          <p className="text-3xl md:text-4xl font-bold text-white leading-tight">
                              {result.split('(')[0]}
                              <span className="block text-lg font-medium text-slate-400 mt-2">{result.split('(')[1]?.replace(')', '')}</span>
                          </p>
                      ) : (
                          <p className="text-3xl font-bold text-slate-600">--</p>
                      )}
                  </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                      <BatteryCharging size={18} className="text-lime-600" />
                      影响因素
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                      <li><span className="font-medium">电池老化：</span>旧电池的实际容量可能远低于标称值。</li>
                      <li><span className="font-medium">温度：</span>极寒或极热环境会显著降低电池性能。</li>
                      <li><span className="font-medium">放电倍率：</span>大电流放电会降低有效容量（Peukert 效应）。</li>
                      <li><span className="font-medium">自放电：</span>长期放置也会消耗电量。</li>
                  </ul>
              </div>
          </div>

      </div>
    </div>
  );
};