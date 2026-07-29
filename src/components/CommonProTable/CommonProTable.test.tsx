import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import CommonProTable from './index';

const mockSortableHeaderClick = jest.fn();

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
    ProTable: ({
      columns,
      dataSource,
      toolBarRender,
      components,
      scroll,
      tableLayout,
    }: any) => {
      const toolbar = toolBarRender?.();
      const HeaderCell = components?.header?.cell || 'th';
      return React.createElement(
        'div',
        {
          'data-testid': 'pro-table',
          'data-scroll-x': scroll?.x,
          'data-table-layout': tableLayout,
        },
        toolbar
          ? React.createElement(
              'div',
              { 'data-testid': 'toolbar' },
              ...(Array.isArray(toolbar) ? toolbar : [toolbar]),
            )
          : null,
        React.createElement(
          'table',
          null,
          React.createElement(
            'thead',
            null,
            React.createElement(
              'tr',
              null,
              columns?.map((col: any, index: number) => {
                const headerCellProps = col.onHeaderCell?.(col) || {};
                return React.createElement(
                  HeaderCell,
                  {
                    ...headerCellProps,
                    key: col.key || index,
                    'data-testid': `column-${col.dataIndex}`,
                    onClick: col.sorter ? mockSortableHeaderClick : undefined,
                    style: { width: col.width },
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
                );
              }),
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

  beforeEach(() => {
    window.localStorage.clear();
  });

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

  describe('column resize', () => {
    it('should render full text content so resized columns can reveal it', () => {
      const longName =
        'Antique Crown Antique Crown Antique Crown Antique Crown Antique Crown';

      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={[
            {
              id: 9,
              name: longName,
              status: 'active',
              created_at: '2024-01-01',
            },
          ]}
        />,
      );

      expect(screen.getByText(longName)).toBeTruthy();
      expect(screen.queryByText('Antique Crown Antiqu...')).toBeNull();
      expect(screen.getByTestId('column-name').style.width).toBe('150px');
      expect(
        screen.getByTestId('pro-table').getAttribute('data-table-layout'),
      ).toBe('fixed');
      expect(
        Number(screen.getByTestId('pro-table').getAttribute('data-scroll-x')),
      ).toBeGreaterThan(0);
    });

    it('should resize data columns and persist widths without resizing actions', () => {
      const { container } = render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
          onDetail={jest.fn()}
        />,
      );

      const nameHeader = screen.getByTestId('column-name');
      const resizeHandle = nameHeader.querySelector(
        '.common-pro-table-column-resize-handle',
      );
      expect(resizeHandle).toBeTruthy();

      fireEvent.mouseDown(resizeHandle as Element, { clientX: 200 });
      fireEvent.mouseMove(document, { clientX: 260 });
      fireEvent.mouseUp(document);

      expect(screen.getByTestId('column-name').style.width).toBe('210px');
      expect(
        JSON.parse(
          window.localStorage.getItem(
            'unfazed-admin:table-column-widths:test',
          ) || '{}',
        ).name,
      ).toBe(210);

      expect(
        container
          .querySelector('[data-testid="column-option"]')
          ?.querySelector('.common-pro-table-column-resize-handle'),
      ).toBeNull();
    });

    it('should not bubble resize handle clicks to sortable header cells', () => {
      render(
        <CommonProTable
          modelDesc={{
            ...mockModelDesc,
            attrs: {
              ...mockModelDesc.attrs,
              list_sort: ['name'],
            },
          }}
          modelName="test"
          data={mockData}
        />,
      );

      const nameHeader = screen.getByTestId('column-name');
      const resizeHandle = nameHeader.querySelector(
        '.common-pro-table-column-resize-handle',
      );

      fireEvent.mouseDown(resizeHandle as Element, { clientX: 200 });
      fireEvent.mouseMove(document, { clientX: 240 });
      fireEvent.mouseUp(resizeHandle as Element);
      fireEvent.click(resizeHandle as Element);

      expect(mockSortableHeaderClick).not.toHaveBeenCalled();
    });

    it('should release resizing when mouseup happens on the resize handle', () => {
      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
        />,
      );

      const nameHeader = screen.getByTestId('column-name');
      const resizeHandle = nameHeader.querySelector(
        '.common-pro-table-column-resize-handle',
      );

      fireEvent.mouseDown(resizeHandle as Element, { clientX: 200 });
      fireEvent.mouseUp(resizeHandle as Element, { clientX: 200 });
      fireEvent.mouseMove(document, { clientX: 300 });

      expect(screen.getByTestId('column-name').style.width).toBe('150px');
      expect(
        JSON.parse(
          window.localStorage.getItem(
            'unfazed-admin:table-column-widths:test',
          ) || '{}',
        ).name,
      ).toBeUndefined();
    });

    it('should resize from the rendered header width when content already stretched the column', () => {
      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={[
            {
              id: 9,
              name: 'Antique Crown Antique Crown Antique Crown Antique Crown Antique Crown',
              status: 'active',
              created_at: '2024-01-01',
            },
          ]}
        />,
      );

      const nameHeader = screen.getByTestId('column-name');
      nameHeader.getBoundingClientRect = jest.fn(
        () =>
          ({
            width: 360,
            height: 40,
            top: 0,
            right: 360,
            bottom: 40,
            left: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect,
      );

      const resizeHandle = nameHeader.querySelector(
        '.common-pro-table-column-resize-handle',
      );

      fireEvent.mouseDown(resizeHandle as Element, { clientX: 200 });
      fireEvent.mouseMove(document, { clientX: 260 });
      fireEvent.mouseUp(document);

      expect(screen.getByTestId('column-name').style.width).toBe('420px');
      expect(
        JSON.parse(
          window.localStorage.getItem(
            'unfazed-admin:table-column-widths:test',
          ) || '{}',
        ).name,
      ).toBe(420);
    });

    it('should shrink from the rendered header width', () => {
      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
        />,
      );

      const nameHeader = screen.getByTestId('column-name');
      nameHeader.getBoundingClientRect = jest.fn(
        () =>
          ({
            width: 300,
            height: 40,
            top: 0,
            right: 300,
            bottom: 40,
            left: 0,
            x: 0,
            y: 0,
            toJSON: () => ({}),
          }) as DOMRect,
      );

      const resizeHandle = nameHeader.querySelector(
        '.common-pro-table-column-resize-handle',
      );

      fireEvent.mouseDown(resizeHandle as Element, { clientX: 260 });
      fireEvent.mouseMove(document, { clientX: 180 });
      fireEvent.mouseUp(document);

      expect(screen.getByTestId('column-name').style.width).toBe('220px');
      expect(
        JSON.parse(
          window.localStorage.getItem(
            'unfazed-admin:table-column-widths:test',
          ) || '{}',
        ).name,
      ).toBe(220);
    });

    it('should restore stored data column widths by model name', () => {
      window.localStorage.setItem(
        'unfazed-admin:table-column-widths:test',
        JSON.stringify({ name: 240 }),
      );

      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
        />,
      );

      expect(screen.getByTestId('column-name').style.width).toBe('240px');
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

  describe('batch add button', () => {
    it('should render Batch Add button and trigger callback when clicked', () => {
      const onBatchAddRelated = jest.fn();

      render(
        <CommonProTable
          modelDesc={mockModelDesc}
          modelName="test"
          data={mockData}
          onAddRelated={jest.fn()}
          onBatchAddRelated={onBatchAddRelated}
        />,
      );

      const batchAddButton = screen.getByRole('button', {
        name: /Batch Add/,
      });
      expect(batchAddButton).toBeTruthy();

      batchAddButton.click();
      expect(onBatchAddRelated).toHaveBeenCalledTimes(1);
    });
  });
});
