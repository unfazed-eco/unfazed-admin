import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useDataFetching } from './useDataFetching';
import { buildSearchConditions, getStoredSettings } from './utils';

jest.mock('@/services/api', () => ({
  getModelDesc: jest.fn(),
  getModelData: jest.fn(),
}));

jest.mock('./utils', () => ({
  buildSearchConditions: jest.fn(),
  getStoredSettings: jest.fn(),
}));

describe('useDataFetching', () => {
  const messageApi = {
    error: jest.fn(),
  } as any;

  const setCurrentSearchParams = jest.fn();
  const onError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (getStoredSettings as jest.Mock).mockReturnValue({ pageSize: 50 });
    (buildSearchConditions as jest.Mock).mockReturnValue([
      { field: 'name', icontains: 'alice' },
    ]);
  });

  it('fetchModelDesc returns model data on success', async () => {
    (api.getModelDesc as jest.Mock).mockResolvedValue({
      code: 0,
      data: { fields: {} },
    });

    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    let data: any;
    await act(async () => {
      data = await result.current.fetchModelDesc();
    });

    expect(data).toEqual({ fields: {} });
    expect(messageApi.error).not.toHaveBeenCalled();
  });

  it('fetchModelDesc handles non-zero code', async () => {
    (api.getModelDesc as jest.Mock).mockResolvedValue({
      code: 1,
      message: 'bad desc',
    });

    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    await act(async () => {
      await result.current.fetchModelDesc();
    });

    expect(messageApi.error).toHaveBeenCalledWith('bad desc');
    expect(onError).toHaveBeenCalled();
  });

  it('fetchModelDesc handles exception', async () => {
    (api.getModelDesc as jest.Mock).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    await act(async () => {
      await result.current.fetchModelDesc();
    });

    expect(messageApi.error).toHaveBeenCalledWith(
      'Failed to fetch model description',
    );
    expect(onError).toHaveBeenCalled();
  });

  it('fetchModelData returns fallback when modelDesc missing', async () => {
    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    let data: any;
    await act(async () => {
      data = await result.current.fetchModelData({ current: 1 }, undefined);
    });

    expect(data).toEqual({ data: [], success: false, total: 0 });
    expect(api.getModelData).not.toHaveBeenCalled();
  });

  it('fetchModelData calls API and returns formatted success payload', async () => {
    (api.getModelData as jest.Mock).mockResolvedValue({
      code: 0,
      data: { data: [{ id: 1 }], count: 1 },
    });

    const modelDesc = {
      attrs: { list_per_page: 20 },
    } as any;

    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    let data: any;
    await act(async () => {
      data = await result.current.fetchModelData(
        { current: 2, q: 'alice' },
        modelDesc,
      );
    });

    expect(setCurrentSearchParams).toHaveBeenCalledWith({
      current: 2,
      q: 'alice',
    });
    expect(buildSearchConditions).toHaveBeenCalledWith(
      { current: 2, q: 'alice' },
      modelDesc,
    );
    expect(api.getModelData).toHaveBeenCalledWith({
      name: 'user',
      page: 2,
      size: 50,
      cond: [{ field: 'name', icontains: 'alice' }],
    });
    expect(data).toEqual({ data: [{ id: 1 }], success: true, total: 1 });
  });

  it('fetchModelData handles non-zero response', async () => {
    (api.getModelData as jest.Mock).mockResolvedValue({
      code: 2,
      message: 'fetch failed',
    });

    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    let data: any;
    await act(async () => {
      data = await result.current.fetchModelData({ current: 1, pageSize: 25 }, {
        attrs: { list_per_page: 20 },
      } as any);
    });

    expect(messageApi.error).toHaveBeenCalledWith('fetch failed');
    expect(onError).toHaveBeenCalled();
    expect(data).toEqual({ data: [], success: false, total: 0 });
  });

  it('fetchModelData handles exception', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    (api.getModelData as jest.Mock).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() =>
      useDataFetching({
        modelName: 'user',
        messageApi,
        setCurrentSearchParams,
        onError,
      }),
    );

    await act(async () => {
      await result.current.fetchModelData({ current: 1 }, {
        attrs: { list_per_page: 20 },
      } as any);
    });

    expect(messageApi.error).toHaveBeenCalledWith('Failed to fetch data');
    expect(onError).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
