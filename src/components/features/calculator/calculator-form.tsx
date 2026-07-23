"use client";

import { useMemo, useState } from "react";
import type { BuildingConfig } from "@/lib/pricing/types";
import type { PSBEngineeringMatrices } from "@/types/pricing";
import { priceBuilding } from "@/lib/pricing/engine";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EngineeringBreakdownPanel } from "./engineering-breakdown";
import { ChevronDown } from "lucide-react";
import {
  ROOF_STYLES, SIDE_OPTIONS, END_OPTIONS, PANEL_ORIENTATIONS,
  SNOW_LOAD_OPTIONS, WIND_OPTIONS,
} from "@/lib/pricing/constants";
import { formatCurrency } from "@/lib/utils";

function Section({
  title,
  defaultOpen = true,
  contentClassName = "",
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-3"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
        </div>
      </CardHeader>
      {open && <CardContent className={contentClassName}>{children}</CardContent>}
    </Card>
  );
}

export interface CalculatorFormProps {
  matrices: PSBEngineeringMatrices;
  defaultState?: string;
}

const defaultConfig = (m: PSBEngineeringMatrices, state?: string): BuildingConfig => ({
  width: 12,
  length: 20,
  height: 8,
  roofStyle: "A-Frame Vertical",
  sides: "Fully Enclosed",
  ends: "Enclosed Ends",
  sidesPanel: "Horizontal",
  endsPanel: "Horizontal",
  sidesQty: 2,
  endsQty: 2,
  windMph: 105,
  snowLoad: "30 Ground Load",
  state: state ?? m.meta.defaultStateLabel ?? "",
});

export function CalculatorForm({ matrices, defaultState }: CalculatorFormProps) {
  const [config, setConfig] = useState<BuildingConfig>(() =>
    defaultConfig(matrices, defaultState)
  );

  const result = useMemo(
    () => priceBuilding(config, matrices),
    [config, matrices]
  );

  const update = <K extends keyof BuildingConfig>(key: K, value: BuildingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const numField = (key: keyof BuildingConfig, label: string, step = 1) => (
    <div className="space-y-1">
      <Label htmlFor={String(key)} className="text-xs">{label}</Label>
      <Input
        id={String(key)}
        type="number"
        step={step}
        value={String(config[key] ?? "")}
        onChange={(e) => update(key, Number(e.target.value) as BuildingConfig[typeof key])}
      />
    </div>
  );

  const selectField = <T extends string>(
    key: keyof BuildingConfig,
    label: string,
    options: readonly T[]
  ) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={String(config[key] ?? "")}
        onValueChange={(v) => update(key, v as BuildingConfig[typeof key])}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const numSelectField = (
    key: keyof BuildingConfig,
    label: string,
    options: readonly number[]
  ) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select
        value={String(config[key] ?? "")}
        onValueChange={(v) => update(key, Number(v) as BuildingConfig[typeof key])}
      >
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={String(o)}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Section title="Building" contentClassName="grid grid-cols-2 md:grid-cols-4 gap-3">
          {numField("width", "Width (ft)")}
          {numField("length", "Length (ft)")}
          {numField("height", "Leg Height (ft)")}
          {selectField("roofStyle", "Roof Style", ROOF_STYLES)}
          {selectField("sides", "Side Type", SIDE_OPTIONS)}
          {selectField("sidesPanel", "Side Panel", PANEL_ORIENTATIONS)}
          {numSelectField("sidesQty", "Sides Qty", [0, 1, 2])}
          <div className="hidden md:block" />
          {selectField("ends", "End Type", END_OPTIONS)}
          {selectField("endsPanel", "End Panel", PANEL_ORIENTATIONS)}
          {numSelectField("endsQty", "Ends Qty", [0, 1, 2])}
        </Section>

        <Section title="Loads" contentClassName="grid grid-cols-2 gap-3">
          {selectField("snowLoad", "Snow Load", SNOW_LOAD_OPTIONS)}
          {numSelectField("windMph", "Wind (MPH)", WIND_OPTIONS)}
        </Section>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="py-3">
            <h3 className="text-base font-semibold">Engineering Cost</h3>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {formatCurrency(result.engineeringBreakdown.totalEngineering)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              State: {config.state || "—"} · Region: {result.region}
            </p>
          </CardContent>
        </Card>
        <EngineeringBreakdownPanel breakdown={result.engineeringBreakdown} />
      </div>
    </div>
  );
}
