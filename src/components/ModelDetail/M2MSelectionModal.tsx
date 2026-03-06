import { ProTable } from '@ant-design/pro-components';
import { Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { getModelData } from '@/services/api';

interface M2MSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (
    selectedIds: React.Key[],
    selectedRecords: any[],
    initialSelectedIds: React.Key[],
  ) => void;
  title: string;
  modelDesc: any;
  relation: any;
  mainRecordId: any;
}

const M2MSelectionModal: React.FC<M2MSelectionModalProps> = ({
  visible,
  onCancel,
  onOk,
  title,
  modelDesc,
  relation,
  mainRecordId,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<React.Key[]>([]);
  const [saving, setSaving] = useState(false);

  // Load initial selected IDs when modal opens
  useEffect(() => {
    if (visible && relation?.through) {
      setSaving(false); // Reset saving state when modal opens
      const loadInitialSelection = async () => {
        try {
          const { through } = relation;
          // Get linked IDs from through table
          const throughResponse = await getModelData({
            name: through.through,
            page: 1,
            size: 10000,
            cond: [
              {
                field: through.source_to_through_field,
                eq: mainRecordId,
              },
            ],
          });

          if (throughResponse?.code === 0) {
            const linkedIds = (throughResponse.data?.data || []).map(
              (item: any) => item[through.target_to_through_field],
            );
            setInitialSelectedIds(linkedIds);
            setSelectedRowKeys(linkedIds);
          }
        } catch (error) {
          console.error('Failed to load initial selection:', error);
        }
      };

      loadInitialSelection();
    }
  }, [visible, relation, mainRecordId]);

  const handleOk = async () => {
    if (saving) return; // Prevent double submission

    setSaving(true);
    try {
      await onOk(selectedRowKeys, selectedRows, initialSelectedIds);
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      // Merge new selections with existing ones (for pagination support)
      setSelectedRows((prevRows) => {
        const existingIds = new Set(prevRows.map((r) => r.id));
        const newRows = newSelectedRows.filter((r) => !existingIds.has(r.id));
        const keptRows = prevRows.filter((r) =>
          newSelectedRowKeys.includes(r.id),
        );
        return [...keptRows, ...newRows];
      });
    },
    getCheckboxProps: (record: any) => ({
      name: record.name,
    }),
  };

  return (
    <Modal
      title={`Link ${title}`}
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      width={1000}
      style={{ top: 20 }}
      okText="Save"
      cancelText="Cancel"
      confirmLoading={saving}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>
          Selected {selectedRowKeys.length} items (Initially linked:{' '}
          {initialSelectedIds.length})
        </span>
      </div>

      <ProTable
        rowKey="id"
        size="small"
        scroll={{ y: 400 }}
        rowSelection={rowSelection}
        request={async (params) => {
          try {
            // Build search conditions
            const conditions: any[] = [];

            // Process form search conditions, only search fields in search_fields
            const searchFields = modelDesc.attrs?.search_fields || [];
            Object.entries(params).forEach(([key, value]) => {
              if (
                value &&
                key !== 'current' &&
                key !== 'pageSize' &&
                searchFields.includes(key)
              ) {
                conditions.push({
                  field: key,
                  icontains: String(value),
                });
              }
            });

            // Get all target records (not just linked ones)
            const targetModelName = relation.target || modelDesc.name;
            const response = await getModelData({
              name: targetModelName,
              page: params.current || 1,
              size: params.pageSize || 10,
              cond: conditions,
            });

            if (response?.code === 0) {
              const responseData = response.data?.data || [];

              return {
                data: responseData,
                total: response.data?.count || 0,
                success: true,
              };
            }

            return {
              data: [],
              total: 0,
              success: false,
            };
          } catch (error) {
            console.error('Search error:', error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={Object.entries(modelDesc.fields || {})
          .filter(
            ([_fieldName, fieldConfig]) => (fieldConfig as any).show !== false,
          )
          .map(([fieldName, fieldConfig]) => {
            const fieldConf = fieldConfig as any;
            const attrs = modelDesc.attrs || {};

            const column: any = {
              title: fieldConf.name || fieldName,
              dataIndex: fieldName,
              key: fieldName,
              width: 150,
              ellipsis: true,
              hideInSearch: !attrs.search_fields?.includes(fieldName),
            };

            // Set valueType and valueEnum for fields with choices
            if (fieldConf.choices && fieldConf.choices.length > 0) {
              column.valueType = 'select';
              column.valueEnum = fieldConf.choices.reduce(
                (acc: any, [value, label]: [string, string]) => {
                  acc[value] = { text: label };
                  return acc;
                },
                {},
              );
              column.render = (_: any, record: any) => {
                const value = record?.[fieldName];
                if (value === null || value === undefined) return '-';
                const choice = fieldConf.choices.find(
                  ([choiceValue]: [string, string]) => choiceValue === value,
                );
                return choice ? choice[1] : value;
              };
            } else if (fieldConf.field_type === 'BooleanField') {
              column.valueType = 'switch';
              column.render = (_: any, record: any) => {
                const value = record?.[fieldName];
                return value ? '✓' : '✗';
              };
            } else if (fieldConf.field_type === 'DateField') {
              column.valueType = 'date';
              column.render = (_: any, record: any) => {
                const value = record?.[fieldName];
                if (value === null || value === undefined) return '-';
                return value;
              };
            } else if (fieldConf.field_type === 'DatetimeField') {
              column.valueType = 'dateTime';
              column.render = (_: any, record: any) => {
                const value = record?.[fieldName];
                if (value === null || value === undefined) return '-';
                return value;
              };
            } else if (
              fieldConf.field_type === 'IntegerField' ||
              fieldConf.field_type === 'FloatField'
            ) {
              column.valueType = 'digit';
              column.render = (_: any, record: any) => {
                const value = record?.[fieldName];
                if (value === null || value === undefined) return '-';
                const num = Number(value);
                if (Number.isNaN(num)) return '-';
                return num.toLocaleString();
              };
            } else {
              column.valueType = 'text';
              column.render = (_: any, record: any) => {
                const value = record?.[fieldName];
                if (value === null || value === undefined) return '-';
                // Handle text truncation
                if (typeof value === 'string' && value.length > 30) {
                  return `${value.substring(0, 30)}...`;
                }
                return value;
              };
            }

            // Add sort based on list_sort
            if (attrs.list_sort?.includes(fieldName)) {
              column.sorter = true;
            }

            return column;
          })}
        search={
          modelDesc.attrs?.search_fields?.length > 0
            ? {
                labelWidth: 120,
                defaultCollapsed: false,
              }
            : false
        }
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        options={{
          search: false,
          reload: true,
          density: true,
          setting: false,
        }}
        toolBarRender={false}
      />
    </Modal>
  );
};

export default M2MSelectionModal;
