import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Edit, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminEmptyState, AdminPageHeader, AdminReadOnlyNotice } from "./AdminResourceUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminPricingRulesQueryOptions,
  deleteAdminPricingRule,
  saveAdminPricingRule,
} from "@/lib/admin/operations";
import type { AdminOperationalPanel, AdminPricingRule } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";
import { calculateDiscountedPrice } from "@/lib/campaign/business";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function PricingForm({
  rule,
  panels,
  onSaved,
}: {
  rule: AdminPricingRule | null;
  panels: AdminOperationalPanel[];
  onSaved: () => void;
}) {
  const save = useServerFn(saveAdminPricingRule);
  const queryClient = useQueryClient();
  const [panelId, setPanelId] = useState(rule?.panelId ?? "");
  const [durationSeconds, setDurationSeconds] = useState(String(rule?.durationSeconds ?? 15));
  const [basePrice, setBasePrice] = useState(String(rule?.basePrice ?? ""));
  const [discountPct, setDiscountPct] = useState(String(rule?.discountPct ?? 0));
  const [dateStart, setDateStart] = useState(rule?.dateStart ?? "");
  const [dateEnd, setDateEnd] = useState(rule?.dateEnd ?? "");
  const [timeStart, setTimeStart] = useState(rule?.timeStart?.slice(0, 5) ?? "");
  const [timeEnd, setTimeEnd] = useState(rule?.timeEnd?.slice(0, 5) ?? "");
  const [weekday, setWeekday] = useState(rule?.weekday == null ? "all" : String(rule.weekday));
  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: rule?.id,
          panelId,
          durationSeconds: Number(durationSeconds),
          basePrice: Number(basePrice),
          discountPct: Number(discountPct),
          dateStart: dateStart || null,
          dateEnd: dateEnd || null,
          timeStart: timeStart || null,
          timeEnd: timeEnd || null,
          weekday: weekday === "all" ? null : Number(weekday),
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-pricing-rules"] });
      toast.success(rule ? "Regra atualizada." : "Regra criada.");
      onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao salvar."),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="pricing-panel">Painel</Label>
        <select
          id="pricing-panel"
          value={panelId}
          onChange={(event) => setPanelId(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          required
        >
          <option value="">Selecione um painel</option>
          {panels.map((panel) => (
            <option key={panel.id} value={panel.id}>
              {panel.name}
              {panel.active ? "" : " (inativo)"}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pricing-duration">Duração (segundos)</Label>
          <Input
            id="pricing-duration"
            type="number"
            min="1"
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-base">Preço base (R$)</Label>
          <Input
            id="pricing-base"
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(event) => setBasePrice(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pricing-discount">Desconto (%)</Label>
        <Input
          id="pricing-discount"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={discountPct}
          onChange={(event) => setDiscountPct(event.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricing-date-start">Data início (opcional)</Label>
          <Input
            id="pricing-date-start"
            type="date"
            value={dateStart}
            onChange={(event) => setDateStart(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-date-end">Data fim (opcional)</Label>
          <Input
            id="pricing-date-end"
            type="date"
            value={dateEnd}
            onChange={(event) => setDateEnd(event.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricing-time-start">Hora início (opcional)</Label>
          <Input
            id="pricing-time-start"
            type="time"
            value={timeStart}
            onChange={(event) => setTimeStart(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pricing-time-end">Hora fim (opcional)</Label>
          <Input
            id="pricing-time-end"
            type="time"
            value={timeEnd}
            onChange={(event) => setTimeEnd(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pricing-weekday">Dia da semana (opcional)</Label>
        <select
          id="pricing-weekday"
          value={weekday}
          onChange={(event) => setWeekday(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <option value="all">Todos os dias</option>
          {WEEKDAYS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar
        </Button>
      </div>
    </form>
  );
}

export function AdminPricingPage({
  user,
  initialData,
}: {
  user: AuthUser;
  initialData: { panels: AdminOperationalPanel[]; rules: AdminPricingRule[] };
}) {
  const canManage = user.roles.includes("admin");
  const { data } = useQuery({ ...adminPricingRulesQueryOptions(user.id), initialData });
  const remove = useServerFn(deleteAdminPricingRule);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AdminPricingRule | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-pricing-rules"] });
      toast.success("Regra excluída.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Erro ao excluir."),
  });

  function openEditor(rule: AdminPricingRule | null) {
    setEditingRule(rule);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-7">
      <AdminPageHeader
        eyebrow="Preços"
        title="Gerenciamento de preços"
        description="Configure as regras aplicadas por painel, duração, período e horário."
        action={
          canManage ? (
            <Button type="button" onClick={() => openEditor(null)}>
              <Plus className="h-4 w-4" aria-hidden />
              Nova regra
            </Button>
          ) : undefined
        }
      />
      {!canManage && <AdminReadOnlyNotice />}

      {data.rules.length === 0 ? (
        <AdminEmptyState message="Nenhuma regra de preço cadastrada." />
      ) : (
        <div className="space-y-4">
          {data.rules.map((rule) => (
            <article key={rule.id} className="rounded-lg border border-border bg-white p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-lg font-semibold text-navy">{rule.panelName}</h2>
                  <p className="mt-1 text-sm text-ink-soft">Duração: {rule.durationSeconds}s</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Editar regra"
                      onClick={() => openEditor(rule)}
                    >
                      <Edit className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Excluir regra"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja excluir esta regra?")) {
                          deleteMutation.mutate(rule.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs font-medium uppercase text-ink-soft">Preço base</p>
                  <p className="mt-1 text-xl font-bold text-navy">
                    {formatCurrency(rule.basePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-ink-soft">Preço aplicado</p>
                  <p className="mt-1 text-xl font-bold text-teal">
                    {formatCurrency(calculateDiscountedPrice(rule.basePrice, rule.discountPct))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-ink-soft">Período</p>
                  <p className="mt-1 text-sm text-navy">
                    {rule.dateStart && rule.dateEnd
                      ? `${rule.dateStart} até ${rule.dateEnd}`
                      : "Qualquer data"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-ink-soft">Faixa</p>
                  <p className="mt-1 text-sm text-navy">
                    {rule.timeStart && rule.timeEnd
                      ? `${rule.timeStart.slice(0, 5)} - ${rule.timeEnd.slice(0, 5)}`
                      : "Qualquer horário"}
                  </p>
                  {rule.weekday != null && (
                    <Badge variant="secondary" className="mt-2">
                      {WEEKDAYS[rule.weekday]}
                    </Badge>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar regra" : "Nova regra de preço"}</DialogTitle>
            <DialogDescription>
              Critérios opcionais restringem onde a regra é aplicável.
            </DialogDescription>
          </DialogHeader>
          <PricingForm
            key={editingRule?.id ?? "new"}
            rule={editingRule}
            panels={data.panels}
            onSaved={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
