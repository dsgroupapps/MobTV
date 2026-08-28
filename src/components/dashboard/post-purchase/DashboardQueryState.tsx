import { AlertCircle, LoaderCircle } from "lucide-react";

export function DashboardLoading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center text-ink-soft" role="status">
      <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden />
      <span className="ml-2 text-sm">{label}</span>
    </div>
  );
}

export function DashboardRouteError({ error }: { error: Error }) {
  return (
    <section className="rounded-lg border border-red/25 bg-white px-6 py-12 text-center">
      <AlertCircle className="mx-auto h-8 w-8 text-red" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold text-navy">Não foi possível carregar esta área</h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink-soft">
        {error.message || "Atualize a página e tente novamente."}
      </p>
    </section>
  );
}
