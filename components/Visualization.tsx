import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { CalculatedResistor, CalculationMode } from '../types';

interface VisualizationProps {
  data: CalculatedResistor[];
  mode: CalculationMode;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export const Visualization: React.FC<VisualizationProps> = ({ data, mode }) => {
  const chartData = data.map((r, index) => ({
    name: `R${index + 1}`,
    Voltage: r.voltageDrop,
    Current: r.currentFlow,
    Power: r.power,
    Resistance: r.actualResistance,
  }));

  const dataKey = mode === CalculationMode.Series ? 'Voltage' : 'Current';
  const unit = mode === CalculationMode.Series ? 'V' : 'A';
  const label = mode === CalculationMode.Series ? '电压降 (Voltage Drop)' : '电流 (Current)';

  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider text-center">
        {mode === CalculationMode.Series ? '各电阻分压情况' : '各电阻分流情况'}
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey={dataKey} name={label} radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};