import { render, waitFor } from '@testing-library/react';
import OAuthLogin from './index';

const mockUseModel = jest.fn();
const mockLogin = jest.fn();
const mockGetAdminSettings = jest.fn();
const mockGetRouteAndMenuData = jest.fn();

const mockMessage = {
  loading: jest.fn(),
  destroy: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

const mockSetInitialState = jest.fn();
let mockLocationHref = 'http://localhost/oauth/login';
let mockLocationSearch = '';

jest.mock('@umijs/max', () => ({
  useModel: (...args: any[]) => mockUseModel(...args),
}));

jest.mock('antd', () => {
  const React = require('react');
  return {
    App: {
      useApp: () => ({ message: mockMessage }),
    },
    Spin: () => React.createElement('div', { 'data-testid': 'spin' }, 'spin'),
  };
});

jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    flushSync: (fn: any) => fn(),
  };
});

jest.mock('@/services/api', () => ({
  login: (...args: any[]) => mockLogin(...args),
  getAdminSettings: (...args: any[]) => mockGetAdminSettings(...args),
}));

jest.mock('@/utils/routeManager', () => ({
  getRouteAndMenuData: (...args: any[]) => mockGetRouteAndMenuData(...args),
}));

describe('OAuth login page', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        get href() {
          return mockLocationHref;
        },
        set href(value: string) {
          mockLocationHref = value;
        },
        get search() {
          return mockLocationSearch;
        },
        set search(value: string) {
          mockLocationSearch = value;
        },
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLocationHref = 'http://localhost/oauth/login';
    mockLocationSearch = '';

    mockUseModel.mockReturnValue({
      setInitialState: mockSetInitialState,
    });
    mockGetAdminSettings.mockResolvedValue({
      code: 0,
      data: {
        title: 'Admin',
        fixSiderbar: true,
        pwa: false,
        iconfontUrl: '',
        authPlugins: [{ platform: 'github' }],
      },
    });
    mockGetRouteAndMenuData.mockResolvedValue({
      routeList: [{ path: '/books' }],
      menuData: [{ path: '/books', name: 'Books' }],
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('handles oauth error in callback params', async () => {
    mockLocationSearch = '?error=access_denied';
    localStorage.setItem('oauth_platform', 'github');

    render(<OAuthLogin />);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith(
        'OAuth登录失败: access_denied',
      );
    });
    expect(localStorage.getItem('oauth_platform')).toBeNull();
    expect(mockLocationHref).toContain('/user/login');
  });

  it('handles oauth login success and updates runtime state', async () => {
    mockLocationSearch =
      '?code=abc&state=%7B%22source%22%3A%22test%22%7D&foo=bar';
    localStorage.setItem('oauth_platform', 'github');

    mockLogin.mockResolvedValue({
      code: 0,
      data: {
        account: 'demo',
        email: 'demo@example.com',
        roles: [{ name: 'admin' }],
        groups: [],
        extra: {
          nickname: 'Demo User',
          avatar: 'http://avatar',
        },
      },
    });

    render(<OAuthLogin />);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockMessage.success).toHaveBeenCalledWith('OAuth登录成功！');
    });

    expect(mockGetAdminSettings).toHaveBeenCalled();
    expect(mockGetRouteAndMenuData).toHaveBeenCalled();
    expect(localStorage.getItem('userInfo')).toContain('"account":"demo"');
    expect(localStorage.getItem('userSettings')).toContain('"title":"Admin"');
    expect(localStorage.getItem('authPlugins')).toContain('github');
    expect(localStorage.getItem('oauth_platform')).toBeNull();

    expect(mockSetInitialState).toHaveBeenCalledWith(expect.any(Function));
    const updater = mockSetInitialState.mock.calls[0][0];
    const next = updater({ old: true });
    expect(next.currentUser.account).toBe('demo');
    expect(next.menuData).toEqual([{ path: '/books', name: 'Books' }]);
    expect(next.routeList).toEqual([{ path: '/books' }]);
    expect(mockLocationHref).toContain('/');
  });

  it('handles oauth login failure and exception branches', async () => {
    mockLocationSearch = '?code=bad';
    localStorage.setItem('oauth_platform', 'github');
    mockLogin.mockResolvedValueOnce({
      code: 1,
      message: 'bad-login',
    });

    render(<OAuthLogin />);
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('bad-login');
    });

    await waitFor(() => {
      expect(localStorage.getItem('oauth_platform')).toBeNull();
    });
    jest.advanceTimersByTime(2000);
    expect(mockLocationHref).toContain('/user/login');

    mockLocationHref = 'http://localhost/oauth/login';
    mockLocationSearch = '?code=throw';
    localStorage.setItem('oauth_platform', 'github');
    mockLogin.mockRejectedValueOnce(new Error('network-error'));

    render(<OAuthLogin />);
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith(
        'OAuth登录处理失败，请重试',
      );
    });
    jest.advanceTimersByTime(2000);
    expect(mockLocationHref).toContain('/user/login');
  });
});
