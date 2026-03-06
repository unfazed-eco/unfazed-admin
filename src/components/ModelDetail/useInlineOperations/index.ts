import { message } from 'antd';
import { useCallback, useState } from 'react';
import type {
  EditingKeysState,
  InlineDataState,
  UseInlineOperationsOptions,
} from './types';
import { useActionHandler } from './useActionHandler';
import { useBackRelationOperations } from './useBackRelationOperations';
import { useConditionBuilder } from './useConditionBuilder';
import { useCrudOperations } from './useCrudOperations';
import { useM2MOperations } from './useM2MOperations';

export const useInlineOperations = ({
  mainRecord,
}: UseInlineOperationsOptions) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [inlineData, setInlineData] = useState<InlineDataState>({});
  const [editingKeys, setEditingKeys] = useState<EditingKeysState>({});
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['main']));

  // Use condition builder
  const { buildConditions } = useConditionBuilder();

  // Use action handler
  const { handleInlineAction } = useActionHandler({ messageApi });

  // Use CRUD operations
  const {
    handleInlineSave,
    handleInlineDelete,
    loadInlineData,
    addInlineRecord,
  } = useCrudOperations({
    messageApi,
    setInlineData,
    setEditingKeys,
    buildConditions,
  });

  // Use M2M operations
  const { handleM2MAdd, handleM2MRemove } = useM2MOperations({
    mainRecord,
    messageApi,
  });

  // Use back relation operations
  const { handleBackRelationLink, handleBackRelationUnlink } =
    useBackRelationOperations({
      mainRecord,
      messageApi,
    });

  // Mark tab as loaded
  const markTabLoaded = useCallback((tabKey: string) => {
    setLoadedTabs((prev) => new Set([...prev, tabKey]));
  }, []);

  return {
    contextHolder,
    messageApi,
    inlineData,
    setInlineData,
    editingKeys,
    setEditingKeys,
    loadedTabs,
    markTabLoaded,
    handleInlineAction,
    handleInlineSave,
    handleInlineDelete,
    loadInlineData,
    handleM2MAdd,
    handleM2MRemove,
    handleBackRelationLink,
    handleBackRelationUnlink,
    addInlineRecord,
  };
};
