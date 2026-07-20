import type { PSBEngineeringMatrices } from "@/types/pricing";
import type { BuildingConfig, EngineOutput } from "./types";
import { calcSnowEngineering } from "./snow-engineering";

/**
 * Premium Engineering engine — snow/wind structural engineering only.
 *
 * Delegates to calcSnowEngineering, which reproduces the spreadsheet's
 * Snow-* sheet chain (trusses, hat channels, girts, verticals) and applies
 * the C102 kill-switch.
 */
export function priceBuilding(
  config: BuildingConfig,
  matrices: PSBEngineeringMatrices
): EngineOutput {
  const engineering = calcSnowEngineering(config, matrices.snow);
  return {
    engineeringBreakdown: engineering,
    inputs: config,
    region: matrices.region,
  };
}
