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
        const payloadData =
          formData && Object.keys(formData).length > 0 ? formData : rawValues;
        const isBatchAction = Boolean((actionConfig as any)?.batch);

        const response = await executeModelAction({
          name: toolName,
          action: actionKey,
          search_condition: searchConditions,
          ...(isBatchAction
            ? { input_data: payloadData }
            : { form_data: payloadData }),
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
              // Handle file download for multiple response shapes:
              // 1) data as plain string
              // 2) data.url / data.filename
              // 3) data.content / data.contentType / data.filename
              // 4) data.download.url or data.download.content
              (() => {
                const defaultFilename = `${actionConfig.name}_${Date.now()}.txt`;
                const payload = response?.data;
                const nestedDownload =
                  payload && typeof payload === 'object'
                    ? (payload as any).download
                    : undefined;
                const normalized =
                  nestedDownload && typeof nestedDownload === 'object'
                    ? nestedDownload
                    : payload;

                if (
                  normalized &&
                  typeof normalized === 'object' &&
                  normalized.url
                ) {
                  const link = document.createElement('a');
                  link.href = normalized.url;
                  link.download = normalized.filename || defaultFilename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  messageApi.success('File downloaded successfully');
                  return;
                }

                const hasContent =
                  typeof payload === 'string' ||
                  (normalized &&
                    typeof normalized === 'object' &&
                    normalized.content !== undefined);
                if (hasContent) {
                  const content =
                    typeof payload === 'string' ? payload : normalized.content;
                  const contentType =
                    typeof payload === 'string'
                      ? 'text/plain'
                      : normalized.contentType || 'application/octet-stream';
                  const filename =
                    typeof payload === 'string'
                      ? defaultFilename
                      : normalized.filename || defaultFilename;

                  const blob = new Blob([content], { type: contentType });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  messageApi.success('File downloaded successfully');
                  return;
                }

                messageApi.warning('No downloadable content returned');
              })();
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
