import * as XLSX from "xlsx";
import type { PSBEngineeringMatrices } from "@/types/pricing";
import { detectRegion, type RegionDetection } from "./detect-region";
import { getSheet, tryGetSheet } from "./sheet-readers/utils";
import { readQuoteSheetMeta } from "./sheet-readers/quote-sheet";
import { readSnowChangers } from "./sheet-readers/snow-changers";
import { readSnowTrusses } from "./sheet-readers/snow-trusses";
import { readSnowTrussSpacing } from "./sheet-readers/snow-truss-spacing";
import { readSnowHatChannels } from "./sheet-readers/snow-hat-channels";
import { readSnowVerticals } from "./sheet-readers/snow-verticals";
import { readSnowGirts } from "./sheet-readers/snow-girts";
import { readSnowDiagonalBracing } from "./sheet-readers/snow-diagonal-bracing";
import { validateMatrices, type ValidationResult } from "./validators";

export const PARSER_VERSION = "1.0.0-eng";

export interface ParseResult {
  detection: RegionDetection;
  matrices: PSBEngineeringMatrices;
  validation: ValidationResult;
}

/**
 * Parse a PSB workbook (south or north) — engineering-only slice.
 * Reads the 7 Snow-* sheets plus PSB-Quote Sheet header for defaults.
 */
export function parsePsbWorkbook(
  buffer: ArrayBuffer | Uint8Array,
  filename?: string
): ParseResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const detection = detectRegion(workbook, filename);

  const meta = readQuoteSheetMeta(getSheet(workbook, "PSB-Quote Sheet"));

  const snowChangers = readSnowChangers(getSheet(workbook, "Snow - Changers"));
  const snowTrusses = readSnowTrusses(getSheet(workbook, "Snow - Trusses"));
  const snowTrussSpacing = readSnowTrussSpacing(getSheet(workbook, "Snow - Truss Spacing"));
  const snowHat = readSnowHatChannels(getSheet(workbook, "Snow - Hat Channels"));
  const snowVerticals = readSnowVerticals(getSheet(workbook, "Snow - Verticals"));
  const snowGirts = readSnowGirts(getSheet(workbook, "Snow - Girts"));
  const snowDB = tryGetSheet(workbook, "Snow - Diagonal Bracing");
  const diagonalBracing = snowDB
    ? readSnowDiagonalBracing(snowDB)
    : { matrix: {} } as ReturnType<typeof readSnowDiagonalBracing>;

  const matrices: PSBEngineeringMatrices = {
    region: detection.region,
    filenameStates: detection.states,
    parsedAt: new Date().toISOString(),
    parserVersion: PARSER_VERSION,
    meta,
    snow: {
      changers: snowChangers,
      trusses: snowTrusses,
      trussSpacing: snowTrussSpacing,
      hatChannels: snowHat,
      verticals: snowVerticals,
      girts: snowGirts,
      diagonalBracing,
    },
  };

  const validation = validateMatrices(matrices);

  return { detection, matrices, validation };
}
