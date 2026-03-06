/**
 * Column render functions for different field types
 */

import { EyeOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Image, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React from 'react';

/**
 * Render boolean field
 */
export const renderBooleanField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => <span>{record[fieldName] ? '✓' : '✗'}</span>;
};

/**
 * Render date field
 */
export const renderDateField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const value = record[fieldName];
    if (!value) return '-';
    const numValue = typeof value === 'string' ? Number(value) : value;
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
};

/**
 * Render datetime field
 */
export const renderDatetimeField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const value = record[fieldName];
    if (!value) return '-';
    const numValue = typeof value === 'string' ? Number(value) : value;
    const timestamp =
      typeof numValue === 'number' &&
      !Number.isNaN(numValue) &&
      numValue > 0 &&
      numValue < 10000000000
        ? numValue * 1000
        : numValue;
    const result = dayjs(timestamp);
    return result.isValid() ? result.format('YYYY-MM-DD HH:mm:ss') : '-';
  };
};

/**
 * Render time field
 */
export const renderTimeField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const value = record[fieldName];
    if (!value) return '-';
    const numValue = typeof value === 'string' ? Number(value) : value;
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
};

/**
 * Render number field
 */
export const renderNumberField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) =>
    record[fieldName] !== null && record[fieldName] !== undefined
      ? Number(record[fieldName]).toLocaleString()
      : '-';
};

/**
 * Render text field
 */
export const renderTextField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const text = record[fieldName] || '-';
    return text.length > 20 ? `${text.substring(0, 20)}...` : text;
  };
};

/**
 * Render choice field
 */
export const renderChoiceField = (
  fieldName: string,
  choices: [string, string][],
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const choice = choices?.find(
      ([value]: [string, string]) => value === record[fieldName],
    );
    return choice ? choice[1] : record[fieldName] || '-';
  };
};

/**
 * Render editor field (rich text)
 */
export const renderEditorField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const content = record[fieldName];
    if (!content) return '-';

    const stringContent = String(content);
    const sanitizedText = stringContent
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const preview =
      sanitizedText.length > 50
        ? `${sanitizedText.substring(0, 50)}...`
        : sanitizedText || 'Rich content';

    return (
      <Tooltip
        title={
          <div
            style={{
              maxWidth: 500,
              maxHeight: 300,
              overflow: 'auto',
              padding: '8px',
              backgroundColor: '#fff',
            }}
            dangerouslySetInnerHTML={{ __html: stringContent }}
          />
        }
        placement="topLeft"
        overlayStyle={{ maxWidth: 'none' }}
      >
        <span
          style={{
            cursor: 'pointer',
            color: '#1677ff',
            fontSize: '12px',
          }}
          title="Hover to view formatted content"
        >
          ✍️ {preview}
        </span>
      </Tooltip>
    );
  };
};

/**
 * Render image field
 */
export const renderImageField = (
  fieldName: string,
  fieldConfig: any,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const imageUrl = record[fieldName];
    if (!imageUrl) return '-';

    return (
      <Image
        src={imageUrl}
        alt={fieldConfig.name || fieldName}
        width={80}
        height={60}
        style={{
          objectFit: 'cover',
          borderRadius: 4,
          border: '1px solid #d9d9d9',
        }}
        placeholder={
          <div
            style={{
              width: 80,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f5f5f5',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
            }}
          >
            <EyeOutlined style={{ color: '#bfbfbf' }} />
          </div>
        }
        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+2oqIrqwOqG4otoP/7DwhIHGALSCxgCzgASCAJSCBhA0ggAQkgASRAAgkgAQkrAUlbrUoroKChzZmNe/+t2+NZTZ+3pt6vr7+7/ffO9/S7v//x8v9Nv339b7Y8A4cOHjjyBAADGHGAYNwBjFjAGIJBBzBmAYMIJh3AqAWMIph0AKMWMIpg0gGMWsAogkknMGrBgAWMIph0AqMWDFjAKIJJJzBqwYAFjCKYdAKjFgxYwCiCSSc="
      />
    );
  };
};

/**
 * Render JSON field
 */
export const renderJsonField = (
  fieldName: string,
): ProColumns<Record<string, any>>['render'] => {
  return (_, record) => {
    const content = record[fieldName];
    if (content === null || content === undefined) return '-';

    // Convert to string for display
    let jsonString: string;
    let formattedJson: string;
    try {
      if (typeof content === 'string') {
        // Parse and re-stringify to validate and format
        const parsed = JSON.parse(content);
        jsonString = JSON.stringify(parsed);
        formattedJson = JSON.stringify(parsed, null, 2);
      } else {
        jsonString = JSON.stringify(content);
        formattedJson = JSON.stringify(content, null, 2);
      }
    } catch {
      jsonString = String(content);
      formattedJson = String(content);
    }

    // Create preview text
    const preview =
      jsonString.length > 30 ? `${jsonString.substring(0, 30)}...` : jsonString;

    return (
      <Tooltip
        title={
          <pre
            style={{
              margin: 0,
              maxWidth: 500,
              maxHeight: 400,
              overflow: 'auto',
              fontSize: 12,
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {formattedJson}
          </pre>
        }
        placement="topLeft"
        overlayStyle={{ maxWidth: 'none' }}
        color="#fff"
        overlayInnerStyle={{ color: '#333' }}
      >
        <span
          style={{
            cursor: 'pointer',
            color: '#722ed1',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: 12,
          }}
          title="Hover to view formatted JSON"
        >
          📋 {preview}
        </span>
      </Tooltip>
    );
  };
};

/**
 * Render text range search form item
 */
export const renderTextRangeFormItem = (
  _schema: any,
  config: any,
): React.ReactNode => {
  const { value, onChange } = config;
  const currentValue = Array.isArray(value) ? value : ['', ''];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="text"
        placeholder="Start"
        value={currentValue[0] || ''}
        onChange={(e) => {
          onChange?.([e.target.value, currentValue[1] || '']);
        }}
        style={{
          flex: 1,
          padding: '4px 11px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          outline: 'none',
        }}
      />
      <span>~</span>
      <input
        type="text"
        placeholder="End"
        value={currentValue[1] || ''}
        onChange={(e) => {
          onChange?.([currentValue[0] || '', e.target.value]);
        }}
        style={{
          flex: 1,
          padding: '4px 11px',
          border: '1px solid #d9d9d9',
          borderRadius: 6,
          outline: 'none',
        }}
      />
    </div>
  );
};
