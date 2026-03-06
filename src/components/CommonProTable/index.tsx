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
import React, { useCallback, useMemo, useRef } from 'react';
import type { CommonProTableProps } from './types';
import { useColumnGenerator } from './useColumnGenerator';
import { useTableState } from './useTableState';

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
  onDeleteRelated,
  onRequest,
  tableProps = {},
  actionRef,
}) => {
  const formRef = useRef<ProFormInstance>(null as any);

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
  }, [modelDesc, onAction, onLink, linkDisabled, onAddRelated]);

  const columns = useMemo(() => generateColumns(), [generateColumns]);

  // Check for searchable fields and batch actions
  const canSearch = modelDesc.attrs?.can_search !== false;
  const searchFields = (modelDesc.attrs as any)?.search_fields || [];
  const hasSearchableFields = searchFields.length > 0;
  const batchActions = getBatchActionMenuItems();
  const hasBatchActions = batchActions.length > 0;
  // Show search panel if can_search is not false AND (has searchable fields OR has batch actions)
  const showSearchPanel = canSearch && (hasSearchableFields || hasBatchActions);

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
        `}
      </style>
      <ProTable<Record<string, any>>
        className="common-pro-table"
        headerTitle={modelDesc.attrs.help_text || modelName}
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
        columns={columns}
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
          x: 'max-content',
          y: 'calc(100vh - 400px)',
        }}
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
        {...tableProps}
      />
    </>
  );
};

export default CommonProTable;

// Re-export types for convenience
export type { CommonProTableProps } from './types';
