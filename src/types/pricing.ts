/**
 * Premium Engineering — parsed snow-sheet matrices persisted in
 * psbe_pricing_data.matrices and consumed by the engineering engine.
 */

export type Region = "north" | "south";

// =============================================================================
// Snow engineering
// =============================================================================
export interface SnowStateConstants {
  code: string;
  trussPriceByWidth: Record<number, number>;
  legHeightMult: number;
  channelPricePerFt: number;
  tubingPricePerFt: number;
}

export interface SnowChangersMatrix {
  snowLoadNameToCode: Record<string, string>;
  snowLoadCodeOrder: string[];
  legHeightSymbol: Record<number, string>;
  legHeightTubingFeet: Record<number, number>;
  hcWidthBucket: Record<number, number>;
  trussWidthBucket: Record<number, number>;
  byStateName: Record<string, SnowStateConstants>;
  legHeightAdjust: Record<number, Record<string, number>>;
  states: string[];
  snowLoads: string[];
  windOptions: number[];
}

export interface SnowTrussesMatrix {
  colKeys: string[];
  lengths: number[];
  counts: number[][];
}

export interface SnowHatChannelsMatrix {
  rowKeys: string[];
  windHeader: number[];
  spacingTable: number[][];
  stateCodes: string[];
  widthHeader: number[];
  originalCounts: number[][];
}

export interface SnowVerticalsMatrix {
  legHeightHeader: number[];
  windCol: number[];
  spacingTable: number[][];
  widthHeader: number[];
  originalRow: number[];
}

export interface SnowGirtsMatrix {
  girtRowKeys: number[];
  windHeader: number[];
  spacingTable: number[][];
  legHeightCol: number[];
  originalCol: number[];
  trussSpacingAxis: number[];
  trussSpacingBucket: number[];
}

export interface SnowTrussSpacingMatrix {
  rowKeys: string[];
  colKeys: string[];
  spacingTable: number[][];
}

export interface SnowDiagonalBracingMatrix {
  matrix: Record<number, Record<number, number>>;
}

export interface SnowMatrices {
  changers: SnowChangersMatrix;
  trusses: SnowTrussesMatrix;
  trussSpacing: SnowTrussSpacingMatrix;
  hatChannels: SnowHatChannelsMatrix;
  verticals: SnowVerticalsMatrix;
  girts: SnowGirtsMatrix;
  diagonalBracing: SnowDiagonalBracingMatrix;
}

// =============================================================================
// Quote Sheet metadata — the parser still reads a few defaults from the header
// (default state label + region detection). Base-pricing dropdowns dropped.
// =============================================================================
export interface QuoteSheetMeta {
  roofStyles: string[];
  sideOptions: string[];
  endOptions: string[];
  panelOrientations: string[];
  defaultStateLabel: string;
  defaultSnowLoad: string;
  defaultWindMph: number;
}

// =============================================================================
// Top-level engineering matrices blob persisted in psbe_pricing_data.matrices
// =============================================================================
export interface PSBEngineeringMatrices {
  region: Region;
  filenameStates: string[];
  parsedAt: string;
  parserVersion: string;
  meta: QuoteSheetMeta;
  snow: SnowMatrices;
}

// Back-compat alias so older imports (`PSBPricingMatrices`) still resolve
// during the transitional cleanup pass.
export type PSBPricingMatrices = PSBEngineeringMatrices;
