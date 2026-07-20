import type { WorkSheet } from "xlsx";
import type { QuoteSheetMeta } from "@/types/pricing";
import { getString, getNumber } from "./utils";

/**
 * Pulls only the header cells the engineering calculator needs:
 * default state (drives region detection + snow-load default) and the
 * default snow/wind values.
 */
export function readQuoteSheetMeta(sheet: WorkSheet): QuoteSheetMeta {
  return {
    roofStyles: ["A-Frame Vertical", "A-Frame Horizontal"],
    sideOptions: ["Fully Enclosed", "Partial Sides", "Open"],
    endOptions: ["Gable", "Enclosed Ends", "Extended Gable"],
    panelOrientations: ["Vertical", "Horizontal"],
    defaultStateLabel: getString(sheet, "Z10"),
    defaultSnowLoad: getString(sheet, "N55"),
    defaultWindMph: getNumber(sheet, "J55") || 105,
  };
}
