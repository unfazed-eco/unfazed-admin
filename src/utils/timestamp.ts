import dayjs from 'dayjs';

export const SECONDS_TIMESTAMP_LIMIT = 10000000000;

export const isEmptyDateTimeValue = (value: any) =>
  value === undefined || value === null || value === '';

export const isNumericTimestamp = (value: any) =>
  typeof value === 'number' ||
  (typeof value === 'string' && /^\d+$/.test(value));

export const toTimestampMilliseconds = (value: any) => {
  if (!isNumericTimestamp(value)) return value;

  const numValue = Number(value);
  return numValue > 0 && numValue < SECONDS_TIMESTAMP_LIMIT
    ? numValue * 1000
    : numValue;
};

export const toDateTimePickerValue = (value: any) => {
  if (isEmptyDateTimeValue(value)) return value;

  if (isNumericTimestamp(value)) {
    return dayjs(toTimestampMilliseconds(value));
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : value;
};

export const toUnixTimestamp = (value: any) => {
  if (isEmptyDateTimeValue(value)) return value;

  if (isNumericTimestamp(value)) {
    const numValue = Number(value);
    return numValue > 0 && numValue < SECONDS_TIMESTAMP_LIMIT
      ? numValue
      : Math.floor(numValue / 1000);
  }

  if ((value as any)?.unix) {
    return (value as any).unix();
  }

  if (value instanceof Date) {
    return Math.floor(value.getTime() / 1000);
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.unix() : value;
};

export const currentUnixTimestamp = () => Math.floor(Date.now() / 1000);

export const formatDateTimeValue = (
  value: any,
  format: string,
  fallback = '-',
) => {
  if (isEmptyDateTimeValue(value)) return fallback;

  const parsed = toDateTimePickerValue(value);
  const result = dayjs(parsed);
  return result.isValid() ? result.format(format) : fallback;
};
