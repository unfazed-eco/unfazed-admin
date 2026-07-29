import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ProFormDatePicker,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormItem,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProFormTimePicker,
} from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import React from 'react';
import { JsonFieldEditor, ProFormEditorJS } from '@/components';
import { toJsonString, validateJson } from '@/utils/json';
import {
  toDisplayDateTimePickerValue,
  toUnixTimestamp,
} from '@/utils/timestamp';

/**
 * Shared helper for rendering form fields.
 * @param fieldName Field name
 * @param fieldConfig Field configuration
 * @param formRef Form reference used for ImageField preview
 * @param options Extra options
 */
export const renderFormField = (
  fieldName: string,
  fieldConfig: any,
  formRef?: React.RefObject<ProFormInstance>,
  options?: {
    /** Whether to render in readonly mode */
    readonly?: boolean;
    /** Custom shared props */
    commonProps?: any;
  },
) => {
  const { readonly = false, commonProps: customCommonProps } = options || {};

  // Determine if field should be readonly (from options OR from fieldConfig)
  const isReadonly =
    readonly || fieldConfig.readonly || customCommonProps?.readonly;

  const commonProps = {
    name: fieldName,
    label: fieldConfig.name || fieldName,
    tooltip: fieldConfig.help_text,
    readonly: isReadonly,
    disabled: isReadonly, // Also set disabled for better compatibility
    rules: fieldConfig.blank
      ? []
      : [
          {
            required: true,
            message: `${fieldConfig.name || fieldName} is required`,
          },
        ],
    ...customCommonProps,
    // Ensure readonly/disabled are not overwritten by customCommonProps
    ...(isReadonly ? { readonly: true, disabled: true } : {}),
  };

  // Render different components based on the field type.
  switch (fieldConfig.field_type) {
    case 'CharField':
      if (fieldConfig.choices && fieldConfig.choices.length > 0) {
        return (
          <ProFormSelect
            key={fieldName}
            {...commonProps}
            options={fieldConfig.choices.map(
              ([value, label]: [string, string]) => ({
                label,
                value,
              }),
            )}
          />
        );
      }
      return <ProFormText key={fieldName} {...commonProps} />;

    case 'TextField':
      return <ProFormTextArea key={fieldName} {...commonProps} />;

    case 'IntegerField':
      if (fieldConfig.choices && fieldConfig.choices.length > 0) {
        return (
          <ProFormSelect
            key={fieldName}
            {...commonProps}
            options={fieldConfig.choices.map(
              ([value, label]: [number, string]) => ({
                label,
                value,
              }),
            )}
          />
        );
      }
      return (
        <ProFormDigit
          key={fieldName}
          {...commonProps}
          fieldProps={{
            precision: 0,
          }}
        />
      );

    case 'FloatField':
      return (
        <ProFormDigit
          key={fieldName}
          {...commonProps}
          fieldProps={{
            precision: 2,
          }}
        />
      );

    case 'BooleanField':
      return <ProFormSwitch key={fieldName} {...commonProps} />;

    case 'DateField':
      return (
        <ProFormDatePicker
          key={fieldName}
          {...commonProps}
          convertValue={(value: any) => {
            return toDisplayDateTimePickerValue(value);
          }}
          // Date fields are calendar values without time-zone semantics.
          // The backend always returns wall-clock strings, so submit the
          // picked wall-clock string back unchanged (no timestamp conversion).
          transform={(value: any) => {
            if (!value) return { [fieldName]: value };
            return typeof value.format === 'function'
              ? { [fieldName]: value.format('YYYY-MM-DD') }
              : { [fieldName]: value };
          }}
        />
      );

    case 'DatetimeField':
      return (
        <ProFormDateTimePicker
          key={fieldName}
          {...commonProps}
          fieldProps={{
            showTime: true,
            format: 'YYYY-MM-DD HH:mm:ss',
          }}
          // Convert timestamp to dayjs for display
          convertValue={(value: any) => {
            return toDisplayDateTimePickerValue(value);
          }}
          // Convert dayjs back to timestamp for submission
          transform={(value: any) => {
            return { [fieldName]: toUnixTimestamp(value) };
          }}
        />
      );

    case 'TimeField':
      return (
        <ProFormTimePicker
          key={fieldName}
          {...commonProps}
          convertValue={(value: any) => {
            return toDisplayDateTimePickerValue(value);
          }}
          // Time fields are clock values without time-zone semantics.
          // The backend always returns wall-clock strings, so submit the
          // picked wall-clock string back unchanged (no timestamp conversion).
          transform={(value: any) => {
            if (!value) return { [fieldName]: value };
            return typeof value.format === 'function'
              ? { [fieldName]: value.format('HH:mm:ss') }
              : { [fieldName]: value };
          }}
        />
      );

    case 'EditorField':
      return (
        <ProFormEditorJS
          key={fieldName}
          {...commonProps}
          fieldProps={{
            readOnly: isReadonly,
            config: {
              placeholder: commonProps.tooltip || 'Start writing your story...',
              removePlugins: ['ImageUpload', 'EasyImage', 'CKFinder', 'CKBox'],
              toolbar: {
                removeItems: [
                  'uploadImage',
                  'imageUpload',
                  'ckfinder',
                  'ckbox',
                  'mediaEmbed',
                ],
              },
              image: {
                insert: { type: 'auto' },
                resizeUnit: 'px',
                resizeOptions: [
                  {
                    name: 'resizeImage:original',
                    value: null,
                    label: 'Original',
                  },
                  {
                    name: 'resizeImage:custom',
                    label: 'Custom',
                    value: 'custom',
                  },
                  { name: 'resizeImage:200', value: '200', label: '200px' },
                  { name: 'resizeImage:400', value: '400', label: '400px' },
                ],
                toolbar: [
                  'imageStyle:inline',
                  'imageStyle:block',
                  'imageStyle:wrapText',
                  '|',
                  'resizeImage',
                  '|',
                  'toggleImageCaption',
                  'imageTextAlternative',
                ],
              },
            },
          }}
        />
      );

    case 'ImageField':
      return (
        <ProFormText
          key={fieldName}
          {...commonProps}
          fieldProps={{
            placeholder: 'Enter image URL...',
            addonAfter: (
              <Button
                size="small"
                onClick={() => {
                  if (!formRef?.current) {
                    Modal.warning({
                      title: 'Preview Unavailable',
                      content: 'Form reference not available for preview',
                    });
                    return;
                  }

                  const url = formRef.current.getFieldValue(fieldName);
                  if (url) {
                    Modal.info({
                      title: 'Image Preview',
                      content: (
                        <div style={{ textAlign: 'center' }}>
                          <img
                            src={url}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: 400,
                              objectFit: 'contain',
                            }}
                            onError={(e) => {
                              e.currentTarget.src =
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+2oqIrqwOqG4otoP/7DwhIHGALSCxgCzgASCAJSCBhA0ggAQkgASRAAgkgAQkrAUlbrUoroKChzZmNe/+t2+NZTZ+3pt6vr7+7/ffO9/S7v//x8v9Nv339b7Y8A4cOHjjyBAADGHGAYNwBjFjAGIJBBzBmAYMIJh3AqAWMIph0AKMWMIpg0gGMWsAogkknMGrBgAWMIph0AqMWDFjAKIJJJzBqwYAFjCKYdAKjFgxYwCiCSSc=';
                            }}
                          />
                        </div>
                      ),
                      width: 600,
                    });
                  } else {
                    Modal.warning({
                      title: 'No Image URL',
                      content: 'Please enter an image URL first',
                    });
                  }
                }}
              >
                Preview
              </Button>
            ),
          }}
        />
      );

    case 'JsonField':
      return (
        <ProFormItem
          key={fieldName}
          name={fieldName}
          label={fieldConfig.name || fieldName}
          tooltip={fieldConfig.help_text}
          rules={[
            ...(fieldConfig.blank
              ? []
              : [
                  {
                    required: true,
                    message: `${fieldConfig.name || fieldName} is required`,
                  },
                ]),
            {
              validator: async (_: any, value: any) => {
                if (value === null || value === undefined) return;
                const result = validateJson(value);
                if (!result.valid) {
                  throw new Error(`Invalid JSON: ${result.error}`);
                }
              },
            },
          ]}
          // Convert object to JSON string for display
          getValueProps={(value: any) => ({
            value: toJsonString(value),
          })}
          // Keep as JSON string when submitting to backend
          transform={(value: any) => {
            // Ensure we send a valid JSON string to backend
            const jsonString = toJsonString(value);
            return { [fieldName]: jsonString };
          }}
          {...customCommonProps}
        >
          <JsonFieldEditor
            readonly={isReadonly}
            placeholder={fieldConfig.help_text || 'Enter JSON data...'}
          />
        </ProFormItem>
      );

    default:
      return <ProFormText key={fieldName} {...commonProps} />;
  }
};

/**
 * Render multiple form fields in a batch.
 * @param fields Field configuration map
 * @param formRef Form reference
 * @param options Extra options
 */
export const renderFormFields = (
  fields: Record<string, any>,
  formRef?: React.RefObject<ProFormInstance>,
  options?: {
    /** Whether to render in readonly mode */
    readonly?: boolean;
    /** Field filter function */
    fieldFilter?: (fieldName: string, fieldConfig: any) => boolean;
    /** Custom shared props */
    commonProps?: any;
  },
) => {
  const { fieldFilter, ...renderOptions } = options || {};

  return Object.entries(fields)
    .map(([fieldName, fieldConfig]: [string, any]) => {
      // Skip fields that should not be shown.
      if (fieldConfig.show === false) return null;

      // Apply the custom field filter when provided.
      if (fieldFilter && !fieldFilter(fieldName, fieldConfig)) return null;

      return renderFormField(fieldName, fieldConfig, formRef, renderOptions);
    })
    .filter(Boolean); // Filter out null entries.
};
