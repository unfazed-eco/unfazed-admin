import { renderHook } from '@testing-library/react';
import React from 'react';
import { useColumnGenerator } from './useColumnGenerator';

const mockRenderBooleanField = jest.fn(() => jest.fn(() => 'bool'));
const mockRenderDateField = jest.fn(() => jest.fn(() => 'date'));
const mockRenderDatetimeField = jest.fn(() => jest.fn(() => 'datetime'));
const mockRenderTimeField = jest.fn(() => jest.fn(() => 'time'));
const mockRenderNumberField = jest.fn(() => jest.fn(() => 'num'));
const mockRenderTextField = jest.fn(() => jest.fn(() => 'text'));
const mockRenderChoiceField = jest.fn(() => jest.fn(() => 'choice'));
const mockRenderEditorField = jest.fn(() => jest.fn(() => 'editor'));
const mockRenderImageField = jest.fn(() => jest.fn(() => 'image'));
const mockRenderJsonField = jest.fn(() => jest.fn(() => 'json'));
const mockRenderTextRangeFormItem = jest.fn(() => null);

jest.mock('./columnRenderers', () => ({
  renderBooleanField: (...args: any[]) =>
    (mockRenderBooleanField as any)(...args),
  renderChoiceField: (...args: any[]) =>
    (mockRenderChoiceField as any)(...args),
  renderDateField: (...args: any[]) => (mockRenderDateField as any)(...args),
  renderDatetimeField: (...args: any[]) =>
    (mockRenderDatetimeField as any)(...args),
  renderEditorField: (...args: any[]) =>
    (mockRenderEditorField as any)(...args),
  renderImageField: (...args: any[]) => (mockRenderImageField as any)(...args),
  renderJsonField: (...args: any[]) => (mockRenderJsonField as any)(...args),
  renderNumberField: (...args: any[]) =>
    (mockRenderNumberField as any)(...args),
  renderTextField: (...args: any[]) => (mockRenderTextField as any)(...args),
  renderTextRangeFormItem: (...args: any[]) =>
    (mockRenderTextRangeFormItem as any)(...args),
  renderTimeField: (...args: any[]) => (mockRenderTimeField as any)(...args),
}));

describe('useColumnGenerator', () => {
  const setEditableKeys = jest.fn();
  const pendingUnlinkRef = { current: new Set<string | number>() };
  const onDetail = jest.fn();
  const onAction = jest.fn();
  const onSave = jest.fn().mockResolvedValue(undefined);
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onUnlink = jest.fn().mockResolvedValue(undefined);
  const onDeleteRelated = jest.fn().mockResolvedValue(undefined);
  const onEditRelated = jest.fn();
  const onCopyRelated = jest.fn().mockResolvedValue(undefined);

  const modelDesc = {
    attrs: {
      list_display: [
        'id',
        'name',
        'status',
        'is_on',
        'created_at',
        'updated_at',
        'score',
        'title',
        'editor',
        'image',
        'payload',
      ],
      list_order: ['name', 'id'],
      search_fields: ['name', 'created_at', 'score', 'title'],
      search_range_fields: ['created_at', 'score', 'title'],
      list_sort: ['score'],
      list_filter: ['status', 'is_on'],
      list_search: ['name'],
      list_editable: ['name'],
      can_edit: true,
      can_delete: true,
    },
    fields: {
      id: {
        name: 'ID',
        field_type: 'IntegerField',
        show: true,
        readonly: true,
      },
      name: { name: 'Name', field_type: 'CharField', show: true },
      status: {
        name: 'Status',
        field_type: 'CharField',
        choices: [
          ['A', 'Active'],
          ['I', 'Inactive'],
        ],
      },
      is_on: { name: 'On', field_type: 'BooleanField' },
      created_at: { name: 'Created', field_type: 'DateField' },
      updated_at: { name: 'Updated', field_type: 'DatetimeField' },
      score: { name: 'Score', field_type: 'FloatField' },
      title: { name: 'Title', field_type: 'TextField' },
      editor: { name: 'Editor', field_type: 'EditorField' },
      image: { name: 'Image', field_type: 'ImageField' },
      payload: { name: 'Payload', field_type: 'JsonField' },
      hidden: { name: 'Hidden', field_type: 'CharField', show: false },
    },
    actions: {
      reset: { name: 'reset', label: 'Reset', batch: false },
      batch_export: {
        name: 'batch_export',
        label: 'Batch Export',
        batch: true,
      },
    },
  } as any;

  const data = [
    { id: 1, status: 'A', is_on: true, name: 'Alice', score: 2 },
    { id: 2, status: 'I', is_on: false, name: 'Bob', score: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    pendingUnlinkRef.current.clear();
  });

  it('generates columns with search/filter/sort/edit metadata', () => {
    const { result } = renderHook(() =>
      useColumnGenerator({
        modelDesc,
        editableKeys: [],
        setEditableKeys,
        pendingUnlinkRef,
        data,
        onDetail,
        onAction,
        onSave,
        onDelete,
        onUnlink,
        onDeleteRelated,
        onEditRelated,
        onCopyRelated,
      }),
    );

    const columns = result.current.generateColumns();
    const byKey = Object.fromEntries(columns.map((c: any) => [c.key, c]));

    expect(columns.length).toBeGreaterThan(1);
    expect(byKey.name.hideInSearch).toBe(false);
    expect(byKey.created_at.valueType).toBe('dateRange');
    expect(byKey.score.valueType).toBe('digitRange');
    expect(typeof byKey.title.renderFormItem).toBe('function');
    expect(byKey.status.valueType).toBe('select');
    expect(byKey.is_on.valueType).toBe('switch');
    expect(typeof byKey.score.sorter).toBe('function');
    expect(byKey.status.filters.length).toBeGreaterThan(0);
    expect(typeof byKey.name.filterDropdown).toBe('function');
    expect(typeof byKey.name.onFilter).toBe('function');
    expect(byKey.id.editable).toBe(false);
    expect(typeof byKey.name.editable).toBe('function');

    // renderer hooks called
    expect(mockRenderBooleanField).toHaveBeenCalled();
    expect(mockRenderDateField).toHaveBeenCalled();
    expect(mockRenderDatetimeField).toHaveBeenCalled();
    expect(mockRenderChoiceField).toHaveBeenCalled();
    expect(mockRenderNumberField).toHaveBeenCalled();
    expect(mockRenderTextField).toHaveBeenCalled();
    expect(mockRenderEditorField).toHaveBeenCalled();
    expect(mockRenderImageField).toHaveBeenCalled();
    expect(mockRenderJsonField).toHaveBeenCalled();
  });

  it('executes action column handlers for detail/edit/delete/unlink/custom', async () => {
    const actionApi = {
      startEditable: jest.fn(),
      cancelEditable: jest.fn(),
    };

    const { result } = renderHook(() =>
      useColumnGenerator({
        modelDesc,
        editableKeys: [],
        setEditableKeys,
        pendingUnlinkRef,
        data,
        onDetail,
        onAction,
        onSave,
        onDelete,
        onUnlink,
        onDeleteRelated,
        onEditRelated: undefined,
        onCopyRelated,
      }),
    );

    const columns = result.current.generateColumns();
    const actionCol: any = columns.find(
      (c: any) => c.key === undefined && c.dataIndex === 'option',
    );
    const rendered: any[] = actionCol.render(
      null,
      { id: 1, name: 'A' },
      0,
      actionApi,
    );

    const detailBtn = rendered.find((x) => x.key === 'detail');
    detailBtn.props.onClick();
    expect(onDetail).toHaveBeenCalled();

    const editBtn = rendered.find(
      (x) => x?.props?.children === 'Edit' && x?.key !== 'edit-related',
    );
    editBtn.props.onClick();
    expect(setEditableKeys).toHaveBeenCalled();
    expect(actionApi.startEditable).toHaveBeenCalledWith(1);

    const unlinkPop = rendered.find((x) => x.key === 'unlink');
    await unlinkPop.props.onConfirm();
    expect(onUnlink).toHaveBeenCalledWith({ id: 1, name: 'A' });

    pendingUnlinkRef.current.add(1);
    await unlinkPop.props.onConfirm();
    expect(onUnlink).toHaveBeenCalledTimes(1);

    const deleteRelatedPop = rendered.find((x) => x.key === 'delete-related');
    await deleteRelatedPop.props.onConfirm();
    expect(onDeleteRelated).toHaveBeenCalled();

    const copyBtn = rendered.find((x) => x.key === 'copy-related');
    await copyBtn.props.onClick();
    expect(onCopyRelated).toHaveBeenCalledWith({ id: 1, name: 'A' });

    const moreDropdown = rendered.find((x) => x.key === 'more');
    moreDropdown.props.menu.items[0].onClick();
    expect(onAction).toHaveBeenCalledWith(
      'reset',
      expect.any(Object),
      { id: 1, name: 'A' },
      false,
      [],
    );
  });

  it('executes editing branch save/cancel and fallback delete branch', async () => {
    const { result } = renderHook(() =>
      useColumnGenerator({
        modelDesc: {
          ...modelDesc,
          attrs: { ...modelDesc.attrs, can_edit: true, can_delete: true },
        },
        editableKeys: [1],
        setEditableKeys,
        pendingUnlinkRef,
        data,
        onDetail,
        onAction,
        onSave,
        onDelete,
        onUnlink: undefined,
        onDeleteRelated: undefined,
        onEditRelated: undefined,
        onCopyRelated: undefined,
      }),
    );

    const actionApi = {
      startEditable: jest.fn(),
      cancelEditable: jest.fn(),
    };

    const columns = result.current.generateColumns();
    const actionCol: any = columns.find((c: any) => c.dataIndex === 'option');
    const rendered: any[] = actionCol.render(
      null,
      { id: 1, name: 'A' },
      0,
      actionApi,
    );

    const saveBtn = rendered.find((x) => x?.props?.children === 'Save');
    await saveBtn.props.onClick();
    expect(onSave).toHaveBeenCalled();

    const cancelBtn = rendered.find((x) => x?.props?.children === 'Cancel');
    cancelBtn.props.onClick();
    expect(actionApi.cancelEditable).toHaveBeenCalledWith(1);

    // not editing case to trigger standard delete
    const rendered2: any[] = actionCol.render(
      null,
      { id: 2, name: 'B' },
      0,
      actionApi,
    );
    const deletePop = rendered2.find((x) => x.key === 'delete');
    await deletePop.props.onConfirm();
    expect(onDelete).toHaveBeenCalledWith({ id: 2, name: 'B' });
  });

  it('triggers popup edit action when configured', () => {
    const { result } = renderHook(() =>
      useColumnGenerator({
        modelDesc,
        editableKeys: [],
        setEditableKeys,
        pendingUnlinkRef,
        data,
        onDetail,
        onAction,
        onSave,
        onDelete,
        onUnlink: undefined,
        onDeleteRelated: undefined,
        onEditRelated,
        onCopyRelated: undefined,
      }),
    );

    const actionApi = {
      startEditable: jest.fn(),
      cancelEditable: jest.fn(),
    };
    const columns = result.current.generateColumns();
    const actionCol: any = columns.find((c: any) => c.dataIndex === 'option');
    const rendered: any[] = actionCol.render(
      null,
      { id: 9, name: 'P' },
      0,
      actionApi,
    );
    const popupEdit = rendered.find((x) => x.key === 'edit-related');
    popupEdit.props.onClick();
    expect(onEditRelated).toHaveBeenCalledWith({ id: 9, name: 'P' });
  });
});
