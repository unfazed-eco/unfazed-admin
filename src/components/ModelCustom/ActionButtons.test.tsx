import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import ActionButtons from './ActionButtons';

const mockModalConfirm = jest.fn();

jest.mock('antd', () => {
  const React = require('react');
  return {
    Button: ({ children, onClick }: any) =>
      React.createElement('button', { type: 'button', onClick }, children),
    Modal: {
      confirm: (...args: any[]) => mockModalConfirm(...args),
    },
  };
});

describe('ActionButtons', () => {
  const messageApi = {
    warning: jest.fn(),
  } as any;
  const executeAction = jest.fn(async () => {});
  const validateFields = jest.fn();
  const formRef = {
    current: {
      validateFields,
    },
  } as any;

  const toolDesc = {
    actions: {
      emptyRun: {
        label: 'EmptyRun',
        input: 'empty',
      },
      confirmRun: {
        label: 'ConfirmRun',
        input: 'form',
        confirm: true,
        description: 'Need confirm',
      },
      plainRun: {
        label: 'PlainRun',
        input: 'form',
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    validateFields.mockResolvedValue({ a: 1 });
  });

  it('handles empty/form actions with and without confirm', async () => {
    render(
      <ActionButtons
        toolDesc={toolDesc}
        actionLoading={{}}
        formRef={formRef}
        messageApi={messageApi}
        executeAction={executeAction}
      />,
    );

    fireEvent.click(screen.getByText('EmptyRun'));
    expect(executeAction).toHaveBeenCalledWith(
      'emptyRun',
      toolDesc.actions.emptyRun,
      {},
    );

    fireEvent.click(screen.getByText('PlainRun'));
    await waitFor(() => {
      expect(validateFields).toHaveBeenCalled();
      expect(executeAction).toHaveBeenCalledWith(
        'plainRun',
        toolDesc.actions.plainRun,
        { a: 1 },
      );
    });

    fireEvent.click(screen.getByText('ConfirmRun'));
    await waitFor(() => {
      expect(mockModalConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'ConfirmRun',
          content: 'Need confirm',
        }),
      );
    });

    const confirmConfig = mockModalConfirm.mock.calls[0][0];
    await confirmConfig.onOk();
    expect(executeAction).toHaveBeenCalledWith(
      'confirmRun',
      toolDesc.actions.confirmRun,
      { a: 1 },
    );
  });

  it('warns when form validation fails', async () => {
    validateFields.mockRejectedValueOnce(new Error('invalid'));

    render(
      <ActionButtons
        toolDesc={toolDesc}
        actionLoading={{}}
        formRef={formRef}
        messageApi={messageApi}
        executeAction={executeAction}
      />,
    );

    fireEvent.click(screen.getByText('PlainRun'));
    await waitFor(() => {
      expect(messageApi.warning).toHaveBeenCalledWith(
        'Please fill in all required fields',
      );
    });
  });
});
