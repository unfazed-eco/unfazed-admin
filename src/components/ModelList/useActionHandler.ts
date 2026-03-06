/**
 * Hook for handling model actions
 */

import type { ActionType } from '@ant-design/pro-components';
import { useCallback, useRef, useState } from 'react';
import { showDisplayModal } from './DisplayModal';
import type { CurrentAction } from './types';

interface UseActionHandlerOptions {
  modelDesc: API.AdminSerializeModel | null;
  actionRef: React.MutableRefObject<ActionType>;
  executeBatchAction: (
    actionKey: string,
    records: Record<string, any>[],
    modelDesc?: API.AdminSerializeModel,
    extra?: any,
    searchParams?: Record<string, any>,
  ) => Promise<any>;
  executeRowAction: (
    actionKey: string,
    record: Record<string, any>,
    modelDesc?: API.AdminSerializeModel,
    extra?: any,
  ) => Promise<any>;
}

export const useActionHandler = ({
  modelDesc,
  actionRef,
  executeBatchAction,
  executeRowAction,
}: UseActionHandlerOptions) => {
  // Use ref to store latest search params (avoids async state update issues)
  const latestSearchParamsRef = useRef<Record<string, any>>({});

  // Action Modal state
  const [stringModalVisible, setStringModalVisible] = useState(false);
  const [fileModalVisible, setFileModalVisible] = useState(false);
  const [currentAction, setCurrentAction] = useState<CurrentAction | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  // Update latest search params
  const updateSearchParams = useCallback((params: Record<string, any>) => {
    latestSearchParamsRef.current = params;
  }, []);

  // Execute action core logic
  const executeAction = useCallback(
    async (
      actionKey: string,
      _actionConfig: any,
      record?: Record<string, any>,
      isBatch = false,
      records: Record<string, any>[] = [],
      extra?: any,
      searchParams?: Record<string, any>,
    ) => {
      setActionLoading(true);
      try {
        let result: any;
        if (isBatch) {
          result = await executeBatchAction(
            actionKey,
            records,
            modelDesc || undefined,
            extra,
            searchParams,
          );
        } else {
          result = await executeRowAction(
            actionKey,
            record || {},
            modelDesc || undefined,
            extra,
          );
        }

        if (result.success) {
          // Handle display type output
          if (
            (result.actionConfig as any)?.output === 'display' &&
            result.data
          ) {
            showDisplayModal(result.data, result.actionConfig);
          } else {
            // Other output types handled in hook
            actionRef.current?.reload?.();
          }
        }
      } catch (error) {
        console.error('Action execution error:', error);
      } finally {
        setActionLoading(false);
      }
    },
    [executeBatchAction, executeRowAction, modelDesc, actionRef],
  );

  // Trigger action (based on input type)
  const triggerAction = useCallback(
    (
      actionKey: string,
      actionConfig: any,
      record?: Record<string, any>,
      isBatch = false,
      records: Record<string, any>[] = [],
      searchParams?: Record<string, any>,
    ) => {
      // Use latestSearchParamsRef if searchParams has no valid values
      const hasValidSearchParams =
        searchParams &&
        Object.values(searchParams).some(
          (v) => v !== undefined && v !== null && v !== '',
        );
      const effectiveSearchParams = hasValidSearchParams
        ? searchParams
        : latestSearchParamsRef.current;

      setCurrentAction({
        actionKey,
        actionConfig,
        record,
        isBatch,
        records,
        searchParams: effectiveSearchParams,
      });

      switch (actionConfig.input) {
        case 'string':
          setStringModalVisible(true);
          break;
        case 'file':
          setFileModalVisible(true);
          break;
        default:
          // Execute directly
          executeAction(
            actionKey,
            actionConfig,
            record,
            isBatch,
            records,
            undefined,
            effectiveSearchParams,
          );
          break;
      }
    },
    [executeAction],
  );

  // String input modal confirm handler
  const handleStringInputConfirm = useCallback(
    (inputValue: string) => {
      if (currentAction) {
        const extra = { input: inputValue };
        executeAction(
          currentAction.actionKey,
          currentAction.actionConfig,
          currentAction.record,
          currentAction.isBatch,
          currentAction.records || [],
          extra,
          currentAction.searchParams,
        );
      }
      setStringModalVisible(false);
      setCurrentAction(null);
    },
    [currentAction, executeAction],
  );

  // File upload modal confirm handler
  const handleFileUploadConfirm = useCallback(
    (files: File[]) => {
      if (currentAction) {
        // Convert files to backend required format
        const filePromises = files.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                content: reader.result, // base64 data URL
              });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(filePromises).then((filesData) => {
          const extra = { files: filesData };
          executeAction(
            currentAction.actionKey,
            currentAction.actionConfig,
            currentAction.record,
            currentAction.isBatch,
            currentAction.records || [],
            extra,
            currentAction.searchParams,
          );
        });
      }
      setFileModalVisible(false);
      setCurrentAction(null);
    },
    [currentAction, executeAction],
  );

  // Modal cancel handler
  const handleModalCancel = useCallback(() => {
    setStringModalVisible(false);
    setFileModalVisible(false);
    setCurrentAction(null);
    setActionLoading(false);
  }, []);

  return {
    // State
    stringModalVisible,
    fileModalVisible,
    currentAction,
    actionLoading,

    // Actions
    updateSearchParams,
    triggerAction,
    handleStringInputConfirm,
    handleFileUploadConfirm,
    handleModalCancel,
  };
};
