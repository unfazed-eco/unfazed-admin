import { act, fireEvent, render, screen } from '@testing-library/react';
import Register from './index';

const mockHistoryPush = jest.fn();
const mockUseRequest = jest.fn();
const mockRegisterUser = jest.fn();
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
let mockUseRequestOptions: any;

const mockFormItemPropsByName: Record<string, any> = {};
let mockPasswordValue = '';

jest.mock('@umijs/max', () => {
  const React = require('react');
  return {
    history: {
      push: (...args: any[]) => mockHistoryPush(...args),
    },
    Link: ({ to, children }: any) =>
      React.createElement(
        'a',
        { href: to, 'data-testid': 'link-login' },
        children,
      ),
    useRequest: (...args: any[]) => mockUseRequest(...args),
  };
});

jest.mock('antd', () => {
  const React = require('react');

  const Form: any = ({ children, onFinish }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'form' },
      children,
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            onFinish?.({
              mail: 'demo@example.com',
              password: 'abcdef',
              confirm: 'abcdef',
              mobile: '13800138000',
              captcha: '1234',
            }),
        },
        'submit-form',
      ),
    );

  Form.useForm = () => [
    {
      getFieldValue: (name: string) => {
        if (name === 'password') return mockPasswordValue;
        return undefined;
      },
      validateFields: jest.fn(),
    },
  ];

  Form.Item = ({ name, rules, children, ...rest }: any) => {
    if (name) {
      mockFormItemPropsByName[name] = { name, rules, ...rest };
    }
    return React.createElement(
      'div',
      { 'data-testid': name ? `form-item-${name}` : 'form-item' },
      children,
    );
  };

  const Select: any = ({ value, onChange, children }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'select-prefix' },
      React.createElement(
        'div',
        { 'data-testid': 'select-value' },
        String(value),
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange?.('87') },
        'change-prefix',
      ),
      children,
    );

  Select.Option = ({ value, children }: any) =>
    React.createElement('div', { 'data-testid': `option-${value}` }, children);

  const Space: any = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'space' }, children);
  Space.Compact = ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'space-compact' }, children);

  return {
    Button: ({ children, onClick, disabled }: any) =>
      React.createElement(
        'button',
        { type: 'button', onClick, disabled },
        children,
      ),
    Col: ({ children }: any) => React.createElement('div', null, children),
    Form,
    Input: ({ placeholder, onChange, type }: any) =>
      React.createElement('input', {
        placeholder,
        onChange,
        type,
      }),
    message: {
      success: (...args: any[]) => mockMessageSuccess(...args),
      error: (...args: any[]) => mockMessageError(...args),
    },
    Popover: ({ children, content }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'popover' },
        content,
        children,
      ),
    Progress: ({ percent }: any) =>
      React.createElement('div', { 'data-testid': 'progress' }, percent),
    Row: ({ children }: any) => React.createElement('div', null, children),
    Select,
    Space,
  };
});

jest.mock('./styles', () => () => ({
  styles: {
    success: 'success',
    warning: 'warning',
    error: 'error',
    password: 'password',
    main: 'main',
    getCaptcha: 'getCaptcha',
    footer: 'footer',
    submit: 'submit',
    'progress-ok': 'progress-ok',
    'progress-pass': 'progress-pass',
    'progress-poor': 'progress-poor',
  },
}));

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockFormItemPropsByName).forEach((k) => {
      delete mockFormItemPropsByName[k];
    });
    mockPasswordValue = '';

    mockUseRequest.mockImplementation((_service: any, options: any) => {
      mockUseRequestOptions = options;
      return {
        loading: false,
        run: mockRegisterUser,
      };
    });
  });

  it('submits form via registerUser and supports captcha/prefix interactions', async () => {
    jest.useFakeTimers();
    render(<Register />);

    fireEvent.click(screen.getByText('submit-form'));
    expect(mockRegisterUser).toHaveBeenCalledWith({
      mail: 'demo@example.com',
      password: 'abcdef',
      confirm: 'abcdef',
      mobile: '13800138000',
      captcha: '1234',
    });

    expect(screen.getByTestId('select-value').textContent).toBe('86');
    fireEvent.click(screen.getByText('change-prefix'));
    expect(screen.getByTestId('select-value').textContent).toBe('87');

    fireEvent.click(screen.getByText('获取验证码'));
    expect(screen.getByText('59 s')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('58 s')).toBeTruthy();

    jest.useRealTimers();
  });

  it('handles useRequest success and error callbacks', () => {
    render(<Register />);

    mockUseRequestOptions.onSuccess({ code: 0, status: 'ok' }, [
      { mail: 'x@y.z' },
    ]);
    expect(mockMessageSuccess).toHaveBeenCalledWith('注册成功！');
    expect(mockHistoryPush).toHaveBeenCalledWith({
      pathname: '/user/register-result?account=x@y.z',
    });

    mockUseRequestOptions.onSuccess({ code: 1, message: 'bad-register' }, [
      { mail: 'x@y.z' },
    ]);
    expect(mockMessageError).toHaveBeenCalledWith('bad-register');

    mockUseRequestOptions.onError(new Error('network-error'));
    expect(mockMessageError).toHaveBeenCalledWith('注册失败，请重试！');
  });

  it('covers password and confirm validators', async () => {
    render(<Register />);

    const checkPassword = mockFormItemPropsByName.password.rules[0].validator;
    const checkConfirm = mockFormItemPropsByName.confirm.rules[1].validator;

    await expect(checkPassword({}, '')).rejects.toBe('请输入密码!');
    await expect(checkPassword({}, '12345')).rejects.toBe('');
    await expect(checkPassword({}, '123456')).resolves.toBeUndefined();

    mockPasswordValue = 'abcdef';
    await expect(checkConfirm({}, 'abc')).rejects.toBe('两次输入的密码不匹配!');
    await expect(checkConfirm({}, 'abcdef')).resolves.toBeUndefined();
  });
});
