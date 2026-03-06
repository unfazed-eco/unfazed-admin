/**
 * Action handlers for model operations
 * Handles batch actions, row actions, and action response processing
 */

import type { MessageInstance } from 'antd/es/message/interface';
import { useCallback } from 'react';
import { executeModelAction, saveModelData } from '@/services/api';
import { buildSearchConditions } from './utils';

interface UseActionHandlersOptions {
  modelName: string;
  messageApi: MessageInstance;
  currentSearchParams: any;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useActionHandlers = ({
  modelName,
  messageApi,
  currentSearchParams,
  onSuccess,
  onError,
}: UseActionHandlersOptions) => {
  // Handle action response result
  const handleActionResponse = useCallback(
    (response: any, actionConfig: any) => {
      if (!response || response.code !== 0) {
        messageApi.error(response?.message || 'Operation failed');
        return;
      }

      // Handle response based on action output type
      switch (actionConfig?.output) {
        case 'toast':
          messageApi.success(response.message || 'Operation successful');
          break;
        case 'download':
          // Handle file download
          if (response.data?.url) {
            const link = document.createElement('a');
            link.href = response.data.url;
            link.download = response.data.filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (response.data?.content) {
            // If file content is returned, create blob for download
            const blob = new Blob([response.data.content], {
              type: response.data.contentType || 'application/octet-stream',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = response.data.filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
          break;
        case 'refresh':
          messageApi.success(response.message || 'Operation successful');
          onSuccess?.(); // Trigger page refresh
          break;
        case 'display':
          // display type is handled at call site, just return data here
          return response.data;
        default:
          messageApi.success(response.message || 'Operation successful');
      }

      return response.data;
    },
    [messageApi, onSuccess],
  );

  // Execute batch action
  const executeBatchAction = useCallback(
    async (
      actionKey: string,
      _records: Record<string, any>[],
      modelDesc?: API.AdminSerializeModel,
      extra?: any,
      searchParams?: Record<string, any>,
    ) => {
      try {
        // Use provided searchParams if it has valid values, otherwise fall back to currentSearchParams
        // Check if searchParams has any non-undefined, non-null, non-empty values
        const hasValidSearchParams =
          searchParams &&
          Object.values(searchParams).some(
            (v) => v !== undefined && v !== null && v !== '',
          );
        const paramsToUse = hasValidSearchParams
          ? searchParams
          : currentSearchParams;

        // Build search conditions in structured format
        const searchConditions = buildSearchConditions(paramsToUse, modelDesc);

        const payload: API.ModelActionRequest = {
          name: modelName,
          action: actionKey,
        };

        if (searchConditions.length > 0) {
          payload.search_condition = searchConditions;
        }

        if (
          extra &&
          typeof extra === 'object' &&
          Object.keys(extra).length > 0
        ) {
          payload.form_data = extra;
        }

        const response = await executeModelAction(payload);

        // Get action config
        const actionConfig = modelDesc?.actions?.[actionKey];
        const result = handleActionResponse(response, actionConfig);

        if ((actionConfig as any)?.output !== 'display') {
          onSuccess?.();
        }

        return { success: true, data: result, actionConfig };
      } catch (error) {
        messageApi.error('Operation failed');
        onError?.(error);
        console.error('Batch action error:', error);
        return { success: false, data: null, actionConfig: null };
      }
    },
    [
      modelName,
      messageApi,
      currentSearchParams,
      onSuccess,
      onError,
      handleActionResponse,
    ],
  );

  // Execute row-level action
  const executeRowAction = useCallback(
    async (
      actionKey: string,
      record: Record<string, any>,
      modelDesc?: API.AdminSerializeModel,
      extra?: any,
    ) => {
      try {
        // Generate condition for single record, only need current row ID
        const conditions: API.Condition[] = [
          {
            field: 'id',
            eq: record.id,
          },
        ];

        const response = await executeModelAction({
          name: modelName,
          action: actionKey,
          search_condition: conditions,
          // Always provide the full row payload so the API has complete context.
          form_data: {
            ...(record || {}),
            ...(extra || {}),
          },
        });

        // Get action config
        const actionConfig = modelDesc?.actions?.[actionKey];
        const result = handleActionResponse(response, actionConfig);

        if ((actionConfig as any)?.output !== 'display') {
          onSuccess?.();
        }

        return { success: true, data: result, actionConfig };
      } catch (error) {
        messageApi.error('Operation failed');
        onError?.(error);
        console.error('Row action error:', error);
        return { success: false, data: null, actionConfig: null };
      }
    },
    [modelName, messageApi, onSuccess, onError, handleActionResponse],
  );

  // Save model data
  const saveData = useCallback(
    async (data: Record<string, any>) => {
      try {
        await saveModelData({
          name: modelName,
          data,
        });
        messageApi.success('Saved successfully');
        onSuccess?.();
        return true;
      } catch (error) {
        messageApi.error('Save failed');
        onError?.(error);
        console.error('Save error:', error);
        return false;
      }
    },
    [modelName, messageApi, onSuccess, onError],
  );

  return {
    handleActionResponse,
    executeBatchAction,
    executeRowAction,
    saveData,
  };
};
