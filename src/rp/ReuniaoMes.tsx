import { useEffect, useState } from "react";
import { Landmark, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRP } from "./store";
import { fmtUSD } from "./engine";
import { DIRETRIZES, resumoMensal, reuniaoLocal, type Reuniao } from "./mundo";
import { gerarReuniaoIA } from "./narrador";
import { formatarMes, nomeMes, proximoMes } from "./calendario";
import { mesFechado } from "./calendario";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export function ReuniaoMes({ aberto, onFechar }: Props) {
  const { estado, fecharMes } = useRP();
  const [reuniao, setReuniao] = useState<Reuniao>(() => reuniaoLocal(estado));
  const [carregando, setCarregando] = useState(false);
  const [diretriz, setDiretriz] = useState(DIRETRIZES[0].id);

  const resumo = resumoMensal(estado);
  const podeFechar = mesFechado(estado.calendario);
  const proximo = proximoMes(estado.calendario);
  const iaLigada = estado.config.habilitada;

  useEffect(() => {
    if (!aberto) return;
    setReuniao(reuniaoLocal(estado));
    setDiretriz(DIRETRIZES[0].id);
    if (!iaLigada) return;
    let vivo = true;
    setCarregando(true);
    void gerarReuniaoIA(estado.config, estado)
      .then((r) => {
        if (vivo && r) setReuniao(r);
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });
    return () => {
      vivo = false;
    };
    // o roteiro depende do mês fechado, não de cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, estado.turno]);

  const encerrar = () => {
    if (!podeFechar) return;
    if (fecharMes(diretriz, reuniao.abertura)) onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-gradient-to-r from-blue-950/60 via-card to-card px-6 py-4 text-left">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
            <Landmark className="h-5 w-5 text-ouro" />
            Conselho de Fechamento
            <span className="text-sm font-normal text-muted-foreground">
              {formatarMes(estado.calendario)} · 130º andar
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Fechamento do mês e planejamento do próximo. Os CEOs reportam; você escolhe a diretriz e
            vira o mês.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Receita do mês", valor: resumo.receita, tom: "text-foreground" },
              { label: "Lucro do mês", valor: resumo.lucro, tom: "text-cyan-300" },
              { label: "Caixa hoje", valor: estado.caixa, tom: "text-primary" },
              {
                label: "Dividendo (25%)",
                valor: resumo.lucro * 0.25,
                tom: "text-ouro",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-border/60 bg-background/40 px-3 py-2"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </div>
                <div className={`text-lg font-bold tabular-nums ${c.tom}`}>{fmtUSD(c.valor)}</div>
              </div>
            ))}
          </div>

          {carregando && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Os CEOs estão subindo pro 130º — o conselho está sendo escrito pela IA…
            </div>
          )}

          <div className="rounded-xl border border-ouro/30 bg-ouro/5 p-4">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ouro">
              Ryan Dalbert · Chairman
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{reuniao.abertura}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {reuniao.ceos.map((c) => (
              <div key={c.nome} className="rounded-xl border border-border/60 bg-card/60 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-bold text-foreground">{c.nome}</span>
                  <span className="truncate text-[10px] text-muted-foreground">{c.divisao}</span>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-foreground/80">{c.fala}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-ouro/30 bg-ouro/5 p-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ouro">
                Sofia Mendes · CFO
              </div>
              <p className="text-[12px] leading-snug text-foreground/85">{reuniao.sofia}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                Axiom · Chief of Staff
              </div>
              <p className="text-[12px] leading-snug text-foreground/85">{reuniao.axiom}</p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                Diretriz pro próximo mês
              </span>
              <span className="text-[11px] text-muted-foreground">
                tensão atual {estado.mundo.tensao}/100
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {DIRETRIZES.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDiretriz(d.id)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    diretriz === d.id
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-background/40 hover:border-primary/40"
                  }`}
                >
                  <div className="text-[13px] font-bold">{d.titulo}</div>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {d.descricao}
                  </p>
                  <div className="mt-2 text-[10px] font-semibold text-primary">{d.resumo}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-card px-6 py-3">
          <span className="text-[11px] text-muted-foreground">
            {podeFechar
              ? `Ao encerrar: dividendo de ${fmtUSD(resumo.lucro * 0.25)} pro Ryan e calendário vira ${nomeMes(proximo.mes)} de ${proximo.ano}.`
              : "O mês ainda não fechou. Avance até a semana 4."}
          </span>
          <Button
            onClick={encerrar}
            disabled={!podeFechar}
            className="bg-ouro text-black hover:bg-ouro/90"
          >
            Encerrar reunião · abrir {nomeMes(proximo.mes)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
