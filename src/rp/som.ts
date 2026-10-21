/**
 * Motor de áudio sintetizado para o RP (Web Audio API).
 * Não depende de arquivos externos — gera pads ambientais em tempo real.
 * Modos:
 *  - "torre": drone corporativo executivo (Succession style, acordes menores quentes)
 *  - "casa": lo-fi noturno suave para Greenwich (acordes quentes e ondas calmas)
 *  - "crise": pulso tenso e urgente quando heat >= 75
 */

type ModoAudio = "torre" | "casa" | "crise";

class GeradorSons {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private osciladores: OscillatorNode[] = [];
  private modoAtual: ModoAudio | null = null;
  private ativo = false;
  private volume = 0.08;

  public isAtivo(): boolean {
    return this.ativo;
  }

  public alternar(localizacao: string, heat: number): boolean {
    if (this.ativo) {
      this.parar();
      return false;
    } else {
      this.iniciar(localizacao, heat);
      return true;
    }
  }

  public iniciar(localizacao: string, heat: number) {
    if (this.ativo) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.ativo = true;
      this.atualizar(localizacao, heat);
    } catch {
      this.ativo = false;
    }
  }

  public parar() {
    this.limparOsciladores();
    if (this.ctx) {
      try {
        void this.ctx.close();
      } catch {
        // no-op
      }
      this.ctx = null;
    }
    this.masterGain = null;
    this.ativo = false;
    this.modoAtual = null;
  }

  public atualizar(localizacao: string, heat: number) {
    if (!this.ativo || !this.ctx || !this.masterGain) return;

    let proximoModo: ModoAudio = "torre";
    if (heat >= 75) {
      proximoModo = "crise";
    } else if (localizacao === "casa") {
      proximoModo = "casa";
    }

    if (this.modoAtual === proximoModo) return;
    this.modoAtual = proximoModo;
    this.montarAmbiente(proximoModo);
  }

  private limparOsciladores() {
    for (const osc of this.osciladores) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // no-op
      }
    }
    this.osciladores = [];
  }

  private montarAmbiente(modo: ModoAudio) {
    if (!this.ctx || !this.masterGain) return;
    this.limparOsciladores();

    const agora = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.connect(this.masterGain);

    if (modo === "casa") {
      // Greenwich: filtro suave, frequências confortáveis de piano/rhodes (Dó maior / Lá menor suave)
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, agora);

      const notas = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3
      notas.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, agora);

        // LFO sutil para ondulação relaxante
        g.gain.setValueAtTime(0.2 / notas.length, agora);
        osc.connect(g);
        g.connect(filter);
        osc.start(agora + idx * 0.1);
        this.osciladores.push(osc);
      });
    } else if (modo === "crise") {
      // Crise: batimento sombrio, pulsação grave em 55Hz (A1) e 110Hz (A2)
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, agora);

      const oscBass = this.ctx.createOscillator();
      const gainBass = this.ctx.createGain();
      oscBass.type = "sawtooth";
      oscBass.frequency.setValueAtTime(55, agora);
      gainBass.gain.setValueAtTime(0.3, agora);
      oscBass.connect(gainBass);
      gainBass.connect(filter);
      oscBass.start();
      this.osciladores.push(oscBass);

      const oscPulse = this.ctx.createOscillator();
      const gainPulse = this.ctx.createGain();
      oscPulse.type = "triangle";
      oscPulse.frequency.setValueAtTime(110, agora);
      gainPulse.gain.setValueAtTime(0.15, agora);
      oscPulse.connect(gainPulse);
      gainPulse.connect(filter);
      oscPulse.start();
      this.osciladores.push(oscPulse);
    } else {
      // Torre executiva: drone atmosférico de luxo (Dó menor / Mi bemol menor)
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, agora);

      const freqs = [65.41, 130.81, 155.56, 196.0]; // C2, C3, Eb3, G3
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, agora);
        g.gain.setValueAtTime(0.22 / freqs.length, agora);
        osc.connect(g);
        g.connect(filter);
        osc.start(agora + idx * 0.05);
        this.osciladores.push(osc);
      });
    }
  }
}

export const motorAudio = new GeradorSons();
