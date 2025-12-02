import React, { useState, useEffect, useMemo } from 'react';
import { Plus, HelpCircle, Calculator, Zap, Activity, DivideCircle, Lightbulb, Box, Waves, Battery, Palette } from 'lucide-react';
import { ResistorRow } from './components/ResistorRow';
import { Visualization } from './components/Visualization';
import { VoltageDivider } from './components/VoltageDivider';
import { LEDCalculator } from './components/LEDCalculator';
import { OhmsLawCalculator } from './components/OhmsLawCalculator';
import { RCCalculator } from './components/RCCalculator';
import { BatteryLifeCalculator } from './components/BatteryLifeCalculator';
import { ColorCodeCalculator } from './components/ColorCodeCalculator';
import { Resistor, UnitMultiplier, CalculatedResistor, CalculationMode } from './types';
import { v4 as uuidv4 } from 'uuid';

// Simple UUID generator if uuid package not available, but since we are simulating environment, let's use a simple random string
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [mode, setMode] = useState<CalculationMode>(CalculationMode.Series);
  
  // Input States
  const [sourceValue, setSourceValue] = useState<number>(10); // Volts for Series, Amps for Parallel ideally, but usually users have Voltage source for parallel too.
  // Note: For parallel current divider, strictly speaking it divides current. But often people ask "Parallel circuit with 12V source".
  // Let's implement Strict Physics definitions but allow Voltage input for Parallel to calculate total current first.
  const [inputType, setInputType] = useState<'voltage' | 'current'>('voltage'); 

  const [resistors, setResistors] = useState<Resistor[]>([
    { id: generateId(), value: 100, multiplier: UnitMultiplier.Ohm },
    { id: generateId(), value: 200, multiplier: UnitMultiplier.Ohm },
  ]);

  // Handler to add resistor
  const addResistor = () => {
    setResistors([...resistors, { id: generateId(), value: 100, multiplier: UnitMultiplier.Ohm }]);
  };

  // Handler to remove resistor
  const removeResistor = (id: string) => {
    if (resistors.length > 1) {
      setResistors(resistors.filter((r) => r.id !== id));
    }
  };

  // Handler to change resistor values
  const updateResistor = (id: string, field: keyof Resistor, value: number | UnitMultiplier) => {
    setResistors(
      resistors.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Calculations
  const results: {
    calculatedResistors: CalculatedResistor[];
    totalResistance: number;
    totalCurrent: number;
    totalPower: number;
    totalVoltage: number;
  } = useMemo(() => {
    // Return default values if mode is not Series or Parallel
    if (mode !== CalculationMode.Series && mode !== CalculationMode.Parallel) {
        return {
            calculatedResistors: [],
            totalResistance: 0,
            totalCurrent: 0,
            totalPower: 0,
            totalVoltage: 0
        };
    }

    const rs = resistors.map(r => ({ ...r, actualResistance: r.value * r.multiplier }));
    
    if (mode === CalculationMode.Series) {
      // Series Circuit
      const totalResistance = rs.reduce((acc, r) => acc + r.actualResistance, 0);
      
      let totalCurrent = 0;
      let totalVoltage = 0;

      if (inputType === 'voltage') {
        totalVoltage = sourceValue;
        totalCurrent = totalResistance > 0 ? totalVoltage / totalResistance : 0;
      } else {
        totalCurrent = sourceValue;
        totalVoltage = totalCurrent * totalResistance;
      }

      const calculatedResistors = rs.map(r => {
        const voltageDrop = totalCurrent * r.actualResistance;
        const power = totalCurrent * totalCurrent * r.actualResistance;
        return {
          ...r,
          voltageDrop,
          currentFlow: totalCurrent,
          power,
          sharePercentage: totalVoltage > 0 ? (voltageDrop / totalVoltage) * 100 : 0
        };
      });

      return {
        calculatedResistors,
        totalResistance,
        totalCurrent,
        totalPower: totalVoltage * totalCurrent,
        totalVoltage
      };

    } else {
      // Parallel Circuit
      // 1/Rtotal = 1/R1 + 1/R2 ...
      const conductance = rs.reduce((acc, r) => acc + (r.actualResistance > 0 ? 1 / r.actualResistance : 0), 0);
      const totalResistance = conductance > 0 ? 1 / conductance : 0;

      let totalCurrent = 0;
      let totalVoltage = 0;

      if (inputType === 'voltage') {
        totalVoltage = sourceValue;
        totalCurrent = totalVoltage * conductance; // I = V/R = V * G
      } else {
        // Current Divider Source
        totalCurrent = sourceValue;
        totalVoltage = totalCurrent * totalResistance;
      }

      const calculatedResistors = rs.map(r => {
        const currentFlow = r.actualResistance > 0 ? totalVoltage / r.actualResistance : 0;
        const power = totalVoltage * currentFlow;
        return {
          ...r,
          voltageDrop: totalVoltage,
          currentFlow,
          power,
          sharePercentage: totalCurrent > 0 ? (currentFlow / totalCurrent) * 100 : 0
        };
      });

      return {
        calculatedResistors,
        totalResistance,
        totalCurrent,
        totalPower: totalVoltage * totalCurrent,
        totalVoltage
      };
    }
  }, [resistors, mode, sourceValue, inputType]);


  // Effect to reset input type logic when mode changes
  useEffect(() => {
    if (mode === CalculationMode.Series) {
      setInputType('voltage');
    } else if (mode === CalculationMode.Parallel) {
      setInputType('current');
    }
  }, [mode]);

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    if (Math.abs(num) < 0.001 || Math.abs(num) > 10000) {
      return num.toExponential(3);
    }
    return num.toLocaleString('en-US', { maximumFractionDigits: 3 });
  };

  const formatUnit = (num: number, unit: string) => {
      let suffix = '';
      let value = num;
      if (value >= 1000000) { value /= 1000000; suffix = 'M'; }
      else if (value >= 1000) { value /= 1000; suffix = 'k'; }
      else if (value < 1 && value > 0) {
          if (value < 0.000001) { value *= 1000000000; suffix = 'n'; }
          else if (value < 0.001) { value *= 1000000; suffix = 'µ'; }
          else { value *= 1000; suffix = 'm'; }
      }
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 3 })} ${suffix}${unit}`;
  };

  const renderContent = () => {
    switch (mode) {
        case CalculationMode.ColorCode:
            return <ColorCodeCalculator />;
        case CalculationMode.VoltageDivider:
            return <VoltageDivider />;
        case CalculationMode.LED:
            return <LEDCalculator />;
        case CalculationMode.OhmsLaw:
            return <OhmsLawCalculator />;
        case CalculationMode.RCTime:
            return <RCCalculator />;
        case CalculationMode.BatteryLife:
            return <BatteryLifeCalculator />;
        case CalculationMode.Series:
        case CalculationMode.Parallel:
        default:
            return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Source Input Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                    电源参数
                  </h2>
                  
                  <div className="space-y-4">
                     <div className="flex rounded-lg bg-slate-100 p-1">
                        <button 
                            onClick={() => setInputType('voltage')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'voltage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            已知电压 (V)
                        </button>
                        <button 
                             onClick={() => setInputType('current')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${inputType === 'current' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            已知电流 (I)
                        </button>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            {inputType === 'voltage' ? '总电压 (Input Voltage)' : '总电流 (Input Current)'}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={sourceValue === 0 ? '' : sourceValue}
                                onChange={(e) => setSourceValue(parseFloat(e.target.value) || 0)}
                                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-slate-800"
                            />
                            <div className="absolute right-4 top-3.5 text-slate-400 font-bold">
                                {inputType === 'voltage' ? 'V' : 'A'}
                            </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Resistors Input Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                        电阻列表
                      </h2>
                      <button 
                        onClick={addResistor}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <Plus size={16} /> 添加电阻
                      </button>
                   </div>
                   
                   <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                     {resistors.map((r, idx) => (
                       <ResistorRow 
                         key={r.id} 
                         index={idx} 
                         resistor={r} 
                         onChange={updateResistor}
                         onRemove={removeResistor}
                         canRemove={resistors.length > 1}
                       />
                     ))}
                   </div>
                </div>

                {/* Formula Hint Card */}
                <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
                   <div className="flex items-start gap-3">
                      <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={20} />
                      <div className="text-sm text-slate-600 space-y-2">
                          <p className="font-semibold text-slate-800">计算公式:</p>
                          {mode === CalculationMode.Series ? (
                              <>
                                <p>分压公式: <span className="font-mono bg-white px-1 rounded">U<sub>x</sub> = U<sub>total</sub> × (R<sub>x</sub> / R<sub>total</sub>)</span></p>
                                <p>电流恒定: <span className="font-mono bg-white px-1 rounded">I = U<sub>total</sub> / R<sub>total</sub></span></p>
                                <p>总电阻: <span className="font-mono bg-white px-1 rounded">R<sub>total</sub> = R1 + R2 + ...</span></p>
                              </>
                          ) : (
                              <>
                                 <p>分流公式: <span className="font-mono bg-white px-1 rounded">I<sub>x</sub> = I<sub>total</sub> × (R<sub>total</sub> / R<sub>x</sub>)</span></p>
                                 <p>电压恒定: <span className="font-mono bg-white px-1 rounded">U = I<sub>total</sub> × R<sub>total</sub></span></p>
                                 <p>总电阻: <span className="font-mono bg-white px-1 rounded">1/R<sub>total</sub> = 1/R1 + 1/R2 + ...</span></p>
                              </>
                          )}
                      </div>
                   </div>
                </div>

              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Main Result Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                      <div className="relative z-10">
                         <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">总电阻 (Req)</p>
                         <p className="text-2xl font-bold truncate" title={results.totalResistance.toString()}>
                            {formatUnit(results.totalResistance, 'Ω')}
                         </p>
                      </div>
                   </div>
                   
                   <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">总电流 (Itot)</p>
                      <p className="text-2xl font-bold text-emerald-600 truncate">
                          {formatUnit(results.totalCurrent, 'A')}
                      </p>
                   </div>

                   <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">总电压 (Utot)</p>
                      <p className="text-2xl font-bold text-blue-600 truncate">
                          {formatUnit(results.totalVoltage, 'V')}
                      </p>
                   </div>
                </div>

                {/* Visual Chart */}
                <Visualization data={results.calculatedResistors} mode={mode} />

                {/* Detailed Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">详细数据</h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                        总功率: {formatUnit(results.totalPower, 'W')}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="px-6 py-3 w-16">#</th>
                          <th className="px-6 py-3">阻值 (R)</th>
                          <th className="px-6 py-3">分得电压 (U)</th>
                          <th className="px-6 py-3">通过电流 (I)</th>
                          <th className="px-6 py-3">功率 (P)</th>
                          <th className="px-6 py-3 text-right">占比 (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {results.calculatedResistors.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-3 font-mono text-slate-400">R{idx + 1}</td>
                            <td className="px-6 py-3 font-semibold text-slate-700">{formatUnit(r.actualResistance, 'Ω')}</td>
                            <td className="px-6 py-3 text-blue-600">{formatUnit(r.voltageDrop, 'V')}</td>
                            <td className="px-6 py-3 text-emerald-600">{formatUnit(r.currentFlow, 'A')}</td>
                            <td className="px-6 py-3 text-amber-600">{formatUnit(r.power, 'W')}</td>
                            <td className="px-6 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-slate-600">{r.sharePercentage.toFixed(1)}%</span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${mode === CalculationMode.Series ? 'bg-blue-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${Math.min(r.sharePercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
            );
    }
  };

  const ModeButton = ({ targetMode, icon: Icon, label, colorClass, ringClass }: any) => (
      <button
        onClick={() => setMode(targetMode)}
        className={`flex items-center justify-center gap-2 px-2 py-3 rounded-xl font-semibold transition-all shadow-sm text-xs sm:text-sm ${
            mode === targetMode
            ? `${colorClass} text-white ${ringClass} ring-2 ring-offset-2`
            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Calculator size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              电子工具箱 <span className="text-slate-400 font-normal text-sm ml-2 hidden sm:inline-block">Electronics Toolkit</span>
            </h1>
          </div>
          <div className="text-sm text-slate-500 font-medium hidden sm:block">
             Professional Electronics Tools
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Mode Toggles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 mb-8">
            <ModeButton 
                targetMode={CalculationMode.Series} 
                icon={Activity} 
                label="串联" 
                colorClass="bg-blue-600" 
                ringClass="ring-blue-600 shadow-blue-200" 
            />
            <ModeButton 
                targetMode={CalculationMode.Parallel} 
                icon={Zap} 
                label="并联" 
                colorClass="bg-emerald-600" 
                ringClass="ring-emerald-600 shadow-emerald-200" 
            />
             <ModeButton 
                targetMode={CalculationMode.ColorCode} 
                icon={Palette} 
                label="色环电阻" 
                colorClass="bg-pink-500" 
                ringClass="ring-pink-500 shadow-pink-200" 
            />
            <ModeButton 
                targetMode={CalculationMode.VoltageDivider} 
                icon={DivideCircle} 
                label="分压器" 
                colorClass="bg-indigo-600" 
                ringClass="ring-indigo-600 shadow-indigo-200" 
            />
            <ModeButton 
                targetMode={CalculationMode.LED} 
                icon={Lightbulb} 
                label="LED" 
                colorClass="bg-amber-500" 
                ringClass="ring-amber-500 shadow-amber-200" 
            />
             <ModeButton 
                targetMode={CalculationMode.OhmsLaw} 
                icon={Box} 
                label="欧姆定律" 
                colorClass="bg-purple-600" 
                ringClass="ring-purple-600 shadow-purple-200" 
            />
            <ModeButton 
                targetMode={CalculationMode.RCTime} 
                icon={Waves} 
                label="RC滤波" 
                colorClass="bg-cyan-600" 
                ringClass="ring-cyan-600 shadow-cyan-200" 
            />
            <ModeButton 
                targetMode={CalculationMode.BatteryLife} 
                icon={Battery} 
                label="电池寿命" 
                colorClass="bg-lime-600" 
                ringClass="ring-lime-600 shadow-lime-200" 
            />
        </div>

        {renderContent()}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
         <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-slate-500 text-sm">
                Copyright © 2025 <span className="font-bold text-slate-700">movecall</span>. All Rights Reserved.
            </p>
            <p className="text-slate-400 text-xs mt-2">
                Made with ❤️ for Electronics Engineers
            </p>
         </div>
      </footer>
    </div>
  );
}

export default App;