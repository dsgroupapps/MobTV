import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CreditCard, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CurrentQuote } from "@/lib/campaign/business";
import { confirmSimulatedPayment } from "@/lib/campaign/functions";
import { clearCompletedCampaignStorage, readCurrentQuote } from "@/lib/campaign/storage";
import { CampaignFlowHeader } from "./CampaignFlowHeader";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function CampaignReviewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmPayment = useServerFn(confirmSimulatedPayment);
  const [quote, setQuote] = useState<CurrentQuote | null>(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedQuote = readCurrentQuote();
    if (!storedQuote) {
      void navigate({ to: "/dashboard/campanhas/nova" });
      return;
    }

    setQuote(storedQuote);
    setTimeLeft(
      Math.max(0, Math.floor((new Date(storedQuote.expires_at).getTime() - Date.now()) / 1000)),
    );
  }, [navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!quote) throw new Error("Dados inválidos.");
      return confirmPayment({ data: { quoteId: quote.id } });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["advertiser-dashboard"] });
      clearCompletedCampaignStorage();
      toast.success(
        result.alreadyCreated
          ? `Pedido #${result.orderId.slice(0, 8).toUpperCase()} já estava criado.`
          : `Pagamento confirmado. Pedido #${result.orderId.slice(0, 8).toUpperCase()} criado.`,
      );
      void navigate({ to: "/dashboard/pedidos" });
    },
    onError: (mutationError) => {
      const message = mutationError instanceof Error ? mutationError.message : "Erro inesperado.";
      setError(message);
      toast.error(`Erro no pagamento: ${message}`);
    },
  });

  if (!quote) {
    return (
      <div className="flex min-h-64 items-center justify-center text-ink-soft">
        <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
        <span className="ml-2 text-sm">Carregando orçamento...</span>
      </div>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="mx-auto max-w-4xl">
      <CampaignFlowHeader currentStep={4} />
      <h1 className="font-display text-3xl font-bold text-navy sm:text-4xl">Revisão</h1>
      <p className="mt-2 text-sm text-ink-soft sm:text-base">Finalize sua contratação.</p>

      <div className="mt-7 space-y-6">
        <section className="rounded-lg border border-border bg-white p-5 sm:p-7">
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-semibold text-navy">
                Orçamento #{quote.id.slice(0, 8).toUpperCase()}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                Válido por mais {minutes}:{seconds.toString().padStart(2, "0")}
              </p>
            </div>
            <Badge
              variant={timeLeft > 300 ? "default" : "destructive"}
              className="self-start shadow-none"
            >
              {timeLeft > 0 ? "Ativo" : "Expirado"}
            </Badge>
          </header>

          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-soft">Período</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {quote.date_start} até {quote.date_end}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-soft">Duração</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {quote.duration_seconds}s por inserção
              </dd>
            </div>
            {quote.total_insertions != null && (
              <div>
                <dt className="text-xs text-ink-soft">Total de inserções</dt>
                <dd className="mt-1 text-sm font-medium text-navy">
                  {quote.total_insertions.toLocaleString("pt-BR")}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-ink-soft">Tipo</dt>
              <dd className="mt-1 text-sm font-medium text-navy">
                {quote.type === "campaign" ? "Campanha" : "Espaço"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-medium text-navy">
                {currencyFormatter.format(quote.total_price)}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-soft">Impostos</span>
              <span className="font-medium text-navy">{currencyFormatter.format(0)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
              <span className="font-semibold text-navy">Total</span>
              <span className="font-display text-2xl font-bold text-navy">
                {currencyFormatter.format(quote.total_price)}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-navy">
            <CreditCard className="h-5 w-5 text-gold-deep" aria-hidden />
            Pagamento fictício
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Esta é uma simulação de checkout. Clique em “Confirmar pagamento” para prosseguir.
          </p>
          <div className="mt-5 space-y-3 rounded-lg bg-off-white p-5">
            {[
              "Processamento instantâneo",
              "Ordem de serviço gerada automaticamente",
              "Upload de mídia liberado após confirmação",
            ].map((item) => (
              <p key={item} className="flex items-center gap-2 text-sm text-navy">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" aria-hidden />
                {item}
              </p>
            ))}
          </div>
        </section>

        {error && (
          <p
            className="rounded-md border border-red/25 bg-red/8 px-4 py-3 text-sm text-red"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate({ to: "/dashboard/campanhas/nova/pontos" })}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={() => paymentMutation.mutate()}
            disabled={timeLeft <= 0 || paymentMutation.isPending}
          >
            {paymentMutation.isPending ? "Processando..." : "Confirmar pagamento"}
            {paymentMutation.isPending && (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
