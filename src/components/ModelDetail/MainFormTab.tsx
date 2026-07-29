import { SaveOutlined } from '@ant-design/icons';
import type { ProFormInstance } from '@ant-design/pro-components';
import { ProForm } from '@ant-design/pro-components';
import { Button, Card, Divider, Space } from 'antd';
import React from 'react';
import { saveModelData } from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';

interface MainFormTabProps {
  modelName: string;
  modelDesc: API.AdminSerializeModel;
  record: Record<string, any>;
  formRef: React.RefObject<ProFormInstance>;
  canEdit: boolean;
  isCreateMode: boolean;
  messageApi: any;
  onBack?: () => void;
  setOperationLoading: React.Dispatch<React.SetStateAction<boolean>>;
  onValuesChange?: (values: Record<string, any>) => void;
}

const MainFormTab: React.FC<MainFormTabProps> = ({
  modelName,
  modelDesc,
  record,
  formRef,
  canEdit,
  isCreateMode,
  messageApi,
  onBack,
  setOperationLoading,
  onValuesChange,
}) => {
  return (
    <Card>
      <ProForm
        formRef={formRef}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        initialValues={record}
        onValuesChange={(_, allValues) => {
          onValuesChange?.(allValues as Record<string, any>);
        }}
        onFinish={async (values) => {
          setOperationLoading(true);
          try {
            const dataToSave = isCreateMode ? values : { ...record, ...values };

            const response = await saveModelData({
              name: modelName,
              data: dataToSave,
            });

            if (response?.code === 0) {
              messageApi.success(
                isCreateMode ? 'Created successfully' : 'Saved successfully',
              );
              onBack?.();
            } else {
              messageApi.error(response?.message || 'Save failed');
            }
          } catch (error) {
            messageApi.error('Save failed');
            console.error('Save error:', error);
          } finally {
            setOperationLoading(false);
          }
        }}
        submitter={{
          render: () =>
            canEdit ? (
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                >
                  Save
                </Button>
              </Space>
            ) : null,
        }}
      >
        <Divider orientation="left">Basic Information</Divider>
        {(() => {
          const detailDisplay = (modelDesc.attrs as any)?.detail_display as
            | string[]
            | undefined;
          const detailOrder = (modelDesc.attrs as any)?.detail_order as
            | string[]
            | undefined;
          const detailEditable = (modelDesc.attrs as any)?.detail_editable as
            | string[]
            | undefined;

          let fieldEntries = Object.entries(modelDesc.fields);

          if (detailDisplay && detailDisplay.length > 0) {
            fieldEntries = fieldEntries.filter(([fieldName]) =>
              detailDisplay.includes(fieldName),
            );
          }

          if (detailOrder && detailOrder.length > 0) {
            fieldEntries = fieldEntries.sort(([a], [b]) => {
              const indexA = detailOrder.indexOf(a);
              const indexB = detailOrder.indexOf(b);
              const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
              const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
              return orderA - orderB;
            });
          }

          return fieldEntries.map(([fieldName, fieldConfig]: [string, any]) => {
            const shouldShow =
              detailDisplay && detailDisplay.length > 0
                ? detailDisplay.includes(fieldName)
                : fieldConfig.show !== false;

            if (!shouldShow) {
              return null;
            }

            let isReadonly = !canEdit || fieldConfig.readonly;

            if (
              canEdit &&
              !isReadonly &&
              detailEditable &&
              detailEditable.length > 0
            ) {
              isReadonly = !detailEditable.includes(fieldName);
            }

            return renderFormField(fieldName, fieldConfig, formRef, {
              commonProps: {
                readonly: isReadonly,
                rules: fieldConfig.required
                  ? [
                      {
                        required: true,
                        message: `${fieldConfig.name || fieldName} is required`,
                      },
                    ]
                  : [],
              },
            });
          });
        })()}
      </ProForm>
    </Card>
  );
};

export default MainFormTab;
