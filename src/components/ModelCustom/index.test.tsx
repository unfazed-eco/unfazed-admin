import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import ModelCustom from './index';

const mockUseRequest = jest.fn();
const mockGetModelDesc = jest.fn();
const mockRenderFormField = jest.fn();
const mockUseActionExecutor = jest.fn();
let mockActionButtonsProps: any;

jest.mock('@umijs/max', () => ({
  useRequest: (...args: any[]) => mockUseRequest(...args),
}));

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    PageContainer: ({ children, header }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'page-container' },
        React.createElement('div', { 'data-testid': 'title' }, header?.title),
        React.createElement('div', { 'data-testid': 'extra' }, header?.extra),
        children,
      ),
    ProForm: ({ children }: any) =>
      React.createElement('form', { 'data-testid': 'pro-form' }, children),
  };
});

jest.mock('antd', () => {
  const React = require('react');
  return {
    Button: ({ children, onClick }: any) =>
      React.createElement('button', { type: 'button', onClick }, children),
    Card: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'card' }, children),
    Divider: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'divider' }, children),
    Space: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'space' }, children),
    Spin: ({ tip }: any) =>
      React.createElement('div', { 'data-testid': 'spin' }, tip || 'spin'),
    message: {
      useMessage: () => [
        {
          success: jest.fn(),
          error: jest.fn(),
          warning: jest.fn(),
        },
        React.createElement('div', { 'data-testid': 'message-holder' }),
      ],
    },
  };
});

jest.mock('@/services/api', () => ({
  getModelDesc: (...args: any[]) => mockGetModelDesc(...args),
}));

jest.mock('@/utils/formFieldRenderer', () => ({
  renderFormField: (...args: any[]) => mockRenderFormField(...args),
}));

jest.mock('./useActionExecutor', () => ({
  useActionExecutor: (...args: any[]) => mockUseActionExecutor(...args),
}));

jest.mock('./ActionButtons', () => {
  const React = require('react');
  return (props: any) => {
    mockActionButtonsProps = props;
    return React.createElement('div', { 'data-testid': 'action-buttons' });
  };
});

describe('ModelCustom', () => {
  const toolDesc = {
    attrs: {
      help_text: 'Tool Help',
    },
    fields: {
      visibleText: {
        show: true,
        readonly: false,
        blank: false,
        name: 'VisibleText',
      },
      visibleReadonly: {
        show: true,
        readonly: true,
        blank: true,
        name: 'VisibleReadonly',
      },
      hiddenField: {
        show: false,
      },
    },
    actions: {
      run: { label: 'Run' },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockActionButtonsProps = undefined;
    mockGetModelDesc.mockResolvedValue({ code: 0, data: toolDesc });
    mockRenderFormField.mockImplementation((fieldName: string) =>
      React.createElement('div', { 'data-testid': `field-${fieldName}` }),
    );
    mockUseActionExecutor.mockReturnValue({
      actionLoading: { run: true },
      executeAction: jest.fn(),
    });
  });

  it('renders loading state when desc is loading', () => {
    mockUseRequest.mockReturnValue({ loading: true });

    render(<ModelCustom toolName="myTool" onBack={jest.fn()} />);
    expect(screen.getByTestId('spin')).toBeTruthy();
    expect(screen.getByText('Loading tool description...')).toBeTruthy();
  });

  it('renders tool form with visible fields and action buttons', async () => {
    mockUseRequest.mockImplementation((requestFn: any) => {
      requestFn();
      return { loading: false };
    });

    const onBack = jest.fn();
    render(<ModelCustom toolName="myTool" onBack={onBack} />);

    await waitFor(() => {
      expect(screen.getByTestId('pro-form')).toBeTruthy();
      expect(screen.getByTestId('action-buttons')).toBeTruthy();
    });

    expect(screen.getByTestId('title').textContent).toBe('Tool Help');
    expect(screen.getByTestId('field-visibleText')).toBeTruthy();
    expect(screen.getByTestId('field-visibleReadonly')).toBeTruthy();
    expect(screen.queryByTestId('field-hiddenField')).toBeNull();

    expect(mockRenderFormField).toHaveBeenCalledWith(
      'visibleText',
      toolDesc.fields.visibleText,
      expect.any(Object),
      {
        commonProps: {
          disabled: false,
          rules: [{ required: true, message: 'VisibleText is required' }],
        },
      },
    );

    expect(mockRenderFormField).toHaveBeenCalledWith(
      'visibleReadonly',
      toolDesc.fields.visibleReadonly,
      expect.any(Object),
      {
        commonProps: {
          disabled: true,
          rules: [],
        },
      },
    );

    expect(mockActionButtonsProps.toolDesc).toEqual(toolDesc);
    expect(mockActionButtonsProps.actionLoading).toEqual({ run: true });
    expect(typeof mockActionButtonsProps.executeAction).toBe('function');
  });
});
