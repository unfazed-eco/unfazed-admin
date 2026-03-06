/**
 * Action buttons component for ModelCustom
 */

import type { ProFormInstance } from '@ant-design/pro-components';
import { Button } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import React, { useCallback } from 'react';
import type { ActionConfig } from './types';

interface ActionButtonsProps {
  toolDesc: API.AdminToolSerializeModel;
  actionLoading: Record<string, boolean>;
  formRef: React.RefObject<ProFormInstance>;
  messageApi: MessageInstance;
  executeAction: (
    actionKey: string,
    actionConfig: ActionConfig,
    formData: any,
  ) => Promise<void>;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  toolDesc,
  actionLoading,
  formRef,
  messageApi,
  executeAction,
}) => {
  const handleActionClick = useCallback(
    async (actionKey: string, actionConfig: ActionConfig) => {
      if (actionConfig.input === 'empty') {
        // No form data needed
        await executeAction(actionKey, actionConfig, {});
      } else {
        // Form data needed
        try {
          const formData = await formRef.current?.validateFields();
          await executeAction(actionKey, actionConfig, formData);
        } catch (_error) {
          messageApi.warning('Please fill in all required fields');
        }
      }
    },
    [executeAction, formRef, messageApi],
  );

  const buttons: React.ReactNode[] = [];

  Object.entries(toolDesc.actions || {}).forEach(
    ([actionKey, actionConfig]: [string, any]) => {
      buttons.push(
        <Button
          key={actionKey}
          type={actionKey === 'submit' ? 'primary' : 'default'}
          loading={actionLoading[actionKey]}
          onClick={() => handleActionClick(actionKey, actionConfig)}
        >
          {actionConfig.label || actionConfig.name}
        </Button>,
      );
    },
  );

  return <>{buttons}</>;
};

export default ActionButtons;
