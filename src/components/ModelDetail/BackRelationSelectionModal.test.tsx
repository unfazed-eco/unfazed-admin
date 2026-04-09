import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { getModelData } from '@/services/api';
import BackRelationSelectionModal from './BackRelationSelectionModal';

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
    Button: ({ children, onClick, loading }: any) =>
      React.createElement(
        'button',
        { onClick, 'data-loading': loading ? 'true' : 'false' },
        children,
      ),
    Modal: ({ children, footer, title }: any) =>
      React.createElement(
        'div',
        null,
        React.createElement('div', { 'data-testid': 'title' }, title),
        children,
        React.createElement('div', { 'data-testid': 'footer' }, footer),
      ),
  };
});

jest.mock('@ant-design/icons', () => ({
  LinkOutlined: () => null,
}));

jest.mock('@/services/api', () => ({
  getModelData: jest.fn(),
}));

describe('BackRelationSelectionModal', () => {
  const props = {
    visible: true,
    onCancel: jest.fn(),
    onLink: jest.fn(),
    title: 'Orders',
    modelName: 'order',
    modelDesc: {
      attrs: {
        search_fields: ['name'],
        list_sort: ['score'],
      },
      fields: {
        id: { name: 'ID', field_type: 'IntegerField', show: true },
        name: { name: 'Name', field_type: 'CharField', show: true },
        status: {
          name: 'Status',
          field_type: 'CharField',
          choices: [
            ['A', 'Active'],
            ['I', 'Inactive'],
          ],
          show: true,
        },
        enabled: { name: 'Enabled', field_type: 'BooleanField', show: true },
        score: { name: 'Score', field_type: 'FloatField', show: true },
        d: { name: 'Date', field_type: 'DateField', show: true },
        dt: { name: 'DateTime', field_type: 'DatetimeField', show: true },
        t: { name: 'Time', field_type: 'TimeField', show: true },
        hidden: { name: 'Hidden', field_type: 'TextField', show: false },
      },
    },
    relation: {
      target_field: 'owner_id',
    },
    mainRecordId: 99,
    isSingleSelect: false,
    loading: false,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedTableProps = undefined;
  });

  it('builds table request and columns, then handles no-change save', async () => {
    (getModelData as jest.Mock).mockResolvedValue({
      code: 0,
      data: {
        data: [
          {
            id: 1,
            owner_id: 99,
            name: 'A very very very very very very long text value',
            status: 'A',
            enabled: true,
            score: 10.5,
            d: 1700000000,
            dt: 1700000000,
            t: 1700000000,
          },
          {
            id: 2,
            owner_id: -1,
            name: 'short',
            status: 'I',
            enabled: false,
            score: 2,
          },
        ],
        count: 2,
      },
    });

    render(React.createElement(BackRelationSelectionModal, props));

    const result = await capturedTableProps.request({
      current: 1,
      pageSize: 10,
      name: 'x',
    });

    expect(getModelData).toHaveBeenCalledWith({
      name: 'order',
      page: 1,
      size: 10,
      cond: [{ field: 'name', icontains: 'x' }],
    });
    expect(result).toEqual({
      data: expect.any(Array),
      total: 2,
      success: true,
    });

    // Trigger column renderers to cover branches
    const byKey = Object.fromEntries(
      capturedTableProps.columns.map((c: any) => [c.key, c]),
    );
    expect(byKey.status.render(null, { status: 'A' })).toBe('Active');
    expect(byKey.enabled.render(null, { enabled: true })).toBe('✓');
    expect(byKey.enabled.render(null, { enabled: false })).toBe('✗');
    expect(byKey.score.render(null, { score: 1000 })).toBe('1,000');
    expect(byKey.score.render(null, { score: 'bad' })).toBe('-');
    expect(byKey.name.render(null, { name: 'x'.repeat(40) })).toContain('...');

    // no changes => onCancel
    fireEvent.click(screen.getByText('Save'));
    expect(props.onCancel).toHaveBeenCalled();
  });

  it('handles link/unlink delta and failure branches', async () => {
    (getModelData as jest.Mock)
      .mockResolvedValueOnce({ code: 1, data: {} })
      .mockRejectedValueOnce(new Error('network'));

    const spy = jest.spyOn(console, 'error').mockImplementation();

    render(React.createElement(BackRelationSelectionModal, props));

    const failed = await capturedTableProps.request({
      current: 1,
      pageSize: 10,
    });
    expect(failed).toEqual({ data: [], total: 0, success: false });

    const failed2 = await capturedTableProps.request({
      current: 1,
      pageSize: 10,
    });
    expect(failed2).toEqual({ data: [], total: 0, success: false });

    // force selection change to create link delta
    act(() => {
      capturedTableProps.rowSelection.onChange(
        [3],
        [{ id: 3, owner_id: -1, name: 'new' }],
      );
    });

    fireEvent.click(screen.getByText('Save'));
    expect(props.onLink).toHaveBeenCalledWith(
      [{ id: 3, owner_id: -1, name: 'new' }],
      [],
    );

    spy.mockRestore();
  });
});
