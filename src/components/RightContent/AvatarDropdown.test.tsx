import { render, screen } from '@testing-library/react';
import { AvatarDropdown, AvatarName } from './AvatarDropdown';

const mockUseModel = jest.fn();
const mockHistoryPush = jest.fn();
const mockHistoryReplace = jest.fn();
const mockOutLogin = jest.fn();
let mockHeaderDropdownProps: any;

jest.mock('@umijs/max', () => ({
  useModel: (...args: any[]) => mockUseModel(...args),
  history: {
    push: (...args: any[]) => mockHistoryPush(...args),
    replace: (...args: any[]) => mockHistoryReplace(...args),
  },
}));

jest.mock('antd', () => {
  const React = require('react');
  return {
    Spin: () => React.createElement('div', { 'data-testid': 'spin' }, 'spin'),
  };
});

jest.mock('antd-style', () => ({
  createStyles: () => () => ({
    styles: {
      action: 'action',
    },
  }),
}));

jest.mock('@/services/api', () => ({
  outLogin: (...args: any[]) => mockOutLogin(...args),
}));

jest.mock('../HeaderDropdown', () => {
  const React = require('react');
  return (props: any) => {
    mockHeaderDropdownProps = props;
    return React.createElement(
      'div',
      { 'data-testid': 'header-dropdown' },
      props.children,
    );
  };
});

describe('AvatarDropdown', () => {
  const originalLocation = window.location;

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: 'http://localhost/admin',
        pathname: '/admin',
        search: '?x=1',
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
    mockHeaderDropdownProps = undefined;
  });

  it('AvatarName renders current user name', () => {
    mockUseModel.mockReturnValue({
      initialState: { currentUser: { name: 'Alice' } },
    });
    render(<AvatarName />);
    expect(screen.getByText('Alice')).toBeTruthy();
  });

  it('shows loading when state or user is not ready', () => {
    mockUseModel.mockReturnValueOnce({
      initialState: undefined,
      setInitialState: jest.fn(),
    });
    const { rerender } = render(<AvatarDropdown />);
    expect(screen.getByTestId('spin')).toBeTruthy();

    mockUseModel.mockReturnValueOnce({
      initialState: { currentUser: {} },
      setInitialState: jest.fn(),
    });
    rerender(<AvatarDropdown />);
    expect(screen.getByTestId('spin')).toBeTruthy();
  });

  it('handles menu clicks and logout flow', async () => {
    const setInitialState = jest.fn();
    mockUseModel.mockReturnValue({
      initialState: { currentUser: { name: 'Alice' } },
      setInitialState,
    });
    localStorage.setItem(
      'userInfo',
      JSON.stringify({ extra: { platform: 'github' } }),
    );
    localStorage.setItem('userSettings', '{"x":1}');

    render(<AvatarDropdown menu={true}>child</AvatarDropdown>);
    expect(screen.getByTestId('header-dropdown')).toBeTruthy();

    expect(mockHeaderDropdownProps.menu.items.map((i: any) => i.key)).toEqual([
      'center',
      'settings',
      undefined,
      'logout',
    ]);

    mockHeaderDropdownProps.menu.onClick({ key: 'settings' });
    expect(mockHistoryPush).toHaveBeenCalledWith('/account/settings');

    await mockHeaderDropdownProps.menu.onClick({ key: 'logout' });
    expect(localStorage.getItem('userInfo')).toBeNull();
    expect(localStorage.getItem('userSettings')).toBeNull();
    expect(setInitialState).toHaveBeenCalledWith(expect.any(Function));
    expect(mockOutLogin).toHaveBeenCalledWith(undefined);
    expect(mockHistoryReplace).toHaveBeenCalledWith({
      pathname: '/user/login',
      search: 'redirect=%2Fadmin%3Fx%3D1',
    });
  });

  it('logout tolerates malformed user info and existing redirect', async () => {
    const setInitialState = jest.fn();
    mockUseModel.mockReturnValue({
      initialState: { currentUser: { name: 'Alice' } },
      setInitialState,
    });
    localStorage.setItem('userInfo', '{bad-json');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: 'http://localhost/admin?redirect=%2Fx',
        pathname: '/admin',
        search: '',
      },
    });

    render(<AvatarDropdown menu={false}>child</AvatarDropdown>);
    await mockHeaderDropdownProps.menu.onClick({ key: 'logout' });
    expect(mockOutLogin).toHaveBeenCalledWith(undefined);
    expect(mockHistoryReplace).not.toHaveBeenCalled();
  });
});
