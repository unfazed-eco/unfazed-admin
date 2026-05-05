import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import * as React from 'react';
import ModelDetail from './index';

const mockUseInlineOperations = jest.fn();
const mockUseInlineTabRenderer = jest.fn();
const mockBatchSaveModelData = jest.fn();
const mockDeleteModelData = jest.fn();
const mockGetModelInlines = jest.fn();

const mockDebouncedReload = jest.fn();
const mockModalConfirm = jest.fn();

const mockUseRequestState = {
  loading: false,
  inlineDescs: {} as Record<string, any>,
};

jest.mock('@umijs/max', () => {
  const React = require('react');
  return {
    useRequest: (service: any, options: any) => {
      React.useEffect(() => {
        let active = true;
        Promise.resolve(service()).then(() => {
          if (active && options?.onSuccess) {
            options.onSuccess(mockUseRequestState.inlineDescs);
          }
        });
        return () => {
          active = false;
        };
      }, [service, options]);
      return { loading: mockUseRequestState.loading };
    },
  };
});

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    PageContainer: ({ children, header }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'page-container' },
        React.createElement(
          'div',
          { 'data-testid': 'page-title' },
          header?.title,
        ),
        React.createElement(
          'div',
          { 'data-testid': 'header-extra' },
          header?.extra,
        ),
        children,
      ),
  };
});

jest.mock('antd', () => {
  const React = require('react');
  return {
    Button: ({ children, onClick }: any) =>
      React.createElement('button', { type: 'button', onClick }, children),
    Modal: {
      confirm: (...args: any[]) => mockModalConfirm(...args),
    },
    Spin: ({ children }: any) =>
      React.createElement('div', { 'data-testid': 'spin' }, children),
    Tabs: ({ items, onChange }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'tabs' },
        ...(items || []).map((item: any) =>
          React.createElement(
            'div',
            { key: item.key, 'data-testid': `tab-${item.key}` },
            React.createElement(
              'button',
              { type: 'button', onClick: () => onChange?.(item.key) },
              `switch-${item.key}`,
            ),
            React.createElement(
              'div',
              { 'data-testid': `tab-label-${item.key}` },
              item.label,
            ),
            item.children,
          ),
        ),
      ),
  };
});

jest.mock('@/services/api', () => ({
  batchSaveModelData: (...args: any[]) => mockBatchSaveModelData(...args),
  deleteModelData: (...args: any[]) => mockDeleteModelData(...args),
  getModelInlines: (...args: any[]) => mockGetModelInlines(...args),
}));

jest.mock('./useInlineOperations', () => ({
  useInlineOperations: (...args: any[]) => mockUseInlineOperations(...args),
}));

jest.mock('./InlineTabRenderer', () => ({
  useInlineTabRenderer: (...args: any[]) => mockUseInlineTabRenderer(...args),
}));

jest.mock('./MainFormTab', () => {
  const React = require('react');
  return (props: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'main-form-tab' },
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () => props.onValuesChange?.({ title: 'changed' }),
        },
        'main-change',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: props.onBack },
        'main-back',
      ),
    );
});

jest.mock('./M2MSelectionModal', () => {
  const React = require('react');
  return ({ visible, title, onCancel, onOk }: any) =>
    visible
      ? React.createElement(
          'div',
          { 'data-testid': `m2m-modal-${title}` },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => onOk([1, 2], [{ id: 1 }, { id: 2 }], [2, 3]),
            },
            'm2m-ok',
          ),
          React.createElement(
            'button',
            { type: 'button', onClick: onCancel },
            'm2m-cancel',
          ),
        )
      : null;
});

jest.mock('./BackRelationSelectionModal', () => {
  const React = require('react');
  return ({ visible, title, onCancel, onLink }: any) =>
    visible
      ? React.createElement(
          'div',
          { 'data-testid': `back-select-modal-${title}` },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => onLink([{ id: 5 }, { id: 6 }], [{ id: 9 }]),
            },
            'back-link',
          ),
          React.createElement(
            'button',
            { type: 'button', onClick: onCancel },
            'back-link-cancel',
          ),
        )
      : null;
});

jest.mock('./BackRelationAddModal', () => {
  const React = require('react');
  return ({ visible, mode, inlineName, onClose, onSuccess }: any) =>
    visible
      ? React.createElement(
          'div',
          { 'data-testid': `back-add-modal-${mode}-${inlineName}` },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => {
                onSuccess();
                onClose();
              },
            },
            'back-add-success',
          ),
          React.createElement(
            'button',
            { type: 'button', onClick: onClose },
            'back-add-close',
          ),
        )
      : null;
});

jest.mock('./BackRelationBatchAddModal', () => {
  const React = require('react');
  return ({ visible, inlineName, onPreview, onBatchSave, onClose }: any) =>
    visible
      ? React.createElement(
          'div',
          { 'data-testid': `back-batch-modal-${inlineName}` },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => onPreview([{ id: -1, name: 'preview-row' }]),
            },
            'back-batch-preview',
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () => onBatchSave([{ id: -1, name: 'save-row' }]),
            },
            'back-batch-save',
          ),
          React.createElement(
            'button',
            { type: 'button', onClick: onClose },
            'back-batch-close',
          ),
        )
      : null;
});

describe('ModelDetail', () => {
  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };
  const mockMarkTabLoaded = jest.fn();
  const mockHandleInlineAction = jest.fn();
  const mockHandleInlineSave = jest.fn(async () => {});
  const mockHandleInlineDelete = jest.fn(async () => {});
  const mockHandleM2MAdd = jest.fn(async () => {});
  const mockHandleM2MRemove = jest.fn(async () => {});
  const mockHandleBackRelationLink = jest.fn(async () => {});
  const mockHandleBackRelationUnlink = jest.fn(async () => {});
  const mockAddInlineRecord = jest.fn();
  const mockOnBack = jest.fn();

  const modelDesc = {
    attrs: {
      can_edit: true,
      can_delete: true,
    },
    fields: {
      title: { default: 'default-title' },
      count: { default: 1 },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRequestState.loading = false;
    mockUseRequestState.inlineDescs = {
      tags: {
        attrs: { label: 'Tags', verbose_name: 'Tags' },
        relation: {
          relation: 'm2m',
          through: { source_field: 'id' },
        },
      },
      comments: {
        attrs: {
          label: 'Comments',
          can_batch_save: true,
        },
        relation: {
          relation: 'bk_fk',
          source_field: 'id',
          target_field: 'post_id',
          target_field_nullable: false,
        },
      },
    };

    mockGetModelInlines.mockResolvedValue({
      code: 0,
      data: mockUseRequestState.inlineDescs,
    });
    mockBatchSaveModelData.mockResolvedValue({ code: 0 });
    mockDeleteModelData.mockResolvedValue({ code: 0 });

    mockUseInlineOperations.mockReturnValue({
      contextHolder: React.createElement('div', { 'data-testid': 'ctx' }),
      messageApi: mockMessageApi,
      editingKeys: {},
      loadedTabs: new Set<string>(),
      markTabLoaded: mockMarkTabLoaded,
      handleInlineAction: mockHandleInlineAction,
      handleInlineSave: mockHandleInlineSave,
      handleInlineDelete: mockHandleInlineDelete,
      handleM2MAdd: mockHandleM2MAdd,
      handleM2MRemove: mockHandleM2MRemove,
      handleBackRelationLink: mockHandleBackRelationLink,
      handleBackRelationUnlink: mockHandleBackRelationUnlink,
      addInlineRecord: mockAddInlineRecord,
    });

    mockUseInlineTabRenderer.mockImplementation((args: any) => ({
      renderInlineComponent: (inlineName: string) =>
        React.createElement(
          'div',
          { 'data-testid': `inline-${inlineName}` },
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                args.setM2MModalVisible((prev: any) => ({
                  ...prev,
                  [inlineName]: true,
                })),
            },
            `open-m2m-${inlineName}`,
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                args.setBackRelationModalVisible((prev: any) => ({
                  ...prev,
                  [inlineName]: true,
                })),
            },
            `open-back-select-${inlineName}`,
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                args.setBackRelationAddModalVisible((prev: any) => ({
                  ...prev,
                  [inlineName]: true,
                })),
            },
            `open-back-add-${inlineName}`,
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                args.setBackRelationBatchAddModalVisible((prev: any) => ({
                  ...prev,
                  [inlineName]: true,
                })),
            },
            `open-back-batch-${inlineName}`,
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                args.setBackRelationEditModalRecord((prev: any) => ({
                  ...prev,
                  [inlineName]: { id: 501, name: 'edit-me' },
                })),
            },
            `open-back-edit-${inlineName}`,
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              onClick: () =>
                args.setBackRelationCopyModalRecord((prev: any) => ({
                  ...prev,
                  [inlineName]: { id: 502, name: 'copy-me' },
                })),
            },
            `open-back-copy-${inlineName}`,
          ),
        ),
      debouncedReload: mockDebouncedReload,
    }));
  });

  it('renders detail page and covers delete, tab switch and modal callbacks', async () => {
    render(
      <ModelDetail
        modelName="posts"
        routeLabel="Posts"
        modelDesc={modelDesc}
        record={{ id: 10, title: 'post-1' }}
        onBack={mockOnBack}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('main-form-tab')).toBeTruthy();
    });
    expect(screen.getByTestId('page-title').textContent).toContain(
      'Posts Detail',
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(mockModalConfirm).toHaveBeenCalled();
    const confirmConfig = mockModalConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmConfig.onOk();
    });
    expect(mockDeleteModelData).toHaveBeenCalledWith({
      name: 'posts',
      data: { id: 10, title: 'post-1' },
    });
    expect(mockMessageApi.success).toHaveBeenCalledWith('Deleted successfully');
    expect(mockOnBack).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('switch-comments')).toBeTruthy();
    });
    fireEvent.click(screen.getByText('switch-comments'));
    expect(mockMarkTabLoaded).toHaveBeenCalledWith('comments');

    fireEvent.click(screen.getByText('main-change'));

    fireEvent.click(screen.getByText('open-m2m-tags'));
    fireEvent.click(screen.getByText('m2m-ok'));
    await waitFor(() => {
      expect(mockHandleM2MAdd).toHaveBeenCalledWith(
        'tags',
        expect.any(Object),
        [1],
      );
      expect(mockHandleM2MRemove).toHaveBeenCalledWith(
        'tags',
        expect.any(Object),
        [3],
      );
    });
    expect(mockDebouncedReload).toHaveBeenCalledWith('tags');

    fireEvent.click(screen.getByText('open-back-select-comments'));
    fireEvent.click(screen.getByText('back-link'));
    await waitFor(() => {
      expect(mockHandleBackRelationUnlink).toHaveBeenCalledWith(
        'comments',
        expect.any(Object),
        { id: 9 },
      );
      expect(mockHandleBackRelationLink).toHaveBeenCalledWith(
        'comments',
        expect.any(Object),
        [{ id: 5 }, { id: 6 }],
      );
    });
    expect(mockDebouncedReload).toHaveBeenCalledWith('comments');

    fireEvent.click(screen.getByText('open-back-add-comments'));
    fireEvent.click(screen.getAllByText('back-add-success')[0]);
    expect(mockDebouncedReload).toHaveBeenCalledWith('comments');

    fireEvent.click(screen.getByText('open-back-batch-comments'));
    fireEvent.click(screen.getByText('back-batch-preview'));
    await act(async () => {
      fireEvent.click(screen.getByText('back-batch-save'));
    });
    expect(mockBatchSaveModelData).toHaveBeenCalledWith({
      name: 'comments',
      data: [{ id: -1, name: 'save-row', post_id: 10 }],
    });
    expect(mockMessageApi.success).toHaveBeenCalledWith(
      'Batch saved successfully',
    );
    expect(mockDebouncedReload).toHaveBeenCalledWith('comments');

    fireEvent.click(screen.getByText('open-back-edit-comments'));
    const editModal = screen.getByTestId('back-add-modal-edit-comments');
    expect(editModal).toBeTruthy();
    fireEvent.click(within(editModal).getByText('back-add-success'));
    expect(mockDebouncedReload).toHaveBeenCalledWith('comments');

    fireEvent.click(screen.getByText('open-back-copy-comments'));
    const copyModal = screen.getByTestId('back-add-modal-create-comments');
    expect(copyModal).toBeTruthy();
    fireEvent.click(within(copyModal).getByText('back-add-success'));
    expect(mockDebouncedReload).toHaveBeenCalledWith('comments');

    fireEvent.click(screen.getByText('Back'));
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('handles delete and batch save failures', async () => {
    mockDeleteModelData.mockResolvedValueOnce({
      code: 1,
      message: 'cannot-delete',
    });
    mockBatchSaveModelData.mockResolvedValueOnce({
      code: 1,
      message: 'batch-failed',
    });

    render(
      <ModelDetail
        modelName="posts"
        routeLabel="Posts"
        modelDesc={modelDesc}
        record={{ id: 11 }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('main-form-tab')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Delete'));
    const confirmConfig = mockModalConfirm.mock.calls[0][0];
    await act(async () => {
      await confirmConfig.onOk();
    });
    expect(mockMessageApi.error).toHaveBeenCalledWith('cannot-delete');

    fireEvent.click(screen.getByText('open-back-batch-comments'));
    await act(async () => {
      fireEvent.click(screen.getByText('back-batch-save'));
    });
    expect(mockMessageApi.error).toHaveBeenCalledWith('batch-failed');
  });

  it('renders loading and create-mode title path', async () => {
    mockUseRequestState.loading = true;
    const { rerender } = render(
      <ModelDetail
        modelName="posts"
        routeLabel="Posts"
        modelDesc={modelDesc}
        record={{ id: -1 }}
      />,
    );
    expect(screen.getByText('Loading...')).toBeTruthy();

    mockUseRequestState.loading = false;
    mockUseRequestState.inlineDescs = {};
    rerender(
      <ModelDetail
        modelName="posts"
        routeLabel="Posts"
        modelDesc={modelDesc}
        record={{ id: -1 }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('page-title').textContent).toContain(
        'Create New Posts',
      );
    });
    expect(screen.queryByText('Delete')).toBeNull();
  });
});
