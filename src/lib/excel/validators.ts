import type { PSBEngineeringMatrices } from "@/types/pricing";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats: Record<string, number | string>;
}

/**
 * Structural sanity checks on the parsed engineering-only matrices.
 * Errors block the upload from becoming current; warnings are informational.
 */
export function validateMatrices(m: PSBEngineeringMatrices): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stats: Record<string, number | string> = {
    region: m.region,
    parserVersion: m.parserVersion,
    snowLoadCount: m.snow.changers.snowLoads.length,
    snowStateCount: m.snow.changers.states.length,
    trussSpacingRows: m.snow.trussSpacing.rowKeys.length,
    trussSpacingCols: m.snow.trussSpacing.colKeys.length,
    trussStateColCount: m.snow.trusses.colKeys.length,
    stateConstantCount: Object.keys(m.snow.changers.byStateName).length,
  };

  if (m.snow.changers.snowLoads.length === 0) {
    errors.push("Snow - Changers: no snow load options parsed");
  }
  if (!m.meta.defaultStateLabel) {
    warnings.push("PSB-Quote Sheet Z10 (default state) is empty");
  }
  if (Object.keys(m.snow.changers.byStateName).length === 0) {
    warnings.push("Snow - Changers: no per-state engineering constants parsed (rows 58–70)");
  }
  if (Object.keys(m.snow.changers.legHeightAdjust).length === 0) {
    warnings.push("Snow - Changers: F94 leg-height-adjustment table is empty");
  }
  if (m.snow.trussSpacing.rowKeys.length === 0 || m.snow.trussSpacing.colKeys.length === 0) {
    errors.push("Snow - Truss Spacing: lookup table missing row/col keys");
  }

  return { ok: errors.length === 0, errors, warnings, stats };
}
