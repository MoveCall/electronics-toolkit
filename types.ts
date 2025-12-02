export enum UnitMultiplier {
  Ohm = 1,
  kOhm = 1000,
  MOhm = 1000000,
}

export interface Resistor {
  id: string;
  value: number; // The user input number
  multiplier: UnitMultiplier;
}

export interface CalculatedResistor extends Resistor {
  actualResistance: number; // value * multiplier
  voltageDrop: number; // Volts
  currentFlow: number; // Amps
  power: number; // Watts
  sharePercentage: number; // % of total V or I
}

export enum CalculationMode {
  Series = 'series',
  Parallel = 'parallel',
  VoltageDivider = 'voltage-divider',
  LED = 'led',
  OhmsLaw = 'ohms-law',
  RCTime = 'rc-time',
  BatteryLife = 'battery-life',
  ColorCode = 'color-code',
}