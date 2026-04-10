import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import DynamicRoute from './DynamicRoute';

const mockReplace = jest.fn();
let mockPathname = '/';
let mockInitialState: any = {};

jest.mock('@umijs/max', () => ({
  history: {
    replace: (...args: any[]) => mockReplace(...args),
  },
  useLocation: () => ({ pathname: mockPathname }),
  useModel: () => ({ initialState: mockInitialState }),
}));

jest.mock('@/components', () => ({
  ModelAdmin: ({ modelName, routeLabel }: any) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'model-admin' },
      `admin-${modelName}-${routeLabel}`,
    );
  },
  ModelCustom: ({ toolName }: any) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'model-custom' },
      `custom-${toolName}`,
    );
  },
}));

describe('DynamicRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockInitialState = {};
  });

  it('redirects to login when route list missing on private path', async () => {
    mockPathname = '/private/page';
    mockInitialState = { routeList: [] };

    render(React.createElement(DynamicRoute));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/user/login');
    });
  });

  it('shows error on public path when route list missing', async () => {
    mockPathname = '/user/login/callback';
    mockInitialState = { routeList: [] };

    render(React.createElement(DynamicRoute));

    expect(await screen.findByText('Error Loading Route')).not.toBeNull();
    expect(
      screen.getByText(
        'Route list not available, but this should be handled by static routes',
      ),
    ).not.toBeNull();
  });

  it('redirects from root path to first available route', async () => {
    mockPathname = '/';
    mockInitialState = {
      routeList: [
        {
          path: '/parent',
          routes: [
            { path: '/first-child', component: 'ModelAdmin', name: 'book' },
          ],
        },
      ],
    };

    render(React.createElement(DynamicRoute));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/first-child');
    });
  });

  it('redirects to 404 when path not found', async () => {
    mockPathname = '/not-exist';
    mockInitialState = {
      routeList: [{ path: '/exists', component: 'ModelAdmin', name: 'book' }],
    };

    render(React.createElement(DynamicRoute));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/exception/404');
    });
  });

  it('renders ModelAdmin for matched route', async () => {
    mockPathname = '/books';
    mockInitialState = {
      routeList: [
        {
          path: '/books',
          component: 'ModelAdmin',
          name: 'book',
          label: 'Books',
        },
      ],
    };

    render(React.createElement(DynamicRoute));

    expect((await screen.findByTestId('model-admin')).textContent).toBe(
      'admin-book-Books',
    );
  });

  it('renders ModelCustom for matched route', async () => {
    mockPathname = '/tool';
    mockInitialState = {
      routeList: [
        {
          path: '/tool',
          component: 'ModelCustom',
          name: 'reportTool',
        },
      ],
    };

    render(React.createElement(DynamicRoute));

    expect((await screen.findByTestId('model-custom')).textContent).toBe(
      'custom-reportTool',
    );
  });

  it('renders unsupported component fallback', async () => {
    mockPathname = '/legacy';
    mockInitialState = {
      routeList: [
        {
          path: '/legacy',
          component: 'LegacyView',
          name: 'legacy',
        },
      ],
    };

    render(React.createElement(DynamicRoute));

    expect(
      await screen.findByText(/Unsupported dynamic component/),
    ).not.toBeNull();
    expect(screen.getByText(/LegacyView/)).not.toBeNull();
  });

  it('shows timeout error when global state not ready', async () => {
    jest.useFakeTimers();

    mockPathname = '/books';
    mockInitialState = undefined;

    render(React.createElement(DynamicRoute));

    act(() => {
      jest.advanceTimersByTime(120);
    });

    expect(
      await screen.findByText(
        'Failed to load route configuration from global state',
      ),
    ).not.toBeNull();

    jest.useRealTimers();
  });
});
