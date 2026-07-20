# premium-engineering — Premium Steel engineering-only calculator

## What this app is

Engineering-only fork of [PSB Pricing](../psb-pricing) — computes just the snow/wind
structural adders (trusses, hat channels, girts, verticals) from the same PSB
rate-card workbooks. No quotes, no customers, no PDF, no base pricing.

Parallel to how `asc-engineering` was carved out of `asc-pricing`.

## Source-of-truth analysis

- `engineering-spreadsheet-analysis.md` — engineering deep-dive of both regional workbooks
- Full historical PSB analysis: `C:/Users/Redir/bbd-pricer-analysis/PSB_PRICER_ANALYSIS.md`

Sample workbooks:
- `C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx` (south)
- `C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx` (north)

## Stack

- Next.js 16 + Tailwind v4 + shadcn/ui (new-york)
- NextAuth v5 (shared with BBD Launcher — `profiles` table)
- Supabase: shared instance `xockuiyvxijuzlwlsfbu` — engineering tables prefixed **`psbe_`**
  (must not collide with the live PSB Pricing app's `psb_*` tables)
- `xlsx` for workbook parsing

## Engineering pipeline (mirrors the spreadsheet's Snow-* sheet chain)

1. **Required truss spacing** ← `Snow - Truss Spacing` (snow + leg + width + wind + ends + style)
2. **Original truss count** ← `Snow - Trusses` (state + width + length)
3. `extras = ceil(L*12 / spacing) + 1 - original` — extras × price/ft × C102
4. Hat channels / girts / verticals follow the same shape against their own lookup tables

**C102 kill-switch:** if `wind ≤ 130` AND `snow == 30GL`, all engineering extras = $0.

## Layout (src/)

```
src/
  lib/
    excel/
      parser.ts               — reads 7 Snow-* sheets + PSB-Quote Sheet header
      sheet-readers/snow-*.ts — one per snow sheet
      validators.ts           — structural sanity checks
    pricing/
      engine.ts               — thin wrapper calling calcSnowEngineering
      snow-engineering.ts     — the entire engineering pipeline (do not touch without a golden case)
      types.ts                — BuildingConfig, SnowEngineeringBreakdown, EngineOutput
      constants.ts            — dropdown options
  app/
    (app)/
      calculator/             — the calculator
      admin/{regions,states,upload,audit-log}
    api/
      admin/{regions,state-defaults,upload,audit-log,pricing-status}
      pricing/[regionId]      — reads current matrices snapshot
      regions                 — list active regions
      state-defaults          — list state→region mappings
```

## Database (`psbe_*` in shared Supabase)

- `psbe_regions` — South / North
- `psbe_state_defaults` — state code → region + default snow load + wind
- `psbe_uploads` — upload tracking
- `psbe_pricing_data` — versioned JSON snapshot (only Snow-* matrices)
- `psbe_audit_log` — admin action trail

**Deleted (vs PSB Pricing):** `psb_customers`, `psb_quotes`, `psb_quote_sequence`, `psb_config`.

## How to bootstrap

```sh
cd C:/Users/Redir/premium-engineering
npm install
cp .env.example .env.local    # fill in Supabase + AUTH_SECRET
# Apply migration in Supabase SQL editor: supabase/migrations/20260720000000_create_psbe_tables.sql
npm run dev                    # http://localhost:3000
```

## Sibling apps

- `C:/Users/Redir/psb-pricing/` — full PSB pricing app (base + engineering)
- `C:/Users/Redir/asc-engineering/` — analogous ASC engineering-only fork
- `C:/Users/Redir/BBDLauncher/` — central hub (launcher tile registration pending)
