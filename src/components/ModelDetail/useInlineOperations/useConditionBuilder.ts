import { useCallback } from 'react';

export const useConditionBuilder = () => {
  // Build query conditions based on relation type
  const buildConditions = useCallback(
    (inlineDesc: any, record: Record<string, any>) => {
      const relation = inlineDesc?.relation;
      if (!relation) return [];

      switch (relation.relation) {
        case 'fk':
          return [
            {
              field: relation.source_field,
              eq: record[relation.target_field],
            },
          ];
        case 'o2o':
          return [
            {
              field: relation.source_field,
              eq: record[relation.target_field],
            },
          ];
        case 'bk_fk':
          return [
            {
              field: relation.target_field,
              eq: record[relation.source_field],
            },
          ];
        case 'bk_o2o':
          return [
            {
              field: relation.target_field,
              eq: record[relation.source_field],
            },
          ];
        default:
          console.error(`Unsupported relation type: ${relation.relation}`);
          return [];
      }
    },
    [],
  );

  return { buildConditions };
};
