import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as React from 'react';
import ModelList from './index';

const mockReload = jest.fn();
let mockCapturedTableProps: any;

const mockUseRequest = jest.fn();
const mockUseModelOperations = jest.fn();
const mockUseActionHandler = jest.fn();
const mockGetModelDesc = jest.fn();
const mockDeleteModelData = jest.fn();

jest.mock('@umijs/max', () => ({
  useRequest: (...args: any[]) => mockUseRequest(...args),
}));

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    PageContainer: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'page-container' }, children),
  };
});

jest.mock('@/components/ActionModals', () => {
  const React = require('react');
  return {
    StringInputModal: ({ visible, onOk, onCancel }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'string-modal', 'data-visible': visible ? '1' : '0' },
        React.createElement(
          'button',
          { onClick: () => onOk('str-value') },
          'string-ok',
        ),
        React.createElement('button', { onClick: onCancel }, 'string-cancel'),
      ),
    FileUploadModal: ({ visible, onOk, onCancel }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'file-modal', 'data-visible': visible ? '1' : '0' },
        React.createElement(
          'button',
          { onClick: () => onOk([new File(['a'], 'a.txt')]) },
          'file-ok',
        ),
        React.createElement('button', { onClick: onCancel }, 'file-cancel'),
      ),
  };
});

jest.mock('@/hooks/useModelOperations', () => ({
  useModelOperations: (...args: any[]) => mockUseModelOperations(...args),
}));

jest.mock('@/services/api', () => ({
  getModelDesc: (...args: any[]) => mockGetModelDesc(...args),
  deleteModelData: (...args: any[]) => mockDeleteModelData(...args),
}));

jest.mock('../index', () => {
  const React = require('react');
  return {
    CommonProTable: (props: any) => {
      mockCapturedTableProps = props;
      props.actionRef.current = { reload: mockReload };
      return React.createElement(
        'div',
        { 'data-testid': 'common-table' },
        React.createElement(
          'button',
          {
            onClick: () =>
              props.onAction('add', { key: 'a' }, { id: 1 }, false, [], {
                kw: 'x',
              }),
          },
          'table-add',
        ),
        React.createElement(
          'button',
          {
            onClick: () =>
              props.onAction('custom', { key: 'custom' }, { id: 2 }, true, [
                { id: 2 },
              ]),
          },
          'table-custom',
        ),
      );
    },
  };
});

jest.mock('./useActionHandler', () => ({
  useActionHandler: (...args: any[]) => mockUseActionHandler(...args),
}));

describe('ModelList', () => {
  const messageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };
  const fetchModelData = jest.fn(async () => ({
    data: [{ id: 1 }],
    total: 1,
    success: true,
  }));
  const executeBatchAction = jest.fn();
  const executeRowAction = jest.fn();
  const saveData = jest.fn(async () => true);
  const getStoredSettings = jest.fn(() => ({ pageSize: 33 }));
  const onDetail = jest.fn();
  const onModelDescLoaded = jest.fn();
  const triggerAction = jest.fn();
  const updateSearchParams = jest.fn();
  const handleStringInputConfirm = jest.fn();
  const handleFileUploadConfirm = jest.fn();
  const handleModalCancel = jest.fn();

  const modelDesc = {
    attrs: {
      list_per_page: 20,
      list_per_page_options: [10, 20, 50],
    },
    actions: {},
    fields: {},
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCapturedTableProps = undefined;
    mockGetModelDesc.mockResolvedValue({ code: 0, data: modelDesc });
    mockDeleteModelData.mockResolvedValue({ code: 0 });

    mockUseModelOperations.mockReturnValue({
      contextHolder: React.createElement('div', { 'data-testid': 'ctx' }),
      messageApi,
      fetchModelData,
      executeBatchAction,
      executeRowAction,
      saveData,
      getStoredSettings,
    });

    mockUseActionHandler.mockReturnValue({
      stringModalVisible: true,
      fileModalVisible: true,
      currentAction: { actionConfig: { label: 'Run', description: 'desc' } },
      actionLoading: false,
      updateSearchParams,
      triggerAction,
      handleStringInputConfirm,
      handleFileUploadConfirm,
      handleModalCancel,
    });

    mockUseRequest.mockImplementation((requestFn: any) => {
      requestFn();
      return { loading: false };
    });
  });

  it('renders table after model desc loaded and handles actions', async () => {
    render(
      <ModelList
        modelName="books"
        onDetail={onDetail}
        onModelDescLoaded={onModelDescLoaded}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('common-table')).toBeTruthy();
    });
    expect(onModelDescLoaded).toHaveBeenCalledWith(modelDesc);

    fireEvent.click(screen.getByText('table-add'));
    expect(onDetail).toHaveBeenCalledWith({ id: -1 });

    fireEvent.click(screen.getByText('table-custom'));
    expect(triggerAction).toHaveBeenCalledWith(
      'custom',
      { key: 'custom' },
      { id: 2 },
      true,
      [{ id: 2 }],
      undefined,
    );

    await act(async () => {
      await mockCapturedTableProps.onRequest({ current: 2, kw: 'alpha' });
    });
    expect(updateSearchParams).toHaveBeenCalledWith({
      current: 2,
      kw: 'alpha',
    });
    expect(fetchModelData).toHaveBeenCalledWith(
      { current: 2, kw: 'alpha' },
      modelDesc,
    );

    await act(async () => {
      await mockCapturedTableProps.onSave({ id: 9, name: 'book' });
    });
    expect(saveData).toHaveBeenCalledWith({ id: 9, name: 'book' });
    expect(mockReload).toHaveBeenCalled();

    await act(async () => {
      await mockCapturedTableProps.onDelete({ id: 3 });
    });
    expect(mockDeleteModelData).toHaveBeenCalledWith({
      name: 'books',
      data: { id: 3 },
    });
    expect(messageApi.success).toHaveBeenCalledWith('Deleted successfully');

    expect(mockCapturedTableProps.tableProps.pagination.defaultPageSize).toBe(
      33,
    );
    expect(
      mockCapturedTableProps.tableProps.pagination.pageSizeOptions,
    ).toEqual([10, 20, 50]);
  });

  it('handles delete failure and exception', async () => {
    render(<ModelList modelName="books" />);

    await waitFor(() => {
      expect(mockCapturedTableProps).toBeTruthy();
    });

    mockDeleteModelData.mockResolvedValueOnce({
      code: 1,
      message: 'delete-bad',
    });
    await act(async () => {
      await mockCapturedTableProps.onDelete({ id: 6 });
    });
    expect(messageApi.error).toHaveBeenCalledWith('delete-bad');

    mockDeleteModelData.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      await mockCapturedTableProps.onDelete({ id: 7 });
    });
    expect(messageApi.error).toHaveBeenCalledWith('Delete failed');
  });

  it('shows loading when desc is loading or absent', () => {
    mockUseRequest.mockReturnValueOnce({ loading: true });
    render(<ModelList modelName="books" />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });
});
