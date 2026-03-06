import { render, screen } from '@testing-library/react';
import * as React from 'react';
import CommonProTable from './index';

// Mock antd components
jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    message: {
      useMessage: () => [{ success: jest.fn(), error: jest.fn() }, null],
    },
  };
});

// Mock ProTable to simplify testing
jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  const originalModule = jest.requireActual('@ant-design/pro-components');
  return {
    ...originalModule,
    ProTable: ({ columns, dataSource, ...props }: any) => {
      return React.createElement(
        'div',
        { 'data-testid': 'pro-table', ...props },
        React.createElement(
          'table',
          null,
          React.createElement(
            'thead',
            null,
            React.createElement(
              'tr',
              null,
              columns?.map((col: any, index: number) =>
                React.createElement(
                  'th',
                  {
                    key: col.key || index,
                    'data-testid': `column-${col.dataIndex}`,
                  },
                  col.title,
                  col.sorter &&
                    React.createElement(
                      'span',
                      { 'data-testid': `sorter-${col.dataIndex}` },
                      'sortable',
                    ),
                  col.filters &&
                    React.createElement(
                      'span',
                      { 'data-testid': `filter-${col.dataIndex}` },
                      'filterable',
                    ),
                  (typeof col.editable === 'function'
                    ? col.editable?.()
                    : col.editable) &&
                    React.createElement(
                      'span',
                      { 'data-testid': `editable-${col.dataIndex}` },
                      'editable',
                    ),
                ),
              ),
            ),
          ),
          React.createElement(
            'tbody',
            null,
            dataSource?.map((row: any, rowIndex: number) =>
              React.createElement(
                'tr',
                { key: row.id || rowIndex },
                columns?.map((col: any, colIndex: number) =>
                  React.createElement(
                    'td',
                    { key: col.key || colIndex },
                    col.render
                      ? col.render(row[col.dataIndex], row)
                      : row[col.dataIndex],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    },
  };
});

describe('CommonProTable', () => {
  const mockModelDesc: API.AdminSerializeModel = {
    fields: {
      id: {
        name: 'ID',
        field_type: 'IntegerField',
        readonly: true,
        show: true,
        help_text: 'Primary key',
      },
      name: {
        name: 'Name',
        field_type: 'CharField',
        readonly: false,
        show: true,
        help_text: 'Item name',
      },
      status: {
        name: 'Status',
        field_type: 'CharField',
        readonly: false,
        show: true,
        help_text: 'Item status',
        choices: [
          ['active', 'Active'],
          ['inactive', 'Inactive'],
        ],
      },
      created_at: {
        name: 'Created At',
        field_type: 'DatetimeField',
        readonly: true,
        show: true,
        help_text: 'Creation time',
      },
      hidden_field: {
        name: 'Hidden',
        field_type: 'CharField',
        readonly: false,
        show: false,
        help_text: 'Hidden field',
      },
    },
    actions: {},
    attrs: {
      can_edit: true,
      can_delete: true,
      can_add: true,
    },
  };

  const mockData = [
    { id: 1, name: 'Item A', status: 'active', created_at: '2024-01-01' },
    { id: 2, name: 'Item B', status: 'inactive', created_at: '2024-01-02' },
  ];

  describe('list_order', () => {
    it('should order columns according to list_order', () => {
      const modelDescWithOrder = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          list_order: ['name', 'status', 'id', 'created_at'],
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescWithOrder}
          modelName="test"
          data={mockData}
        />,
      );

      const headers = screen.getAllByRole('columnheader');
      // First visible columns should follow list_order
      expect(headers[0].textContent).toContain('Name');
      expect(headers[1].textContent).toContain('Status');
      expect(headers[2].textContent).toContain('ID');
      expect(headers[3].textContent).toContain('Created At');
    });

    it('should put fields not in list_order at the end', () => {
      const modelDescWithPartialOrder = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          list_order: ['status'], // Only status is ordered
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescWithPartialOrder}
          modelName="test"
          data={mockData}
        />,
      );

      const headers = screen.getAllByRole('columnheader');
      // Status should be first
      expect(headers[0].textContent).toContain('Status');
    });
  });

  describe('list_sort', () => {
    it('should make fields in list_sort sortable', () => {
      const modelDescWithSort = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          list_sort: ['name', 'created_at'],
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescWithSort}
          modelName="test"
          data={mockData}
        />,
      );

      // Fields in list_sort should have sorter
      expect(screen.getByTestId('sorter-name')).toBeTruthy();
      expect(screen.getByTestId('sorter-created_at')).toBeTruthy();

      // Fields not in list_sort should not have sorter
      expect(screen.queryByTestId('sorter-id')).toBeNull();
      expect(screen.queryByTestId('sorter-status')).toBeNull();
    });

    it('should not have sortable columns when list_sort is empty', () => {
      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
        />,
      );

      expect(screen.queryByTestId('sorter-name')).toBeNull();
      expect(screen.queryByTestId('sorter-id')).toBeNull();
    });
  });

  describe('list_editable', () => {
    it('should only make fields in list_editable editable (except id)', () => {
      const modelDescWithEditable = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          can_edit: true,
          list_editable: ['name', 'status'],
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescWithEditable}
          modelName="test"
          data={mockData}
        />,
      );

      // Only fields in list_editable should be editable
      expect(screen.getByTestId('editable-name')).toBeTruthy();
      expect(screen.getByTestId('editable-status')).toBeTruthy();

      // id field should not be editable even if in list_editable
      expect(screen.queryByTestId('editable-id')).toBeNull();
      // readonly fields should not be editable even when in list_editable
      expect(screen.queryByTestId('editable-created_at')).toBeNull();
    });

    it('should not have editable columns when can_edit is false', () => {
      const modelDescNoEdit = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          can_edit: false,
          list_editable: ['name', 'status'],
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescNoEdit}
          modelName="test"
          data={mockData}
        />,
      );

      expect(screen.queryByTestId('editable-name')).toBeNull();
      expect(screen.queryByTestId('editable-status')).toBeNull();
    });

    it('should not have editable columns when list_editable is not provided', () => {
      const modelDescNoListEditable = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          can_edit: true,
          // No list_editable
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescNoListEditable}
          modelName="test"
          data={mockData}
        />,
      );

      expect(screen.queryByTestId('editable-name')).toBeNull();
    });

    it('should not make readonly fields or id editable when list_editable is defined', () => {
      const modelDescWithReadonly = {
        ...mockModelDesc,
        attrs: {
          ...mockModelDesc.attrs,
          can_edit: true,
          list_editable: ['id', 'name', 'created_at'], // created_at is readonly
        },
      };

      render(
        <CommonProTable
          modelDesc={modelDescWithReadonly}
          modelName="test"
          data={mockData}
        />,
      );

      // name is not readonly and not id, should be editable
      expect(screen.getByTestId('editable-name')).toBeTruthy();

      // id should NOT be editable
      expect(screen.queryByTestId('editable-id')).toBeNull();
      // created_at is readonly, should NOT be editable
      expect(screen.queryByTestId('editable-created_at')).toBeNull();
    });
  });

  describe('Detail button', () => {
    it('should always show Detail button', () => {
      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
          onDetail={jest.fn()}
        />,
      );

      // Detail button should always be present (Actions column should exist)
      expect(screen.getByTestId('column-option')).toBeTruthy();
    });
  });

  describe('hidden fields', () => {
    it('should not show fields with show: false', () => {
      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
        />,
      );

      // hidden_field has show: false, should not appear
      expect(screen.queryByTestId('column-hidden_field')).toBeNull();
    });
  });
});
