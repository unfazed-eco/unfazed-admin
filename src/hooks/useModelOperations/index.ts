/**
 * useModelOperations Hook
 *
 * Main hook for model CRUD operations.
 * This file composes smaller hooks and utilities to provide a unified API.
 *
 * Usage remains the same:
 * ```ts
 * import { useModelOperations } from '@/hooks/useModelOperations';
 *
 * const {
 *   contextHolder,
 *   messageApi,
 *   fetchModelDesc,
 *   fetchModelData,
 *   executeBatchAction,
 *   executeRowAction,
 *   saveData,
 *   // ...other methods
 * } = useModelOperations({ modelName: 'myModel' });
 * ```
 */

import { message } from 'antd';
import { useState } from 'react';
import { useActionHandlers } from './useActionHandlers';
import { useDataFetching } from './useDataFetching';
import { buildSearchConditions, getStoredSettings } from './utils';

interface UseModelOperationsOptions {
  modelName: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const useModelOperations = ({
  modelName,
  onSuccess,
  onError,
}: UseModelOperationsOptions) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [currentSearchParams, setCurrentSearchParams] = useState<any>({});

  // Data fetching operations
  const { fetchModelDesc, fetchModelData } = useDataFetching({
    modelName,
    messageApi,
    setCurrentSearchParams,
    onError,
  });

  // Action handlers
  const {
    handleActionResponse,
    executeBatchAction,
    executeRowAction,
    saveData,
  } = useActionHandlers({
    modelName,
    messageApi,
    currentSearchParams,
    onSuccess,
    onError,
  });

  return {
    // Context holder for message API
    contextHolder,
    messageApi,

    // Search params state
    currentSearchParams,
    setCurrentSearchParams,

    // Utility functions
    getStoredSettings,
    buildSearchConditions,

    // Data fetching
    fetchModelDesc,
    fetchModelData,

    // Action handlers
    executeBatchAction,
    executeRowAction,
    saveData,
    handleActionResponse,
  };
};

// Re-export utilities for direct usage if needed
export { buildSearchConditions, getStoredSettings } from './utils';
