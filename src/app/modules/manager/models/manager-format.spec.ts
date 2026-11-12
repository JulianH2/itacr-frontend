import { CHANNEL_LABELS, STATUS_LABELS, formatDuration, orderChannelLabel } from './manager-format';

describe('manager format', () => {
  it.each([
    [null, '—'],
    [45, '45 s'],
    [60, '1 min'],
    [750, '13 min'],
    [3900, '1 h 05 min'],
    [7200, '2 h 00 min'],
  ])('should write %s seconds as %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });

  it('should name the channels and the statuses in Spanish', () => {
    expect(CHANNEL_LABELS).toEqual({ Waiter: 'Mesero', Pickup: 'Para recoger' });
    expect(STATUS_LABELS.InPreparation).toBe('En preparación');
  });

  it('should say where an order goes', () => {
    expect(orderChannelLabel('MobileApp', null)).toBe('Para recoger');
    expect(orderChannelLabel('DineIn', 5)).toBe('Mesero · Mesa 5');
    expect(orderChannelLabel('TakeAway', null)).toBe('Mesero · Para llevar');
  });
});
