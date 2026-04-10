import { act, render, renderHook, screen } from '@testing-library/react';
import { useInlineTabRenderer } from './InlineTabRenderer';

const mockTablePropsByModel: Record<string, any> = {};
const mockReloadByModel: Record<string, jest.Mock> = {};

const mockUseRequestHandlers = jest.fn();
const mockCreateBackRelationRequestHandler = jest.fn();
const mockCreateForwardRelationRequestHandler = jest.fn();
const mockCreateM2MRequestHandler = jest.fn();

jest.mock('../index', () => {
  const React = require('react');
  return {
    CommonProTable: (props: any) => {
      mockTablePropsByModel[props.modelName] = props;
      const reload = jest.fn();
      mockReloadByModel[props.modelName] = reload;
      if (props.actionRef) {
        props.actionRef.current = { reload };
      }
      return React.createElement(
        'div',
        { 'data-testid': `table-${props.modelName}` },
        props.modelName,
      );
    },
  };
});

jest.mock('./useRequestHandlers', () => ({
  useRequestHandlers: (...args: any[]) => mockUseRequestHandlers(...args),
}));

describe('useInlineTabRenderer', () => {
  let mockM2MModalVisibleState: Record<string, boolean>;
  let mockBackRelationModalVisibleState: Record<string, boolean>;
  let mockBackRelationAddModalVisibleState: Record<string, boolean>;
  let mockBackRelationBatchAddModalVisibleState: Record<string, boolean>;
  let mockBackRelationEditModalRecordState: Record<string, any>;
  let mockPreviewInlineDataState: Record<string, any[] | undefined>;
  let mockOperationLoadingState: boolean;

  const mockHandleInlineAction = jest.fn();
  const mockHandleInlineSave = jest.fn(async () => {});
  const mockHandleInlineDelete = jest.fn(async () => {});
  const mockHandleM2MRemove = jest.fn(async () => {});
  const mockHandleBackRelationUnlink = jest.fn(async () => {});
  const mockAddInlineRecord = jest.fn();
  const mockSetM2MModalVisible = jest.fn((updater: any) => {
    mockM2MModalVisibleState =
      typeof updater === 'function'
        ? updater(mockM2MModalVisibleState)
        : updater;
  });
  const mockSetBackRelationModalVisible = jest.fn((updater: any) => {
    mockBackRelationModalVisibleState =
      typeof updater === 'function'
        ? updater(mockBackRelationModalVisibleState)
        : updater;
  });
  const mockSetBackRelationAddModalVisible = jest.fn((updater: any) => {
    mockBackRelationAddModalVisibleState =
      typeof updater === 'function'
        ? updater(mockBackRelationAddModalVisibleState)
        : updater;
  });
  const mockSetBackRelationBatchAddModalVisible = jest.fn((updater: any) => {
    mockBackRelationBatchAddModalVisibleState =
      typeof updater === 'function'
        ? updater(mockBackRelationBatchAddModalVisibleState)
        : updater;
  });
  const mockSetBackRelationEditModalRecord = jest.fn((updater: any) => {
    mockBackRelationEditModalRecordState =
      typeof updater === 'function'
        ? updater(mockBackRelationEditModalRecordState)
        : updater;
  });
  const mockSetPreviewInlineData = jest.fn((updater: any) => {
    mockPreviewInlineDataState =
      typeof updater === 'function'
        ? updater(mockPreviewInlineDataState)
        : updater;
  });
  const mockSetOperationLoading = jest.fn((updater: any) => {
    mockOperationLoadingState =
      typeof updater === 'function'
        ? updater(mockOperationLoadingState)
        : updater;
  });

  const mockM2MRequest = jest.fn(async () => ({
    data: [{ id: 1 }],
    total: 1,
    success: true,
  }));
  const mockForwardRequest = jest.fn(async () => ({
    data: [{ id: 2 }],
    total: 1,
    success: true,
  }));
  const mockBackRequest = jest.fn(async () => ({
    data: [{ id: 3 }],
    total: 1,
    success: true,
  }));

  const createHook = (overrides: Partial<any> = {}) => {
    const inlineActionRefs = {
      current: {} as any,
    };

    return renderHook(() =>
      useInlineTabRenderer({
        record: { id: 11, owner_id: 77 },
        inlineDescs: {},
        loadedTabs: new Set<string>(),
        editingKeys: {},
        handleInlineAction: mockHandleInlineAction,
        handleInlineSave: mockHandleInlineSave,
        handleInlineDelete: mockHandleInlineDelete,
        handleM2MRemove: mockHandleM2MRemove,
        handleBackRelationUnlink: mockHandleBackRelationUnlink,
        addInlineRecord: mockAddInlineRecord,
        setM2MModalVisible: mockSetM2MModalVisible,
        setBackRelationModalVisible: mockSetBackRelationModalVisible,
        setBackRelationAddModalVisible: mockSetBackRelationAddModalVisible,
        setBackRelationBatchAddModalVisible:
          mockSetBackRelationBatchAddModalVisible,
        setBackRelationEditModalRecord: mockSetBackRelationEditModalRecord,
        previewInlineData: mockPreviewInlineDataState,
        setPreviewInlineData: mockSetPreviewInlineData,
        setOperationLoading: mockSetOperationLoading,
        inlineActionRefs,
        ...overrides,
      }),
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockTablePropsByModel).forEach((k) => {
      delete mockTablePropsByModel[k];
    });
    Object.keys(mockReloadByModel).forEach((k) => {
      delete mockReloadByModel[k];
    });

    mockM2MModalVisibleState = {};
    mockBackRelationModalVisibleState = {};
    mockBackRelationAddModalVisibleState = {};
    mockBackRelationBatchAddModalVisibleState = {};
    mockBackRelationEditModalRecordState = {};
    mockPreviewInlineDataState = {};
    mockOperationLoadingState = false;

    mockUseRequestHandlers.mockReturnValue({
      createBackRelationRequestHandler: mockCreateBackRelationRequestHandler,
      createForwardRelationRequestHandler:
        mockCreateForwardRelationRequestHandler,
      createM2MRequestHandler: mockCreateM2MRequestHandler,
    });
    mockCreateBackRelationRequestHandler.mockReturnValue(mockBackRequest);
    mockCreateForwardRelationRequestHandler.mockReturnValue(mockForwardRequest);
    mockCreateM2MRequestHandler.mockReturnValue(mockM2MRequest);
  });

  it('returns null when inline desc is missing and loading card when tab is not loaded', () => {
    const { result } = createHook({
      inlineDescs: {
        tags: { relation: { relation: 'm2m' } },
      },
      loadedTabs: new Set<string>(),
    });

    expect(result.current.renderInlineComponent('missing')).toBeNull();

    render(result.current.renderInlineComponent('tags') as any);
    expect(screen.getByText('Loading...')).toBeTruthy();
    expect(screen.queryByTestId('table-tags')).toBeNull();
  });

  it('covers m2m branch with request, action, unlink and link callbacks', async () => {
    const { result } = createHook({
      inlineDescs: {
        tags: {
          relation: { relation: 'm2m', through: { source_field: 'id' } },
          attrs: {
            list_per_page: 15,
            list_per_page_options: [10, 15],
          },
        },
      },
      loadedTabs: new Set<string>(['tags']),
    });

    render(result.current.renderInlineComponent('tags') as any);
    const props = mockTablePropsByModel.tags;
    expect(props).toBeTruthy();

    expect(props.modelDesc.attrs.can_add).toBe(false);
    expect(props.modelDesc.attrs.can_edit).toBe(false);
    expect(props.modelDesc.attrs.can_delete).toBe(false);

    await act(async () => {
      await props.onRequest({ current: 1 });
    });
    expect(mockCreateM2MRequestHandler).toHaveBeenCalledWith(
      'tags',
      expect.any(Object),
    );
    expect(mockM2MRequest).toHaveBeenCalledWith({ current: 1 });

    props.onAction('custom', { key: 'k' }, { id: 2 }, true, [{ id: 2 }], {
      q: 'x',
    });
    expect(mockHandleInlineAction).toHaveBeenCalledWith(
      'tags',
      'custom',
      { key: 'k' },
      { id: 2 },
      true,
      [{ id: 2 }],
      { q: 'x' },
    );

    await act(async () => {
      await props.onUnlink({ id: 99 });
    });
    expect(mockSetOperationLoading).toHaveBeenCalledWith(true);
    expect(mockHandleM2MRemove).toHaveBeenCalledWith(
      'tags',
      expect.any(Object),
      { id: 99 },
    );
    expect(mockReloadByModel.tags).toHaveBeenCalled();
    expect(mockSetOperationLoading).toHaveBeenLastCalledWith(false);

    act(() => {
      props.onLink();
    });
    expect(mockM2MModalVisibleState.tags).toBe(true);
  });

  it('covers fk/o2o branch save/delete and add-related behaviors', async () => {
    const { result } = createHook({
      inlineDescs: {
        fkBooks: {
          relation: { relation: 'fk' },
          attrs: { can_add: true, list_per_page: 20 },
        },
        o2oProfile: {
          relation: { relation: 'o2o' },
          attrs: { can_add: true, list_per_page: 20 },
        },
      },
      loadedTabs: new Set<string>(['fkBooks', 'o2oProfile']),
    });

    render(result.current.renderInlineComponent('fkBooks') as any);
    const fkProps = mockTablePropsByModel.fkBooks;

    await act(async () => {
      await fkProps.onSave({ id: 1 });
    });
    expect(mockHandleInlineSave).toHaveBeenCalledWith('fkBooks', { id: 1 });
    expect(mockReloadByModel.fkBooks).toHaveBeenCalled();

    await act(async () => {
      await fkProps.onDelete({ id: 8 });
    });
    expect(mockHandleInlineDelete).toHaveBeenCalledWith('fkBooks', { id: 8 });

    act(() => {
      fkProps.onAddRelated();
    });
    expect(mockBackRelationAddModalVisibleState.fkBooks).toBe(true);

    render(result.current.renderInlineComponent('o2oProfile') as any);
    const o2oProps = mockTablePropsByModel.o2oProfile;
    expect(o2oProps.onAddRelated).toBeUndefined();
  });

  it('covers bk_fk nullable=true with link/unlink/edit callbacks', async () => {
    const { result } = createHook({
      inlineDescs: {
        comments: {
          relation: { relation: 'bk_fk', target_field_nullable: true },
          attrs: { can_add: true, can_delete: true, can_edit: true },
        },
      },
      loadedTabs: new Set<string>(['comments']),
    });

    render(result.current.renderInlineComponent('comments') as any);
    const props = mockTablePropsByModel.comments;

    act(() => {
      props.onLink();
    });
    expect(mockBackRelationModalVisibleState.comments).toBe(true);

    await act(async () => {
      await props.onUnlink({ id: 6 });
    });
    expect(mockHandleBackRelationUnlink).toHaveBeenCalledWith(
      'comments',
      expect.any(Object),
      { id: 6 },
    );
    expect(mockReloadByModel.comments).toHaveBeenCalled();

    expect(props.onDeleteRelated).toBeUndefined();
    expect(typeof props.onEditRelated).toBe('function');
    act(() => {
      props.onEditRelated({ id: 88 });
    });
    expect(mockBackRelationEditModalRecordState.comments).toEqual({ id: 88 });
  });

  it('covers bk_fk nullable=false with preview rows and local delete', async () => {
    mockPreviewInlineDataState = {
      logs: [{ id: 1 }, { id: 2 }],
    };

    const { result } = createHook({
      previewInlineData: mockPreviewInlineDataState,
      inlineDescs: {
        logs: {
          relation: { relation: 'bk_fk', target_field_nullable: false },
          attrs: {
            can_add: true,
            can_delete: true,
            can_edit: true,
            can_batch_save: true,
          },
        },
      },
      loadedTabs: new Set<string>(['logs']),
    });

    render(result.current.renderInlineComponent('logs') as any);
    const props = mockTablePropsByModel.logs;

    const req = await props.onRequest({ current: 1 });
    expect(req).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      total: 2,
      success: true,
    });
    expect(mockBackRequest).not.toHaveBeenCalled();

    await act(async () => {
      await props.onDeleteRelated({ id: 1 });
    });
    expect(mockSetPreviewInlineData).toHaveBeenCalled();
    expect(mockPreviewInlineDataState.logs).toEqual([{ id: 2 }]);
    expect(mockHandleInlineDelete).not.toHaveBeenCalledWith('logs', { id: 1 });
    expect(mockReloadByModel.logs).toHaveBeenCalled();

    act(() => {
      props.onAddRelated();
      props.onBatchAddRelated();
    });
    expect(mockBackRelationAddModalVisibleState.logs).toBe(true);
    expect(mockBackRelationBatchAddModalVisibleState.logs).toBe(true);
    expect(props.onEditRelated).toBeUndefined();
  });

  it('covers bk_o2o behavior and default unsupported relation', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = createHook({
      inlineDescs: {
        profile: {
          relation: { relation: 'bk_o2o', target_field_nullable: false },
          attrs: {},
        },
        strange: {
          relation: { relation: 'unknown_relation' },
          attrs: {},
        },
      },
      loadedTabs: new Set<string>(['profile', 'strange']),
    });

    render(result.current.renderInlineComponent('profile') as any);
    const profileProps = mockTablePropsByModel.profile;
    expect(typeof profileProps.onAddRelated).toBe('function');
    expect(typeof profileProps.onDeleteRelated).toBe('function');
    expect(profileProps.onEditRelated).toBeUndefined();
    expect(profileProps.linkDisabled).toBe(false);

    render(result.current.renderInlineComponent('strange') as any);
    expect(screen.getByText(/Unsupported relation type/i)).toBeTruthy();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
