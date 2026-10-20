import { Button } from "@/components/ui/button";
import { MEMBROS, BENS, MOMENTOS } from "./familia";

export function FamiliaMR({ onAbrirSofia }: { onAbrirSofia: () => void }) {
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 pb-8">
      {/* FAIXA */}
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-blue-950/50 via-card to-background p-6">
        <h2 className="text-xl font-black tracking-tight">Família MR</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A dinastia que manda no império — Greenwich, trusts e o berçário mais caro do planeta.
        </p>
      </section>

      {/* MEMBROS */}
      <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
          O clã
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {MEMBROS.map((m) => (
            <div
              key={m.id}
              className="flex flex-col rounded-xl border border-border/50 bg-background/40 p-3.5"
            >
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-black text-primary">
                  {m.nome[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold leading-tight">{m.nome}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {m.idade} · {m.papel}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-ouro/40 bg-ouro/10 px-2 py-0.5 text-[10px] font-semibold text-ouro">
                  {m.relacao}
                </span>
              </div>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                {m.traco}
              </div>
              <p className="mt-1 flex-1 text-[12px] leading-snug text-muted-foreground">{m.nota}</p>
              {m.id === "sofia" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2.5 w-fit border-ouro/40 text-ouro hover:bg-ouro/10"
                  onClick={onAbrirSofia}
                >
                  💬 Conversar
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* PATRIMÔNIO DO CLÃ */}
      <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
          A dinastia em números
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {BENS.map((b) => (
            <div key={b.titulo} className="rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {b.titulo}
              </div>
              <div className="mt-0.5 text-lg font-black text-ouro">{b.valor}</div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{b.nota}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOMENTOS */}
      <section className="rounded-2xl border border-border/60 bg-card/60 p-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-primary">
          Momentos do clã
        </h3>
        <div className="space-y-0">
          {MOMENTOS.map((m, i) => (
            <div key={m.quando} className="relative flex gap-3 pb-4">
              <div className="flex w-3 shrink-0 flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 rounded-full border border-primary/60 bg-primary/30" />
                {i < MOMENTOS.length - 1 && <span className="mt-1 w-px flex-1 bg-border/60" />}
              </div>
              <div className="min-w-0 pb-0.5">
                <div className="text-[12px] font-bold">{m.quando}</div>
                <p className="text-[12px] leading-snug text-muted-foreground">{m.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
