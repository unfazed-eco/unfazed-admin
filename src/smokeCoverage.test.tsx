import { fireEvent, render, screen } from '@testing-library/react';

const React = require('react');

const mockHistoryPush = jest.fn();

jest.mock('@umijs/max', () => {
  const React = require('react');
  return {
    history: {
      push: (...args: any[]) => mockHistoryPush(...args),
    },
    useIntl: () => ({
      formatMessage: ({ id }: any) => id,
    }),
    Link: ({ to, children }: any) =>
      React.createElement('a', { href: to }, children),
    useSearchParams: () => [new URLSearchParams('account=smoke@example.com')],
    SelectLang: () =>
      React.createElement('span', { 'data-testid': 'umi-lang' }, 'lang'),
  };
});

jest.mock('@ant-design/icons', () => {
  const React = require('react');
  return {
    GithubOutlined: () => React.createElement('span', null, 'github'),
    CloseCircleOutlined: () => React.createElement('span', null, 'close'),
    RightOutlined: () => React.createElement('span', null, 'right'),
    DingdingOutlined: () => React.createElement('span', null, 'ding'),
  };
});

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  const GridContent = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'grid' }, children);
  const DefaultFooter = ({ copyright }: any) =>
    React.createElement('div', { 'data-testid': 'default-footer' }, copyright);
  return {
    GridContent,
    DefaultFooter,
  };
});

jest.mock('antd-style', () => ({
  createStyles: () => () => ({
    styles: {
      dropdown: 'dropdown',
      title: 'title',
      error_icon: 'error_icon',
      actions: 'actions',
      registerResult: 'registerResult',
    },
  }),
}));

jest.mock('antd', () => {
  const React = require('react');
  const Descriptions: any = ({ children, title }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'descriptions' },
      React.createElement('div', null, title),
      children,
    );
  Descriptions.Item = ({ children, label }: any) =>
    React.createElement('div', null, `${label}:${children}`);

  const Steps: any = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'steps' }, children);
  Steps.Step = ({ title }: any) => React.createElement('div', null, title);

  return {
    Button: ({ children, onClick }: any) =>
      React.createElement('button', { type: 'button', onClick }, children),
    Card: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'card' }, children),
    Result: ({ status, title, subTitle, extra, children }: any) =>
      React.createElement(
        'div',
        { 'data-testid': `result-${status}` },
        React.createElement('div', null, title),
        React.createElement('div', null, subTitle),
        extra,
        children,
      ),
    Skeleton: () =>
      React.createElement('div', { 'data-testid': 'skeleton' }, 'skeleton'),
    Dropdown: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'dropdown' }, children),
    Descriptions,
    Steps,
  };
});

describe('smoke coverage modules', () => {
  it('covers access/loading/footer/header/locales/utils exports', () => {
    const access = require('./access').default;
    expect(access({ currentUser: { access: 'admin' } }).canAdmin).toBe(true);
    expect(access({ currentUser: { access: 'user' } }).canAdmin).toBe(false);

    const Loading = require('./loading').default;
    render(React.createElement(Loading));
    expect(screen.getByTestId('skeleton')).toBeTruthy();

    const Footer = require('./components/Footer').default;
    render(React.createElement(Footer));
    expect(screen.getByTestId('default-footer').textContent).toContain(
      'Powered by Unfazed Eco',
    );

    const HeaderDropdown = require('./components/HeaderDropdown').default;
    render(React.createElement(HeaderDropdown, { menu: { items: [] } }));
    expect(screen.getByTestId('dropdown')).toBeTruthy();

    const { SelectLang } = require('./components/RightContent');
    render(React.createElement(SelectLang));
    expect(screen.getByTestId('umi-lang')).toBeTruthy();

    const en = require('./locales/en-US').default;
    const zh = require('./locales/zh-CN').default;
    expect(en['navBar.lang']).toBeTruthy();
    expect(zh['navBar.lang']).toBeTruthy();
  });

  it('covers common result/exception pages and style modules', () => {
    const NotFound = require('./pages/404').default;
    render(React.createElement(NotFound));
    fireEvent.click(screen.getByText('pages.404.buttonText'));
    expect(mockHistoryPush).toHaveBeenCalled();

    const E403 = require('./pages/exception/403').default;
    const E404 = require('./pages/exception/404').default;
    const E500 = require('./pages/exception/500').default;
    render(React.createElement(E403));
    render(React.createElement(E404));
    render(React.createElement(E500));
    expect(screen.getByText('403')).toBeTruthy();
    expect(screen.getAllByText('404').length).toBeGreaterThan(0);
    expect(screen.getAllByText('500').length).toBeGreaterThan(0);

    const FailResult = require('./pages/result/fail').default;
    const SuccessResult = require('./pages/result/success').default;
    render(React.createElement(FailResult));
    render(React.createElement(SuccessResult));
    expect(screen.getByText('提交失败')).toBeTruthy();
    expect(screen.getByText('提交成功')).toBeTruthy();

    const RegisterResult = require('./pages/user/register-result').default;
    render(React.createElement(RegisterResult));
    expect(screen.getByText(/smoke@example.com 注册成功/)).toBeTruthy();

    const failStyles = require('./pages/result/fail/index.style').default;
    const successStyles = require('./pages/result/success/index.style').default;
    const registerStyles = require('./pages/user/register/styles').default;
    const registerResultStyles =
      require('./pages/user/register-result/style.style').default;
    expect(failStyles).toBeTruthy();
    expect(successStyles).toBeTruthy();
    expect(registerStyles).toBeTruthy();
    expect(registerResultStyles).toBeTruthy();
  });
});
