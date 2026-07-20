/**
 * Engine constants — engineering-only picker options.
 */
export const ROOF_STYLES = ["A-Frame Vertical", "A-Frame Horizontal"] as const;
export const SIDE_OPTIONS = ["Fully Enclosed", "Partial Sides", "Open"] as const;
export const END_OPTIONS = ["Gable", "Enclosed Ends", "Extended Gable"] as const;
export const PANEL_ORIENTATIONS = ["Vertical", "Horizontal"] as const;

/**
 * Snow load options (B9:P9 in Snow - Changers).
 * Ground Load (GL) values 30..90, Roof Load (RL) values 20..61.
 */
export const SNOW_LOAD_OPTIONS = [
  "30 Ground Load", "40 Ground Load", "50 Ground Load", "60 Ground Load",
  "70 Ground Load", "80 Ground Load", "90 Ground Load",
  "20 Roof Load", "27 Roof Load", "34 Roof Load", "41 Roof Load",
  "47 Roof Load", "54 Roof Load", "61 Roof Load",
] as const;

/** Wind bucket header from Snow - Truss Spacing col keys. */
export const WIND_OPTIONS = [105, 115, 130, 140, 155, 165, 180] as const;

export const DEFAULT_WIND_MPH = 105;
