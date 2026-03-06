import type { ActionType } from '@ant-design/pro-components';
import { Card } from 'antd';
import React, { useCallback, useRef } from 'react';
import { CommonProTable } from '../index';
import type {
  InlineActionRefsMap,
  ModalVisibilityState,
  ReloadTimestampMap,
} from './types';
import { useRequestHandlers } from './useRequestHandlers';

interface InlineTabRendererProps {
  record: Record<string, any>;
  inlineDescs: Record<string, any>;
  loadedTabs: Set<string>;
  editingKeys: Record<string, any[]>;
  handleInlineAction: (
    inlineName: string,
    actionKey: string,
    action: any,
    actionRecord?: any,
    isBatch?: boolean,
    records?: any[],
  ) => void;
  handleInlineSave: (
    inlineName: string,
    record: Record<string, any>,
  ) => Promise<void>;
  handleInlineDelete: (
    inlineName: string,
    record: Record<string, any>,
  ) => Promise<void>;
  handleM2MRemove: (
    inlineName: string,
    inlineDesc: any,
    targetRecordsOrIds: any | any[],
  ) => Promise<void>;
  handleBackRelationUnlink: (
    inlineName: string,
    inlineDesc: any,
    targetRecord: any,
  ) => Promise<void>;
  addInlineRecord: (inlineName: string, newRecord: Record<string, any>) => void;
  setM2MModalVisible: React.Dispatch<
    React.SetStateAction<ModalVisibilityState>
  >;
  setBackRelationModalVisible: React.Dispatch<
    React.SetStateAction<ModalVisibilityState>
  >;
  setBackRelationAddModalVisible: React.Dispatch<
    React.SetStateAction<ModalVisibilityState>
  >;
  setOperationLoading: React.Dispatch<React.SetStateAction<boolean>>;
  inlineActionRefs: React.MutableRefObject<InlineActionRefsMap>;
}

export const useInlineTabRenderer = ({
  record,
  inlineDescs,
  loadedTabs,
  editingKeys,
  handleInlineAction,
  handleInlineSave,
  handleInlineDelete,
  handleM2MRemove,
  handleBackRelationUnlink,
  addInlineRecord,
  setM2MModalVisible,
  setBackRelationModalVisible,
  setBackRelationAddModalVisible,
  setOperationLoading,
  inlineActionRefs,
}: InlineTabRendererProps) => {
  // Track reload timestamps to prevent duplicate reloads
  const lastReloadTime = useRef<ReloadTimestampMap>({});

  const {
    createBackRelationRequestHandler,
    createForwardRelationRequestHandler,
    createM2MRequestHandler,
  } = useRequestHandlers({ record });

  // Helper function to reload table with debounce (prevents duplicate requests)
  const debouncedReload = useCallback(
    (inlineName: string) => {
      const now = Date.now();
      const lastTime = lastReloadTime.current[inlineName] || 0;
      if (now - lastTime > 500) {
        // Only reload if more than 500ms since last reload
        lastReloadTime.current[inlineName] = now;
        inlineActionRefs.current[inlineName]?.reload();
      }
    },
    [inlineActionRefs],
  );

  // Render inline component based on relation type
  const renderInlineComponent = useCallback(
    (inlineName: string) => {
      const inlineDesc = inlineDescs[inlineName];
      const relationType = (inlineDesc as any)?.relation?.relation;
      const isLoaded = loadedTabs.has(inlineName);

      if (!inlineDesc) return null;

      if (!isLoaded) {
        return (
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <span>Loading...</span>
            </div>
          </Card>
        );
      }

      switch (relationType) {
        case 'm2m': {
          // M2M table uses request mode to show ONLY linked records with pagination
          // Use stable request handler to prevent unnecessary re-requests
          const handleM2MRequest = createM2MRequestHandler(
            inlineName,
            inlineDesc,
          );

          return (
            <Card>
              <CommonProTable
                modelDesc={{
                  ...inlineDesc,
                  attrs: {
                    ...inlineDesc.attrs,
                    can_add: false,
                    can_edit: false,
                    can_delete: false,
                  },
                }}
                modelName={inlineName}
                onRequest={handleM2MRequest}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  handleInlineAction(
                    inlineName,
                    actionKey,
                    action,
                    actionRecord,
                    isBatch,
                    records,
                  );
                }}
                onUnlink={async (unlinkRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleM2MRemove(inlineName, inlineDesc, unlinkRecord);
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                onLink={() =>
                  setM2MModalVisible((prev) => ({
                    ...prev,
                    [inlineName]: true,
                  }))
                }
                actionRef={
                  {
                    get current() {
                      return inlineActionRefs.current[inlineName];
                    },
                    set current(ref: ActionType | undefined) {
                      inlineActionRefs.current[inlineName] = ref;
                    },
                  } as React.MutableRefObject<ActionType | undefined>
                }
                tableProps={{
                  pagination: {
                    defaultPageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );
        }

        case 'fk':
        case 'o2o': {
          // Use stable request handler to prevent unnecessary re-requests
          const handleFkRequest = createForwardRelationRequestHandler(
            inlineName,
            inlineDesc,
          );

          return (
            <Card>
              <CommonProTable
                modelDesc={{
                  ...inlineDesc,
                  attrs: {
                    ...inlineDesc.attrs,
                    can_add: false, // Disable Add button for inline tables
                    can_edit: false, // Disable Edit button for inline tables
                  },
                }}
                modelName={inlineName}
                onRequest={handleFkRequest}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  handleInlineAction(
                    inlineName,
                    actionKey,
                    action,
                    actionRecord,
                    isBatch,
                    records,
                  );
                }}
                onSave={async (saveRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleInlineSave(inlineName, saveRecord);
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                onDelete={async (deleteRecord: any) => {
                  setOperationLoading(true);
                  try {
                    await handleInlineDelete(inlineName, deleteRecord);
                    debouncedReload(inlineName);
                  } finally {
                    setOperationLoading(false);
                  }
                }}
                actionRef={
                  {
                    get current() {
                      return inlineActionRefs.current[inlineName];
                    },
                    set current(ref: ActionType | undefined) {
                      inlineActionRefs.current[inlineName] = ref;
                    },
                  } as React.MutableRefObject<ActionType | undefined>
                }
                tableProps={{
                  pagination: {
                    defaultPageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );
        }

        case 'bk_fk':
        case 'bk_o2o': {
          // For back relations, use Link/Unlink instead of Add/Edit/Delete
          // Use stable request handler to prevent unnecessary re-requests
          const handleRequest = createBackRelationRequestHandler(
            inlineName,
            inlineDesc,
          );

          // Check if target_field is nullable
          // When nullable=false: show Add + Delete buttons (must create/delete records)
          // When nullable=true: show Link + Unlink buttons (can link/unlink existing records)
          const isTargetFieldNullable =
            inlineDesc.relation?.target_field_nullable !== false;

          return (
            <Card>
              <CommonProTable
                modelDesc={{
                  ...inlineDesc,
                  attrs: {
                    ...inlineDesc.attrs,
                    can_add: false, // Disable Add button for back relation tables
                    can_edit: false, // Disable Edit button for back relation tables
                    can_delete: false, // Disable Delete button, use Unlink instead
                  },
                }}
                modelName={inlineName}
                onRequest={handleRequest}
                onAction={(
                  actionKey: string,
                  action: any,
                  actionRecord?: any,
                  isBatch?: boolean,
                  records?: any[],
                ) => {
                  handleInlineAction(
                    inlineName,
                    actionKey,
                    action,
                    actionRecord,
                    isBatch,
                    records,
                  );
                }}
                // Unlink button - only show when target_field is nullable
                onUnlink={
                  isTargetFieldNullable
                    ? async (unlinkRecord: any) => {
                        setOperationLoading(true);
                        try {
                          await handleBackRelationUnlink(
                            inlineName,
                            inlineDesc,
                            unlinkRecord,
                          );
                          debouncedReload(inlineName);
                        } finally {
                          setOperationLoading(false);
                        }
                      }
                    : undefined
                }
                // Link button - only show when target_field is nullable
                onLink={
                  isTargetFieldNullable
                    ? () =>
                        setBackRelationModalVisible((prev) => ({
                          ...prev,
                          [inlineName]: true,
                        }))
                    : undefined
                }
                // Add button - only show when target_field is NOT nullable
                onAddRelated={
                  !isTargetFieldNullable
                    ? () =>
                        setBackRelationAddModalVisible((prev) => ({
                          ...prev,
                          [inlineName]: true,
                        }))
                    : undefined
                }
                // Delete button - only show when target_field is NOT nullable
                onDeleteRelated={
                  !isTargetFieldNullable
                    ? async (deleteRecord: any) => {
                        setOperationLoading(true);
                        try {
                          await handleInlineDelete(inlineName, deleteRecord);
                          debouncedReload(inlineName);
                        } finally {
                          setOperationLoading(false);
                        }
                      }
                    : undefined
                }
                // bk_o2o can always open modal to change the linked record
                linkDisabled={false}
                actionRef={
                  {
                    get current() {
                      return inlineActionRefs.current[inlineName];
                    },
                    set current(ref: ActionType | undefined) {
                      inlineActionRefs.current[inlineName] = ref;
                    },
                  } as React.MutableRefObject<ActionType | undefined>
                }
                tableProps={{
                  pagination: {
                    defaultPageSize: inlineDesc.attrs?.list_per_page || 10,
                    pageSizeOptions: inlineDesc.attrs
                      ?.list_per_page_options || [10, 20, 50, 100],
                    showSizeChanger: true,
                    showQuickJumper: true,
                  },
                }}
              />
            </Card>
          );
        }

        default:
          console.error(
            `Unsupported relation type: ${(inlineDesc as any)?.relation?.relation}`,
          );
          return (
            <Card>
              <div
                style={{ padding: 16, textAlign: 'center', color: '#ff4d4f' }}
              >
                Unsupported relation type:{' '}
                {(inlineDesc as any)?.relation?.relation}
              </div>
            </Card>
          );
      }
    },
    [
      inlineDescs,
      record,
      editingKeys,
      handleInlineSave,
      handleInlineDelete,
      loadedTabs,
      handleInlineAction,
      handleM2MRemove,
      handleBackRelationUnlink,
      addInlineRecord,
      createBackRelationRequestHandler,
      createForwardRelationRequestHandler,
      createM2MRequestHandler,
      debouncedReload,
      inlineActionRefs,
      setM2MModalVisible,
      setBackRelationModalVisible,
      setBackRelationAddModalVisible,
      setOperationLoading,
    ],
  );

  return {
    renderInlineComponent,
    debouncedReload,
  };
};
