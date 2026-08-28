import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS = ["Configuração", "Pontos", "Horários", "Revisão"] as const;

export function CampaignFlowHeader({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-[11px] font-medium uppercase text-gold-deep">/ Criar campanha</p>
      <div className="mt-5 grid grid-cols-4 gap-2" aria-label={`Etapa ${currentStep} de 4`}>
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          return (
            <div key={step} className="min-w-0">
              <div
                className={cn("h-1 rounded-full bg-border", (isComplete || isCurrent) && "bg-gold")}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-ink-soft",
                    isComplete && "border-teal bg-teal text-navy",
                    isCurrent && "border-gold bg-gold text-navy",
                  )}
                >
                  {isComplete ? <Check className="h-3 w-3" aria-hidden /> : stepNumber}
                </span>
                <span
                  className={cn(
                    "truncate text-[11px] text-ink-soft sm:text-xs",
                    isCurrent && "font-semibold text-navy",
                  )}
                >
                  {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
