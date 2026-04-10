import { Button, Input, Modal, Table } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

interface BackRelationBatchAddModalProps {
  visible: boolean;
  inlineName: string;
  inlineDesc: any;
  relation: any;
  messageApi: any;
  batchSaveLoading?: boolean;
  onPreview: (rows: Record<string, any>[]) => void;
  onBatchSave: (rows: Record<string, any>[]) => Promise<void>;
  onClose: () => void;
}

const parseBoolean = (value: string): boolean | string => {
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return value;
};

const castValueByFieldType = (value: string, fieldConfig: any) => {
  const trimmed = value.trim();
  if (trimmed === '') return '';

  switch (fieldConfig?.field_type) {
    case 'BooleanField':
      return parseBoolean(trimmed);
    case 'IntegerField': {
      const n = Number.parseInt(trimmed, 10);
      return Number.isNaN(n) ? trimmed : n;
    }
    case 'FloatField': {
      const n = Number.parseFloat(trimmed);
      return Number.isNaN(n) ? trimmed : n;
    }
    default:
      return trimmed;
  }
};

const isRecordRow = (
  row: Record<string, any> | null,
): row is Record<string, any> => row !== null;

const validateAndCastValue = (rawValue: string, fieldConfig: any) => {
  const trimmed = rawValue.trim();

  if (trimmed === '') {
    if (fieldConfig?.blank === false) {
      return { value: '', error: 'is required' };
    }
    return { value: '', error: '' };
  }

  if (Array.isArray(fieldConfig?.choices) && fieldConfig.choices.length > 0) {
    const matchedChoice = fieldConfig.choices.find(
      ([choiceValue, choiceLabel]: [any, any]) =>
        String(trimmed) === String(choiceValue) ||
        String(trimmed) === String(choiceLabel),
    );
    if (!matchedChoice) {
      return { value: trimmed, error: 'is not in allowed choices' };
    }
    return { value: matchedChoice[0], error: '' };
  }

  const fieldType = fieldConfig?.field_type;
  if (fieldType === 'IntegerField') {
    if (!/^-?\d+$/.test(trimmed)) {
      return { value: trimmed, error: 'must be an integer' };
    }
    return { value: Number.parseInt(trimmed, 10), error: '' };
  }

  if (fieldType === 'FloatField') {
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      return { value: trimmed, error: 'must be a number' };
    }
    return { value: n, error: '' };
  }

  if (fieldType === 'BooleanField') {
    const normalized = trimmed.toLowerCase();
    if (
      !['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(normalized)
    ) {
      return { value: trimmed, error: 'must be a boolean' };
    }
    return { value: castValueByFieldType(trimmed, fieldConfig), error: '' };
  }

  if (fieldType === 'DatetimeField' || fieldType === 'DateField') {
    const dt = new Date(trimmed);
    if (Number.isNaN(dt.getTime())) {
      return { value: trimmed, error: 'must be a valid date/datetime' };
    }
    return { value: trimmed, error: '' };
  }

  if (fieldType === 'TimeField') {
    if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(trimmed)) {
      return { value: trimmed, error: 'must be in HH:mm or HH:mm:ss format' };
    }
    return { value: trimmed, error: '' };
  }

  return { value: castValueByFieldType(trimmed, fieldConfig), error: '' };
};

const BackRelationBatchAddModal: React.FC<BackRelationBatchAddModalProps> = ({
  visible,
  inlineName,
  inlineDesc,
  relation,
  messageApi,
  batchSaveLoading,
  onPreview,
  onBatchSave,
  onClose,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  const [previewFieldKeys, setPreviewFieldKeys] = useState<string[]>([]);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [previewPagination, setPreviewPagination] = useState<{
    current: number;
    pageSize: number;
  }>({
    current: 1,
    pageSize: 10,
  });

  const editableFieldKeys = useMemo(() => {
    let keys = Object.entries(inlineDesc?.fields || {})
      .filter(([fieldName, fieldConfig]: [string, any]) => {
        if (fieldName === 'id') return false;
        if (fieldName === relation?.target_field) return false;
        if (fieldConfig?.readonly) return false;
        if (fieldConfig?.show === false) return false;
        return true;
      })
      .map(([fieldName]) => fieldName);

    const listDisplay = ((inlineDesc?.attrs as any)?.list_display ||
      []) as string[];
    if (listDisplay.length > 0) {
      keys = keys
        .filter((key) => listDisplay.includes(key))
        .sort((a, b) => listDisplay.indexOf(a) - listDisplay.indexOf(b));
    }

    const rawListOrder = ((inlineDesc?.attrs as any)?.list_order ||
      []) as string[];
    const listOrder = rawListOrder
      .filter(Boolean)
      .map((key) => key.replace(/^-/, ''));
    if (listOrder.length > 0) {
      keys = [...keys].sort((a, b) => {
        const indexA = listOrder.indexOf(a);
        const indexB = listOrder.indexOf(b);
        const orderA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        const orderB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
        return orderA - orderB;
      });
    }

    return keys;
  }, [inlineDesc, relation]);

  const parsePastedRows = useCallback(() => {
    const text = pasteText.trim();
    if (!text) {
      return {
        rows: [] as Record<string, any>[],
        fieldKeys: [] as string[],
        invalidLine: '' as string,
        typeErrors: [] as string[],
      };
    }

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim() !== '');

    if (lines.length === 0) {
      return {
        rows: [] as Record<string, any>[],
        fieldKeys: [] as string[],
        invalidLine: '' as string,
        typeErrors: [] as string[],
      };
    }
    if (editableFieldKeys.length === 0) {
      return {
        rows: [] as Record<string, any>[],
        fieldKeys: [] as string[],
        invalidLine: '',
        typeErrors: [],
      };
    }

    const fieldKeys = editableFieldKeys;
    const splitLine = (line: string) => line.split('\t');
    const now = Date.now();
    let invalidLine = '';
    const typeErrors: string[] = [];
    const rows = lines
      .map((line, index) => {
        const cells = splitLine(line);
        if (cells.length !== fieldKeys.length) {
          invalidLine = line;
          return null;
        }
        const row: Record<string, any> = { id: -(now + index) };

        fieldKeys.forEach((fieldKey, cellIndex) => {
          const rawValue = cells[cellIndex];
          const fieldConfig = inlineDesc?.fields?.[fieldKey];
          const { value, error } = validateAndCastValue(rawValue, fieldConfig);
          if (error) {
            typeErrors.push(
              `Row ${index + 1}, ${
                fieldConfig?.name || fieldKey
              }: ${error} (input: ${rawValue})`,
            );
          }
          row[fieldKey] = value;
        });

        return row;
      })
      .filter(isRecordRow)
      .filter((row) => fieldKeys.some((fieldKey) => row[fieldKey] !== ''));

    return { rows, fieldKeys, invalidLine, typeErrors };
  }, [editableFieldKeys, inlineDesc, pasteText]);

  const handlePreview = useCallback(() => {
    const { rows, fieldKeys, invalidLine, typeErrors } = parsePastedRows();
    if (invalidLine) {
      messageApi.error(`Cannot handle line: ${invalidLine}`);
      return;
    }
    if (typeErrors.length > 0) {
      const head = typeErrors[0];
      const tail =
        typeErrors.length > 1 ? ` (and ${typeErrors.length - 1} more)` : '';
      messageApi.error(`Type validation failed: ${head}${tail}`);
      return;
    }
    if (rows.length === 0) {
      messageApi.warning('No valid rows found from pasted content');
      return;
    }

    setPreviewRows(rows);
    setPreviewFieldKeys(fieldKeys);
    setPreviewEnabled(true);
    setPreviewPagination((prev) => ({ ...prev, current: 1 }));
    onPreview(rows);
    messageApi.success(`Preview loaded: ${rows.length} row(s)`);
  }, [messageApi, onPreview, parsePastedRows]);

  const handleBatchSave = useCallback(async () => {
    const { rows, fieldKeys, invalidLine, typeErrors } = parsePastedRows();
    if (invalidLine) {
      messageApi.error(`Cannot handle line: ${invalidLine}`);
      return;
    }
    if (typeErrors.length > 0) {
      const head = typeErrors[0];
      const tail =
        typeErrors.length > 1 ? ` (and ${typeErrors.length - 1} more)` : '';
      messageApi.error(`Type validation failed: ${head}${tail}`);
      return;
    }
    if (rows.length === 0 || fieldKeys.length === 0) {
      messageApi.error('No valid data to batch save');
      return;
    }
    await onBatchSave(rows);
  }, [messageApi, onBatchSave, parsePastedRows]);

  const handleClosePreview = useCallback(() => {
    setPreviewEnabled(false);
  }, []);

  const previewColumns = useMemo(() => {
    return previewFieldKeys.map((fieldKey) => ({
      title: inlineDesc?.fields?.[fieldKey]?.name || fieldKey,
      dataIndex: fieldKey,
      key: fieldKey,
      ellipsis: true,
      width: 180,
    }));
  }, [inlineDesc, previewFieldKeys]);

  const expanded = previewEnabled && previewRows.length > 0;

  return (
    <Modal
      open={visible}
      title={`Batch Add ${inlineDesc?.attrs?.label || inlineName}`}
      width={expanded ? 1100 : 560}
      destroyOnClose
      onCancel={onClose}
      footer={null}
      styles={{
        body: {
          paddingTop: 20,
        },
      }}
    >
      <div style={{ marginBottom: 12, color: 'rgba(0, 0, 0, 0.65)' }}>
        Paste raw tab-separated rows copied from Excel / Google Sheets (no
        header row).
      </div>
      {!expanded && (
        <Input.TextArea
          value={pasteText}
          onChange={(e) => {
            setPasteText(e.target.value);
            setPreviewEnabled(false);
            setPreviewRows([]);
            setPreviewFieldKeys([]);
            setPreviewPagination((prev) => ({ ...prev, current: 1 }));
            onPreview([]);
          }}
          placeholder="Paste rows here..."
          autoSize={{ minRows: 6, maxRows: 14 }}
        />
      )}

      {expanded && (
        <div style={{ marginTop: 16 }}>
          <Table
            rowKey={(record) => record.id}
            columns={previewColumns}
            dataSource={previewRows}
            pagination={{
              current: previewPagination.current,
              pageSize: previewPagination.pageSize,
              total: previewRows.length,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
            }}
            onChange={(pagination) => {
              setPreviewPagination((prev) => ({
                current: pagination.current || 1,
                pageSize: pagination.pageSize || prev.pageSize,
              }));
            }}
            scroll={{ x: 'max-content', y: 340 }}
            size="small"
          />
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            type="primary"
            loading={batchSaveLoading}
            onClick={handleBatchSave}
          >
            Batch Save
          </Button>
          <Button onClick={expanded ? handleClosePreview : handlePreview}>
            {expanded ? 'Close Preview' : 'Preview'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BackRelationBatchAddModal;
