import type { Settings as LayoutSettings } from '@ant-design/pro-components';

// 扩展 LayoutSettings 以包含我们的自定义字段
interface ExtendedLayoutSettings extends LayoutSettings {
  showWatermark?: boolean;
}

import { SettingDrawer } from '@ant-design/pro-components';
import { AvatarDropdown, AvatarName, Footer, SelectLang } from '@/components';
import { getAdminSettings } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';
import '@ant-design/v5-patch-for-react-19';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import React from 'react';
import { PATH_PREFIX } from '../config/constants';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

// 路由和图标转换函数已移动到 routeManager.ts 中

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<ExtendedLayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  menuData?: any[];
  routeList?: API.AdminRoute[]; // 添加原始路由数据
}> {
  const fetchUserInfo = async () => {
    try {
      // 从本地存储获取用户信息，而不是调用 currentUser API
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        return JSON.parse(userInfo) as API.CurrentUser;
      }
    } catch (_error) {
      console.warn('Failed to parse user info from localStorage:', _error);
    }

    // 如果没有用户信息且不在登录相关页面，才跳转到登录页
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

        // 分离ProLayout需要的字段和应用级别的字段
        const layoutSettings = {
          // ProLayout直接支持的字段
          title: apiData.title || defaultSettings.title,
          logo: apiData.logo || defaultSettings.logo,
          navTheme: apiData.navTheme,
          colorPrimary: apiData.colorPrimary,
          layout: apiData.layout,
          contentWidth: apiData.contentWidth,
          fixedHeader: apiData.fixedHeader,
          fixSiderbar: apiData.fixSiderbar ?? defaultSettings.fixSiderbar,
          colorWeak: apiData.colorWeak,
          // 前端特有字段
          pwa: apiData.pwa ?? defaultSettings.pwa,
          iconfontUrl: apiData.iconfontUrl ?? defaultSettings.iconfontUrl,
          // 水印控制字段
          showWatermark: apiData.showWatermark ?? true,
        };

        // 应用级别的配置存储到localStorage
        const appSettings = {
          pageSize: apiData.pageSize,
          timeZone: apiData.timeZone,
          apiPrefix: apiData.apiPrefix,
          debug: apiData.debug,
          version: apiData.version,
          extra: apiData.extra,
          authPlugins: apiData.authPlugins,
        };

        // 存储应用级别配置到localStorage
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

  // 如果不是登录相关页面，检查用户登录状态
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
      // 用户已登录，获取API设置和动态路由数据
      // 注意：动态路由只在用户登录后获取，确保权限控制
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

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [<SelectLang key="selectLang" />],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    // 使用动态菜单数据
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
      // 如果没有登录，重定向到 login
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
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
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
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  // 在开发环境使用相对路径，生产环境可以配置具体API地址
  // baseURL: process.env.NODE_ENV === 'development' ? '' : 'your-production-api-url',
  ...errorConfig,
};
