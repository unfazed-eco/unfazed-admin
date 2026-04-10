import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useActionHandlers } from './useActionHandlers';
import { buildSearchConditions } from './utils';

jest.mock('@/services/api', () => ({
  executeModelAction: jest.fn(),
  saveModelData: jest.fn(),
}));

jest.mock('./utils', () => ({
  buildSearchConditions: jest.fn(),
}));

describe('useActionHandlers', () => {
  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
  } as any;

  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const mockModelDesc = {
    actions: {
      batch_export: {
        name: 'batch_export',
        label: 'Batch Export',
        output: 'toast',
        batch: true,
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should flatten batch search params into input_data (without search_params wrapper)', async () => {
    (buildSearchConditions as jest.Mock).mockReturnValue([
      { field: 'mission_id', eq: 9 },
      { field: 'mission_name', icontains: 'abc' },
    ]);
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'ok',
      data: {},
    });

    const { result } = renderHook(() =>
      useActionHandlers({
        modelName: 'SettingsAdmin',
        messageApi: mockMessageApi,
        currentSearchParams: {},
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      }),
    );

    await act(async () => {
      await result.current.executeBatchAction(
        'batch_export',
        [],
        mockModelDesc,
        undefined,
        {
          current: 1,
          pageSize: 20,
          _timestamp: 123,
          mission_id: 9,
          mission_name: 'abc',
          empty_field: '',
        },
      );
    });

    expect(api.executeModelAction).toHaveBeenCalledWith({
      name: 'SettingsAdmin',
      action: 'batch_export',
      search_condition: [
        { field: 'mission_id', eq: 9 },
        { field: 'mission_name', icontains: 'abc' },
      ],
      input_data: {
        mission_id: 9,
        mission_name: 'abc',
      },
    });
  });

  it('should merge extra data into flattened batch input_data', async () => {
    (buildSearchConditions as jest.Mock).mockReturnValue([
      { field: 'mission_id', eq: 9 },
    ]);
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'ok',
      data: {},
    });

    const { result } = renderHook(() =>
      useActionHandlers({
        modelName: 'SettingsAdmin',
        messageApi: mockMessageApi,
        currentSearchParams: {},
      }),
    );

    await act(async () => {
      await result.current.executeBatchAction(
        'batch_export',
        [],
        mockModelDesc,
        { input: 'raw' },
        {
          mission_id: 9,
        },
      );
    });

    expect(api.executeModelAction).toHaveBeenCalledWith({
      name: 'SettingsAdmin',
      action: 'batch_export',
      search_condition: [{ field: 'mission_id', eq: 9 }],
      form_data: { input: 'raw' },
      input_data: {
        mission_id: 9,
        input: 'raw',
      },
    });
  });

  it('should fallback to currentSearchParams when provided searchParams has no valid value', async () => {
    (buildSearchConditions as jest.Mock).mockReturnValue([
      { field: 'mission_id', eq: 7 },
    ]);
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'ok',
      data: {},
    });

    const currentSearchParams = {
      mission_id: 7,
      mission_name: 'fallback',
    };

    const { result } = renderHook(() =>
      useActionHandlers({
        modelName: 'SettingsAdmin',
        messageApi: mockMessageApi,
        currentSearchParams,
      }),
    );

    await act(async () => {
      await result.current.executeBatchAction(
        'batch_export',
        [],
        mockModelDesc,
        undefined,
        {},
      );
    });

    expect(buildSearchConditions).toHaveBeenCalledWith(
      currentSearchParams,
      mockModelDesc,
    );
    expect(api.executeModelAction).toHaveBeenCalledWith({
      name: 'SettingsAdmin',
      action: 'batch_export',
      search_condition: [{ field: 'mission_id', eq: 7 }],
      input_data: currentSearchParams,
    });
  });
});
