/**
 * Data fetching hooks for model operations
 * Handles fetching model description and model data
 */

import type { MessageInstance } from 'antd/es/message/interface';
import { useCallback } from 'react';
import { getModelData, getModelDesc } from '@/services/api';
import { buildSearchConditions, getStoredSettings } from './utils';

interface UseDataFetchingOptions {
  modelName: string;
  messageApi: MessageInstance;
  setCurrentSearchParams: (params: any) => void;
  onError?: (error: any) => void;
}

export const useDataFetching = ({
  modelName,
  messageApi,
  setCurrentSearchParams,
  onError,
}: UseDataFetchingOptions) => {
  // Fetch model description
  const fetchModelDesc =
    useCallback(async (): Promise<API.AdminSerializeModel | null> => {
      try {
        const response = await getModelDesc(modelName);
        if (response?.code === 0) {
          return response.data;
        } else {
          messageApi.error(
            response?.message || 'Failed to fetch model description',
          );
          onError?.(response);
          return null;
        }
      } catch (error) {
        messageApi.error('Failed to fetch model description');
        onError?.(error);
        return null;
      }
    }, [modelName, messageApi, onError]);

  // Fetch model data
  const fetchModelData = useCallback(
    async (params: any, modelDesc?: API.AdminSerializeModel) => {
      if (!modelDesc) {
        return { data: [], success: false, total: 0 };
      }

      // Save current search params for action execution
      setCurrentSearchParams(params);

      const storedSettings = getStoredSettings();
      const pageSize =
        storedSettings.pageSize || modelDesc.attrs.list_per_page || 20;

      // Build search conditions
      const conditions = buildSearchConditions(params, modelDesc);

      try {
        const response = await getModelData({
          name: modelName,
          page: params.current || 1,
          size: params.pageSize || pageSize,
          cond: conditions.length > 0 ? conditions : undefined,
        });

        if (response.code === 0) {
          return {
            data: response.data.data,
            success: true,
            total: response.data.count,
          };
        } else {
          messageApi.error(response.message || 'Failed to fetch data');
          onError?.(response);
          return { data: [], success: false, total: 0 };
        }
      } catch (error) {
        messageApi.error('Failed to fetch data');
        onError?.(error);
        console.error('Fetch data error:', error);
        return { data: [], success: false, total: 0 };
      }
    },
    [modelName, messageApi, onError, setCurrentSearchParams],
  );

  return {
    fetchModelDesc,
    fetchModelData,
  };
};
