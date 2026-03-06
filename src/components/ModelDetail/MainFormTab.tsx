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
}) => {
  return (
    <Card>
      <ProForm
        formRef={formRef}
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        initialValues={record}
        onFinish={async (values) => {
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
          // Get detail config from attrs
          const detailDisplay = (modelDesc.attrs as any)?.detail_display as
            | string[]
            | undefined;
          const detailOrder = (modelDesc.attrs as any)?.detail_order as
            | string[]
            | undefined;
          const detailEditable = (modelDesc.attrs as any)?.detail_editable as
            | string[]
            | undefined;

          // Debug: log detail_display configuration
          console.log('=== ModelDetail Debug ===');
          console.log('detail_display:', detailDisplay);
          console.log('detail_editable:', detailEditable);
          console.log('can_edit:', canEdit);
          console.log('all fields:', Object.keys(modelDesc.fields));

          // Get field entries
          let fieldEntries = Object.entries(modelDesc.fields);

          // Filter by detail_display if defined
          if (detailDisplay && detailDisplay.length > 0) {
            fieldEntries = fieldEntries.filter(([fieldName]) =>
              detailDisplay.includes(fieldName),
            );
            console.log(
              'after detail_display filter:',
              fieldEntries.map(([name]) => name),
            );
          } else {
            console.log('detail_display not applied (empty or undefined)');
          }

          // Sort by detail_order if defined
          console.log('detail_order:', detailOrder);
          if (detailOrder && detailOrder.length > 0) {
            console.log(
              'before detail_order sort:',
              fieldEntries.map(([name]) => name),
            );
            fieldEntries = fieldEntries.sort(([a], [b]) => {
              const indexA = detailOrder.indexOf(a);
              const indexB = detailOrder.indexOf(b);
              const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
              const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
              return orderA - orderB;
            });
            console.log(
              'after detail_order sort:',
              fieldEntries.map(([name]) => name),
            );
          } else {
            console.log('detail_order not applied (empty or undefined)');
          }

          return fieldEntries.map(([fieldName, fieldConfig]: [string, any]) => {
            // If detail_display is defined and field is in it, show regardless of fieldConfig.show
            // Otherwise, respect fieldConfig.show
            const shouldShow =
              detailDisplay && detailDisplay.length > 0
                ? detailDisplay.includes(fieldName)
                : fieldConfig.show !== false;

            if (!shouldShow) {
              console.log(`field "${fieldName}" hidden`);
              return null;
            }
            console.log(`rendering field: ${fieldName}`);

            // Determine if field is editable
            // If can_edit is false, all fields are readonly
            let isReadonly = !canEdit || fieldConfig.readonly;
            console.log(
              `  ${fieldName} initial readonly:`,
              isReadonly,
              `(canEdit: ${canEdit}, fieldConfig.readonly: ${fieldConfig.readonly})`,
            );

            if (
              canEdit &&
              !isReadonly &&
              detailEditable &&
              detailEditable.length > 0
            ) {
              isReadonly = !detailEditable.includes(fieldName);
              console.log(
                `  ${fieldName} after detail_editable check:`,
                isReadonly,
                `(in list: ${detailEditable.includes(fieldName)})`,
              );
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
