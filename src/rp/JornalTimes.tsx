import { X, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtUSD } from "./engine";
import type { EstadoRP } from "./types";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  estado: EstadoRP;
}

export function JornalTimes({ aberto, onFechar, estado }: Props) {
  const ultima = estado.feed[0];
  const anteriores = estado.feed.slice(1, 5);

  if (!ultima) return null;

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onFechar()}>
      <DialogContent className="flex max-h-[92vh] max-w-5xl flex-col gap-0 overflow-hidden bg-[#faf7f0] text-[#1c1917] p-0 font-serif dark:bg-[#181614] dark:text-[#f2efe9]">
        {/* Top bar do modal */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e5dec9] bg-[#f2ecdd] px-6 py-2.5 dark:border-[#38332d] dark:bg-[#201d19]">
          <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#78716c]">
            EDIÇÃO EXCLUSIVA PARA O CONSELHO · SPACE GROUP
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onFechar}
            className="h-7 w-7 p-0 text-[#78716c] hover:text-[#1c1917] dark:hover:text-[#f2efe9]"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Conteúdo rolável do jornal */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
          {/* CABEÇALHO DO JORNAL */}
          <div className="border-b-4 border-double border-[#1c1917] pb-4 text-center dark:border-[#f2efe9]">
            <div className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-[#78716c]">
              THE GLOBAL FINANCIAL & STRATEGIC CHRONICLE
            </div>
            <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-6xl uppercase">
              The MR Times
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center justify-between border-y border-[#1c1917]/30 py-1 font-sans text-[11px] font-semibold text-[#57534e] dark:border-[#f2efe9]/30 dark:text-[#a8a29e]">
              <span>VOL. VIII · EDIÇÃO Nº {estado.turno + 104}</span>
              <span>{estado.data} · BRASÍLIA / NOVA YORK / ZURIQUE</span>
              <span>PREÇO: $10.00 USD · 0.18 SC</span>
            </div>
          </div>

          {/* CORPO DO JORNAL — 2 COLUNAS PRINCIPAIS + SIDEBAR */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* MANCHETE PRINCIPAL */}
            <div className="space-y-4">
              <div>
                <Badge
                  variant="outline"
                  className="mb-2 font-sans text-[10px] uppercase tracking-wider text-[#b45309] border-[#b45309]/40"
                >
                  Manchete de Capa · Turno {ultima.turno}
                </Badge>
                <h2 className="text-2xl font-black leading-tight sm:text-3xl text-balance">
                  {ultima.titulo}
                </h2>
                {ultima.reacoes.midia && (
                  <p className="mt-1 text-sm italic text-[#78716c]">"{ultima.reacoes.midia}"</p>
                )}
              </div>

              {/* Texto com Drop Cap */}
              <div className="text-[14px] leading-relaxed text-[#292524] dark:text-[#d6d3d1]">
                <p className="first-letter:float-left first-letter:mr-3 first-letter:text-5xl first-letter:font-black first-letter:leading-none whitespace-pre-line">
                  {ultima.cena}
                </p>
              </div>

              {/* Box de Efeitos / Análise Econômica */}
              <div className="rounded-lg border border-[#d6cbaf] bg-[#f5efe1] p-3.5 dark:border-[#3d3730] dark:bg-[#221f1b]">
                <div className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
                  Desdobramentos Oficiais Registrados
                </div>
                <ul className="mt-2 space-y-1 font-sans text-xs">
                  {ultima.efeitos.map((ef, i) => (
                    <li key={i} className="flex gap-2 text-[#44403c] dark:text-[#a8a29e]">
                      <span className="font-bold text-[#b45309]">§</span>
                      <span>{ef}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mercado & Opinião Pública */}
              <div className="grid gap-3 pt-2 sm:grid-cols-2 font-sans text-xs">
                <div className="border-l-2 border-[#1c1917]/40 pl-2.5 dark:border-[#f2efe9]/40">
                  <div className="font-bold uppercase tracking-wide text-[#78716c]">
                    Repercussão no Mercado
                  </div>
                  <div className="mt-0.5 text-[#44403c] dark:text-[#a8a29e]">
                    {ultima.reacoes.mercado || "Volatilidade controlada pelo treasury."}
                  </div>
                </div>
                <div className="border-l-2 border-[#1c1917]/40 pl-2.5 dark:border-[#f2efe9]/40">
                  <div className="font-bold uppercase tracking-wide text-[#78716c]">
                    Voz Pública & Redes
                  </div>
                  <div className="mt-0.5 text-[#44403c] dark:text-[#a8a29e]">
                    {ultima.reacoes.povo || "Aprovação popular estável."}
                  </div>
                </div>
              </div>

              {/* EDIÇÕES ANTERIORES DO JORNAL */}
              {anteriores.length > 0 && (
                <div className="mt-6 border-t border-[#d6cbaf] pt-4 dark:border-[#38332d]">
                  <div className="font-sans text-[11px] font-black uppercase tracking-wider text-[#78716c]">
                    Edições Anteriores · Arquivo Semanal
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {anteriores.map((ant) => (
                      <div
                        key={ant.id}
                        className="rounded-lg border border-[#e5dec9] bg-[#fbf9f4] p-2.5 text-xs dark:border-[#38332d] dark:bg-[#1e1b18]"
                      >
                        <div className="font-sans text-[10px] text-[#78716c]">
                          Turno {ant.turno} · {ant.data}
                        </div>
                        <div className="font-bold leading-snug">{ant.titulo}</div>
                        <p className="mt-1 line-clamp-2 text-[11px] text-[#57534e] dark:text-[#a8a29e]">
                          {ant.cena}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR — INDICADORES FINANCEIROS & ANÁLISE */}
            <aside className="space-y-4 border-l border-[#d6cbaf] pl-6 font-sans dark:border-[#38332d]">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-[#78716c]">
                  Market Watch
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[#e5dec9] pb-1.5 dark:border-[#38332d]">
                    <span className="font-medium text-[#78716c]">Space Coin</span>
                    <span className="font-bold text-[#b45309]">${estado.coin.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#e5dec9] pb-1.5 dark:border-[#38332d]">
                    <span className="font-medium text-[#78716c]">Holding Total</span>
                    <span className="font-bold">{fmtUSD(estado.holding)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#e5dec9] pb-1.5 dark:border-[#38332d]">
                    <span className="font-medium text-[#78716c]">Caixa Livre</span>
                    <span className="font-bold text-[#15803d]">{fmtUSD(estado.caixa)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#e5dec9] pb-1.5 dark:border-[#38332d]">
                    <span className="font-medium text-[#78716c]">Clima Geral</span>
                    <span className="font-bold capitalize">{estado.mundo.clima}</span>
                  </div>
                </div>
              </div>

              {/* ANÁLISE DE RISCO */}
              <div className="rounded-xl border border-[#d6cbaf] bg-[#f5efe1] p-3 text-xs dark:border-[#3d3730] dark:bg-[#221f1b]">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#b45309]">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Termômetro de Risco
                </div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Heat com Órgãos:</span>
                    <span className={`font-bold ${estado.heat > 70 ? "text-red-600" : ""}`}>
                      {estado.heat}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tensão do Conselho:</span>
                    <span className="font-bold">{estado.mundo.tensao}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aprovação Popular:</span>
                    <span className="font-bold">{estado.aprovacao}/100</span>
                  </div>
                </div>
              </div>

              {/* RADAR DE GREENWICH */}
              <div className="rounded-xl border border-[#d6cbaf] bg-[#f5efe1] p-3 text-xs dark:border-[#3d3730] dark:bg-[#221f1b]">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#78716c]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Muralha & Bastidores
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#57534e] dark:text-[#a8a29e]">
                  Sofia Mendes monitora os livros do 130º. A residência de Greenwich segue sob
                  perímetro de segurança absoluta.
                </p>
              </div>

              {/* COLUNA EDITORIAL */}
              <div className="border-t border-[#d6cbaf] pt-3 text-[11px] italic text-[#78716c] dark:border-[#38332d]">
                "O capital nunca dorme no império MR. Cada semana movimenta mais volume do que
                economias inteiras da América Latina."
              </div>
            </aside>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
