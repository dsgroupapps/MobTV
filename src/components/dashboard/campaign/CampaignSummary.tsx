import type { CampaignBrief } from "@/lib/campaign/business";

type CampaignSummaryProps = {
  quoteData: CampaignBrief;
  selectedLabel: string;
  selectedCount: number;
};

export function CampaignSummary({ quoteData, selectedLabel, selectedCount }: CampaignSummaryProps) {
  return (
    <section className="rounded-lg border border-border bg-white px-5 py-4 sm:px-6">
      <h2 className="text-sm font-semibold text-navy">Resumo da campanha</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-soft">Período</dt>
          <dd className="mt-1 text-sm font-medium text-navy">
            {quoteData.date_start} até {quoteData.date_end}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-ink-soft">Duração</dt>
          <dd className="mt-1 text-sm font-medium text-navy">{quoteData.duration_seconds}s</dd>
        </div>
        {quoteData.total_insertions != null && (
          <div>
            <dt className="text-xs text-ink-soft">Inserções</dt>
            <dd className="mt-1 text-sm font-medium text-navy">
              {quoteData.total_insertions.toLocaleString("pt-BR")}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-ink-soft">{selectedLabel}</dt>
          <dd className="mt-1 text-sm font-medium text-navy">{selectedCount}</dd>
        </div>
      </dl>
    </section>
  );
}
