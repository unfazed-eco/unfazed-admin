import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useActionHandler } from './useActionHandler';

// Mock the API
jest.mock('@/services/api', () => ({
  executeModelAction: jest.fn(),
}));

// Mock Modal
jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    Modal: {
      ...originalModule.Modal,
      info: jest.fn(),
    },
  };
});

describe('useActionHandler', () => {
  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleInlineAction', () => {
    it('should execute action with record condition', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      const action = { output: 'toast', label: 'Test Action' };
      const record = { id: 123 };

      await act(async () => {
        await result.current.handleInlineAction(
          'crown_history',
          'test_action',
          action,
          record,
        );
      });

      expect(api.executeModelAction).toHaveBeenCalledWith({
        name: 'crown_history',
        action: 'test_action',
        form_data: {},
        search_condition: [{ field: 'id', eq: 123 }],
      });
    });

    it('should execute batch action without record condition', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
        message: 'Batch success',
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      const action = { output: 'toast', label: 'Batch Action' };

      await act(async () => {
        await result.current.handleInlineAction(
          'crown_history',
          'batch_action',
          action,
          undefined,
          true,
        );
      });

      expect(api.executeModelAction).toHaveBeenCalledWith({
        name: 'crown_history',
        action: 'batch_action',
        form_data: {},
        search_condition: [],
      });
    });

    it('should handle toast output type', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
        message: 'Action completed',
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'toast' },
          { id: 1 },
        );
      });

      expect(mockMessageApi.success).toHaveBeenCalledWith('Action completed');
    });

    it('should handle display output type', async () => {
      const { Modal } = require('antd');
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
        data: [{ id: 1, property: 'Name', value: 'Test' }],
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'display', label: 'Info' },
          { id: 1 },
        );
      });

      expect(Modal.info).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Info',
          width: 800,
        }),
      );
    });

    it('should handle download output type', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
        data: {
          download: {
            url: 'https://example.com/file.pdf',
            filename: 'test.pdf',
          },
        },
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'download' },
          { id: 1 },
        );
      });

      expect(mockMessageApi.success).toHaveBeenCalledWith('Download started');
    });

    it('should handle refresh output type', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
        message: 'Refreshing',
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'refresh' },
          { id: 1 },
        );
      });

      expect(mockMessageApi.success).toHaveBeenCalledWith('Refreshing');
    });

    it('should handle action failure', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 1,
        message: 'Action failed',
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'toast' },
          { id: 1 },
        );
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith('Action failed');
    });

    it('should handle exception', async () => {
      (api.executeModelAction as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'toast' },
          { id: 1 },
        );
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith('Action failed');
      consoleSpy.mockRestore();
    });

    it('should use default success message when no message provided', async () => {
      (api.executeModelAction as jest.Mock).mockResolvedValue({
        code: 0,
      });

      const { result } = renderHook(() =>
        useActionHandler({ messageApi: mockMessageApi }),
      );

      await act(async () => {
        await result.current.handleInlineAction(
          'model',
          'action',
          { output: 'toast' },
          { id: 1 },
        );
      });

      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Action completed successfully',
      );
    });
  });
});
