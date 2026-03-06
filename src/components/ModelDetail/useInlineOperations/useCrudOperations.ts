import { useCallback } from 'react';
import { deleteModelData, getModelData, saveModelData } from '@/services/api';
import type { EditingKeysState, InlineDataState } from './types';

interface UseCrudOperationsOptions {
  messageApi: any;
  setInlineData: React.Dispatch<React.SetStateAction<InlineDataState>>;
  setEditingKeys: React.Dispatch<React.SetStateAction<EditingKeysState>>;
  buildConditions: (inlineDesc: any, record: Record<string, any>) => any[];
}

export const useCrudOperations = ({
  messageApi,
  setInlineData,
  setEditingKeys,
  buildConditions,
}: UseCrudOperationsOptions) => {
  // Save single inline record
  const handleInlineSave = useCallback(
    async (inlineName: string, record: Record<string, any>) => {
      try {
        const payload = { ...record };

        const response = await saveModelData({
          name: inlineName,
          data: payload,
        });

        if (response?.code === 0) {
          messageApi.success('Saved successfully');
          setInlineData((prev) => ({
            ...prev,
            [inlineName]: (prev[inlineName] || []).map((item) =>
              item.id === payload.id ? { ...item, ...payload } : item,
            ),
          }));
          setEditingKeys((prev) => ({
            ...prev,
            [inlineName]:
              prev[inlineName]?.filter((key) => key !== record.id) || [],
          }));
        } else {
          messageApi.error(response?.message || 'Save failed');
        }
      } catch (error) {
        messageApi.error('Save failed');
        console.error('Save error:', error);
      }
    },
    [messageApi, setInlineData, setEditingKeys],
  );

  // Delete single inline record
  const handleInlineDelete = useCallback(
    async (inlineName: string, record: Record<string, any>) => {
      try {
        const response = await deleteModelData({
          name: inlineName,
          data: record,
        });

        if (response?.code === 0) {
          messageApi.success('Deleted successfully');
          setInlineData((prev) => ({
            ...prev,
            [inlineName]: (prev[inlineName] || []).filter(
              (item) => item.id !== record.id,
            ),
          }));
        } else {
          messageApi.error(response?.message || 'Delete failed');
        }
      } catch (error) {
        messageApi.error('Delete failed');
        console.error('Delete error:', error);
      }
    },
    [messageApi, setInlineData],
  );

  // Load inline data
  const loadInlineData = useCallback(
    async (
      inlineName: string,
      inlineDesc: any,
      mainRecordData: Record<string, any>,
    ) => {
      try {
        const relation = inlineDesc.relation;

        if (relation?.relation === 'm2m' && relation?.through) {
          const { through } = relation;

          // Load through table data
          const throughResponse = await getModelData({
            name: through.through,
            page: 1,
            size: 1000,
            cond: [
              {
                field: through.source_to_through_field,
                eq: mainRecordData[through.source_field],
              },
            ],
          });

          // Load target table data
          const targetResponse = await getModelData({
            name: relation.target,
            page: 1,
            size: 1000,
            cond: [],
          });

          if (throughResponse?.code === 0 && targetResponse?.code === 0) {
            const throughData = throughResponse.data?.data || [];
            const targetData = targetResponse.data?.data || [];

            const selectedTargetIds = throughData.map(
              (item: any) => item[through.target_to_through_field],
            );
            const enrichedTargetData = targetData.map((targetItem: any) => ({
              ...targetItem,
              selected: selectedTargetIds.includes(
                targetItem[through.target_field],
              ),
            }));

            setInlineData((prev) => ({
              ...prev,
              [inlineName]: enrichedTargetData,
              [`${inlineName}_through`]: throughData,
            }));
          }
        } else {
          const conditions = buildConditions(inlineDesc, mainRecordData);
          const response = await getModelData({
            name: inlineName,
            cond: conditions,
            page: 1,
            size: 100,
          });
          if (response?.code === 0) {
            setInlineData((prev) => ({
              ...prev,
              [inlineName]: (response.data as any)?.data || [],
            }));
          } else {
            messageApi.error(`Failed to load ${inlineName} data`);
          }
        }
      } catch (error) {
        messageApi.error(`Failed to load ${inlineName} data`);
        console.error('Load error:', error);
      }
    },
    [buildConditions, messageApi, setInlineData],
  );

  // Add new inline record
  const addInlineRecord = useCallback(
    (inlineName: string, newRecord: Record<string, any>) => {
      setInlineData((prev) => ({
        ...prev,
        [inlineName]: [...(prev[inlineName] || []), newRecord],
      }));
      setEditingKeys((prev) => ({
        ...prev,
        [inlineName]: [...(prev[inlineName] || []), newRecord.id],
      }));
    },
    [setInlineData, setEditingKeys],
  );

  return {
    handleInlineSave,
    handleInlineDelete,
    loadInlineData,
    addInlineRecord,
  };
};
