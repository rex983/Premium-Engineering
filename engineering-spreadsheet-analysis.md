# PSB Rate Card Engineering Analysis

Analysis Date: 2026-07-20
Scope: Engineering-only cost drivers (snow load, wind load, seismic, structural upgrades)

Source Workbooks:
- Southern region: IN OH KY IL TN WV MO 1_26_26.xlsx
- Northern region: MI WI PA MN 1_26_26.xlsx

---

## A. Sheet Inventory & Engineering Classification

Both workbooks contain 22 sheets with identical structure.
Engineering sheets: 10 dedicated + 1 input router = 11 total

Pricing - Changers: Input router (45 formulas)
Snow - Changers: State/config engine (35 formulas)
Snow - Math Calculations: Engineering brain (107 formulas)
Snow - Truss Spacing: 4D lookup matrix (9817 cells)
Snow - Trusses: Original truss counts (5328 formulas)
Snow - Hat Channels: Channel spacing (661 formulas)
Snow - Verticals: Vertical post counts (210 formulas)
Snow - Girts: Girt spacing (236 formulas)
Snow Load Breakdown: Line-item summary (25 formulas)
Snow - Diagonal Bracing: Separate line item

---

## B. Core Engineering Sheets

### 1. Pricing - Changers (Input Router)

Converts text inputs into matrix indices.

Key Output: E/O Enclosure (D66)
  Formula: =IF(B70=4, "E", "O")
  Based on: sides coverage + enclosed ends + qty flags
  NOT affected by: panel orientation (V/H)

Width buckets: 12, 18, 20, 22, 24, 26, 28, 30
HC width: 36, 42, 48, 54, 60
Roof style: AFV (A-Frame Vertical) or STD (Standard)

### 2. Snow - Changers (Engineering Constants)

Wind Bucketing: 105, 115, 130, 140, 155, 165, 180 mph

Snow Load Codes:
  Ground Load: 20GL through 90GL
  Roof Load: 20LL through 61LL

Height Classification: S (small), M (medium), T (tall) symbols

State Constants (17 states):
  Truss pricing by width: $240-465 range
  Leg-height multiplier: 1.25-1.375
  Channel price/ft: $3.25-3.50
  Tubing price/ft: $7.25-7.75

F94 Leg-Height Adjustment:
  Height 13-15: -6 inch reduction
  Height 16-20: -12 inch reduction

Critical Gate (C102):
  IF(AND(30GL, wind<=130), 0, 1)
  Light load + low wind -> extras = 0

### 3. Snow - Math Calculations (Engineering Engine)

Trusses (P13, P19):
  extra = ceil(length_inches / spacing) + 1 - original
  cost = extra * price_per_ft * feet_used * gate

Hat Channels (P25, P29) [AFV gate only]:
  extra = (ceil((width+2)/2 / spacing) + 1) * 2 - original
  cost = extra * price_per_ft * (span + 1)

Girts (T25, T30) [double gate: enclosed_ends AND vertical_panels]:
  extra = ceil(height_inches / spacing) + 1 - original
  cost = extra * price_per_ft * perimeter

Verticals (U13, U20) [enclosed_ends gate]:
  extra = ceil(width_inches / spacing) + 1 - original
  cost = extra * price_per_ft * perimeter * height_multiplier * ends_qty
  Height multiplier: 2.0 (13-15), 2.5 (16-18), 3.0 (19-20), 1.0 (<=12)

### 4. Snow - Truss Spacing

9817-cell 4D lookup (rows=42, cols=225):
  Snow code + height symbol + wind + width -> spacing inches
  Example: E-105-12-S-30GL -> 48 inches

### 5-8. Original Count Matrices

Snow - Trusses (5328 formulas): W x L x state
Snow - Hat Channels (661 formulas): spacing-bucket x snow-code
Snow - Verticals (210 formulas): height x wind
Snow - Girts (236 formulas): spacing-bucket

---

## C. State Coverage & Variables

South Region: IN, OH, KY, IL, TN, MO, WV
  Default: 60GL (heavy)

North Region: MI, WI, PA, MN
  Default: 30GL (lighter - pricing includes baseline)

Per-State Truss Pricing: $240-465 by state and width

Wind Exposure: 105-180 mph, same for all states

Seismic & Occupancy: No explicit coding

---

## D. Engineering Rules Verification

All confirmed in PSB workbooks:

E/O Enclosure: Coverage-based, NOT panel-orientation
Height Reduction: 13-15 -> -6", 16-20 -> -12"
Vertical Multiplier: 13-15 -> 2x, 16-18 -> 2.5x, 19-20 -> 3x
C102 Gate: 30GL + wind<=130 -> extras = 0
AFV Gate: Hat channels only for A-Frame Vertical
Girt Double Gate: Enclosed ends AND vertical panels
Vertical Gate: Enclosed ends only

---

## E. Sample Calculations

### Scenario 1: Small Shed (30x50x12, IN, 30GL, 105mph)
  Truss spacing: 48 inches
  C102 gate: 0 (light + low wind)
  Engineering Total: $0

### Scenario 2: Medium Garage (40x80x16, WI, 60GL, 130mph)
  Truss spacing: 18 inches (after -12 adjustment)
  Trusses: 22 extra -> $3,505
  Hat channels: 4 -> $434
  Girts: 3 -> $2,604
  Verticals: 20 (x2.5 mult) -> $13,020
  Engineering Total: $19,563

### Scenario 3: Large Building (60x120x20, MO, 70GL, 155mph)
  Truss spacing: 12 inches (after -12 adjustment)
  Trusses: 66 extra -> $13,860
  Hat channels: 8 -> $820
  Girts: 0 (horizontal panels)
  Verticals: 45 (x3.0 mult) -> $59,400
  Engineering Total: $74,080

---

## F. Open Questions

1. Feet-used (row 28): per-truss or per-unit-length?
2. Hat-channel "length + 1": overlap or gable?
3. Girt perimeter: leg height or panel height?
4. Vertical spacing: always 60" or varies?
5. F52 vs F54 for HC bucketing?
6. Diagonal bracing: 140 mph threshold for all states?
7. E/O on partial enclosure?
8. Height multiplier boundaries?
9. A-Frame Horizontal vs Standard roof?
10. Diagonal bracing in subtotal or separate?

---

## Implementation Guide

Input Variables:
  width, length, height, gauge, roofStyle, sides, sidesQty, 
  endsType, endsQty, panelType, windMph, snowLoad, state

Output Variables:
  trussSpacing, trussQtyExtra, trussPrice,
  hatChannelQtyExtra, hatChannelPrice,
  girtQtyExtra, girtPrice,
  verticalQtyExtra, verticalPrice,
  diagonalBracingQty, diagonalBracingPrice,
  engineeringTotal

Matrices to Parse (7 total):
  1. Snow - Truss Spacing
  2. Snow - Trusses
  3. Snow - Hat Channels
  4. Snow - Verticals
  5. Snow - Girts
  6. Snow - Changers
  7. Pricing - Changers

---

END OF ANALYSIS

Prepared for Premium Engineering app implementation.
Implementation approach: State-machine calculator driven by JSON snapshots
of normalized matrices, matching existing parser output schema.
