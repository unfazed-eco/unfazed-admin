/**
 * Pure utility functions for model operations
 * These functions have no React dependencies and can be used anywhere
 */

import {
  isEmptyDateTimeValue,
  isNumericTimestamp,
  toUnixTimestamp,
} from '@/utils/timestamp';

const isValidUnixTimestamp = (value: any): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * Get stored settings from localStorage
 */
export const getStoredSettings = (): Record<string, any> => {
  try {
    const settings = localStorage.getItem('admin-settings');
    return settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('Failed to parse stored settings:', error);
    return {};
  }
};

/**
 * Build search conditions from form values
 * @param searchValues - Form search values
 * @param modelDesc - Model description
 * @returns Array of search conditions
 */
export const buildSearchConditions = (
  searchValues: any,
  modelDesc?: API.AdminSerializeModel,
): API.Condition[] => {
  if (!modelDesc) return [];

  const conditions: API.Condition[] = [];

  // strip pagination params
  const {
    current: _c,
    pageSize: _s,
    _timestamp: _t,
    ...searchParams
  } = searchValues;

  // Get search_range_fields fields
  const searchRangeFields = (modelDesc.attrs as any)?.search_range_fields || [];

  Object.entries(searchParams).forEach(([field, value]) => {
    if (value === undefined || value === null || value === '') return;

    const fieldConfig = modelDesc.fields[field];
    if (!fieldConfig) return;

    const condition: API.Condition = { field };

    // Check if this field is in search_range_fields
    const isRangeField = searchRangeFields.includes(field);

    // Handle search_range_fields fields with range values
    if (isRangeField) {
      // Normalize value to array format [start, end]
      let start: any;
      let end: any;

      if (Array.isArray(value)) {
        [start, end] = value;
      } else {
        // If value is not array, treat as single value (use as gte)
        start = value;
        end = undefined;
      }

      switch (fieldConfig.field_type) {
        case 'CharField':
          if (start !== undefined && start !== null && start !== '') {
            conditions.push({ field, gte: String(start) } as any);
          }
          if (end !== undefined && end !== null && end !== '') {
            conditions.push({ field, lte: String(end) } as any);
          }
          break;

        case 'IntegerField':
        case 'FloatField':
          // Number range search
          if (start !== undefined && start !== null && start !== '') {
            conditions.push({ field, gte: Number(start) } as any);
          }
          if (end !== undefined && end !== null && end !== '') {
            conditions.push({ field, lte: Number(end) } as any);
          }
          break;

        case 'DateField':
          // Date range search
          if (start) {
            const startStr =
              (start as any)?.format?.('YYYY-MM-DD') || String(start);
            conditions.push({ field, gte: startStr } as any);
          }
          if (end) {
            const endStr = (end as any)?.format?.('YYYY-MM-DD') || String(end);
            conditions.push({ field, lte: endStr } as any);
          }
          break;

        case 'DatetimeField':
          // Datetime range search - use timestamp (seconds)
          if (!isEmptyDateTimeValue(start)) {
            const startTimestamp = toUnixTimestamp(start);
            if (isValidUnixTimestamp(startTimestamp)) {
              conditions.push({ field, gte: startTimestamp } as any);
            }
          }
          if (!isEmptyDateTimeValue(end)) {
            const endTimestamp = toUnixTimestamp(end);
            if (isValidUnixTimestamp(endTimestamp)) {
              conditions.push({ field, lte: endTimestamp } as any);
            }
          }
          break;

        default:
          break;
      }
      return;
    }

    // if the field is in attrs.search_fields, prefer eq for text
    switch (fieldConfig.field_type) {
      case 'CharField':
      case 'TextField':
        if (fieldConfig.choices && fieldConfig.choices.length > 0) {
          condition.eq = String(value);
        } else {
          condition.icontains = String(value);
        }
        break;

      case 'IntegerField':
      case 'FloatField':
        condition.eq = Number(value);
        break;

      case 'BooleanField':
        condition.eq = value ? 1 : 0;
        break;

      case 'DateField':
        if (Array.isArray(value) && value.length === 2) {
          // range
          const [start, end] = value;
          if (start && end) {
            conditions.push(
              {
                field,
                gte: (start as any)?.format?.('YYYY-MM-DD') || String(start),
              } as any,
              {
                field,
                lte: (end as any)?.format?.('YYYY-MM-DD') || String(end),
              } as any,
            );
          }
          return;
        } else if ((value as any)?.format) {
          condition.eq = (value as any).format('YYYY-MM-DD') as any;
        }
        break;

      case 'DatetimeField':
        if (Array.isArray(value) && value.length === 2) {
          // range - use timestamp (seconds)
          const [start, end] = value;
          if (!isEmptyDateTimeValue(start)) {
            const startTs = toUnixTimestamp(start);
            if (isValidUnixTimestamp(startTs)) {
              conditions.push({ field, gte: startTs } as any);
            }
          }
          if (!isEmptyDateTimeValue(end)) {
            const endTs = toUnixTimestamp(end);
            if (isValidUnixTimestamp(endTs)) {
              conditions.push({ field, lte: endTs } as any);
            }
          }
          return;
        } else if (
          typeof (value as any)?.unix === 'function' ||
          isNumericTimestamp(value) ||
          value instanceof Date
        ) {
          // Single datetime value - use timestamp
          const timestamp = toUnixTimestamp(value);
          if (isValidUnixTimestamp(timestamp)) {
            condition.eq = timestamp as any;
          }
        }
        break;

      default:
        if (typeof value === 'string' || typeof value === 'number') {
          condition.eq = value as any;
        }
    }

    if (
      condition.eq !== undefined ||
      (condition as any).lt !== undefined ||
      (condition as any).lte !== undefined ||
      (condition as any).gt !== undefined ||
      (condition as any).gte !== undefined ||
      (condition as any).contains !== undefined ||
      (condition as any).icontains !== undefined
    ) {
      conditions.push(condition);
    }
  });

  return conditions;
};
