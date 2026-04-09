import { act, render } from '@testing-library/react';
import React from 'react';
import { saveModelData } from '@/services/api';
import { renderFormField } from '@/utils/formFieldRenderer';
import MainFormTab from './MainFormTab';

const captured: { proFormProps?: any } = {};

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    ProForm: (props: any) => {
      captured.proFormProps = props;
      return React.createElement(
        'div',
        { 'data-testid': 'pro-form' },
        props.children,
      );
    },
  };
});

jest.mock('antd', () => {
  const React = require('react');
  return {
    Button: (props: any) =>
      React.createElement('button', props, props.children),
    Card: ({ children }: any) => React.createElement('div', null, children),
    Divider: ({ children }: any) => React.createElement('div', null, children),
    Space: ({ children }: any) => React.createElement('div', null, children),
  };
});

jest.mock('@/services/api', () => ({
  saveModelData: jest.fn(),
}));

jest.mock('@/utils/formFieldRenderer', () => ({
  renderFormField: jest.fn(() => null),
}));

describe('MainFormTab', () => {
  const messageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const formRef = { current: { setFieldsValue: jest.fn() } } as any;

  const modelDesc = {
    attrs: {
      detail_display: ['title', 'count', 'hiddenButShown'],
      detail_order: ['count', 'title', 'hiddenButShown'],
      detail_editable: ['title'],
    },
    fields: {
      title: { field_type: 'CharField', name: 'Title', required: true },
      count: { field_type: 'IntegerField', name: 'Count', show: true },
      hiddenButShown: { field_type: 'CharField', name: 'Hidden', show: false },
      skipMe: { field_type: 'TextField', show: false },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    captured.proFormProps = undefined;
  });

  const renderComponent = (props: any = {}) =>
    render(
      React.createElement(MainFormTab, {
        modelName: 'book',
        modelDesc,
        record: { id: 1, title: 'A' },
        formRef,
        canEdit: true,
        isCreateMode: false,
        messageApi,
        onBack: jest.fn(),
        onValuesChange: jest.fn(),
        ...props,
      }),
    );

  it('renders fields by detail config and propagates value changes', () => {
    const onValuesChange = jest.fn();
    renderComponent({ onValuesChange });

    expect(renderFormField).toHaveBeenCalledTimes(3);
    expect((renderFormField as jest.Mock).mock.calls.map((c) => c[0])).toEqual([
      'count',
      'title',
      'hiddenButShown',
    ]);

    captured.proFormProps.onValuesChange({}, { title: 'B', count: 2 });
    expect(onValuesChange).toHaveBeenCalledWith({ title: 'B', count: 2 });
  });

  it('handles save success and failure for update/create', async () => {
    const onBack = jest.fn();
    renderComponent({ onBack });

    (saveModelData as jest.Mock).mockResolvedValueOnce({ code: 0 });

    await act(async () => {
      await captured.proFormProps.onFinish({ title: 'updated' });
    });

    expect(saveModelData).toHaveBeenCalledWith({
      name: 'book',
      data: { id: 1, title: 'updated' },
    });
    expect(messageApi.success).toHaveBeenCalledWith('Saved successfully');
    expect(onBack).toHaveBeenCalled();

    (saveModelData as jest.Mock).mockResolvedValueOnce({
      code: 1,
      message: 'bad',
    });

    await act(async () => {
      await captured.proFormProps.onFinish({ title: 'x' });
    });

    expect(messageApi.error).toHaveBeenCalledWith('bad');

    renderComponent({ isCreateMode: true, onBack });
    (saveModelData as jest.Mock).mockResolvedValueOnce({ code: 0 });

    await act(async () => {
      await captured.proFormProps.onFinish({ title: 'new' });
    });

    expect(saveModelData).toHaveBeenCalledWith({
      name: 'book',
      data: { title: 'new' },
    });
    expect(messageApi.success).toHaveBeenCalledWith('Created successfully');
  });

  it('handles save exception and readonly mode', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();

    renderComponent({ canEdit: false });
    (saveModelData as jest.Mock).mockRejectedValueOnce(new Error('network'));

    await act(async () => {
      await captured.proFormProps.onFinish({ title: 'x' });
    });

    expect(messageApi.error).toHaveBeenCalledWith('Save failed');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
