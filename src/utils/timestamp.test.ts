import dayjs from 'dayjs';
import {
  currentUnixTimestamp,
  formatDateTimeValue,
  isEmptyDateTimeValue,
  isNumericTimestamp,
  toDateTimePickerValue,
  toTimestampMilliseconds,
  toUnixTimestamp,
} from './timestamp';

describe('timestamp utils', () => {
  it('detects empty values and numeric timestamps', () => {
    expect(isEmptyDateTimeValue(undefined)).toBe(true);
    expect(isEmptyDateTimeValue(null)).toBe(true);
    expect(isEmptyDateTimeValue('')).toBe(true);
    expect(isEmptyDateTimeValue(0)).toBe(false);

    expect(isNumericTimestamp(1700000000)).toBe(true);
    expect(isNumericTimestamp('1700000000')).toBe(true);
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

    expect(toUnixTimestamp(dayjs('2026-01-01 00:00:00'))).toBe(
      dayjs('2026-01-01 00:00:00').unix(),
    );
    expect(toUnixTimestamp(new Date('2026-01-01T00:00:00Z'))).toBe(
      Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000),
    );
  });

  it('formats timestamp, date, and datetime values', () => {
    expect(formatDateTimeValue(1700000000, 'YYYY-MM-DD')).toBe(
      dayjs(1700000000 * 1000).format('YYYY-MM-DD'),
    );
    expect(formatDateTimeValue('2026-01-01', 'YYYY-MM-DD')).toBe('2026-01-01');
    expect(formatDateTimeValue('', 'YYYY-MM-DD')).toBe('-');
    expect(formatDateTimeValue('bad-date', 'YYYY-MM-DD')).toBe('-');
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
