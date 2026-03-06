import { LinkOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { getModelData } from '@/services/api';

interface BackRelationSelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  onLink: (selectedRecords: any[], unlinkedRecords: any[]) => void;
  title: string;
  modelName: string;
  modelDesc: any;
  relation: API.Relation;
  mainRecordId?: any;
  // For bk_o2o, only allow single selection
  isSingleSelect?: boolean;
  loading?: boolean;
}

const BackRelationSelectionModal: React.FC<BackRelationSelectionModalProps> = ({
  visible,
  onCancel,
  onLink,
  title,
  modelName,
  modelDesc,
  relation,
  mainRecordId,
  isSingleSelect = false,
  loading = false,
}) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  // Track initially linked record IDs (already linked before opening modal)
  const [initialLinkedIds, setInitialLinkedIds] = useState<React.Key[]>([]);
  // Track initially linked records (for unlink operation)
  const [initialLinkedRecords, setInitialLinkedRecords] = useState<any[]>([]);

  // Reset selection state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedRowKeys([]);
      setSelectedRows([]);
      setInitialLinkedIds([]);
      setInitialLinkedRecords([]);
    }
  }, [visible]);

  const handleOk = () => {
    // Calculate newly linked records (selected but not initially linked)
    const newlyLinkedRecords = selectedRows.filter(
      (record) => !initialLinkedIds.includes(record.id),
    );

    // Calculate unlinked records (initially linked but now unchecked)
    const unlinkedRecords = initialLinkedRecords.filter(
      (record) => !selectedRowKeys.includes(record.id),
    );

    // If there are any changes (new links or unlinks), call the handler
    if (newlyLinkedRecords.length > 0 || unlinkedRecords.length > 0) {
      onLink(newlyLinkedRecords, unlinkedRecords);
    } else {
      // No changes, just close
      onCancel();
    }
  };

  // Check if a record is linked to the current main record
  const isLinkedToCurrentRecord = (record: any) => {
    const fkValue = record[relation.target_field];
    return fkValue === mainRecordId;
  };

  // Calculate newly selected count (excluding already linked)
  const newlySelectedCount = selectedRowKeys.filter(
    (key) => !initialLinkedIds.includes(key),
  ).length;

  // Calculate unlinked count (initially linked but now unchecked)
  const unlinkedCount = initialLinkedIds.filter(
    (id) => !selectedRowKeys.includes(id),
  ).length;

  // Check if there are any changes
  const hasChanges = newlySelectedCount > 0 || unlinkedCount > 0;

  const rowSelection = {
    type: isSingleSelect ? ('radio' as const) : ('checkbox' as const),
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: (newSelectedRowKeys: React.Key[], newSelectedRows: any[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
      // Merge new selected rows with existing ones (preserve across pages)
      setSelectedRows((prevRows) => {
        const existingRowsMap = new Map(prevRows.map((row) => [row.id, row]));
        // Add new rows from current page
        newSelectedRows.forEach((row) => {
          existingRowsMap.set(row.id, row);
        });
        // Remove rows that are no longer selected
        const selectedKeysSet = new Set(newSelectedRowKeys);
        return Array.from(existingRowsMap.values()).filter((row) =>
          selectedKeysSet.has(row.id),
        );
      });
    },
  };

  return (
    <Modal
      title={
        <span>
          <LinkOutlined style={{ marginRight: 8 }} />
          Link {title}
        </span>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      style={{ top: 20 }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<LinkOutlined />}
          onClick={handleOk}
          disabled={!hasChanges}
          loading={loading}
        >
          Save
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <span style={{ color: '#666' }}>
          {isSingleSelect
            ? `Select one record to link${initialLinkedIds.length > 0 ? ` (Current: ${initialLinkedIds.length} linked)` : ''}`
            : `Already linked: ${initialLinkedIds.length} | To link: ${newlySelectedCount} | To unlink: ${unlinkedCount}`}
        </span>
      </div>

      <ProTable
        rowKey="id"
        size="small"
        scroll={{ y: 400 }}
        rowSelection={rowSelection}
        request={async (params) => {
          try {
            // Build search conditions - show ALL records
            const conditions: any[] = [];

            // Process form search conditions
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

            const response = await getModelData({
              name: modelName,
              page: params.current || 1,
              size: params.pageSize || 10,
              cond: conditions,
            });

            if (response?.code === 0) {
              const responseData = response.data?.data || [];
              const total = response.data?.count || 0;

              // Find already linked records on current page
              const linkedRecordsOnPage = responseData.filter((record: any) =>
                isLinkedToCurrentRecord(record),
              );
              const linkedIdsOnPage = linkedRecordsOnPage.map((r: any) => r.id);

              // Accumulate linked records across pages
              if (linkedIdsOnPage.length > 0) {
                setInitialLinkedIds((prev) => {
                  const newIds = linkedIdsOnPage.filter(
                    (id: React.Key) => !prev.includes(id),
                  );
                  return newIds.length > 0 ? [...prev, ...newIds] : prev;
                });
                setInitialLinkedRecords((prev) => {
                  const existingIds = new Set(prev.map((r) => r.id));
                  const newRecords = linkedRecordsOnPage.filter(
                    (r: any) => !existingIds.has(r.id),
                  );
                  return newRecords.length > 0
                    ? [...prev, ...newRecords]
                    : prev;
                });
                setSelectedRowKeys((prev) => {
                  const newIds = linkedIdsOnPage.filter(
                    (id: React.Key) => !prev.includes(id),
                  );
                  return newIds.length > 0 ? [...prev, ...newIds] : prev;
                });
                setSelectedRows((prev) => {
                  const existingIds = new Set(prev.map((r) => r.id));
                  const newRecords = linkedRecordsOnPage.filter(
                    (r: any) => !existingIds.has(r.id),
                  );
                  return newRecords.length > 0
                    ? [...prev, ...newRecords]
                    : prev;
                });
              }

              return {
                data: responseData,
                total: total,
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
        columns={[
          ...Object.entries(modelDesc.fields || {})
            .filter(
              ([fieldName, fieldConfig]) =>
                (fieldConfig as any).show !== false &&
                fieldName !== relation.target_field, // Hide the FK field since we're linking
            )
            .slice(0, 6) // Limit columns for better display
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
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const choice = fieldConf.choices.find(
                    ([choiceValue]: [string, string]) =>
                      choiceValue === actualValue,
                  );
                  return choice ? choice[1] : actualValue;
                };
              } else if (fieldConf.field_type === 'BooleanField') {
                column.valueType = 'switch';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  return actualValue ? '✓' : '✗';
                };
              } else if (fieldConf.field_type === 'DateField') {
                column.valueType = 'date';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const numValue =
                    typeof actualValue === 'string'
                      ? Number(actualValue)
                      : actualValue;
                  const timestamp =
                    typeof numValue === 'number' &&
                    !Number.isNaN(numValue) &&
                    numValue > 0 &&
                    numValue < 10000000000
                      ? numValue * 1000
                      : numValue;
                  const result = dayjs(timestamp);
                  return result.isValid() ? result.format('YYYY-MM-DD') : '-';
                };
              } else if (fieldConf.field_type === 'DatetimeField') {
                column.valueType = 'dateTime';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const numValue =
                    typeof actualValue === 'string'
                      ? Number(actualValue)
                      : actualValue;
                  const timestamp =
                    typeof numValue === 'number' &&
                    !Number.isNaN(numValue) &&
                    numValue > 0 &&
                    numValue < 10000000000
                      ? numValue * 1000
                      : numValue;
                  const result = dayjs(timestamp);
                  return result.isValid()
                    ? result.format('YYYY-MM-DD HH:mm:ss')
                    : '-';
                };
              } else if (fieldConf.field_type === 'TimeField') {
                column.valueType = 'time';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const numValue =
                    typeof actualValue === 'string'
                      ? Number(actualValue)
                      : actualValue;
                  const timestamp =
                    typeof numValue === 'number' &&
                    !Number.isNaN(numValue) &&
                    numValue > 0 &&
                    numValue < 10000000000
                      ? numValue * 1000
                      : numValue;
                  const result = dayjs(timestamp);
                  return result.isValid() ? result.format('HH:mm:ss') : '-';
                };
              } else if (
                fieldConf.field_type === 'IntegerField' ||
                fieldConf.field_type === 'FloatField'
              ) {
                column.valueType = 'digit';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  const num = Number(actualValue);
                  if (Number.isNaN(num)) return '-';
                  return num.toLocaleString();
                };
              } else {
                column.valueType = 'text';
                column.render = (value: any, record: any) => {
                  const actualValue = record?.[fieldName] ?? value;
                  if (actualValue === null || actualValue === undefined)
                    return '-';
                  if (
                    typeof actualValue === 'string' &&
                    actualValue.length > 30
                  ) {
                    return `${actualValue.substring(0, 30)}...`;
                  }
                  return actualValue;
                };
              }

              // Add sort based on list_sort
              if (attrs.list_sort?.includes(fieldName)) {
                column.sorter = true;
              }

              return column;
            }),
        ]}
        search={
          modelDesc.attrs?.search_fields?.length > 0
            ? {
                labelWidth: 120,
                defaultCollapsed: true,
              }
            : false
        }
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: false,
        }}
        options={{
          search: false,
          reload: true,
          density: false,
          setting: false,
        }}
        toolBarRender={false}
      />
    </Modal>
  );
};

export default BackRelationSelectionModal;
