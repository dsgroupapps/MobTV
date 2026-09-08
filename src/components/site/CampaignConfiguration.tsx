import { useEffect, useState } from "react";
import {
  clampSimInput,
  formatCount,
  SIM_LIMITS,
  type CampaignSimInput,
} from "@/lib/planner/audience";
import { INSERTION_REFERENCE_NOTE } from "@/lib/planner/proposal";

function NumberField({
  id,
  label,
  suffix,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const [text, setText] = useState(String(value));

  // Reflete mudanças externas (ex.: estado restaurado da sessão).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-off-white/45">
        {label}
      </span>
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={text}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            if (raw.trim() === "") return;
            onChange(clampInt(raw, min, max));
          }}
          onBlur={() => {
            const next = clampInt(text, min, max);
            setText(String(next));
            onChange(next);
          }}
          className="h-11 w-24 rounded-lg border border-white/10 bg-navy px-3 font-display text-lg font-semibold text-white outline-none transition-colors hover:border-white/20 focus:border-gold"
        />
        <span className="text-sm text-white/50">{suffix}</span>
      </span>
    </label>
  );
}

function clampInt(raw: string, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

/** Disponível mesmo quando nenhum serviço possui audiência individual. */
export function CampaignConfiguration({
  sim,
  onSimChange,
  hasDooh,
}: {
  sim: CampaignSimInput;
  onSimChange: (next: CampaignSimInput) => void;
  hasDooh: boolean;
}) {
  const safeSim = clampSimInput(sim);
  return (
    <section
      data-campaign-configuration
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
        Configuração da campanha
      </h3>
      <div className="mt-4 flex flex-wrap gap-6">
        <NumberField
          id="sim-days"
          label="Duração"
          suffix="dias"
          value={safeSim.days}
          min={SIM_LIMITS.days.min}
          max={SIM_LIMITS.days.max}
          onChange={(days) => onSimChange({ ...safeSim, days })}
        />
        {hasDooh && (
          <NumberField
            id="sim-insertions"
            label="Inserções desejadas DOOH por dia"
            suffix="/ dia"
            value={safeSim.insertionsPerDay}
            min={SIM_LIMITS.insertionsPerDay.min}
            max={SIM_LIMITS.insertionsPerDay.max}
            onChange={(insertionsPerDay) => onSimChange({ ...safeSim, insertionsPerDay })}
          />
        )}
      </div>
      {hasDooh ? (
        <div className="mt-5">
          <p className="font-display text-3xl font-bold text-gold">
            {formatCount(safeSim.days * safeSim.insertionsPerDay)}
          </p>
          <p className="mt-1 text-sm text-white/70">inserções de referência</p>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            {INSERTION_REFERENCE_NOTE} Inserções não equivalem a acessos WiFi nem calculam a entrega
            de impactos do anúncio.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          O formato e o volume de WiFi Ads serão definidos na proposta comercial. A duração e os
          serviços selecionados já fazem parte da solicitação.
        </p>
      )}
    </section>
  );
}
