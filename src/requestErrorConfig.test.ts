import { message, notification } from 'antd';
import { errorConfig } from './requestErrorConfig';

jest.mock('antd', () => ({
  message: {
    warning: jest.fn(),
    error: jest.fn(),
  },
  notification: {
    open: jest.fn(),
  },
}));

describe('requestErrorConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('errorThrower throws BizError when success=false', () => {
    expect(() =>
      errorConfig.errorConfig?.errorThrower?.({
        success: false,
        data: {},
        errorCode: 400,
        errorMessage: 'bad',
        showType: 2,
      } as any),
    ).toThrow('bad');
  });

  it('errorThrower passes when success=true', () => {
    expect(() =>
      errorConfig.errorConfig?.errorThrower?.({
        success: true,
        data: {},
      } as any),
    ).not.toThrow();
  });

  it('errorHandler handles BizError by showType', () => {
    const handler = errorConfig.errorConfig?.errorHandler as any;

    handler(
      { name: 'BizError', info: { showType: 1, errorMessage: 'warn' } },
      {},
    );
    expect(message.warning).toHaveBeenCalledWith('warn');

    handler(
      { name: 'BizError', info: { showType: 2, errorMessage: 'err' } },
      {},
    );
    expect(message.error).toHaveBeenCalledWith('err');

    handler(
      {
        name: 'BizError',
        info: { showType: 3, errorMessage: 'notify', errorCode: 1001 },
      },
      {},
    );
    expect(notification.open).toHaveBeenCalledWith({
      description: 'notify',
      message: 1001,
    });

    handler(
      { name: 'BizError', info: { showType: 9, errorMessage: 'redirect' } },
      {},
    );

    handler(
      { name: 'BizError', info: { showType: 999, errorMessage: 'fallback' } },
      {},
    );
    expect(message.error).toHaveBeenCalledWith('fallback');
  });

  it('errorHandler handles response/request/generic and skipErrorHandler', () => {
    const handler = errorConfig.errorConfig?.errorHandler as any;

    expect(() => handler(new Error('x'), { skipErrorHandler: true })).toThrow();

    handler({ response: { status: 500 } }, {});
    expect(message.error).toHaveBeenCalledWith('Response status:500');

    handler({ request: {} }, {});
    expect(message.error).toHaveBeenCalledWith('None response! Please retry.');

    handler({}, {});
    expect(message.error).toHaveBeenCalledWith('Request error, please retry.');
  });

  it('request/response interceptors work', () => {
    const req = errorConfig.requestInterceptors?.[0] as any;
    const resp = errorConfig.responseInterceptors?.[0] as any;

    expect(req({ url: '/x', method: 'GET' } as any)).toEqual({
      url: '/x',
      method: 'GET',
    });

    const response = { data: { success: false } };
    expect(resp(response as any)).toBe(response);
    expect(message.error).toHaveBeenCalledWith('请求失败！');
  });
});
