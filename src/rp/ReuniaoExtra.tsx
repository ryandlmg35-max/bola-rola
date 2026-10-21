import { CalendarCheck, Check, FileText, Gavel, MapPin, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRP } from "./store";
import { fmtUSD } from "./engine";
import { localPorId, nomeLocal } from "./viagens";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

/**
 * Reunião extra: não é o fechamento mensal e não move número. É a cena de
 * chegar, sentar, ouvir a pauta e sair com a ata — o mapa só existe pra isso.
 */
export function ReuniaoExtra({ aberto, onFechar }: Props) {
  const estado = useRP((s) => s.estado);
  const encerrarReuniao = useRP((s) => s.encerrarReuniao);
  const reuniao = estado.reuniaoAtual;
  if (!reuniao) return null;

  const local = localPorId(reuniao.localId);
  const sofiaNaMesa = reuniao.participantes.some((p) => p.startsWith("Sofia"));
  const divisao = estado.divisoes.find((d) => d.id === reuniao.localId);
  const conflito = estado.mundo.conflitos[0];
  const pauta = [
    `Caixa livre de ${fmtUSD(estado.caixa)} e cartão corporativo com ${fmtUSD(estado.cartao)}.`,
    `Tensão do conselho em ${estado.mundo.tensao}/100 — clima: ${estado.mundo.clima}.`,
    conflito
      ? `Atrito na mesa: ${conflito.entre} × ${conflito.sobre} (nível ${conflito.nivel}).`
      : "Nenhum atrito aberto. Aproveitar enquanto a sala está silenciosa.",
    divisao
      ? `Foco: ${divisao.nome} — ${divisao.status}. ${divisao.nota}`
      : `Foco: alinhar ${reuniao.participantes.length} participantes e sair com uma decisão só.`,
  ];

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border/60 bg-card px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-ouro" />
            {reuniao.titulo}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-ouro" />
              {nomeLocal(local)}
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="h-3 w-3 text-ouro" />
              {reuniao.quando}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3 text-ouro" />
              {reuniao.participantes.join(" · ")}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <div className="rounded-xl border border-ouro/35 bg-ouro/5 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-ouro">
              <FileText className="h-3.5 w-3.5" /> Pauta
            </div>
            <ul className="space-y-2">
              {pauta.map((linha, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-snug text-foreground/85">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ouro/15 text-[9px] font-bold text-ouro">
                    {i + 1}
                  </span>
                  {linha}
                </li>
              ))}
            </ul>
          </div>

          <div className={sofiaNaMesa ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}>
            {sofiaNaMesa && (
              <div className="rounded-xl border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ouro/20 text-[11px] font-black text-ouro">
                    S
                  </span>
                  <div>
                    <div className="text-[11px] font-bold">Sofia Mendes</div>
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      CFO · números primeiro
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                  “{fmtUSD(estado.caixa)} em caixa e {estado.mundo.tensao}/100 de tensão. Eu não
                  assino nada sem número, e nenhum número aqui fecha sem você olhar pra mim.”
                </p>
              </div>
            )}

            <div className="rounded-xl border border-border/50 bg-background/40 p-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[11px] font-black text-primary">
                  A
                </span>
                <div>
                  <div className="text-[11px] font-bold">Axiom</div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    Chief of Staff · pauta
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                “Sala pronta, boss man. {reuniao.participantes.length}{" "}
                {reuniao.participantes.length === 1 ? "pessoa" : "pessoas"}, uma pauta e zero
                paciência pra discurso. Começo pela briga ou pelo dinheiro?”
              </p>
            </div>
          </div>

          {divisao && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/40 p-3">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {divisao.nome}
              </Badge>
              <span className="text-[11px] text-muted-foreground">{divisao.nota}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" />A reunião não custa uma semana; a ata
              entra no chat do Axiom.
            </span>
            <Button
              onClick={() => {
                encerrarReuniao();
                onFechar();
              }}
              className="bg-ouro font-bold text-black hover:bg-ouro/90"
            >
              <FileText className="mr-1 h-4 w-4" /> Registrar ata
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
