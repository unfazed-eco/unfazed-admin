import { useCallback, useRef } from 'react';
import { getModelData } from '@/services/api';
import type { InlineRequestHandlersMap } from './types';

interface UseRequestHandlersOptions {
  record: Record<string, any>;
}

export const useRequestHandlers = ({ record }: UseRequestHandlersOptions) => {
  // Memoized request handlers for each inline table to prevent unnecessary re-requests
  const inlineRequestHandlers = useRef<InlineRequestHandlersMap>({});

  // Create stable request handler for back relation tables
  const createBackRelationRequestHandler = useCallback(
    (inlineName: string, inlineDesc: any) => {
      // Return cached handler if exists
      const cacheKey = `bk_${inlineName}`;
      if (inlineRequestHandlers.current[cacheKey]) {
        return inlineRequestHandlers.current[cacheKey];
      }

      // Create new handler
      const handler = async (params: any) => {
        try {
          const relation = inlineDesc.relation;
          // Build base conditions for back relation
          const baseConditions = [
            {
              field: relation.target_field,
              eq: record[relation.source_field],
            },
          ];

          // Add search conditions
          const searchFields = inlineDesc.attrs?.search_fields || [];
          const searchConditions: any[] = [];
          Object.entries(params).forEach(([key, value]) => {
            if (
              value &&
              key !== 'current' &&
              key !== 'pageSize' &&
              searchFields.includes(key)
            ) {
              searchConditions.push({
                field: key,
                icontains: String(value),
              });
            }
          });

          const response = await getModelData({
            name: inlineName,
            page: params.current || 1,
            size: params.pageSize || inlineDesc.attrs?.list_per_page || 10,
            cond: [...baseConditions, ...searchConditions],
          });

          if (response?.code === 0) {
            return {
              data: response.data?.data || [],
              total: response.data?.count || 0,
              success: true,
            };
          }

          return { data: [], total: 0, success: false };
        } catch (error) {
          console.error('Request error:', error);
          return { data: [], total: 0, success: false };
        }
      };

      // Cache it
      inlineRequestHandlers.current[cacheKey] = handler;
      return handler;
    },
    [record],
  );

  // Create stable request handler for forward relation (fk/o2o) tables
  const createForwardRelationRequestHandler = useCallback(
    (inlineName: string, inlineDesc: any) => {
      // Return cached handler if exists
      const cacheKey = `fk_${inlineName}`;
      if (inlineRequestHandlers.current[cacheKey]) {
        return inlineRequestHandlers.current[cacheKey];
      }

      // Create new handler
      const handler = async (params: any) => {
        try {
          const fkRelation = inlineDesc.relation;
          // Build base conditions for fk/o2o relation
          const baseConditions = [
            {
              field: fkRelation.source_field,
              eq: record[fkRelation.target_field],
            },
          ];

          // Add search conditions
          const searchFields = inlineDesc.attrs?.search_fields || [];
          const searchConditions: any[] = [];
          Object.entries(params).forEach(([key, value]) => {
            if (
              value &&
              key !== 'current' &&
              key !== 'pageSize' &&
              searchFields.includes(key)
            ) {
              searchConditions.push({
                field: key,
                icontains: String(value),
              });
            }
          });

          const response = await getModelData({
            name: inlineName,
            page: params.current || 1,
            size: params.pageSize || inlineDesc.attrs?.list_per_page || 10,
            cond: [...baseConditions, ...searchConditions],
          });

          if (response?.code === 0) {
            return {
              data: response.data?.data || [],
              total: response.data?.count || 0,
              success: true,
            };
          }

          return { data: [], total: 0, success: false };
        } catch (error) {
          console.error('Request error:', error);
          return { data: [], total: 0, success: false };
        }
      };

      // Cache it
      inlineRequestHandlers.current[cacheKey] = handler;
      return handler;
    },
    [record],
  );

  // Create stable request handler for M2M tables
  // M2M table shows ONLY linked records
  const createM2MRequestHandler = useCallback(
    (inlineName: string, inlineDesc: any) => {
      // Return cached handler if exists
      const cacheKey = `m2m_${inlineName}`;
      if (inlineRequestHandlers.current[cacheKey]) {
        return inlineRequestHandlers.current[cacheKey];
      }

      // Create new handler
      const handler = async (params: any) => {
        try {
          const m2mRelation = inlineDesc.relation;
          const throughInfo = m2mRelation?.through;

          if (!throughInfo) {
            return { data: [], total: 0, success: false };
          }

          const pageSize =
            params.pageSize || inlineDesc.attrs?.list_per_page || 10;
          const currentPage = params.current || 1;

          // Step 1: Get linked IDs from through table with pagination
          // Pagination is controlled by through table, not target table
          const throughResponse = await getModelData({
            name: throughInfo.through,
            page: currentPage,
            size: pageSize,
            cond: [
              {
                field: throughInfo.source_to_through_field,
                eq: record[throughInfo.source_field],
              },
            ],
          });

          if (throughResponse?.code !== 0) {
            return { data: [], total: 0, success: false };
          }

          const throughData = throughResponse.data?.data || [];
          const totalCount = throughResponse.data?.count || 0;

          if (throughData.length === 0) {
            return { data: [], total: totalCount, success: true };
          }

          // Get linked IDs for this page
          const linkedIds = throughData.map(
            (item: any) => item[throughInfo.target_to_through_field],
          );

          // Step 2: Build conditions for target table
          const baseConditions = [
            {
              field: throughInfo.target_field,
              in_: linkedIds,
            },
          ];

          // Add search conditions
          const searchFields = inlineDesc.attrs?.search_fields || [];
          const searchConditions: any[] = [];
          Object.entries(params).forEach(([key, value]) => {
            if (
              value &&
              key !== 'current' &&
              key !== 'pageSize' &&
              searchFields.includes(key)
            ) {
              searchConditions.push({
                field: key,
                icontains: String(value),
              });
            }
          });

          // Step 3: Get target records for current page's linked IDs
          // No pagination here since we already paginated in step 1
          const targetModelName = m2mRelation.target || inlineName;
          const response = await getModelData({
            name: targetModelName,
            page: 1,
            size: linkedIds.length, // Only fetch records for current page's linked IDs
            cond: [...baseConditions, ...searchConditions],
          });

          if (response?.code === 0) {
            return {
              data: response.data?.data || [],
              // Use through table's total count for pagination
              total: totalCount,
              success: true,
            };
          }

          return { data: [], total: 0, success: false };
        } catch (error) {
          console.error('M2M request error:', error);
          return { data: [], total: 0, success: false };
        }
      };

      // Cache it
      inlineRequestHandlers.current[cacheKey] = handler;
      return handler;
    },
    [record],
  );

  return {
    createBackRelationRequestHandler,
    createForwardRelationRequestHandler,
    createM2MRequestHandler,
  };
};
