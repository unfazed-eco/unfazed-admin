import { act, fireEvent, render, screen } from '@testing-library/react';
import { message } from 'antd';
import { DataTableModal, FileUploadModal, StringInputModal } from './index';

let capturedUploadProps: any;
let capturedTableProps: any;

jest.mock('antd', () => {
  const React = require('react');
  const Input = ({ value, onChange, placeholder }: any) =>
    React.createElement('input', {
      value,
      onChange,
      placeholder,
      'data-testid': placeholder || 'input',
    });

  Input.TextArea = ({ value, onChange, placeholder }: any) =>
    React.createElement('textarea', {
      value,
      onChange,
      placeholder,
      'data-testid': 'text-area',
    });

  return {
    message: { warning: jest.fn() },
    Button: ({ children, onClick }: any) =>
      React.createElement('button', { onClick }, children),
    Input,
    Modal: ({ title, children, onOk, onCancel, footer }: any) =>
      React.createElement(
        'div',
        null,
        React.createElement('div', { 'data-testid': 'title' }, title),
        children,
        footer,
        React.createElement('button', { onClick: onOk }, 'ok'),
        React.createElement('button', { onClick: onCancel }, 'cancel'),
      ),
    Upload: {
      Dragger: (props: any) => {
        capturedUploadProps = props;
        return React.createElement(
          'div',
          { 'data-testid': 'uploader' },
          'upload',
        );
      },
    },
    Table: (props: any) => {
      capturedTableProps = props;
      return React.createElement('div', { 'data-testid': 'table' }, 'table');
    },
  };
});

describe('ActionModals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedUploadProps = undefined;
    capturedTableProps = undefined;
  });

  it('StringInputModal submits and clears value', () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();

    render(
      <StringInputModal
        visible={true}
        title="Input"
        description="desc"
        onOk={onOk}
        onCancel={onCancel}
      />,
    );

    fireEvent.change(screen.getByTestId('text-area'), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByText('ok'));
    expect(onOk).toHaveBeenCalledWith('hello');

    fireEvent.click(screen.getByText('cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('FileUploadModal validates file list and submits files', async () => {
    const onOk = jest.fn();
    const onCancel = jest.fn();

    render(
      <FileUploadModal
        visible={true}
        title="Upload"
        onOk={onOk}
        onCancel={onCancel}
      />,
    );

    // no files
    fireEvent.click(screen.getByText('ok'));
    expect(message.warning).toHaveBeenCalledWith(
      'Please select at least one file',
    );

    const file = new File(['a'], 'a.txt', { type: 'text/plain' });
    await act(async () => {
      capturedUploadProps.onChange({
        fileList: [{ uid: '1', originFileObj: file }, { uid: '2' }],
      });
    });

    fireEvent.click(screen.getByText('ok'));
    expect(onOk).toHaveBeenCalledWith([file]);

    await act(async () => {
      capturedUploadProps.onRemove({ uid: '1' });
    });
    fireEvent.click(screen.getByText('cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('DataTableModal auto-generates columns and supports custom columns', () => {
    const onClose = jest.fn();
    render(
      <DataTableModal
        visible={true}
        title="Data"
        data={[{ a: 1, b: 'x' }]}
        onClose={onClose}
      />,
    );

    expect(capturedTableProps.dataSource).toEqual([{ a: 1, b: 'x' }]);
    expect(capturedTableProps.columns.map((c: any) => c.dataIndex)).toEqual([
      'a',
      'b',
    ]);

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalled();

    render(
      <DataTableModal
        visible={true}
        title="Data2"
        data={[]}
        columns={[{ title: 'X', dataIndex: 'x', key: 'x' }]}
        onClose={onClose}
      />,
    );

    expect(capturedTableProps.columns).toEqual([
      { title: 'X', dataIndex: 'x', key: 'x' },
    ]);
  });
});
