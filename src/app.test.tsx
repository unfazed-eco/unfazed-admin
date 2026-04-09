import { getAdminSettings } from '@/services/api';
import { getRouteAndMenuData } from '@/utils/routeManager';

const mockHistory = {
  location: { pathname: '/admin/books' },
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('@umijs/max', () => ({
  history: mockHistory,
}));

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    SettingDrawer: (props: any) => React.createElement('div', props),
  };
});

jest.mock('@/components', () => {
  const React = require('react');
  return {
    AvatarDropdown: ({ children }: any) =>
      React.createElement('div', null, children),
    AvatarName: () => React.createElement('span', null, 'avatar'),
    Footer: () => React.createElement('span', null, 'footer'),
    SelectLang: () => React.createElement('span', null, 'lang'),
  };
});

jest.mock('@/services/api', () => ({
  getAdminSettings: jest.fn(),
}));

jest.mock('@/utils/routeManager', () => ({
  getRouteAndMenuData: jest.fn(),
}));

jest.mock('@ant-design/v5-patch-for-react-19', () => ({}));

describe('app runtime', () => {
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

  it('getInitialState returns logged-in state with settings and menu', async () => {
    const { getInitialState } = require('./app');

    getItemSpy.mockImplementation((key: string) =>
      key === 'userInfo' ? JSON.stringify({ name: 'u1', account: 'u1' }) : null,
    );

    (getAdminSettings as jest.Mock).mockResolvedValue({
      code: 0,
      data: {
        title: 'Admin',
        pageSize: 30,
        timeZone: 'UTC',
        apiPrefix: '/api',
        debug: true,
        version: '1.2.3',
        extra: { a: 1 },
        authPlugins: [{ platform: 'github' }],
      },
    });

    (getRouteAndMenuData as jest.Mock).mockResolvedValue({
      routeList: [{ path: '/books', component: 'ModelAdmin', name: 'book' }],
      menuData: [{ path: '/books', name: 'Books' }],
    });

    const state = await getInitialState();

    expect(state.currentUser).toEqual({ name: 'u1', account: 'u1' });
    expect(state.menuData).toEqual([{ path: '/books', name: 'Books' }]);
    expect(state.routeList).toEqual([
      { path: '/books', component: 'ModelAdmin', name: 'book' },
    ]);
    expect(setItemSpy).toHaveBeenCalledWith(
      'unfazed_app_settings',
      expect.stringContaining('"pageSize":30'),
    );
  });

  it('getInitialState redirects to login when user missing on private page', async () => {
    const { getInitialState } = require('./app');

    mockHistory.location.pathname = '/private';
    getItemSpy.mockReturnValue(null);

    const state = await getInitialState();

    expect(mockHistory.push).toHaveBeenCalledWith('/user/login');
    expect(state.currentUser).toBeUndefined();
  });

  it('getInitialState keeps login page as public route', async () => {
    const { getInitialState } = require('./app');

    mockHistory.location.pathname = '/user/login';
    getItemSpy.mockReturnValue(null);

    const state = await getInitialState();
    expect(mockHistory.push).not.toHaveBeenCalledWith('/user/login');
    expect(state.currentUser).toBeUndefined();
  });

  it('layout exposes menu request and page redirects', async () => {
    const { layout, request } = require('./app');

    const setInitialState = jest.fn();
    const config = layout({
      initialState: {
        currentUser: { name: 'u1' },
        menuData: [{ path: '/books', name: 'Books' }],
        routeList: [
          {
            path: '/parent',
            routes: [{ path: '/first', component: 'ModelAdmin' }],
          },
        ],
        settings: { showWatermark: true },
      },
      setInitialState,
    } as any);

    expect(await config.menu?.request?.()).toEqual([
      { path: '/books', name: 'Books' },
    ]);

    mockHistory.location.pathname = '/';
    config.onPageChange?.();
    expect(mockHistory.replace).toHaveBeenCalledWith('/first');

    const config2 = layout({
      initialState: { currentUser: undefined, routeList: [] },
      setInitialState,
    } as any);

    mockHistory.location.pathname = '/private';
    config2.onPageChange?.();
    expect(mockHistory.push).toHaveBeenCalledWith('/user/login');

    expect(request).toEqual(
      expect.objectContaining({ errorConfig: expect.any(Object) }),
    );
  });
});
