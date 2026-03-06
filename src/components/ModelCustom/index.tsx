/**
 * ModelCustom Component
 *
 * A component for rendering custom tool forms with dynamic fields and actions.
 *
 * Usage:
 * ```tsx
 * import { ModelCustom } from '@/components';
 *
 * <ModelCustom toolName="myTool" onBack={handleBack} />
 * ```
 */

import type { ProFormInstance } from '@ant-design/pro-components';
import { PageContainer, ProForm } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Card, Divider, message, Space, Spin } from 'antd';
import React, { useRef, useState } from 'react';
import { getModelDesc } from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';
import ActionButtons from './ActionButtons';
import type { ModelCustomProps } from './types';
import { useActionExecutor } from './useActionExecutor';

const ModelCustom: React.FC<ModelCustomProps> = ({ toolName, onBack }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const formRef = useRef<ProFormInstance>(null!);
  const [toolDesc, setToolDesc] = useState<API.AdminToolSerializeModel | null>(
    null,
  );

  // Lazy load model-desc
  const { loading: descLoading } = useRequest(
    async () => {
      const response = await getModelDesc(toolName);
      if (response?.code === 0) {
        setToolDesc(response.data as API.AdminToolSerializeModel);
      } else {
        console.error('ModelCustom: getModelDesc failed:', response);
      }
      return response;
    },
    {
      manual: false,
      refreshDeps: [toolName],
    },
  );

  // Action executor hook
  const { actionLoading, executeAction } = useActionExecutor({
    toolName,
    toolDesc,
    formRef,
    messageApi,
  });

  // Loading state
  if (descLoading || !toolDesc) {
    return (
      <PageContainer
        header={{
          title: toolName,
          breadcrumb: {},
          extra: onBack
            ? [
                <Button key="back" onClick={onBack}>
                  Back
                </Button>,
              ]
            : [],
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <Spin size="large" tip="Loading tool description..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: toolDesc.attrs.help_text || toolName,
        breadcrumb: {},
        extra: onBack
          ? [
              <Button key="back" onClick={onBack}>
                Back
              </Button>,
            ]
          : [],
      }}
    >
      {contextHolder}

      <Card>
        <ProForm
          formRef={formRef}
          layout="horizontal"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          submitter={false}
        >
          <Divider orientation="left">
            {toolDesc.attrs.help_text || 'Custom Tool'}
          </Divider>

          {/* Render fields */}
          {Object.entries(toolDesc.fields || {}).map(
            ([fieldName, fieldConfig]: [string, any]) => {
              if (!fieldConfig.show) return null;
              return renderFormField(fieldName, fieldConfig, formRef, {
                commonProps: {
                  disabled: fieldConfig.readonly,
                  rules: fieldConfig.blank
                    ? []
                    : [
                        {
                          required: true,
                          message: `${
                            fieldConfig.name || fieldName
                          } is required`,
                        },
                      ],
                },
              });
            },
          )}

          {/* Render action buttons */}
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">
              <ActionButtons
                toolDesc={toolDesc}
                actionLoading={actionLoading}
                formRef={formRef}
                messageApi={messageApi}
                executeAction={executeAction}
              />
            </Space>
          </div>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default ModelCustom;

// Re-export types
export type { ModelCustomProps } from './types';
