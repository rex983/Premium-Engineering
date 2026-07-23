# Formulas dump 5 — G7 truss-extras chain + F94 sanity

## Snow - Math Calculations
| Cell | Formula | Value |
|---|---|---|
| G2 | `=IF(D7<0,0,1)` | 1 |
| G3 | (empty) | |
| G4 | (empty) | |
| G5 | (empty) | |
| G6 | `` | Making Sure its no Negative |
| G7 | `=$D$7*$G$2` | 1 |
| G8 | (empty) | |
| G9 | (empty) | |
| G10 | (empty) | |
| G11 | (empty) | |

## Snow - Math Calculations
| Cell | Formula | Value |
|---|---|---|
| D2 | `='PSB-Quote Sheet'!P17` | 20 |
| D3 | `=$D$2*12` | 240 |
| D4 | `=$D$3/$P$2` | 5 |
| D5 | `=ROUNDUP($D$4,0)` | 5 |
| D6 | `=$D$5+1` | 6 |
| D7 | `=($D$6-$T$2)` | 1 |
| D8 | (empty) | |
| P2 | `='Snow - Truss Spacing'!$F$52` | 48 |
| P4 | `='Snow - Hat Channels'!$L$7` | 36 |
| P6 | `='Snow - Girts '!$F$14` | 60 |
| P8 | `='Snow - Verticals'!$Z$8` | 60 |

## Snow - Math Calculations
| Cell | Formula | Value |
|---|---|---|
| T2 | `='Snow - Trusses '!$BH$11` | 5 |
| T3 | (empty) | |
| T4 | `='Snow - Hat Channels'!$AD$10` | 6 |
| T5 | (empty) | |
| T6 | `='Snow - Girts '!$T$11` | 3 |
| T7 | (empty) | |
| T8 | `='Snow - Verticals'!$B$21` | 4 |

## Snow - Math Calculations
| Cell | Formula | Value |
|---|---|---|
| Z14 | `='Snow - Changers'!$G$31` | 2 |
| Z15 | (empty) | |
| Z16 | (empty) | |

## Snow - Changers
| Cell | Formula | Value |
|---|---|---|
| F94 | `=INDEX($B$81:$P$89,$G$92,$D$92)` |  |
| D14 | `=INDEX($B$10:$P$10,1,$D$13)` | 60GL |
| B92 | `=$D$14` | 60GL |
| B93 | `=$D$54` | 12 |
| D92 | `=MATCH($B$92,$B$80:$P$80,0)` | 4 |
| G92 | `=MATCH($B$93,$A$81:$A$89,0)` | 1 |

## Search for cells referencing F94, D31, or Q47
- Snow - Trusses !D27: D31
- Snow - Trusses !AD27: AD31
- Snow - Trusses !D28: D31
- Snow - Trusses !AD28: AD31
- Snow - Trusses !D29: D31
- Snow - Trusses !AD29: AD31
- Snow - Trusses !D30: D31
- Snow - Trusses !AD30: AD31
- Snow - Trusses !D56: (D31+D26)-1
- Snow - Trusses !AD56: (AD31+AD26)-1
- Snow - Trusses !D61: (D31+D31)-1
- Snow - Trusses !AD61: (AD31+AD31)-1
- Snow - Trusses !D66: (D31+D36)-1
- Snow - Trusses !AD66: (AD31+AD36)-1
- Snow - Trusses !Q92: (Q47+Q42)-1
- Snow - Trusses !Q94: (Q49+Q44)-1
- Snow - Trusses !Q97: (Q47+Q47)-1
- Snow - Trusses !Q99: (Q49+Q49)-1
- Pricing - Accessories!Q48: 'PSB-Quote Sheet'!Q47
