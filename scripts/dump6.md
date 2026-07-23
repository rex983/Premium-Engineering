# Snow - Trusses  probe

| Cell | Formula | Value |
|---|---|---|
| BE1 | `` | 30-PA |
| BE2 | `=BE21` | 7 |
| BG2 | `` | States Chart |
| BI2 | `` | Width |
| BE3 | `=BE21` | 7 |
| BG3 | `='Snow - Changers'!$D$74` | IN |
| BI3 | `='Pricing - Changers'!$E$6` | 12 |
| BE4 | `=BE21` | 7 |
| BE5 | `=BE21` | 7 |
| BE6 | `=BE21` | 7 |
| BG6 | `=concatenate($BI$3,"-",BG3)` | 12-IN |
| BE7 | `=BE21` | 7 |
| BE8 | `=BE21` | 7 |
| BG8 | `` | Match Column |
| BE9 | `=BE21` | 7 |
| BG9 | `=IFERROR(MATCH($BG$6,$B$1:$BE$1,0),0)` | 1 |
| BE10 | `=BE21` | 7 |
| BH10 | `` | Trusses Used in Selected States |
| BE11 | `=BE21` | 7 |
| BH11 | `=INDEX($B$2:$BE$101,$BJ$9,$BG$9)` | 5 |
| BE12 | `=BE21` | 7 |
| BE13 | `=BE21` | 7 |
| BE14 | `=BE21` | 7 |
| BE15 | `=BE21` | 7 |
| BE16 | `=BE21` | 7 |
| BE17 | `=BE21` | 7 |
| BE18 | `=BE21` | 7 |
| BE19 | `=BE21` | 7 |
| BE20 | `=BE21` | 7 |

## Range headers around BH
- BC1: "26-PA"
- BD1: "28-PA"
- BE1: "30-PA"
- BF1: null
- BG1: null
- BH1: null
- BI1: null
- BJ1: null
- BK1: null
- BL1: null
- BM1: null