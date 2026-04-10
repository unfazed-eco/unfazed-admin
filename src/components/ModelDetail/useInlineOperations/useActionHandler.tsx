import { Modal } from 'antd';
import React, { useCallback } from 'react';
import { executeModelAction } from '@/services/api';

interface UseActionHandlerOptions {
  messageApi: any;
}

export const useActionHandler = ({ messageApi }: UseActionHandlerOptions) => {
  const sanitizeSearchParams = useCallback((params?: Record<string, any>) => {
    if (!params) return {};
    const {
      current: _current,
      pageSize: _pageSize,
      _timestamp,
      ...rest
    } = params;

    return Object.fromEntries(
      Object.entries(rest).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
  }, []);

  // Handle inline action execution
  const executeInlineAction = useCallback(
    async (
      inlineName: string,
      actionKey: string,
      action: any,
      record?: any,
      isBatch?: boolean,
      searchParams?: Record<string, any>,
    ) => {
      const cond = record ? [{ field: 'id', eq: record.id }] : [];
      const formData = record ? { ...record } : {};
      const cleanedSearchParams = sanitizeSearchParams(searchParams);
      const hasSearchParams = Object.keys(cleanedSearchParams).length > 0;

      const response = await executeModelAction({
        name: inlineName,
        action: actionKey,
        search_condition: isBatch ? [] : cond,
        ...(isBatch
          ? { input_data: hasSearchParams ? cleanedSearchParams : {} }
          : { form_data: formData }),
      });

      if (response?.code === 0) {
        switch (action.output) {
          case 'toast':
            messageApi.success(
              response.message || 'Action completed successfully',
            );
            break;
          case 'display':
            Modal.info({
              title: action.label || actionKey,
              width: 800,
              content: (
                <div>
                  {Array.isArray(response.data) ? (
                    <table
                      style={{ width: '100%', borderCollapse: 'collapse' }}
                    >
                      <tbody>
                        {response.data.map((item: any) => (
                          <tr
                            key={item.id}
                            style={{ borderBottom: '1px solid #f0f0f0' }}
                          >
                            <td
                              style={{
                                padding: '8px',
                                fontWeight: 'bold',
                                width: '30%',
                              }}
                            >
                              {item.property}:
                            </td>
                            <td style={{ padding: '8px' }}>{item.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <pre>{JSON.stringify(response.data, null, 2)}</pre>
                  )}
                </div>
              ),
            });
            break;
          case 'download': {
            const downloadData = response.data?.download;
            if (downloadData?.url) {
              const link = document.createElement('a');
              link.href = downloadData.url;
              link.download = downloadData.filename || 'download';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              messageApi.success('Download started');
            }
            break;
          }
          case 'refresh':
            messageApi.success(
              response.message || 'Action completed successfully',
            );
            window.location.reload();
            break;
          default:
            messageApi.success(
              response.message || 'Action completed successfully',
            );
        }
      } else {
        messageApi.error(response?.message || 'Action failed');
      }
    },
    [messageApi, sanitizeSearchParams],
  );

  const handleInlineAction = useCallback(
    async (
      inlineName: string,
      actionKey: string,
      action: any,
      record?: any,
      isBatch?: boolean,
      _records?: any[],
      searchParams?: Record<string, any>,
    ) => {
      try {
        if (action?.confirm) {
          Modal.confirm({
            title: action.label || action.name || actionKey,
            content:
              action.description ||
              'Are you sure you want to execute this action?',
            okText: 'Confirm',
            cancelText: 'Cancel',
            onOk: () =>
              executeInlineAction(
                inlineName,
                actionKey,
                action,
                record,
                isBatch,
                searchParams,
              ),
          });
          return;
        }

        await executeInlineAction(
          inlineName,
          actionKey,
          action,
          record,
          isBatch,
          searchParams,
        );
      } catch (error) {
        messageApi.error('Action failed');
        console.error('Action error:', error);
      }
    },
    [messageApi, executeInlineAction],
  );

  return { handleInlineAction };
};
