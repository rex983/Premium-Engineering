/**
 * BuildingConfig — inputs to the engineering-only pricing engine.
 * Only fields consumed by snow-engineering.ts are kept.
 */
export interface BuildingConfig {
  // Geometry
  width: number;
  length: number;
  height: number;

  // Structure (roofStyle drives AFV vs STD in truss-spacing lookup)
  roofStyle: "A-Frame Vertical" | "A-Frame Horizontal";

  // Walls — engineering needs to know which sides/ends are enclosed vertical
  // panels, because girts/verticals only apply when ends=Enclosed and sides=Vertical.
  sides: string;
  ends: string;
  sidesPanel: "Vertical" | "Horizontal";
  endsPanel: "Vertical" | "Horizontal";
  sidesQty: 0 | 1 | 2;
  endsQty: 0 | 1 | 2;

  // Engineering inputs
  windMph: number;
  snowLoad: string;

  // Location (drives state constants: truss price/ft, leg mult, channel & tubing rates)
  state: string;
}

export interface SnowEngineeringBreakdown {
  trussSpacing: string;
  originalTrusses: number;
  extraTrussesNeeded: number;
  trussPrice: number;
  hatChannelSpacing: string;
  originalHatChannels: number;
  extraChannelsNeeded: number;
  hatChannelPrice: number;
  girtSpacing: string;
  originalGirts: number;
  extraGirtsNeeded: number;
  girtPrice: number;
  verticalSpacing: string;
  originalVerticals: number;
  extraVerticalsNeeded: number;
  verticalPrice: number;
  totalEngineering: number;
}

export interface EngineOutput {
  engineeringBreakdown: SnowEngineeringBreakdown;
  inputs: BuildingConfig;
  region: "north" | "south";
}
