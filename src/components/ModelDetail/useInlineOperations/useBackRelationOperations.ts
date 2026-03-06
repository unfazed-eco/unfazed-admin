import { useCallback } from 'react';
import { saveModelData } from '@/services/api';

interface UseBackRelationOperationsOptions {
  mainRecord: Record<string, any>;
  messageApi: any;
}

export const useBackRelationOperations = ({
  mainRecord,
  messageApi,
}: UseBackRelationOperationsOptions) => {
  // Handle back relation link (for bk_fk and bk_o2o)
  // This updates the target record's foreign key field to point to the current main record
  const handleBackRelationLink = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecords: any[]) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'bk_fk' || relation?.relation === 'bk_o2o') {
          // Link each selected record to the main record
          for (const targetRecord of targetRecords) {
            // Send full record data with updated FK field and current timestamp (seconds)
            const response = await saveModelData({
              name: inlineName,
              data: {
                ...targetRecord,
                [relation.target_field]: mainRecord[relation.source_field],
                updated_at: Math.floor(Date.now() / 1000),
              },
            });

            if (response?.code !== 0) {
              messageApi.error(`Failed to link record ${targetRecord.id}`);
              return;
            }
          }

          messageApi.success(
            `Successfully linked ${targetRecords.length} record(s)`,
          );
          // Note: Don't call loadInlineData here - back relation tables use onRequest
          // The caller should call reload() on the table's actionRef instead
        }
      } catch (error) {
        messageApi.error('Failed to link records');
        console.error('Link back relation error:', error);
      }
    },
    [mainRecord, messageApi],
  );

  // Handle back relation unlink (for bk_fk and bk_o2o)
  // This sets the target record's foreign key field to negative of the record's own ID
  const handleBackRelationUnlink = useCallback(
    async (inlineName: string, inlineDesc: any, targetRecord: any) => {
      try {
        const relation = inlineDesc.relation;
        if (relation?.relation === 'bk_fk' || relation?.relation === 'bk_o2o') {
          // Set FK field to negative of the record's own ID
          const recordId = targetRecord.id;
          const negativeFkValue =
            typeof recordId === 'number' && recordId > 0 ? -recordId : -1;

          // Send full record data with FK field set to negative of record's own ID
          const response = await saveModelData({
            name: inlineName,
            data: {
              ...targetRecord,
              [relation.target_field]: negativeFkValue,
              updated_at: Math.floor(Date.now() / 1000),
            },
          });

          if (response?.code === 0) {
            messageApi.success('Unlinked successfully');
            // Note: Don't call loadInlineData here - back relation tables use onRequest
            // The caller should call reload() on the table's actionRef instead
          } else {
            messageApi.error(response?.message || 'Failed to unlink');
          }
        }
      } catch (error) {
        messageApi.error('Failed to unlink');
        console.error('Unlink back relation error:', error);
      }
    },
    [mainRecord, messageApi],
  );

  return {
    handleBackRelationLink,
    handleBackRelationUnlink,
  };
};
