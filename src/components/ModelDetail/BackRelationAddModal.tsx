import { ProForm } from '@ant-design/pro-components';
import { Modal } from 'antd';
import React from 'react';
import { saveModelData } from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';

interface BackRelationAddModalProps {
  visible: boolean;
  inlineName: string;
  inlineDesc: any;
  relation: any;
  mainRecord: Record<string, any>;
  messageApi: any;
  onClose: () => void;
  onSuccess: () => void;
}

const BackRelationAddModal: React.FC<BackRelationAddModalProps> = ({
  visible,
  inlineName,
  inlineDesc,
  relation,
  mainRecord,
  messageApi,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal
      open={visible}
      title={`Add ${inlineDesc?.attrs?.label || inlineName}`}
      width={800}
      destroyOnClose
      onCancel={onClose}
      footer={null}
      styles={{
        body: {
          paddingTop: 24,
        },
      }}
    >
      <ProForm
        layout="horizontal"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        onFinish={async (values) => {
          try {
            // Add the FK field value to link to main record
            const dataToSave = {
              ...values,
              [relation.target_field]: mainRecord[relation.source_field],
            };

            const response = await saveModelData({
              name: inlineName,
              data: dataToSave,
            });

            if (response?.code === 0) {
              messageApi.success('Created successfully');
              onClose();
              onSuccess();
            } else {
              messageApi.error(response?.message || 'Create failed');
            }
          } catch (error) {
            messageApi.error('Create failed');
            console.error('Create error:', error);
          }
        }}
        submitter={{
          searchConfig: {
            submitText: 'Create',
            resetText: 'Cancel',
          },
          onReset: onClose,
        }}
      >
        {Object.entries(inlineDesc?.fields || {}).map(
          ([fieldName, fieldConfig]: [string, any]) => {
            // Skip the FK field (it will be set automatically)
            if (fieldName === relation.target_field) return null;
            // Skip readonly fields and hidden fields
            if (fieldConfig.readonly || fieldConfig.show === false) return null;

            return renderFormField(fieldName, fieldConfig, undefined, {
              commonProps: {
                rules:
                  fieldConfig.blank === false
                    ? [
                        {
                          required: true,
                          message: `${fieldConfig.name || fieldName} is required`,
                        },
                      ]
                    : [],
              },
            });
          },
        )}
      </ProForm>
    </Modal>
  );
};

export default BackRelationAddModal;
