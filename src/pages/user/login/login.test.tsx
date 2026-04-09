import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './index';

const mockUseModel = jest.fn();
const mockLogin = jest.fn();
const mockGetAdminSettings = jest.fn();
const mockGetRouteAndMenuData = jest.fn();
const mockSetInitialState = jest.fn();

const mockMessage = {
  success: jest.fn(),
  error: jest.fn(),
};

let mockLocationHref = 'http://localhost/user/login';
let mockLocationSearch = '';

jest.mock('@umijs/max', () => {
  const React = require('react');
  return {
    FormattedMessage: ({ defaultMessage }: any) =>
      React.createElement('span', null, defaultMessage),
    Helmet: ({ children }: any) =>
      React.createElement(React.Fragment, null, children),
    SelectLang: () => React.createElement('span', null, 'lang'),
    useIntl: () => ({
      formatMessage: ({ defaultMessage, id }: any) => defaultMessage || id,
    }),
    useModel: (...args: any[]) => mockUseModel(...args),
  };
});

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  const ProFormText = ({ placeholder }: any) =>
    React.createElement('input', {
      placeholder,
      'data-testid': placeholder || 'proform-text',
    });

  ProFormText.Password = ({ placeholder }: any) =>
    React.createElement('input', {
      placeholder,
      type: 'password',
      'data-testid': placeholder || 'proform-password',
    });

  return {
    LoginForm: ({ title, actions, children, onFinish, submitter }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'login-form' },
        React.createElement('div', { 'data-testid': 'login-title' }, title),
        actions,
        children,
        submitter === false
          ? null
          : React.createElement(
              'button',
              {
                type: 'button',
                onClick: () =>
                  onFinish?.({
                    username: 'admin',
                    password: 'pass',
                    platform: 'default',
                  }),
              },
              'submit-login',
            ),
      ),
    ProFormCheckbox: ({ children }: any) =>
      React.createElement('label', null, children),
    ProFormText,
  };
});

jest.mock('antd', () => {
  const React = require('react');
  return {
    App: {
      useApp: () => ({ message: mockMessage }),
    },
    Alert: ({ message }: any) =>
      React.createElement('div', { 'data-testid': 'alert' }, message),
    Tabs: ({ items, onChange }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'tabs' },
        ...(items || []).map((item: any) =>
          React.createElement(
            'button',
            {
              key: item.key,
              type: 'button',
              onClick: () => onChange?.(item.key),
            },
            item.label,
          ),
        ),
      ),
  };
});

jest.mock('antd-style', () => ({
  createStyles: () => () => ({
    styles: {
      action: 'action',
      lang: 'lang',
      container: 'container',
    },
  }),
}));

jest.mock('@/components', () => {
  const React = require('react');
  return {
    Footer: () =>
      React.createElement('div', { 'data-testid': 'footer' }, 'footer'),
  };
});

jest.mock('@/services/api', () => ({
  login: (...args: any[]) => mockLogin(...args),
  getAdminSettings: (...args: any[]) => mockGetAdminSettings(...args),
}));

jest.mock('@/utils/routeManager', () => ({
  getRouteAndMenuData: (...args: any[]) => mockGetRouteAndMenuData(...args),
}));

jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  return {
    ...actual,
    flushSync: (fn: any) => fn(),
  };
});

describe('Login Page', () => {
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
          const idx = value.indexOf('?');
          mockLocationSearch = idx >= 0 ? value.slice(idx) : '';
        },
        get search() {
          return mockLocationSearch;
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
    mockLocationHref = 'http://localhost/user/login';
    mockLocationSearch = '';

    mockUseModel.mockReturnValue({
      initialState: {},
      setInitialState: mockSetInitialState,
    });

    mockGetAdminSettings.mockResolvedValue({
      code: 0,
      data: {
        authPlugins: [{ platform: 'github', icon_url: 'https://icon' }],
        defaultLoginType: true,
        fixSiderbar: true,
        pwa: false,
        iconfontUrl: '',
      },
    });

    mockGetRouteAndMenuData.mockResolvedValue({
      routeList: [{ path: '/books' }],
      menuData: [{ path: '/books', name: 'Books' }],
    });
  });

  it('renders login form and supports oauth icon login', async () => {
    render(<Login />);

    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeTruthy();
      expect(screen.getByTestId('login-title').textContent).toBe(
        'Unfazed Admin',
      );
      expect(screen.getByTitle('使用 github 登录')).toBeTruthy();
    });

    fireEvent.click(screen.getByTitle('使用 github 登录'));
    expect(localStorage.getItem('oauth_platform')).toBe('github');
    expect(mockLocationHref).toContain(
      '/api/auth/oauth-login-redirect?platform=github',
    );
  });

  it('handles login success and updates runtime state', async () => {
    mockLocationHref = 'http://localhost/user/login?redirect=%2Ftarget';
    mockLocationSearch = '?redirect=%2Ftarget';

    mockLogin.mockResolvedValue({
      code: 0,
      data: {
        account: 'demo',
        email: 'demo@example.com',
        roles: [{ name: 'admin' }],
        groups: [],
        extra: { nickname: 'Demo User', avatar: 'http://avatar' },
      },
    });

    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('submit-login')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('submit-login'));

    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith('登录成功！');
      expect(mockSetInitialState).toHaveBeenCalledWith(expect.any(Function));
    });

    expect(mockGetAdminSettings).toHaveBeenCalled();
    expect(mockGetRouteAndMenuData).toHaveBeenCalled();
    expect(localStorage.getItem('userInfo')).toContain('"account":"demo"');
    expect(localStorage.getItem('userSettings')).toContain(
      '"defaultLoginType":true',
    );
    expect(mockLocationHref).toBe('/target');
  });

  it('handles login failure and catch branches', async () => {
    mockLogin.mockResolvedValueOnce({
      code: 1,
      message: 'bad-login',
    });

    render(<Login />);
    await waitFor(() => {
      expect(screen.getByText('submit-login')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('submit-login'));

    await waitFor(() => {
      expect(screen.getByTestId('alert').textContent).toBe(
        '账户或密码错误(admin/ant.design)',
      );
    });

    mockLogin.mockRejectedValueOnce(new Error('network'));
    fireEvent.click(screen.getByText('submit-login'));

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('登录失败，请重试！');
    });
  });
});
