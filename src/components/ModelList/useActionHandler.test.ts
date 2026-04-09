import { act, renderHook } from '@testing-library/react';
import { Modal } from 'antd';
import { showDisplayModal } from './DisplayModal';
import { useActionHandler } from './useActionHandler';

jest.mock('./DisplayModal', () => ({
  showDisplayModal: jest.fn(),
}));

jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    Modal: {
      ...originalModule.Modal,
      confirm: jest.fn(),
    },
  };
});

describe('ModelList/useActionHandler', () => {
  const executeBatchAction = jest.fn();
  const executeRowAction = jest.fn();
  const actionRef = {
    current: {
      reload: jest.fn(),
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers direct row action and reload on success', async () => {
    executeRowAction.mockResolvedValue({
      success: true,
      actionConfig: { output: 'toast' },
    });

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    await act(async () => {
      result.current.triggerAction('run', { input: 'none' }, { id: 1 });
    });

    expect(executeRowAction).toHaveBeenCalledWith(
      'run',
      { id: 1 },
      expect.any(Object),
      undefined,
    );
    expect(actionRef.current.reload).toHaveBeenCalled();
  });

  it('opens string modal and confirms with extra input', async () => {
    executeRowAction.mockResolvedValue({
      success: true,
      actionConfig: { output: 'toast' },
    });

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    act(() => {
      result.current.triggerAction('say', { input: 'string' }, { id: 9 });
    });
    expect(result.current.stringModalVisible).toBe(true);

    await act(async () => {
      result.current.handleStringInputConfirm('hello');
    });

    expect(executeRowAction).toHaveBeenCalledWith(
      'say',
      { id: 9 },
      expect.any(Object),
      { input: 'hello' },
    );
    expect(result.current.stringModalVisible).toBe(false);
    expect(result.current.currentAction).toBeNull();
  });

  it('opens file modal and uploads files', async () => {
    class MockFileReader {
      result: any;
      onload: (() => void) | null = null;

      readAsDataURL(_file: File) {
        this.result = 'data:text/plain;base64,Zm9v';
        if (this.onload) this.onload();
      }
    }
    (global as any).FileReader = MockFileReader;

    executeRowAction.mockResolvedValue({
      success: true,
      actionConfig: { output: 'toast' },
    });

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    act(() => {
      result.current.triggerAction('upload', { input: 'file' }, { id: 7 });
    });
    expect(result.current.fileModalVisible).toBe(true);

    const file = new File(['foo'], 'a.txt', { type: 'text/plain' });
    await act(async () => {
      result.current.handleFileUploadConfirm([file]);
      await Promise.resolve();
    });

    expect(executeRowAction).toHaveBeenCalledWith(
      'upload',
      { id: 7 },
      expect.any(Object),
      {
        files: [
          {
            name: 'a.txt',
            size: 3,
            type: 'text/plain',
            content: 'data:text/plain;base64,Zm9v',
          },
        ],
      },
    );
    expect(result.current.fileModalVisible).toBe(false);
  });

  it('shows display modal when output is display', async () => {
    executeRowAction.mockResolvedValue({
      success: true,
      data: [{ id: 1 }],
      actionConfig: { output: 'display' },
    });

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    await act(async () => {
      result.current.triggerAction('display', { input: 'none' }, { id: 1 });
    });

    expect(showDisplayModal).toHaveBeenCalledWith([{ id: 1 }], {
      output: 'display',
    });
  });

  it('runs batch action and fallback search params', async () => {
    executeBatchAction.mockResolvedValue({
      success: true,
      actionConfig: { output: 'toast' },
    });

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    act(() => {
      result.current.updateSearchParams({ keyword: 'k1' });
    });

    await act(async () => {
      result.current.triggerAction(
        'batch',
        { input: 'none' },
        undefined,
        true,
        [{ id: 1 }],
        {},
      );
    });

    expect(executeBatchAction).toHaveBeenCalledWith(
      'batch',
      [{ id: 1 }],
      expect.any(Object),
      undefined,
      { keyword: 'k1' },
    );
  });

  it('uses confirm modal when action requires confirm', async () => {
    executeRowAction.mockResolvedValue({
      success: true,
      actionConfig: { output: 'toast' },
    });

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    act(() => {
      result.current.triggerAction(
        'confirmRun',
        { confirm: true, label: 'Run it' },
        { id: 11 },
      );
    });

    expect(Modal.confirm).toHaveBeenCalled();
    const call = (Modal.confirm as jest.Mock).mock.calls[0][0];

    await act(async () => {
      await call.onOk();
    });

    expect(executeRowAction).toHaveBeenCalledWith(
      'confirmRun',
      { id: 11 },
      expect.any(Object),
      undefined,
    );
  });

  it('handles action exception and modal cancel', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    executeRowAction.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() =>
      useActionHandler({
        modelDesc: { name: 'x' } as any,
        actionRef,
        executeBatchAction,
        executeRowAction,
      }),
    );

    await act(async () => {
      result.current.triggerAction('err', { input: 'none' }, { id: 3 });
      await Promise.resolve();
    });

    act(() => {
      result.current.triggerAction('str', { input: 'string' }, { id: 4 });
      result.current.handleModalCancel();
    });

    expect(result.current.stringModalVisible).toBe(false);
    expect(result.current.fileModalVisible).toBe(false);
    expect(result.current.currentAction).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
