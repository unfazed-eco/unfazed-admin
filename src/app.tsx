import type { Settings as LayoutSettings } from '@ant-design/pro-components';

// Extend LayoutSettings with custom fields
interface ExtendedLayoutSettings extends LayoutSettings {
  showWatermark?: boolean;
  favicon?: string;
}

import { SettingDrawer } from '@ant-design/pro-components';
import { AvatarDropdown, AvatarName, Footer, SelectLang } from '@/components';
import { getAdminSettings } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';
import { setDocumentFavicon } from '@/utils/settings';
import '@ant-design/v5-patch-for-react-19';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import { PATH_PREFIX } from '../config/constants';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

// Route and icon conversion helpers live in routeManager.ts

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<ExtendedLayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  menuData?: any[];
  routeList?: API.AdminRoute[]; // Keep the raw route data
}> {
  const fetchUserInfo = async () => {
    try {
      // Read user info from localStorage instead of calling currentUser API
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo) as API.CurrentUser;
      }
    } catch (_error) {
      console.warn('Failed to parse user info from localStorage:', _error);
    }

    // Redirect to login only when user info is missing outside auth pages
    const { location } = history;
    if (
      ![
        loginPath,
        `/${PATH_PREFIX}/user/register`,
        `/${PATH_PREFIX}/user/register-result`,
      ].includes(location.pathname)
    ) {
      history.push(loginPath);
    }
    return undefined;
  };

  const fetchSettings = async () => {
    try {
      const response = await getAdminSettings({
        skipErrorHandler: true,
      });
      if (response.code === 0) {
        const apiData = response.data;

        // Split ProLayout fields from app-level settings
        const layoutSettings = {
          // Fields supported directly by ProLayout
          title: apiData.title || defaultSettings.title,
          logo: apiData.logo || defaultSettings.logo,
          favicon:
            apiData.iconfontUrl ||
            apiData.favicon ||
            apiData.logo ||
            defaultSettings.logo,
          navTheme: apiData.navTheme,
          colorPrimary: apiData.colorPrimary,
          layout: apiData.layout,
          contentWidth: apiData.contentWidth,
          fixedHeader: apiData.fixedHeader,
          fixSiderbar: apiData.fixSiderbar ?? defaultSettings.fixSiderbar,
          colorWeak: apiData.colorWeak,
          // Frontend-only fields
          pwa: apiData.pwa ?? defaultSettings.pwa,
          // Watermark control
          showWatermark: apiData.showWatermark ?? true,
        };
        setDocumentFavicon(layoutSettings.favicon);

        // Persist app-level settings to localStorage
        const appSettings = {
          pageSize: apiData.pageSize,
          timeZone: apiData.timeZone,
          apiPrefix: apiData.apiPrefix,
          debug: apiData.debug,
          version: apiData.version,
          extra: apiData.extra ?? apiData.EXTRA,
          authPlugins: apiData.authPlugins,
        };

        // Save app-level settings to localStorage
        try {
          localStorage.setItem(
            'unfazed_app_settings',
            JSON.stringify(appSettings),
          );
        } catch (error) {
          console.warn('Failed to save app settings to localStorage:', error);
        }

        return layoutSettings as any;
      }
    } catch (_error) {
      console.warn('Failed to fetch settings, using default settings');
    }
    setDocumentFavicon(defaultSettings.iconfontUrl || defaultSettings.logo);
    return defaultSettings as Partial<ExtendedLayoutSettings>;
  };

  const fetchMenuData = async () => {
    try {
      const { routeList, menuData } = await getRouteAndMenuData();
      return { routeList, menuData };
    } catch (_error) {
      console.warn('Failed to fetch menu data, using default menu');
    }
    return { routeList: [], menuData: [] };
  };

  // Check login state outside auth pages
  const { location } = history;
  if (
    ![
      loginPath,
      `/${PATH_PREFIX}/user/register`,
      `/${PATH_PREFIX}/user/register-result`,
      `/${PATH_PREFIX}/oauth/login`,
    ].includes(location.pathname)
  ) {
    const currentUser = await fetchUserInfo();
    if (currentUser) {
      // User is logged in, load API settings and dynamic route data
      // Dynamic routes are fetched only after login to preserve access control
      const settings = await fetchSettings();
      const { routeList, menuData } = await fetchMenuData();
      return {
        fetchUserInfo,
        currentUser,
        settings,
        menuData,
        routeList,
      };
    }
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<ExtendedLayoutSettings>,
      menuData: [],
      routeList: [],
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
    menuData: [],
    routeList: [],
  };
}

// ProLayout API: https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  const {
    favicon: _favicon,
    iconfontUrl: _iconfontUrl,
    ...layoutSettings
  } = initialState?.settings || {};

  return {
    actionsRender: () => [<SelectLang key="selectLang" />],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    // Use dynamic menu data
    menu: {
      request: async () => {
        return initialState?.menuData || [];
      },
    },
    waterMarkProps:
      initialState?.settings?.showWatermark !== false
        ? {
            content: initialState?.currentUser?.name,
          }
        : undefined,
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      if (
        location.pathname === '/' ||
        location.pathname === `/${PATH_PREFIX}`
      ) {
        const getFirst = (routes: API.AdminRoute[] = []): string | null => {
          for (const r of routes) {
            if (r.routes?.length) {
              const child = getFirst(r.routes);
              if (child) return child;
            } else if (r.path && r.component) {
              return r.path;
            }
          }
          return null;
        };
        const first = getFirst(initialState?.routeList || []);
        if (first) history.replace(first);
        return;
      }
      // Redirect to login if no user is available
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: [],
    menuHeaderRender: undefined,
    // Custom 403 page
    // unAccessible: <div>unAccessible</div>,
    // Add an explicit loading state
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...layoutSettings,
  };
};

/**
 * @name request configuration with centralized error handling
 * Built on axios and ahooks useRequest for a unified request/error flow.
 * @doc https://umijs.org/docs/max/request#configuration
 */
export const request: RequestConfig = {
  // Use relative paths in development; production can point to a concrete API host
  // baseURL: process.env.NODE_ENV === 'development' ? '' : 'your-production-api-url',
  ...errorConfig,
};
