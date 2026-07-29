import dayjs from 'dayjs';
import {
  currentUnixTimestamp,
  formatDateTimeValue,
  isEmptyDateTimeValue,
  isNumericTimestamp,
  toDateTimePickerValue,
  toDisplayDateTimePickerValue,
  toTimestampMilliseconds,
  toUnixTimestamp,
} from './timestamp';

describe('timestamp utils', () => {
  beforeEach(() => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ timeZone: 'UTC+8' }),
    );
  });

  it('detects empty values and numeric timestamps', () => {
    expect(isEmptyDateTimeValue(undefined)).toBe(true);
    expect(isEmptyDateTimeValue(null)).toBe(true);
    expect(isEmptyDateTimeValue('')).toBe(true);
    expect(isEmptyDateTimeValue(0)).toBe(false);

    expect(isNumericTimestamp(1700000000)).toBe(true);
    expect(isNumericTimestamp('1700000000')).toBe(true);
    expect(isNumericTimestamp(Number.NaN)).toBe(false);
    expect(isNumericTimestamp('2026-01-01')).toBe(false);
  });

  it('normalizes second and millisecond timestamps', () => {
    expect(toTimestampMilliseconds(1700000000)).toBe(1700000000000);
    expect(toTimestampMilliseconds('1700000000')).toBe(1700000000000);
    expect(toTimestampMilliseconds(1700000000000)).toBe(1700000000000);

    expect(toUnixTimestamp(1700000000)).toBe(1700000000);
    expect(toUnixTimestamp('1700000000')).toBe(1700000000);
    expect(toUnixTimestamp(1700000000000)).toBe(1700000000);
  });

  it('converts date-like values to dayjs and unix seconds', () => {
    const value = toDateTimePickerValue('2026-01-01 00:00:00');
    expect(value.valueOf()).toBe(dayjs('2026-01-01 00:00:00').valueOf());

    expect(toUnixTimestamp(new Date('2026-01-01T00:00:00Z'))).toBe(
      Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000),
    );
  });

  it('reinterprets picker dayjs in the configured time zone (UTC+8)', () => {
    // The user selected wall-clock '2026-01-01 00:00:00' under UTC+8.
    // The picker dayjs may carry the browser-local zone, so the conversion
    // must rely only on the wall-clock, not on the browser time zone.
    const pickerValue = dayjs('2026-01-01 00:00:00');

    // UTC+8 wall-clock '2026-01-01 00:00:00' == UTC '2025-12-31 16:00:00'
    expect(toUnixTimestamp(pickerValue)).toBe(
      dayjs.utc('2025-12-31 16:00:00').unix(),
    );
  });

  it('interprets bare datetime strings in the configured time zone (UTC+8)', () => {
    // A bare (no zone) wall-clock string must be interpreted in the configured
    // time zone, mirroring the display layer, instead of the browser zone.
    // UTC+8 wall-clock '2026-01-01 00:00:00' == UTC '2025-12-31 16:00:00'
    expect(toUnixTimestamp('2026-01-01 00:00:00')).toBe(
      dayjs.utc('2025-12-31 16:00:00').unix(),
    );
  });

  it('keeps zoned datetime strings at their embedded offset', () => {
    // A string that already carries an offset must be read at that offset,
    // regardless of the configured time zone.
    expect(toUnixTimestamp('2026-01-01T00:00:00Z')).toBe(
      dayjs.utc('2026-01-01T00:00:00Z').unix(),
    );
  });

  it('reinterprets picker dayjs in a negative configured time zone (UTC-5)', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ timeZone: 'UTC-5' }),
    );

    // UTC-5 wall-clock '2026-01-01 00:00:00' == UTC '2026-01-01 05:00:00'
    expect(toUnixTimestamp(dayjs('2026-01-01 00:00:00'))).toBe(
      dayjs.utc('2026-01-01 05:00:00').unix(),
    );
  });

  it('round-trips a timestamp through display and back for UTC+8', () => {
    const original = 1700000000; // 2023-11-14 22:13:20 UTC
    const display = toDisplayDateTimePickerValue(original) as dayjs.Dayjs;
    expect(display.format('YYYY-MM-DD HH:mm:ss')).toBe('2023-11-15 06:13:20');

    // Feeding the displayed picker value back must reproduce the original ts.
    expect(toUnixTimestamp(display)).toBe(original);
  });

  it('returns picker dayjs values unchanged to avoid display jumps on input', () => {
    // A dayjs emitted by the picker on manual input carries the browser-local
    // zone. convertValue must pass it through untouched; reinterpreting its
    // instant in the configured zone would make the displayed wall-clock jump
    // whenever the browser zone differs from the configured one.
    const pickerValue = dayjs('2026-01-01 09:00:00');
    expect(toDisplayDateTimePickerValue(pickerValue)).toBe(pickerValue);
  });

  it('returns null for invalid datetime values', () => {
    expect(toUnixTimestamp('bad-date')).toBeNull();
    expect(toUnixTimestamp(Number.NaN)).toBeNull();
    expect(toUnixTimestamp(new Date('bad-date'))).toBeNull();
    expect(toUnixTimestamp(dayjs('bad-date'))).toBeNull();
  });

  it('formats timestamp, date, and datetime values', () => {
    expect(formatDateTimeValue(1700000000, 'YYYY-MM-DD HH:mm:ss')).toBe(
      '2023-11-15 06:13:20',
    );
    expect(formatDateTimeValue('2026-01-01', 'YYYY-MM-DD')).toBe('2026-01-01');
    expect(
      formatDateTimeValue('2026-01-01T00:00:00Z', 'YYYY-MM-DD HH:mm:ss'),
    ).toBe('2026-01-01 00:00:00');
    expect(
      formatDateTimeValue('2026-01-01 00:00:00', 'YYYY-MM-DD HH:mm:ss'),
    ).toBe('2026-01-01 08:00:00');
    expect(
      formatDateTimeValue('2026-01-01T00:00:00+05:30', 'YYYY-MM-DD HH:mm:ss'),
    ).toBe('2026-01-01 00:00:00');
    expect(formatDateTimeValue('', 'YYYY-MM-DD')).toBe('-');
    expect(formatDateTimeValue('bad-date', 'YYYY-MM-DD')).toBe('-');
  });

  it('converts picker display values using configured time zone', () => {
    const numeric = toDisplayDateTimePickerValue(1700000000);
    expect(numeric?.format('YYYY-MM-DD HH:mm:ss')).toBe('2023-11-15 06:13:20');

    const iso = toDisplayDateTimePickerValue('2026-01-01T00:00:00Z');
    expect(iso?.format('YYYY-MM-DD HH:mm:ss')).toBe('2026-01-01 00:00:00');
  });

  it('keeps UTC display in UTC instead of browser local time', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ timeZone: 'UTC' }),
    );

    expect(formatDateTimeValue(1700000000, 'YYYY-MM-DD HH:mm:ss')).toBe(
      '2023-11-14 22:13:20',
    );
  });

  it('returns the current unix timestamp in seconds', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    expect(currentUnixTimestamp()).toBe(
      Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000),
    );

    jest.useRealTimers();
  });
});
