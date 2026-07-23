# Pricing - Changers D66 chain
## Pricing - Changers
| Cell | Formula | Value |
|---|---|---|
| D66 | `=IF($B$70=4,"E","O")` | E |
| B70 | `=SUM($B$66:$B$69)` | 4 |
| U64 | `=IF($T$64="Vertical",1,0)` |  |
| U65 | `=IF($T$65="Vertical",1,0)` |  |
| U66 | `` | null |
| U67 | `=SUM($U$64:$U$65)` |  |
| U68 | `=IF($U$67=0,0,1)` |  |
| U69 | `=IF($U$68=0,"No","Yes")` | No |
| T64 | `='PSB-Quote Sheet'!N27` | Horizontal |
| T65 | `='PSB-Quote Sheet'!N28` | Horizontal |
| T66 | `` | null |
| T67 | `` | null |
| T68 | `` | Vertical Sides |

## Pricing - Changers
| Cell | Formula | Value |
|---|---|---|
| D64 | `='PSB-Quote Sheet'!L27` | 2 |
| E64 | `='PSB-Quote Sheet'!L28` | 2 |
| H65 | `=$D$64` | 2 |
| H66 | `=$E$64` | 2 |
| G65 | `` | Sides Quantity |
| G66 | `` | Ends Quantity |

## Pricing - Changers rows 60-72 (dense)
| Cell | Formula | Value |
|---|---|---|
| A63 | `` | Building Type |
| B63 | `` | Sides |
| C63 | `` | Ends |
| D63 | `` | Sides QTY |
| E63 | `` | Ends QTY |
| T63 | `` | Value |
| U63 | `` | Yes or No |
| B64 | `='PSB-Quote Sheet'!G27` | Fully Enclosed |
| C64 | `='PSB-Quote Sheet'!G28` | Enclosed Ends |
| D64 | `='PSB-Quote Sheet'!L27` | 2 |
| E64 | `='PSB-Quote Sheet'!L28` | 2 |
| H64 | `` | Is the Building Irregualr |
| S64 | `` | Sides  |
| T64 | `='PSB-Quote Sheet'!N27` | Horizontal |
| U64 | `=IF($T$64="Vertical",1,0)` |  |
| G65 | `` | Sides Quantity |
| H65 | `=$D$64` | 2 |
| J65 | `` | Irregular |
| K65 | `` | 0 |
| L65 | `` | 1 |
| M65 | `` | 2 |
| N65 | `` | 3 |
| O65 | `` | 4 |
| S65 | `` | Ends |
| T65 | `='PSB-Quote Sheet'!N28` | Horizontal |
| U65 | `=IF($T$65="Vertical",1,0)` |  |
| A66 | `` | Sides |
| B66 | `=IF($B$64="Fully Enclosed",1,0)` | 1 |
| D66 | `=IF($B$70=4,"E","O")` | E |
| E66 | `` | Building Type |
| G66 | `` | Ends Quantity |
| H66 | `=$E$64` | 2 |
| K66 | `` | 0 |
| L66 | `` | 1 |
| M66 | `` | 1 |
| N66 | `` | 1 |
| O66 | `` | 0 |
| A67 | `` | Ends |
| B67 | `=IF($C$64="Enclosed Ends",1,0)` | 1 |
| G67 | `` | Total |
| H67 | `=$H$65+$H$66` | 4 |
| U67 | `=SUM($U$64:$U$65)` |  |
| A68 | `` | Sides Quantity |
| B68 | `=IF($D$64=2,1,0)` | 1 |
| K68 | `=MATCH($H$67,$K$65:$O$65,0)` | 5 |
| T68 | `` | Vertical Sides |
| U68 | `=IF($U$67=0,0,1)` |  |
| A69 | `` | Ends Quantity |
| B69 | `=IF($E$64=2,1,0)` | 1 |
| H69 | `` | 1 |
| I69 | `` | IF |
| J69 | `=IF(K69=0,0,1)` |  |
| K69 | `=INDEX($K$66:$O$66,1,$K$68)` |  |
| L69 | `` | Sides = 4 |
| T69 | `` | Yes or No |
| U69 | `=IF($U$68=0,"No","Yes")` | No |
| A70 | `` | Total |
| B70 | `=SUM($B$66:$B$69)` | 4 |
| H70 | `` | 2 |
| I70 | `` | IF |
| J70 | `=IF(K70="O",1,0)` |  |
| K70 | `=$D$33` |  |
| L70 | `` | E or O |
| H71 | `` | 3 |
| I71 | `` | IF |
| J71 | `=IF(K71,1,0)` |  |
| K71 | `=$H$34` |  |
| L71 | `` | Total |
| H72 | `` | 4 |
| I72 | `` | Multiply |
| J72 | `=J70*J71` |  |
| K72 | `` | Combine 2 & 3 |