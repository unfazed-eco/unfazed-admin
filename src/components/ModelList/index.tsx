/**
 * ModelList Component
 *
 * A component for rendering model list with CRUD operations and custom actions.
 *
 * Usage:
 * ```tsx
 * import { ModelList } from '@/components';
 *
 * <ModelList
 *   modelName="myModel"
 *   onDetail={handleDetail}
 *   onModelDescLoaded={handleDescLoaded}
 * />
 * ```
 */

import type { ActionType } from '@ant-design/pro-components';
import { PageContainer } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import React, { useCallback, useRef, useState } from 'react';
import { FileUploadModal, StringInputModal } from '@/components/ActionModals';
import { useModelOperations } from '@/hooks/useModelOperations';
import { deleteModelData, getModelDesc } from '@/services/api';
import { CommonProTable } from '../index';
import type { ModelListProps } from './types';
import { useActionHandler } from './useActionHandler';

const ModelList: React.FC<ModelListProps> = ({
  modelName,
  onDetail,
  onModelDescLoaded,
}) => {
  const actionRef = useRef<ActionType>(null!);

  // Use custom hook for model operations
  const {
    contextHolder,
    messageApi,
    fetchModelData,
    executeBatchAction,
    executeRowAction,
    saveData,
    getStoredSettings,
  } = useModelOperations({
    modelName,
    onSuccess: () => {
      actionRef.current?.reload?.();
    },
  });

  // State management
  const [modelDesc, setModelDesc] = useState<API.AdminSerializeModel | null>(
    null,
  );
  const [_editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

  // Action handler hook
  const {
    stringModalVisible,
    fileModalVisible,
    currentAction,
    actionLoading,
    updateSearchParams,
    triggerAction,
    handleStringInputConfirm,
    handleFileUploadConfirm,
    handleModalCancel,
  } = useActionHandler({
    modelDesc,
    actionRef,
    executeBatchAction,
    executeRowAction,
  });

  // Fetch model description
  const { loading: descLoading } = useRequest(
    async () => {
      const response = await getModelDesc(modelName);
      if (response?.code === 0) {
        const modelDescData = response.data;
        setModelDesc(modelDescData);
        onModelDescLoaded?.(modelDescData);
        return modelDescData;
      } else {
        console.error('ModelList: getModelDesc failed:', response);
        return null;
      }
    },
    {
      manual: false,
      refreshDeps: [modelName],
    },
  );

  // Wrapped data fetch function
  const wrappedFetchModelData = useCallback(
    async (params: any) => {
      // Save latest search params for batch actions
      updateSearchParams(params);
      return await fetchModelData(params, modelDesc || undefined);
    },
    [fetchModelData, modelDesc, updateSearchParams],
  );

  // Save edited data
  const handleSave = useCallback(
    async (key: React.Key, record: Record<string, any>) => {
      const success = await saveData(record);
      if (success) {
        setEditableRowKeys((prevKeys) => prevKeys.filter((k) => k !== key));
        actionRef.current?.reload?.();
      }
    },
    [saveData],
  );

  // Handle delete
  const handleDelete = useCallback(
    async (record: Record<string, any>) => {
      try {
        const response = await deleteModelData({
          name: modelName,
          data: record,
        });

        if (response?.code === 0) {
          messageApi.success('Deleted successfully');
          actionRef.current?.reload?.();
        } else {
          messageApi.error(response?.message || 'Delete failed');
        }
      } catch (_error) {
        messageApi.error('Delete failed');
      }
    },
    [modelName, messageApi],
  );

  // Handle action
  const handleAction = useCallback(
    (
      actionKey: string,
      action: any,
      record?: any,
      isBatch?: boolean,
      records?: any[],
      searchParams?: Record<string, any>,
    ) => {
      if (actionKey === 'add') {
        // Handle add: navigate to ModelDetail with id = -1 for create mode
        const newRecord = { id: -1 };
        onDetail?.(newRecord);
      } else {
        triggerAction(
          actionKey,
          action,
          record,
          isBatch,
          records || [],
          searchParams,
        );
      }
    },
    [onDetail, triggerAction],
  );

  if (descLoading || !modelDesc) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      {contextHolder}

      {/* Action Modals */}
      <StringInputModal
        visible={stringModalVisible}
        title={(currentAction?.actionConfig as any)?.label || 'Input Required'}
        description={currentAction?.actionConfig?.description}
        onOk={handleStringInputConfirm}
        onCancel={handleModalCancel}
        loading={actionLoading}
      />

      <FileUploadModal
        visible={fileModalVisible}
        title={(currentAction?.actionConfig as any)?.label || 'Upload Files'}
        description={currentAction?.actionConfig?.description}
        onOk={handleFileUploadConfirm}
        onCancel={handleModalCancel}
        loading={actionLoading}
      />

      {/* List display */}
      <CommonProTable
        modelDesc={modelDesc}
        modelName={modelName}
        onDetail={onDetail}
        actionRef={actionRef}
        onAction={handleAction}
        onSave={async (record: any) => {
          await handleSave(
            record.id || record.key || JSON.stringify(record),
            record,
          );
        }}
        onDelete={handleDelete}
        onRequest={wrappedFetchModelData}
        tableProps={{
          pagination: {
            defaultPageSize:
              getStoredSettings().pageSize ||
              modelDesc.attrs.list_per_page ||
              20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: modelDesc.attrs.list_per_page_options || [
              10, 20, 50, 100,
            ],
          },
        }}
      />
    </PageContainer>
  );
};

export default ModelList;

// Re-export types
export type { ModelListProps } from './types';
