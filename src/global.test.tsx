const mockMessageWarning = jest.fn();
const mockNotificationOpen = jest.fn();
const mockNotificationDestroy = jest.fn();

describe('global runtime bootstrap', () => {
  const originalMessageChannel = global.MessageChannel;
  const originalCaches = (global as any).caches;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.MessageChannel = originalMessageChannel;
    (global as any).caches = originalCaches;
  });

  it('registers pwa listeners and reloads service worker after update', async () => {
    const listenerMap: Record<string, any> = {};
    const addEventListenerSpy = jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event: any, handler: any) => {
        listenerMap[event] = handler;
      });

    const deleteCacheMock = jest.fn().mockResolvedValue(true);
    (global as any).caches = {
      keys: jest.fn().mockResolvedValue(['k1', 'k2']),
      delete: deleteCacheMock,
    };

    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        reload: reloadMock,
      },
    });

    class MockChannel {
      port1: any;
      port2: any;
      constructor() {
        this.port1 = {
          onmessage: null,
        };
        this.port2 = {
          postMessage: (data: any) => {
            if (this.port1.onmessage) {
              this.port1.onmessage({ data });
            }
          },
        };
      }
    }
    // @ts-expect-error
    global.MessageChannel = MockChannel;

    jest.doMock('../config/defaultSettings', () => ({
      __esModule: true,
      default: { pwa: true },
    }));
    jest.doMock('@umijs/max', () => ({
      useIntl: () => ({
        formatMessage: ({ id }: any) => `i18n:${id}`,
      }),
    }));
    jest.doMock('antd', () => {
      const React = require('react');
      return {
        Button: ({ onClick, children }: any) =>
          React.createElement('button', { onClick }, children),
        message: { warning: (...args: any[]) => mockMessageWarning(...args) },
        notification: {
          open: (...args: any[]) => mockNotificationOpen(...args),
          destroy: (...args: any[]) => mockNotificationDestroy(...args),
        },
      };
    });

    require('./global');

    listenerMap['sw.offline']();
    expect(mockMessageWarning).toHaveBeenCalledWith('i18n:app.pwa.offline');

    const worker = {
      postMessage: (_msg: any, ports: any[]) => {
        ports[0].postMessage({});
      },
    };
    listenerMap['sw.updated']({ detail: { waiting: worker } });

    expect(mockNotificationOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'i18n:app.pwa.serviceworker.updated',
        description: 'i18n:app.pwa.serviceworker.updated.hint',
        btn: expect.any(Object),
      }),
    );

    const openConfig = mockNotificationOpen.mock.calls[0][0];
    await openConfig.btn.props.onClick();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockNotificationDestroy).toHaveBeenCalled();
    expect((global as any).caches.keys).toHaveBeenCalled();
    expect(deleteCacheMock).toHaveBeenCalledWith('k1');
    expect(deleteCacheMock).toHaveBeenCalledWith('k2');
    expect(reloadMock).toHaveBeenCalled();
    addEventListenerSpy.mockRestore();
  });
});
