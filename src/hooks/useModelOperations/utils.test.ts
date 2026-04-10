import { buildSearchConditions, getStoredSettings } from './utils';

describe('useModelOperations/utils', () => {
  let getItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
  });

  afterEach(() => {
    getItemSpy.mockRestore();
  });

  it('getStoredSettings returns parsed value', () => {
    getItemSpy.mockReturnValue('{"pageSize":50}');
    expect(getStoredSettings()).toEqual({ pageSize: 50 });
  });

  it('getStoredSettings returns empty object on invalid json', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    getItemSpy.mockReturnValue('{bad');
    expect(getStoredSettings()).toEqual({});
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('buildSearchConditions returns empty when no modelDesc', () => {
    expect(buildSearchConditions({ name: 'a' }, undefined)).toEqual([]);
  });

  it('builds conditions across normal and range fields', () => {
    const modelDesc = {
      attrs: { search_range_fields: ['price', 'created_at', 'title_range'] },
      fields: {
        title: { field_type: 'CharField' },
        status: { field_type: 'CharField', choices: [['ON', 'ON']] },
        count: { field_type: 'IntegerField' },
        ratio: { field_type: 'FloatField' },
        enabled: { field_type: 'BooleanField' },
        event_date: { field_type: 'DateField' },
        time_at: { field_type: 'DatetimeField' },
        misc: { field_type: 'Unknown' },
        price: { field_type: 'FloatField' },
        created_at: { field_type: 'DatetimeField' },
        title_range: { field_type: 'CharField' },
      },
    } as any;

    const fakeDate = { format: jest.fn(() => '2026-01-02') };
    const fakeStartTime = { unix: jest.fn(() => 1700000001) };
    const fakeEndTime = { unix: jest.fn(() => 1700000002) };

    const conditions = buildSearchConditions(
      {
        current: 1,
        pageSize: 20,
        _timestamp: 123,
        title: 'hello',
        status: 'ON',
        count: '3',
        ratio: '1.5',
        enabled: true,
        event_date: fakeDate,
        time_at: fakeStartTime,
        misc: 99,
        price: [10, 20],
        created_at: [fakeStartTime, fakeEndTime],
        title_range: ['a', 'z'],
        unknownField: 'ignore',
      },
      modelDesc,
    );

    expect(conditions).toEqual(
      expect.arrayContaining([
        { field: 'title', icontains: 'hello' },
        { field: 'status', eq: 'ON' },
        { field: 'count', eq: 3 },
        { field: 'ratio', eq: 1.5 },
        { field: 'enabled', eq: 1 },
        { field: 'event_date', eq: '2026-01-02' },
        { field: 'time_at', eq: 1700000001 },
        { field: 'misc', eq: 99 },
        { field: 'price', gte: 10 },
        { field: 'price', lte: 20 },
        { field: 'created_at', gte: 1700000001 },
        { field: 'created_at', lte: 1700000002 },
        { field: 'title_range', gte: 'a' },
        { field: 'title_range', lte: 'z' },
      ]),
    );
  });

  it('handles date/datetime range and empty edge cases', () => {
    const modelDesc = {
      attrs: { search_range_fields: ['date_range'] },
      fields: {
        date_range: { field_type: 'DateField' },
        dt_range: { field_type: 'DatetimeField' },
        text: { field_type: 'TextField' },
      },
    } as any;

    const startDate = { format: jest.fn(() => '2026-02-01') };
    const endDate = { format: jest.fn(() => '2026-02-03') };
    const startDt = { unix: jest.fn(() => 1710000000) };
    const endDt = { unix: jest.fn(() => 1710000100) };

    const conditions = buildSearchConditions(
      {
        date_range: [startDate, endDate],
        dt_range: [startDt, endDt],
        text: 'k1',
        empty1: '',
        empty2: null,
        empty3: undefined,
      },
      modelDesc,
    );

    expect(conditions).toEqual(
      expect.arrayContaining([
        { field: 'date_range', gte: '2026-02-01' },
        { field: 'date_range', lte: '2026-02-03' },
        { field: 'dt_range', gte: 1710000000 },
        { field: 'dt_range', lte: 1710000100 },
        { field: 'text', icontains: 'k1' },
      ]),
    );
  });

  it('handles DateField/DatetimeField non-range branches and boolean false', () => {
    const modelDesc = {
      attrs: { search_range_fields: [] },
      fields: {
        event_date: { field_type: 'DateField' },
        event_dt: { field_type: 'DatetimeField' },
        enabled: { field_type: 'BooleanField' },
      },
    } as any;

    const conditions = buildSearchConditions(
      {
        event_date: new Date('2026-01-01T00:00:00Z').toISOString(),
        event_dt: new Date('2026-01-01T12:00:00Z'),
        enabled: false,
      },
      modelDesc,
    );

    expect(conditions).toEqual(
      expect.arrayContaining([
        { field: 'enabled', eq: 0 },
        {
          field: 'event_dt',
          eq: Math.floor(new Date('2026-01-01T12:00:00Z').getTime() / 1000),
        },
      ]),
    );
  });
});
