import { Injectable, signal } from '@angular/core';

/** Two rising tones: loud enough for a kitchen, short enough not to pile up when several orders arrive. */
const ALERT_TONES_HZ = [880, 1175] as const;
const TONE_SECONDS = 0.18;
const TONE_GAP_SECONDS = 0.04;
const PEAK_GAIN = 0.4;

/**
 * Plays the new order alert. Browsers block sound until the user touches the page, so the board shows an
 * "Activar sonido" button that calls {@link enable}; until then {@link play} does nothing. The tones are generated with
 * the Web Audio API, so there is no audio file to cache.
 */
@Injectable()
export class KitchenAlertService {
  private context: AudioContext | null = null;

  readonly isSupported = typeof AudioContext !== 'undefined';
  readonly isEnabled = signal(false);

  /** Unlocks the audio (must run from a click or tap) and plays the alert once, so the kitchen hears what to expect. */
  enable(): void {
    if (!this.isSupported) {
      return;
    }
    this.context ??= new AudioContext();
    void this.context.resume();
    this.isEnabled.set(true);
    this.play();
  }

  play(): void {
    const context = this.context;
    if (!this.isEnabled() || context === null) {
      return;
    }
    ALERT_TONES_HZ.forEach((frequency, index) => {
      const start = context.currentTime + index * (TONE_SECONDS + TONE_GAP_SECONDS);
      this.tone(context, frequency, start);
    });
  }

  private tone(context: AudioContext, frequency: number, start: number): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + TONE_SECONDS);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + TONE_SECONDS);
  }
}
