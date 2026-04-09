import React from 'react';
import { renderFormField, renderFormFields } from './formFieldRenderer';

jest.mock('antd', () => {
  const React = require('react');
  return {
    Button: ({ children, ...props }: any) =>
      React.createElement('button', props, children),
    Modal: {
      info: jest.fn(),
      warning: jest.fn(),
    },
  };
});

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  const makeComp = (name: string) => {
    const Comp = (props: any) =>
      React.createElement(name, props, props.children);
    (Comp as any).displayName = name;
    return Comp;
  };

  return {
    ProFormDatePicker: makeComp('ProFormDatePicker'),
    ProFormDateTimePicker: makeComp('ProFormDateTimePicker'),
    ProFormDigit: makeComp('ProFormDigit'),
    ProFormItem: makeComp('ProFormItem'),
    ProFormSelect: makeComp('ProFormSelect'),
    ProFormSwitch: makeComp('ProFormSwitch'),
    ProFormText: makeComp('ProFormText'),
    ProFormTextArea: makeComp('ProFormTextArea'),
    ProFormTimePicker: makeComp('ProFormTimePicker'),
  };
});

jest.mock('@/components', () => {
  const React = require('react');
  return {
    JsonFieldEditor: (props: any) =>
      React.createElement('JsonFieldEditor', props),
    ProFormEditorJS: (props: any) =>
      React.createElement('ProFormEditorJS', props),
  };
});

describe('formFieldRenderer', () => {
  const { Modal } = require('antd');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders CharField as select when choices exist', () => {
    const element: any = renderFormField('status', {
      field_type: 'CharField',
      name: 'Status',
      choices: [
        ['a', 'A'],
        ['b', 'B'],
      ],
    });

    expect(element.type.displayName).toBe('ProFormSelect');
    expect(element.props.options).toEqual([
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ]);
  });

  it('renders basic field types correctly', () => {
    expect(
      (renderFormField('title', { field_type: 'CharField' }) as any).type
        .displayName,
    ).toBe('ProFormText');
    expect(
      (renderFormField('desc', { field_type: 'TextField' }) as any).type
        .displayName,
    ).toBe('ProFormTextArea');
    expect(
      (renderFormField('on', { field_type: 'BooleanField' }) as any).type
        .displayName,
    ).toBe('ProFormSwitch');
    expect(
      (renderFormField('d', { field_type: 'DateField' }) as any).type
        .displayName,
    ).toBe('ProFormDatePicker');
    expect(
      (renderFormField('t', { field_type: 'TimeField' }) as any).type
        .displayName,
    ).toBe('ProFormTimePicker');
  });

  it('renders integer/float field configs', () => {
    const intEl: any = renderFormField('count', { field_type: 'IntegerField' });
    expect(intEl.type.displayName).toBe('ProFormDigit');
    expect(intEl.props.fieldProps).toEqual({ precision: 0 });

    const intSelect: any = renderFormField('count2', {
      field_type: 'IntegerField',
      choices: [
        [1, 'One'],
        [2, 'Two'],
      ],
    });
    expect(intSelect.type.displayName).toBe('ProFormSelect');

    const floatEl: any = renderFormField('score', { field_type: 'FloatField' });
    expect(floatEl.type.displayName).toBe('ProFormDigit');
    expect(floatEl.props.fieldProps).toEqual({ precision: 2 });
  });

  it('handles DatetimeField conversion and transform', () => {
    const element: any = renderFormField('created_at', {
      field_type: 'DatetimeField',
    });

    expect(element.type.displayName).toBe('ProFormDateTimePicker');
    expect(element.props.convertValue(undefined)).toBeUndefined();
    expect(element.props.convertValue(1700000000).valueOf()).toBe(
      1700000000 * 1000,
    );

    const thirteen = element.props.convertValue(1700000000000);
    expect(thirteen.valueOf()).toBe(1700000000000);

    expect(element.props.transform(undefined)).toEqual({
      created_at: undefined,
    });
    expect(element.props.transform('2026-01-01 00:00:00')).toEqual({
      created_at: expect.any(Number),
    });
  });

  it('renders editor and default field', () => {
    const editor: any = renderFormField(
      'content',
      { field_type: 'EditorField', help_text: 'help' },
      undefined,
      { readonly: true },
    );
    expect(editor.type).toBe(require('@/components').ProFormEditorJS);
    expect(editor.props.fieldProps.readOnly).toBe(true);

    const fallback: any = renderFormField('x', { field_type: 'UnknownField' });
    expect(fallback.type.displayName).toBe('ProFormText');
  });

  it('handles ImageField preview with missing formRef and missing url', () => {
    const element: any = renderFormField('cover', { field_type: 'ImageField' });
    const addonButton = element.props.fieldProps.addonAfter;

    addonButton.props.onClick();
    expect(Modal.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Preview Unavailable' }),
    );

    const formRef = { current: { getFieldValue: jest.fn(() => '') } } as any;
    const element2: any = renderFormField(
      'cover',
      { field_type: 'ImageField' },
      formRef,
    );
    element2.props.fieldProps.addonAfter.props.onClick();

    expect(Modal.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'No Image URL' }),
    );
  });

  it('handles ImageField preview with url', () => {
    const formRef = {
      current: { getFieldValue: jest.fn(() => 'https://a/b.png') },
    } as any;
    const element: any = renderFormField(
      'cover',
      { field_type: 'ImageField' },
      formRef,
    );

    element.props.fieldProps.addonAfter.props.onClick();

    expect(Modal.info).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Image Preview',
        width: 600,
      }),
    );
  });

  it('renders JsonField and validates json content', async () => {
    const element: any = renderFormField('meta', {
      field_type: 'JsonField',
      name: 'Meta',
      blank: false,
    });

    expect(element.type.displayName).toBe('ProFormItem');
    expect(element.props.getValueProps({ a: 1 }).value).toContain('"a": 1');
    expect(element.props.transform({ a: 1 })).toEqual({
      meta: expect.stringContaining('"a": 1'),
    });

    const validator = element.props.rules[1].validator;
    await expect(validator({}, '{"a":1}')).resolves.toBeUndefined();
    await expect(validator({}, '{bad')).rejects.toThrow('Invalid JSON');
  });

  it('respects readonly/commonProps and batch render filtering', () => {
    const fieldEl: any = renderFormField(
      'name',
      { field_type: 'CharField', blank: false, readonly: true },
      undefined,
      { commonProps: { tooltip: 'tip' } },
    );

    expect(fieldEl.props.readonly).toBe(true);
    expect(fieldEl.props.disabled).toBe(true);
    expect(fieldEl.props.tooltip).toBe('tip');
    expect(fieldEl.props.rules[0].required).toBe(true);

    const list = renderFormFields(
      {
        a: { field_type: 'CharField' },
        b: { field_type: 'TextField', show: false },
        c: { field_type: 'BooleanField' },
      },
      undefined,
      {
        fieldFilter: (name) => name !== 'c',
      },
    ) as any[];

    expect(list).toHaveLength(1);
    expect(list[0].props.name).toBe('a');
  });
});
