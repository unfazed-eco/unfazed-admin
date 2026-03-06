/**
 * Hook for executing model actions
 */

import type { ProFormInstance } from '@ant-design/pro-components';
import { Modal } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import React, { useCallback, useState } from 'react';
import { executeModelAction } from '@/services/api';
import type { ActionConfig } from './types';

/**
 * Build search conditions from form values
 */
export const buildSearchConditions = (
  values: Record<string, any>,
  desc?: API.AdminToolSerializeModel,
): any[] => {
  if (!desc?.fields) return [];
  const conditions: any[] = [];

  Object.entries(values || {}).forEach(([field, value]) => {
    if (value === undefined || value === null || value === '') return;
    const fieldConfig = desc.fields[field];
    if (!fieldConfig) return;

    const cond: any = { field };

    switch (fieldConfig.field_type) {
      case 'CharField':
      case 'TextField':
        if (fieldConfig.choices && fieldConfig.choices.length > 0) {
          cond.eq = String(value);
        } else {
          cond.icontains = String(value);
        }
        break;
      case 'IntegerField':
      case 'FloatField':
        cond.eq = Number(value);
        break;
      case 'BooleanField':
        cond.eq = value ? 1 : 0;
        break;
      case 'DateField':
      case 'DatetimeField':
        if (Array.isArray(value) && value.length === 2) {
          // range
          const [start, end] = value;
          if (start && end) {
            conditions.push(
              {
                field,
                gte: (start as any)?.format?.('YYYY-MM-DD') || String(start),
              } as any,
              {
                field,
                lte: (end as any)?.format?.('YYYY-MM-DD') || String(end),
              } as any,
            );
          }
          return;
        } else if ((value as any)?.format) {
          cond.eq = (value as any).format(
            fieldConfig.field_type === 'DateField'
              ? 'YYYY-MM-DD'
              : 'YYYY-MM-DD HH:mm:ss',
          ) as any;
        }
        break;
      default:
        if (typeof value === 'string' || typeof value === 'number') {
          cond.eq = value;
        }
    }

    if (
      cond.eq !== undefined ||
      cond.lt !== undefined ||
      cond.lte !== undefined ||
      cond.gt !== undefined ||
      cond.gte !== undefined ||
      cond.contains !== undefined ||
      cond.icontains !== undefined
    ) {
      conditions.push(cond);
    }
  });

  return conditions;
};

interface UseActionExecutorOptions {
  toolName: string;
  toolDesc: API.AdminToolSerializeModel | null;
  formRef: React.RefObject<ProFormInstance>;
  messageApi: MessageInstance;
}

export const useActionExecutor = ({
  toolName,
  toolDesc,
  formRef,
  messageApi,
}: UseActionExecutorOptions) => {
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );

  // Execute action
  const executeAction = useCallback(
    async (actionKey: string, actionConfig: ActionConfig, formData: any) => {
      if (!toolDesc) return;

      setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

      try {
        // Use provided formData if present, otherwise read current form values
        const rawValues =
          formData && Object.keys(formData).length > 0
            ? formData
            : formRef.current?.getFieldsValue?.() || {};

        const searchConditions = buildSearchConditions(rawValues, toolDesc);
        const formPayload =
          actionConfig.input === 'empty' ? {} : formData || {};

        const response = await executeModelAction({
          name: toolName,
          action: actionKey,
          form_data: formPayload,
          search_condition: searchConditions,
        });

        if (response?.code === 0) {
          switch (actionConfig.output) {
            case 'toast':
              messageApi.success(
                response.message || 'Action completed successfully',
              );
              break;

            case 'display': {
              // Show data modal
              const displayData = response.data;

              Modal.info({
                title: actionConfig.label || actionConfig.name,
                width: Math.min(800, window.innerWidth * 0.8),
                content: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    <pre
                      style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {typeof displayData === 'object'
                        ? JSON.stringify(displayData, null, 2)
                        : String(displayData)}
                    </pre>
                  </div>
                ),
              });
              break;
            }

            case 'download':
              // Handle file download
              if (response.data && typeof response.data === 'string') {
                const blob = new Blob([response.data], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${actionConfig.name}_${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              }
              messageApi.success('File downloaded successfully');
              break;

            case 'refresh':
              messageApi.success(
                response.message || 'Action completed successfully',
              );
              // Can add page refresh logic here
              break;

            default:
              messageApi.success(
                response.message || 'Action completed successfully',
              );
          }
        } else {
          messageApi.error(response?.message || 'Action failed');
        }
      } catch (error) {
        messageApi.error('Action failed');
        console.error('Action error:', error);
      } finally {
        setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
      }
    },
    [toolName, toolDesc, formRef, messageApi],
  );

  return {
    actionLoading,
    executeAction,
  };
};
