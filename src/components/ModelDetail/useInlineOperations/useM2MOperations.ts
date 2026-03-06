import { useCallback } from 'react';
import { deleteModelData, getModelData, saveModelData } from '@/services/api';

interface UseM2MOperationsOptions {
  mainRecord: Record<string, any>;
  messageApi: any;
}

export const useM2MOperations = ({
  mainRecord,
  messageApi,
}: UseM2MOperationsOptions) => {
  const getM2MTargetKeyValue = useCallback(
    (through: any, targetRecordOrId: any) => {
      if (targetRecordOrId === null || targetRecordOrId === undefined) {
        return undefined;
      }

      // Support both full record objects and primitive IDs.
      if (typeof targetRecordOrId === 'object') {
        const byTargetField = targetRecordOrId?.[through.target_field];
        if (byTargetField !== null && byTargetField !== undefined) {
          return byTargetField;
        }
        return targetRecordOrId?.id;
      }

      return targetRecordOrId;
    },
    [],
  );

  // Handle M2M add (one by one, backend doesn't support batch)
  const handleM2MAdd = useCallback(
    async (_inlineName: string, inlineDesc: any, targetRecordsOrIds: any[]) => {
      try {
        const relation = inlineDesc.relation;
        if (
          relation?.relation === 'm2m' &&
          relation?.through &&
          targetRecordsOrIds.length > 0
        ) {
          const { through } = relation;

          // Save each relation one by one (backend doesn't support batch)
          for (const targetRecordOrId of targetRecordsOrIds) {
            const targetKeyValue = getM2MTargetKeyValue(
              through,
              targetRecordOrId,
            );
            if (targetKeyValue === undefined) {
              messageApi.error('Failed to add relation: invalid target');
              return;
            }

            const throughData = {
              [through.source_to_through_field]:
                mainRecord[through.source_field],
              [through.target_to_through_field]: targetKeyValue,
            };

            const response = await saveModelData({
              name: through.through,
              data: throughData,
            });

            if (response?.code !== 0) {
              messageApi.error(
                `Failed to add relation for target ${String(targetKeyValue)}`,
              );
              return;
            }
          }

          messageApi.success(
            `Successfully added ${targetRecordsOrIds.length} relation(s)`,
          );
        }
      } catch (error) {
        messageApi.error('Failed to add relations');
        console.error('Add M2M error:', error);
      }
    },
    [getM2MTargetKeyValue, mainRecord, messageApi],
  );

  // Handle M2M remove (one by one, backend doesn't support batch)
  const handleM2MRemove = useCallback(
    async (
      _inlineName: string,
      inlineDesc: any,
      targetRecordsOrIds: any | any[],
    ) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'm2m' && relation?.through) {
          const { through } = relation;

          // Support both single record and array of records
          const recordsOrIds = Array.isArray(targetRecordsOrIds)
            ? targetRecordsOrIds
            : [targetRecordsOrIds];

          if (recordsOrIds.length === 0) return;

          // Delete each relation one by one (backend doesn't support batch)
          for (const targetRecordOrId of recordsOrIds) {
            const targetKeyValue = getM2MTargetKeyValue(
              through,
              targetRecordOrId,
            );
            if (targetKeyValue === undefined) {
              messageApi.error('Failed to remove relation: invalid target');
              return;
            }

            // First, query the through table to get the record ID
            const queryResponse = await getModelData({
              name: through.through,
              page: 1,
              size: 1,
              cond: [
                {
                  field: through.source_to_through_field,
                  eq: mainRecord[through.source_field],
                },
                {
                  field: through.target_to_through_field,
                  eq: targetKeyValue,
                },
              ],
            });

            if (queryResponse?.code !== 0 || !queryResponse.data?.data?.[0]) {
              messageApi.error(
                `Failed to find relation record for target ${String(targetKeyValue)}`,
              );
              return;
            }

            const throughRecord = queryResponse.data.data[0];

            // Delete using the record ID
            const response = await deleteModelData({
              name: through.through,
              data: {
                id: throughRecord.id,
              },
            } as any);

            if (response?.code !== 0) {
              messageApi.error(
                `Failed to remove relation for target ${String(targetKeyValue)}`,
              );
              return;
            }
          }

          messageApi.success(
            recordsOrIds.length === 1
              ? 'Relation removed'
              : `Successfully removed ${recordsOrIds.length} relation(s)`,
          );
        }
      } catch (error) {
        messageApi.error('Failed to remove relation');
        console.error('Remove M2M error:', error);
      }
    },
    [getM2MTargetKeyValue, mainRecord, messageApi],
  );

  return {
    handleM2MAdd,
    handleM2MRemove,
  };
};
