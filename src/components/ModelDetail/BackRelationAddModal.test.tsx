import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import * as api from '@/services/api';
import BackRelationAddModal from './BackRelationAddModal';

// Mock the API
jest.mock('@/services/api', () => ({
  saveModelData: jest.fn(),
}));

// Mock renderFormField
jest.mock('@/utils/formFieldRenderer', () => ({
  renderFormField: (fieldName: string, fieldConfig: any) => {
    const React = require('react');
    return React.createElement('input', {
      key: fieldName,
      'data-testid': `field-${fieldName}`,
      name: fieldName,
      placeholder: fieldConfig.name || fieldName,
    });
  },
}));

// Mock antd Modal
jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    Modal: ({ children, open, title, onCancel }: any) => {
      if (!open) return null;
      return (
        <div data-testid="modal" role="dialog">
          <div data-testid="modal-title">{title}</div>
          <button type="button" data-testid="modal-close" onClick={onCancel}>
            Close
          </button>
          {children}
        </div>
      );
    },
  };
});

// Mock ProForm
jest.mock('@ant-design/pro-components', () => {
  const React = require('react');
  return {
    ProForm: ({ children, onFinish, submitter }: any) => {
      const handleSubmit = (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const values: Record<string, any> = {};
        formData.forEach((value, key) => {
          values[key] = value;
        });
        onFinish?.(values);
      };

      return React.createElement(
        'form',
        { 'data-testid': 'pro-form', onSubmit: handleSubmit },
        children,
        React.createElement(
          'button',
          { type: 'submit', 'data-testid': 'submit-btn' },
          'Create',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'cancel-btn',
            onClick: submitter?.onReset,
          },
          'Cancel',
        ),
      );
    },
  };
});

describe('BackRelationAddModal', () => {
  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  const mockInlineDesc = {
    attrs: {
      label: 'Crown History',
    },
    fields: {
      id: {
        name: 'ID',
        field_type: 'IntegerField',
        readonly: true,
        show: true,
      },
      name: {
        name: 'Name',
        field_type: 'CharField',
        readonly: false,
        show: true,
        blank: false,
      },
      description: {
        name: 'Description',
        field_type: 'TextField',
        readonly: false,
        show: true,
        blank: true,
      },
      crown_id: {
        name: 'Crown ID',
        field_type: 'IntegerField',
        readonly: false,
        show: true,
      },
      hidden_field: {
        name: 'Hidden',
        field_type: 'CharField',
        readonly: false,
        show: false,
      },
      readonly_field: {
        name: 'Readonly',
        field_type: 'CharField',
        readonly: true,
        show: true,
      },
    },
  };

  const mockRelation = {
    relation: 'bk_fk',
    source_field: 'id',
    target_field: 'crown_id',
  };

  const mockMainRecord = {
    id: 1,
    name: 'Test Crown',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when visible', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByTestId('modal')).toBeTruthy();
    expect(screen.getByTestId('modal-title').textContent).toBe(
      'Add Crown History',
    );
  });

  it('should not render modal when not visible', () => {
    render(
      <BackRelationAddModal
        visible={false}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.queryByTestId('modal')).toBeNull();
  });

  it('should skip FK field in form', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // FK field (crown_id) should not be rendered
    expect(screen.queryByTestId('field-crown_id')).toBeNull();
  });

  it('should skip readonly fields in form', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // Readonly fields should not be rendered
    expect(screen.queryByTestId('field-readonly_field')).toBeNull();
    expect(screen.queryByTestId('field-id')).toBeNull();
  });

  it('should skip hidden fields in form', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // Hidden fields should not be rendered
    expect(screen.queryByTestId('field-hidden_field')).toBeNull();
  });

  it('should render editable fields in form', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // Editable fields should be rendered
    expect(screen.getByTestId('field-name')).toBeTruthy();
    expect(screen.getByTestId('field-description')).toBeTruthy();
  });

  it('should call onClose when cancel button clicked', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('cancel-btn'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when modal close button clicked', () => {
    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('modal-close'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should submit form with FK field added', async () => {
    (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    // Fill form
    fireEvent.change(screen.getByTestId('field-name'), {
      target: { value: 'New History' },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(api.saveModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        data: expect.objectContaining({
          crown_id: 1, // FK field should be added automatically
        }),
      });
    });
  });

  it('should show success message and call callbacks on successful submit', async () => {
    (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Created successfully',
      );
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should show error message on failed submit', async () => {
    (api.saveModelData as jest.Mock).mockResolvedValue({
      code: 1,
      message: 'Create failed',
    });

    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={mockInlineDesc}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    fireEvent.click(screen.getByTestId('submit-btn'));

    await waitFor(() => {
      expect(mockMessageApi.error).toHaveBeenCalledWith('Create failed');
    });
  });

  it('should use inline name as title when label not provided', () => {
    const descWithoutLabel = {
      ...mockInlineDesc,
      attrs: {},
    };

    render(
      <BackRelationAddModal
        visible={true}
        inlineName="crown_history"
        inlineDesc={descWithoutLabel}
        relation={mockRelation}
        mainRecord={mockMainRecord}
        messageApi={mockMessageApi}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    expect(screen.getByTestId('modal-title').textContent).toBe(
      'Add crown_history',
    );
  });
});
