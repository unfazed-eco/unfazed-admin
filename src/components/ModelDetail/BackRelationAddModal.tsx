import { ProForm } from '@ant-design/pro-components';
import { Modal } from 'antd';
import React from 'react';
import { saveModelData } from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';

interface BackRelationAddModalProps {
  visible: boolean;
  mode?: 'create' | 'edit';
  initialData?: Record<string, any> | null;
  onSubmitData?: (
    data: Record<string, any>,
    mode: 'create' | 'edit',
  ) => Promise<void> | void;
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
  mode = 'create',
  initialData,
  onSubmitData,
  inlineName,
  inlineDesc,
  relation,
  mainRecord,
  messageApi,
  onClose,
  onSuccess,
}) => {
  const isEditMode = mode === 'edit';
  const modalTitlePrefix = isEditMode ? 'Edit' : 'Add';
  const submitText = isEditMode ? 'Save' : 'Create';
  const successMessage = isEditMode
    ? 'Updated successfully'
    : 'Created successfully';
  const failedMessage = isEditMode ? 'Update failed' : 'Create failed';

  return (
    <Modal
      open={visible}
      title={`${modalTitlePrefix} ${inlineDesc?.attrs?.label || inlineName}`}
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
        initialValues={isEditMode ? initialData || {} : undefined}
        onFinish={async (values) => {
          try {
            // Keep original record payload for update mode, then merge user changes.
            const baseData = isEditMode ? { ...(initialData || {}) } : {};
            const dataToSave = {
              ...baseData,
              ...values,
              [relation.target_field]: mainRecord[relation.source_field],
            };

            if (onSubmitData) {
              await onSubmitData(dataToSave, mode);
              onClose();
              onSuccess();
              return;
            }

            const response = await saveModelData({
              name: inlineName,
              data: dataToSave,
            });

            if (response?.code === 0) {
              messageApi.success(successMessage);
              onClose();
              onSuccess();
            } else {
              messageApi.error(response?.message || failedMessage);
            }
          } catch (error) {
            messageApi.error(failedMessage);
            console.error(`${mode} error:`, error);
          }
        }}
        submitter={{
          searchConfig: {
            submitText,
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
