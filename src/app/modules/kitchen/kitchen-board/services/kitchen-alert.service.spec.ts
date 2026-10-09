import { KitchenAlertService } from './kitchen-alert.service';

/** Counts the oscillators the service starts, without needing real audio. */
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  readonly currentTime = 0;
  readonly destination = {};
  readonly resume = vi.fn(() => Promise.resolve());
  readonly started: number[] = [];

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createOscillator(): object {
    return {
      type: 'sine',
      frequency: { value: 0 },
      connect: (): void => undefined,
      start: (time: number): number => this.started.push(time),
      stop: (): void => undefined,
    };
  }

  createGain(): object {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: (): void => undefined,
    };
  }
}

describe('KitchenAlertService', () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should stay silent until the user enables the sound', () => {
    // Arrange
    const service = new KitchenAlertService();

    // Act
    service.play();

    // Assert
    expect(service.isEnabled()).toBe(false);
    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('should unlock the audio and play the alert once when it is enabled', () => {
    // Arrange
    const service = new KitchenAlertService();

    // Act
    service.enable();

    // Assert
    const [context] = FakeAudioContext.instances;
    expect(service.isEnabled()).toBe(true);
    expect(context.resume).toHaveBeenCalledOnce();
    expect(context.started).toHaveLength(2);
  });

  it('should play both tones of the alert when a new order arrives after enabling', () => {
    // Arrange
    const service = new KitchenAlertService();
    service.enable();
    const [context] = FakeAudioContext.instances;

    // Act
    service.play();

    // Assert
    expect(context.started).toHaveLength(4);
    expect(FakeAudioContext.instances).toHaveLength(1);
  });

  it('should do nothing when the browser has no Web Audio', () => {
    // Arrange
    vi.stubGlobal('AudioContext', undefined);
    const service = new KitchenAlertService();

    // Act
    service.enable();

    // Assert
    expect(service.isSupported).toBe(false);
    expect(service.isEnabled()).toBe(false);
  });
});
