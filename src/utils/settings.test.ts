import {
  defaultAppSettings,
  getApiPrefix,
  getAppSettings,
  getAppVersion,
  getAuthPlugins,
  getDebugMode,
  getExtraSettings,
  getPageSize,
  getTimeZone,
  setAppSettings,
} from './settings';

describe('utils/settings', () => {
  let getItemSpy: jest.SpyInstance;
  let setItemSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('returns default settings when local storage is empty', () => {
    getItemSpy.mockReturnValue(null);
    expect(getAppSettings()).toEqual(defaultAppSettings);
  });

  it('merges saved settings with defaults', () => {
    getItemSpy.mockReturnValue(
      JSON.stringify({ pageSize: 99, debug: true, extra: { a: 1 } }),
    );

    expect(getAppSettings()).toEqual(
      expect.objectContaining({
        pageSize: 99,
        debug: true,
        extra: { a: 1 },
      }),
    );
  });

  it('handles parse errors and save errors', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    getItemSpy.mockReturnValue('{bad json');

    expect(getAppSettings()).toEqual(defaultAppSettings);
    expect(warnSpy).toHaveBeenCalled();

    getItemSpy.mockReturnValue(JSON.stringify(defaultAppSettings));
    setItemSpy.mockImplementation(() => {
      throw new Error('write failed');
    });

    setAppSettings({ pageSize: 30 });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('saves merged settings and supports helper getters', () => {
    getItemSpy.mockReturnValue(
      JSON.stringify({
        ...defaultAppSettings,
        apiPrefix: '/v2',
        timeZone: 'UTC',
        debug: true,
        version: '2.0.0',
        extra: { k: 'v' },
        authPlugins: [{ platform: 'github' }],
      }),
    );

    setAppSettings({ pageSize: 50 });

    expect(setItemSpy).toHaveBeenCalledWith(
      'unfazed_app_settings',
      expect.stringContaining('"pageSize":50'),
    );

    expect(getApiPrefix()).toBe('/v2');
    expect(getPageSize()).toBe(defaultAppSettings.pageSize);
    expect(getTimeZone()).toBe('UTC');
    expect(getDebugMode()).toBe(true);
    expect(getAppVersion()).toBe('2.0.0');
    expect(getExtraSettings()).toEqual({ k: 'v' });
    expect(getAuthPlugins()).toEqual([{ platform: 'github' }]);
  });
});
