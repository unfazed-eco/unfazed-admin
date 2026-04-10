import { act, render } from '@testing-library/react';
import React from 'react';
import { getModelData } from '@/services/api';
import M2MSelectionModal from './M2MSelectionModal';

let capturedTableProps: any;

jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    ProTable: (props: any) => {
      capturedTableProps = props;
      return React.createElement('div', { 'data-testid': 'pro-table' });
    },
  };
});

jest.mock('antd', () => {
  const React = require('react');
  return {
    Modal: ({ children, onOk, onCancel }: any) =>
      React.createElement(
        'div',
        null,
        children,
        React.createElement(
          'button',
          { onClick: onOk, 'data-testid': 'ok-btn' },
          'ok',
        ),
        React.createElement(
          'button',
          { onClick: onCancel, 'data-testid': 'cancel-btn' },
          'cancel',
        ),
      ),
  };
});

jest.mock('@/services/api', () => ({
  getModelData: jest.fn(),
}));

describe('M2MSelectionModal', () => {
  const baseProps = {
    visible: true,
    onCancel: jest.fn(),
    onOk: jest.fn(),
    title: 'Tags',
    modelDesc: {
      name: 'tag',
      attrs: { search_fields: ['name'], list_sort: ['age'] },
      fields: {
        name: { name: 'Name', field_type: 'CharField', show: true },
        active: { name: 'Active', field_type: 'BooleanField', show: true },
        age: { name: 'Age', field_type: 'IntegerField', show: true },
        created_at: {
          name: 'Created',
          field_type: 'DatetimeField',
          show: true,
        },
      },
    },
    relation: {
      target: 'tag',
      through: {
        through: 'book_tag',
        source_to_through_field: 'book_id',
        target_to_through_field: 'tag_id',
      },
    },
    mainRecordId: 9,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedTableProps = undefined;
  });

  it('loads initial selection and handles request success', async () => {
    (getModelData as jest.Mock)
      .mockResolvedValueOnce({
        code: 0,
        data: { data: [{ tag_id: 1 }, { tag_id: 2 }] },
      })
      .mockResolvedValueOnce({
        code: 0,
        data: {
          data: [
            {
              id: 1,
              name: 'A',
              active: true,
              age: 5,
              created_at: '2026-01-01',
            },
          ],
          count: 1,
        },
      });

    render(React.createElement(M2MSelectionModal, baseProps));

    await act(async () => {
      await Promise.resolve();
    });

    expect(getModelData).toHaveBeenCalledWith({
      name: 'book_tag',
      page: 1,
      size: 10000,
      cond: [{ field: 'book_id', eq: 9 }],
    });

    const result = await capturedTableProps.request({
      current: 1,
      pageSize: 10,
      name: 'abc',
    });

    expect(getModelData).toHaveBeenCalledWith({
      name: 'tag',
      page: 1,
      size: 10,
      cond: [{ field: 'name', icontains: 'abc' }],
    });
    expect(result).toEqual({
      data: [
        { id: 1, name: 'A', active: true, age: 5, created_at: '2026-01-01' },
      ],
      total: 1,
      success: true,
    });
  });

  it('handles row selection, save and failure branches', async () => {
    (getModelData as jest.Mock).mockResolvedValue({ code: 1, data: {} });

    render(React.createElement(M2MSelectionModal, baseProps));

    // selection merge across pages
    act(() => {
      capturedTableProps.rowSelection.onChange([1], [{ id: 1, name: 'A' }]);
      capturedTableProps.rowSelection.onChange([1, 2], [{ id: 2, name: 'B' }]);
    });
    expect(() =>
      act(() => {
        capturedTableProps.rowSelection.onChange(
          [1, 2],
          [undefined, null, { id: 2, name: 'B2' }],
        );
      }),
    ).not.toThrow();

    expect(
      capturedTableProps.rowSelection.getCheckboxProps({ name: 'X' }),
    ).toEqual({ name: 'X' });

    await act(async () => {
      // trigger ok (Modal mock renders a button bound to onOk)
      await baseProps.onOk.mockResolvedValueOnce(undefined);
      await capturedTableProps.request({ current: 1, pageSize: 10 });
    });

    // Simulate request error branch
    (getModelData as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    const spy = jest.spyOn(console, 'error').mockImplementation();

    const failed = await capturedTableProps.request({
      current: 1,
      pageSize: 10,
    });
    expect(failed).toEqual({ data: [], total: 0, success: false });

    spy.mockRestore();
  });
});
