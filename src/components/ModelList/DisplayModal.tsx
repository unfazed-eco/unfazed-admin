/**
 * Display modal for showing action results
 */

import { Modal, Table } from 'antd';
import React from 'react';
import { formatDateTimeValue } from '@/utils/timestamp';

/**
 * Show display modal with action result data
 */
export const showDisplayModal = (
  data: any,
  actionConfig: any,
  modelDesc?: API.AdminSerializeModel | null,
): void => {
  const displayData = Array.isArray(data) ? data : [data];

  // Generate column configuration
  const columns =
    displayData.length > 0
      ? Object.keys(displayData[0]).map((key) => ({
          title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          dataIndex: key,
          key,
          ellipsis: true,
          render: (value: any) => {
            const fieldType = modelDesc?.fields?.[key]?.field_type;
            if (value === null || value === undefined) return '-';
            if (fieldType === 'DateField') {
              return formatDateTimeValue(value, 'YYYY-MM-DD');
            }
            if (fieldType === 'DatetimeField') {
              return formatDateTimeValue(value, 'YYYY-MM-DD HH:mm:ss');
            }
            if (fieldType === 'TimeField') {
              return formatDateTimeValue(value, 'HH:mm:ss');
            }
            if (typeof value === 'boolean') return value ? '✓' : '✗';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value);
          },
        }))
      : [];

  Modal.info({
    title: actionConfig?.description || 'Action Result',
    width: Math.min(1000, window.innerWidth * 0.8),
    content: (
      <Table
        dataSource={displayData}
        columns={columns}
        pagination={{ pageSize: 10 }}
        size="small"
        rowKey={(record, index) => record.id || index}
        scroll={{ x: 'max-content' }}
      />
    ),
    onOk() {
      // Modal close callback
    },
  });
};
