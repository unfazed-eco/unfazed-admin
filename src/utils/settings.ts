import defaultLayoutSettings from '../../config/defaultSettings';

/**
 * App-level settings type definition
 */
export interface AppSettings {
  pageSize: number;
  timeZone: string;
  apiPrefix: string;
  debug: boolean;
  version: string;
  extra?: Record<string, any>;
  authPlugins?: Record<string, any>[];
}

/**
 * Default app settings
 */
export const defaultAppSettings: AppSettings = {
  pageSize: 20,
  timeZone: 'UTC',
  apiPrefix: '/api',
  debug: false,
  version: '1.0.0',
  extra: {},
  authPlugins: [],
};

/**
 * Read app settings
 * @returns AppSettings
 */
export const getAppSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem('unfazed_app_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultAppSettings, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to parse app settings from localStorage:', error);
  }
  return defaultAppSettings;
};

/**
 * Update app settings
 * @param settings Partial or complete app settings
 */
export const setAppSettings = (settings: Partial<AppSettings>): void => {
  try {
    const current = getAppSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem('unfazed_app_settings', JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save app settings to localStorage:', error);
  }
};

/**
 * Get API prefix
 * @returns string
 */
export const getApiPrefix = (): string => {
  return getAppSettings().apiPrefix;
};

/**
 * Get page size
 * @returns number
 */
export const getPageSize = (): number => {
  return getAppSettings().pageSize;
};

/**
 * Get time zone
 * @returns string
 */
export const getTimeZone = (): string => {
  return getAppSettings().timeZone;
};

/**
 * Get debug mode
 * @returns boolean
 */
export const getDebugMode = (): boolean => {
  return getAppSettings().debug;
};

/**
 * Get app version
 * @returns string
 */
export const getAppVersion = (): string => {
  return getAppSettings().version;
};

/**
 * Get extra settings
 * @returns Record<string, any>
 */
export const getExtraSettings = (): Record<string, any> => {
  return getAppSettings().extra || {};
};

/**
 * Get auth plugin settings
 * @returns Record<string, any>[]
 */
export const getAuthPlugins = (): Record<string, any>[] => {
  return getAppSettings().authPlugins || [];
};

/**
 * Update the browser tab favicon
 */
export const setDocumentFavicon = (href?: string): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const iconHref = href || defaultLayoutSettings.logo;
  let link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);
  }

  link.href = iconHref;
};
