/**
 * CommonProTable Component
 *
 * A reusable table component based on ProTable with support for:
 * - Dynamic column generation from model description
 * - Client-side and server-side data fetching
 * - Inline editing
 * - Batch and row actions
 * - Link/Unlink for back relations
 *
 * Usage:
 * ```tsx
 * import { CommonProTable } from '@/components';
 *
 * <CommonProTable
 *   modelDesc={modelDesc}
 *   modelName="myModel"
 *   onRequest={handleRequest}
 *   onDetail={handleDetail}
 * />
 * ```
 */

import { LinkOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Dropdown } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CommonProTableProps } from './types';
import { useColumnGenerator } from './useColumnGenerator';
import { useTableState } from './useTableState';

const MIN_COLUMN_WIDTH = 80;
const getColumnStorageKey = (modelName: string) =>
  `unfazed-admin:table-column-widths:${modelName}`;

const readStoredColumnWidths = (modelName: string): Record<string, number> => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(getColumnStorageKey(modelName));
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};

    return Object.entries(parsed).reduce<Record<string, number>>(
      (acc, [key, value]) => {
        if (typeof value === 'number' && Number.isFinite(value)) {
          acc[key] = value;
        }
        return acc;
      },
      {},
    );
  } catch {
    return {};
  }
};

interface ResizableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  width?: number;
  columnKey?: string;
  onResizeColumn?: (columnKey: string, width: number) => void;
}

const ResizableHeaderCell: React.FC<ResizableHeaderCellProps> = ({
  width,
  columnKey,
  onResizeColumn,
  children,
  style,
  ...restProps
}) => {
  const stopResizeEvent = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation?.();
    },
    [],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLSpanElement>) => {
      if (!columnKey || !width || !onResizeColumn) return;

      stopResizeEvent(event);

      const startX = event.clientX;
      const headerCell = event.currentTarget.parentElement;
      const currentWidth = headerCell?.getBoundingClientRect().width;
      const startWidth =
        currentWidth && Number.isFinite(currentWidth) ? currentWidth : width;
      const originalCursor = document.body.style.cursor;
      const originalUserSelect = document.body.style.userSelect;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const nextWidth = Math.max(
          MIN_COLUMN_WIDTH,
          startWidth + moveEvent.clientX - startX,
        );
        onResizeColumn(columnKey, nextWidth);
      };

      const handleMouseUp = () => {
        document.body.style.cursor = originalCursor;
        document.body.style.userSelect = originalUserSelect;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp, {
          capture: true,
        });
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { capture: true });
    },
    [columnKey, onResizeColumn, stopResizeEvent, width],
  );

  return (
    <th
      {...restProps}
      style={{
        ...style,
        width,
        minWidth: width,
        position: 'relative',
      }}
    >
      {children}
      {columnKey && width ? (
        <span
          aria-hidden="true"
          className="common-pro-table-column-resize-handle"
          onClick={stopResizeEvent}
          onMouseDown={handleMouseDown}
          onMouseUp={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        />
      ) : null}
    </th>
  );
};

const CommonProTable: React.FC<CommonProTableProps> = ({
  modelDesc,
  modelName,
  data,
  onDetail,
  onAction,
  onSave,
  onDelete,
  onUnlink,
  onLink,
  linkDisabled,
  onAddRelated,
  onBatchAddRelated,
  onDeleteRelated,
  onEditRelated,
  onCopyRelated,
  onRequest,
  tableProps = {},
  actionRef,
}) => {
  const formRef = useRef<ProFormInstance>(null as any);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    readStoredColumnWidths(modelName),
  );

  // Table state management
  const {
    editableKeys,
    setEditableKeys,
    currentSearchParams,
    filteredData,
    pendingUnlinkRef,
    handleSearchSubmit,
  } = useTableState({ modelDesc, data });

  // Column generation
  const { generateColumns } = useColumnGenerator({
    modelDesc,
    editableKeys,
    setEditableKeys,
    pendingUnlinkRef,
    data: filteredData ?? data,
    onDetail,
    onAction,
    onSave,
    onDelete,
    onUnlink,
    onDeleteRelated,
    onEditRelated,
    onCopyRelated,
  });

  // Generate batch action menu items
  const getBatchActionMenuItems = useCallback(() => {
    if (!modelDesc.actions) return [];

    const menuItems: any[] = [];
    Object.entries(modelDesc.actions).forEach(
      ([actionKey, action]: [string, any]) => {
        if (action.batch) {
          menuItems.push({
            key: actionKey,
            label: action.label || action.name,
            onClick: () => {
              const currentFormValues = formRef.current?.getFieldsValue() || {};
              const searchParams = {
                ...currentSearchParams,
                ...currentFormValues,
              };
              onAction?.(actionKey, action, undefined, true, [], searchParams);
            },
          });
        }
      },
    );

    return menuItems;
  }, [modelDesc, onAction, currentSearchParams]);

  // Render toolbar buttons
  const renderToolBar = useCallback(() => {
    const buttons: React.ReactNode[] = [];

    // Link button for back relations
    if (onLink) {
      buttons.push(
        <Button
          key="link"
          type="primary"
          icon={<LinkOutlined />}
          onClick={onLink}
          disabled={linkDisabled}
        >
          Link
        </Button>,
      );
    }

    // Add button for back relations
    if (onAddRelated) {
      buttons.push(
        <Button
          key="add-related"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddRelated}
        >
          Add
        </Button>,
      );
    }

    // Batch Add button for bk_fk inline paste flow
    if (onBatchAddRelated) {
      buttons.push(
        <Button
          key="batch-add-related"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onBatchAddRelated}
        >
          Batch Add
        </Button>,
      );
    }

    // Standard add button
    if (modelDesc.attrs.can_add) {
      buttons.push(
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onAction?.('add', { name: 'add' })}
        >
          Add
        </Button>,
      );
    }

    return buttons;
  }, [
    modelDesc,
    onAction,
    onLink,
    linkDisabled,
    onAddRelated,
    onBatchAddRelated,
  ]);

  const columns = useMemo(() => generateColumns(), [generateColumns]);
  const handleResizeColumn = useCallback((columnKey: string, width: number) => {
    setColumnWidths((prev) => ({
      ...prev,
      [columnKey]: Math.round(width),
    }));
  }, []);
  const resizableColumns = useMemo(() => {
    return columns.map((column: any) => {
      const columnKey = String(column.key ?? column.dataIndex ?? '');
      const isActionColumn =
        column.dataIndex === 'option' ||
        column.valueType === 'option' ||
        column.fixed === 'right';

      if (!columnKey || isActionColumn) {
        return column;
      }

      const width =
        columnWidths[columnKey] ||
        (typeof column.width === 'number' ? column.width : 150);
      const existingOnHeaderCell = column.onHeaderCell;

      return {
        ...column,
        width,
        onHeaderCell: (...args: any[]) => ({
          ...existingOnHeaderCell?.(...args),
          width,
          columnKey,
          onResizeColumn: handleResizeColumn,
        }),
      };
    });
  }, [columnWidths, columns, handleResizeColumn]);
  const tableScrollX = useMemo(() => {
    const totalWidth = resizableColumns.reduce((sum: number, column: any) => {
      if (typeof column.width === 'number' && Number.isFinite(column.width)) {
        return sum + column.width;
      }
      return sum + 150;
    }, 0);

    return Math.max(totalWidth, 1);
  }, [resizableColumns]);

  // Check for searchable fields and batch actions
  const canSearch = modelDesc.attrs?.can_search !== false;
  const searchFields = (modelDesc.attrs as any)?.search_fields || [];
  const hasSearchableFields = searchFields.length > 0;
  const batchActions = getBatchActionMenuItems();
  const hasBatchActions = batchActions.length > 0;
  // Show search panel if can_search is not false AND (has searchable fields OR has batch actions)
  const showSearchPanel = canSearch && (hasSearchableFields || hasBatchActions);
  const rawHelpText = modelDesc.attrs?.help_text;
  const helpText =
    typeof rawHelpText === 'string'
      ? rawHelpText.trim()
      : rawHelpText
        ? String(rawHelpText)
        : '';
  const hasHelpText = helpText.length > 0;
  const isLongHelpText = helpText.length > 160 || helpText.includes('\n');

  useEffect(() => {
    setIsHelpExpanded(false);
  }, [helpText, modelName]);

  useEffect(() => {
    setColumnWidths(readStoredColumnWidths(modelName));
  }, [modelName]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        getColumnStorageKey(modelName),
        JSON.stringify(columnWidths),
      );
    } catch {
      // Ignore storage failures; resizing should still work for this render.
    }
  }, [columnWidths, modelName]);

  const { components: tablePropsComponents, ...restTableProps } =
    tableProps || {};
  const tableComponents = tablePropsComponents || {};
  const mergedComponents = useMemo(
    () => ({
      ...tableComponents,
      header: {
        ...tableComponents.header,
        cell: tableComponents.header?.cell || ResizableHeaderCell,
      },
    }),
    [tableComponents],
  );

  const headerTitle = useMemo(() => {
    if (!hasHelpText) return modelName;
    if (!isLongHelpText) return helpText;

    return (
      <div style={{ maxWidth: 'min(720px, 100%)' }}>
        <div
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '22px',
            overflow: 'hidden',
            display: isHelpExpanded ? 'block' : '-webkit-box',
            WebkitLineClamp: isHelpExpanded ? undefined : 1,
            WebkitBoxOrient: isHelpExpanded ? undefined : 'vertical',
          }}
        >
          {helpText}
        </div>
        <Button
          type="link"
          size="small"
          style={{ paddingLeft: 0, marginTop: 4 }}
          onClick={() => setIsHelpExpanded((prev) => !prev)}
        >
          {isHelpExpanded ? 'Collapse' : 'More'}
        </Button>
      </div>
    );
  }, [hasHelpText, helpText, isLongHelpText, isHelpExpanded, modelName]);

  return (
    <>
      <style>
        {`
          .common-pro-table [class*='ant-space'] {
            flex-wrap: wrap !important;
            justify-content: flex-end !important;
          }
          .common-pro-table [class*='ant-space-item']:last-child {
            margin-left: auto !important;
          }
          .common-pro-table [class*='ant-pro-query-filter-collapse-button'] {
            white-space: nowrap !important;
          }
          .common-pro-table-column-resize-handle {
            position: absolute;
            top: 0;
            right: 0;
            width: 12px;
            height: 100%;
            cursor: col-resize;
            pointer-events: auto;
            user-select: none;
            z-index: 30;
          }
          .common-pro-table-column-resize-handle:hover {
            background: rgba(22, 119, 255, 0.18);
          }
        `}
      </style>
      <ProTable<Record<string, any>>
        className="common-pro-table"
        headerTitle={headerTitle}
        actionRef={actionRef}
        formRef={formRef}
        rowKey={(record) => record.id || record.key || JSON.stringify(record)}
        search={
          showSearchPanel
            ? {
                labelWidth: 120,
                defaultCollapsed: false,
                optionRender: (
                  _searchConfig: any,
                  formProps: any,
                  dom: any,
                ) => {
                  const originalButtons = hasSearchableFields
                    ? dom.reverse()
                    : [];
                  const buttons = [...originalButtons];

                  if (hasBatchActions) {
                    const batchActionItems = Object.entries(
                      modelDesc.actions || {},
                    )
                      .filter(([, action]: [string, any]) => action.batch)
                      .map(([actionKey, action]: [string, any]) => ({
                        key: actionKey,
                        label: action.label || action.name,
                        onClick: () => {
                          const formValues =
                            formProps.form?.getFieldsValue() || {};
                          onAction?.(
                            actionKey,
                            action,
                            undefined,
                            true,
                            [],
                            formValues,
                          );
                        },
                      }));

                    buttons.push(
                      <Dropdown
                        key="batch-actions"
                        menu={{ items: batchActionItems }}
                        trigger={['click']}
                      >
                        <Button>
                          Batch Actions
                          <MoreOutlined />
                        </Button>
                      </Dropdown>,
                    );
                  }

                  return (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {buttons}
                    </div>
                  );
                },
              }
            : false
        }
        toolBarRender={() => {
          const buttons = renderToolBar();
          return buttons.length > 0 ? buttons : false;
        }}
        request={data ? undefined : onRequest}
        beforeSearchSubmit={handleSearchSubmit}
        dataSource={data ? (filteredData ?? data) : undefined}
        columns={resizableColumns}
        components={mergedComponents}
        editable={
          modelDesc.attrs.can_edit
            ? {
                type: 'multiple',
                editableKeys,
                onChange: setEditableKeys,
                onSave: async (_key: any, record: Record<string, any>) => {
                  await onSave?.(record);
                },
                actionRender: (_row: any, _config: any, defaultDom: any) => {
                  return [defaultDom.save, defaultDom.cancel];
                },
              }
            : undefined
        }
        scroll={{
          x: tableScrollX,
          y: 'calc(100vh - 400px)',
        }}
        tableLayout="fixed"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        options={{
          search: false,
          reload: true,
          density: true,
          setting: true,
        }}
        {...restTableProps}
      />
    </>
  );
};

export default CommonProTable;

// Re-export types for convenience
export type { CommonProTableProps } from './types';
