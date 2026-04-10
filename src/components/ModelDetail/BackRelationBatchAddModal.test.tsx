import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import BackRelationBatchAddModal from './BackRelationBatchAddModal';

jest.mock('antd', () => {
  const _React = require('react');
  return {
    Button: ({ children, onClick, ...rest }: any) => (
      <button type="button" onClick={onClick} {...rest}>
        {children}
      </button>
    ),
    Input: {
      TextArea: ({ value, onChange, placeholder }: any) => (
        <textarea
          data-testid="batch-textarea"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
      ),
    },
    Modal: ({ open, title, children, onCancel }: any) => {
      if (!open) return null;
      return (
        <div data-testid="batch-modal">
          <div data-testid="batch-modal-title">{title}</div>
          <button type="button" onClick={onCancel}>
            Close
          </button>
          {children}
        </div>
      );
    },
    Table: ({ dataSource }: any) => (
      <div data-testid="preview-table">{`rows:${dataSource?.length || 0}`}</div>
    ),
  };
});

describe('BackRelationBatchAddModal', () => {
  const inlineDesc = {
    attrs: {
      label: 'Crown History',
      list_order: ['event_date', 'event_type', 'description', 'level_type'],
    },
    fields: {
      id: {
        name: 'ID',
        field_type: 'IntegerField',
        readonly: true,
        show: true,
        blank: false,
      },
      crown_id: {
        name: 'Crown ID',
        field_type: 'IntegerField',
        readonly: false,
        show: false,
        blank: false,
      },
      event_type: {
        name: 'Event Type',
        field_type: 'CharField',
        readonly: false,
        show: true,
        blank: false,
        choices: [
          ['created', 'Created'],
          ['inspection', 'Inspection'],
        ],
      },
      description: {
        name: 'Description',
        field_type: 'TextField',
        readonly: false,
        show: true,
        blank: true,
        choices: [],
      },
      event_date: {
        name: 'Event Date',
        field_type: 'DatetimeField',
        readonly: false,
        show: true,
        blank: false,
        choices: [],
      },
      level_type: {
        name: 'Level',
        field_type: 'IntegerField',
        readonly: false,
        show: true,
        blank: false,
        choices: [
          [1, 'One'],
          [2, 'Two'],
        ],
      },
    },
  };

  const relation = {
    relation: 'bk_fk',
    source_field: 'id',
    target_field: 'crown_id',
  };

  const messageApi = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  };

  const baseProps = {
    visible: true,
    inlineName: 'crown_history',
    inlineDesc,
    relation,
    messageApi,
    onPreview: jest.fn(),
    onBatchSave: jest.fn(async () => {}),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse pasted rows by position and call preview callback', () => {
    const onPreview = jest.fn();
    render(<BackRelationBatchAddModal {...baseProps} onPreview={onPreview} />);

    fireEvent.change(screen.getByTestId('batch-textarea'), {
      target: {
        value:
          '2026-04-08T09:00:00Z\tCreated\tInitial record\t1\n2026-04-09T11:30:00Z\tinspection\tRoutine check\t2',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(onPreview).toHaveBeenCalled();
    expect(onPreview).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          event_date: '2026-04-08T09:00:00Z',
          event_type: 'created',
          description: 'Initial record',
          level_type: 1,
        }),
      ]),
    );
    expect(messageApi.success).toHaveBeenCalledWith('Preview loaded: 2 row(s)');
  });

  it('should hide textarea in preview mode and show it after close preview', () => {
    render(<BackRelationBatchAddModal {...baseProps} />);

    fireEvent.change(screen.getByTestId('batch-textarea'), {
      target: {
        value: '2026-04-08T09:00:00Z\tcreated\tInitial record\t1',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(screen.queryByTestId('batch-textarea')).toBeNull();
    expect(screen.getByRole('button', { name: 'Close Preview' })).toBeTruthy();
    expect(screen.getByTestId('preview-table').textContent).toBe('rows:1');

    fireEvent.click(screen.getByRole('button', { name: 'Close Preview' }));
    expect(screen.getByTestId('batch-textarea')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeTruthy();
  });

  it('should report type validation errors and block preview/save', async () => {
    const onPreview = jest.fn();
    const onBatchSave = jest.fn(async () => {});
    render(
      <BackRelationBatchAddModal
        {...baseProps}
        onPreview={onPreview}
        onBatchSave={onBatchSave}
      />,
    );

    fireEvent.change(screen.getByTestId('batch-textarea'), {
      target: {
        value: '2026-04-08T09:00:00Z\tcreated\tInvalid level\tabc',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(messageApi.error).toHaveBeenCalledWith(
      expect.stringContaining('is not in allowed choices'),
    );
    expect(onPreview).toHaveBeenCalledWith([]);
    expect(onPreview).not.toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          description: 'Invalid level',
        }),
      ]),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Batch Save' }));
    await waitFor(() => {
      expect(onBatchSave).not.toHaveBeenCalled();
    });
  });

  it('should report row shape errors when column count mismatches', () => {
    render(<BackRelationBatchAddModal {...baseProps} />);

    fireEvent.change(screen.getByTestId('batch-textarea'), {
      target: {
        value: '2026-04-08T09:00:00Z\tcreated\tOnly three columns',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(messageApi.error).toHaveBeenCalledWith(
      expect.stringContaining('Cannot handle line'),
    );
  });

  it('should call batch save callback with parsed rows', async () => {
    const onBatchSave = jest.fn(async () => {});
    render(
      <BackRelationBatchAddModal {...baseProps} onBatchSave={onBatchSave} />,
    );

    fireEvent.change(screen.getByTestId('batch-textarea'), {
      target: {
        value: '2026-04-08T09:00:00Z\tcreated\tSave this row\t1',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Batch Save' }));

    await waitFor(() => {
      expect(onBatchSave).toHaveBeenCalledTimes(1);
    });
    expect(onBatchSave).toHaveBeenCalledWith([
      expect.objectContaining({
        event_date: '2026-04-08T09:00:00Z',
        event_type: 'created',
        description: 'Save this row',
        level_type: 1,
      }),
    ]);
  });
});
