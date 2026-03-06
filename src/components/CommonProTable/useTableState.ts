/**
 * Hook for managing table state and client-side filtering
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseTableStateOptions {
  modelDesc: API.AdminSerializeModel;
  data?: any[];
}

export const useTableState = ({ modelDesc, data }: UseTableStateOptions) => {
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  const [currentSearchParams, setCurrentSearchParams] = useState<
    Record<string, any>
  >({});
  const [filteredData, setFilteredData] = useState<any[] | undefined>(
    undefined,
  );
  const pendingUnlinkRef = useRef<Set<string | number>>(new Set());

  // Client-side filter function for data mode
  const filterDataBySearchParams = useCallback(
    (sourceData: any[], params: Record<string, any>) => {
      if (!sourceData || sourceData.length === 0) return sourceData;

      const searchFields = (modelDesc.attrs as any)?.search_fields || [];
      if (searchFields.length === 0) return sourceData;

      // Check if any search param has value
      const hasSearchValue = Object.entries(params).some(
        ([key, value]) =>
          value &&
          key !== 'current' &&
          key !== 'pageSize' &&
          searchFields.includes(key),
      );

      if (!hasSearchValue) return sourceData;

      return sourceData.filter((record) => {
        return Object.entries(params).every(([key, value]) => {
          if (
            !value ||
            key === 'current' ||
            key === 'pageSize' ||
            !searchFields.includes(key)
          ) {
            return true;
          }

          const fieldValue = record[key];
          if (fieldValue === null || fieldValue === undefined) return false;

          // String contains match (case-insensitive)
          const searchStr = String(value).toLowerCase();
          const fieldStr = String(fieldValue).toLowerCase();
          return fieldStr.includes(searchStr);
        });
      });
    },
    [modelDesc.attrs],
  );

  // Reset filtered data when source data changes
  useEffect(() => {
    if (data) {
      if (Object.keys(currentSearchParams).length > 0) {
        const filtered = filterDataBySearchParams(data, currentSearchParams);
        setFilteredData(filtered);
      } else {
        setFilteredData(undefined);
      }
    }
  }, [data, filterDataBySearchParams, currentSearchParams]);

  // Handle search submit
  const handleSearchSubmit = useCallback(
    (params: any) => {
      setCurrentSearchParams(params);
      if (data) {
        const filtered = filterDataBySearchParams(data, params);
        setFilteredData(filtered);
      }
      return params;
    },
    [data, filterDataBySearchParams],
  );

  return {
    editableKeys,
    setEditableKeys,
    currentSearchParams,
    setCurrentSearchParams,
    filteredData,
    pendingUnlinkRef,
    filterDataBySearchParams,
    handleSearchSubmit,
  };
};
