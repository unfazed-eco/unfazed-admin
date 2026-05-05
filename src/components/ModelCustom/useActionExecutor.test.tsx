import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { buildSearchConditions, useActionExecutor } from './useActionExecutor';

jest.mock('@/services/api', () => ({
  executeModelAction: jest.fn(),
}));

describe('useActionExecutor', () => {
  const mockToolDesc: any = {
    fields: {},
    actions: {},
    attrs: {},
  };

  const mockFormRef = {
    current: {
      getFieldsValue: jest.fn(() => ({})),
    },
  } as any;

  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  } as any;

  let createElementSpy: jest.SpyInstance;
  let createObjectURLSpy: jest.Mock;
  let revokeObjectURLSpy: jest.Mock;
  let clickSpy: jest.SpyInstance;
  let createdAnchors: HTMLAnchorElement[];
  let originalCreateObjectURL: any;
  let originalRevokeObjectURL: any;

  beforeEach(() => {
    jest.clearAllMocks();
    createdAnchors = [];

    const originalCreateElement = document.createElement.bind(document);
    createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: any, options?: any) => {
        const element = originalCreateElement(tagName, options);
        if (String(tagName).toLowerCase() === 'a') {
          createdAnchors.push(element as HTMLAnchorElement);
        }
        return element;
      });

    originalCreateObjectURL = (window.URL as any).createObjectURL;
    originalRevokeObjectURL = (window.URL as any).revokeObjectURL;
    createObjectURLSpy = jest.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = jest.fn();
    (window.URL as any).createObjectURL = createObjectURLSpy;
    (window.URL as any).revokeObjectURL = revokeObjectURLSpy;
    clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    createElementSpy.mockRestore();
    (window.URL as any).createObjectURL = originalCreateObjectURL;
    (window.URL as any).revokeObjectURL = originalRevokeObjectURL;
    clickSpy.mockRestore();
  });

  it('builds DatetimeField action conditions as unix seconds and skips invalid range values', () => {
    const conditions = buildSearchConditions(
      {
        created_at: ['bad-start', 'bad-end'],
        updated_at: [0, '1700000100'],
        exact_at: { unix: jest.fn(() => 1700000200) },
      },
      {
        fields: {
          created_at: { field_type: 'DatetimeField' },
          updated_at: { field_type: 'DatetimeField' },
          exact_at: { field_type: 'DatetimeField' },
        },
      } as any,
    );

    expect(conditions).toEqual([
      { field: 'updated_at', gte: 0 },
      { field: 'updated_at', lte: 1700000100 },
      { field: 'exact_at', eq: 1700000200 },
    ]);
  });

  it('should download when response data contains content/filename/contentType', async () => {
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'success',
      data: {
        content: 'a,b\n1,2',
        filename: 'export.csv',
        contentType: 'text/csv',
      },
    });

    const { result } = renderHook(() =>
      useActionExecutor({
        toolName: 'tool',
        toolDesc: mockToolDesc,
        formRef: mockFormRef,
        messageApi: mockMessageApi,
      }),
    );

    await act(async () => {
      await result.current.executeAction(
        'export_config',
        {
          name: 'export_config',
          output: 'download',
          input: 'empty',
        },
        {},
      );
    });

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchors).toHaveLength(1);
    expect(createdAnchors[0].href).toBe('blob:mock-url');
    expect(createdAnchors[0].download).toBe('export.csv');
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    expect(mockMessageApi.success).toHaveBeenCalledWith(
      'File downloaded successfully',
    );
  });

  it('should download when response data contains url/filename', async () => {
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'success',
      data: {
        url: 'https://example.com/export.csv',
        filename: 'export.csv',
      },
    });

    const { result } = renderHook(() =>
      useActionExecutor({
        toolName: 'tool',
        toolDesc: mockToolDesc,
        formRef: mockFormRef,
        messageApi: mockMessageApi,
      }),
    );

    await act(async () => {
      await result.current.executeAction(
        'export_config',
        {
          name: 'export_config',
          output: 'download',
          input: 'empty',
        },
        {},
      );
    });

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(createdAnchors).toHaveLength(1);
    expect(createdAnchors[0].href).toBe('https://example.com/export.csv');
    expect(createdAnchors[0].download).toBe('export.csv');
    expect(clickSpy).toHaveBeenCalled();
    expect(mockMessageApi.success).toHaveBeenCalledWith(
      'File downloaded successfully',
    );
  });

  it('should download when response data contains nested download url', async () => {
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'success',
      data: {
        download: {
          url: 'https://example.com/report.pdf',
          filename: 'report.pdf',
        },
      },
    });

    const { result } = renderHook(() =>
      useActionExecutor({
        toolName: 'tool',
        toolDesc: mockToolDesc,
        formRef: mockFormRef,
        messageApi: mockMessageApi,
      }),
    );

    await act(async () => {
      await result.current.executeAction(
        'download_report',
        {
          name: 'download_report',
          output: 'download',
          input: 'empty',
        },
        {},
      );
    });

    expect(createObjectURLSpy).not.toHaveBeenCalled();
    expect(createdAnchors).toHaveLength(1);
    expect(createdAnchors[0].href).toBe('https://example.com/report.pdf');
    expect(createdAnchors[0].download).toBe('report.pdf');
    expect(clickSpy).toHaveBeenCalled();
    expect(mockMessageApi.success).toHaveBeenCalledWith(
      'File downloaded successfully',
    );
  });

  it('should keep legacy string download behavior', async () => {
    (api.executeModelAction as jest.Mock).mockResolvedValue({
      code: 0,
      message: 'success',
      data: 'legacy file content',
    });

    const { result } = renderHook(() =>
      useActionExecutor({
        toolName: 'tool',
        toolDesc: mockToolDesc,
        formRef: mockFormRef,
        messageApi: mockMessageApi,
      }),
    );

    await act(async () => {
      await result.current.executeAction(
        'legacy_export',
        {
          name: 'legacy_export',
          output: 'download',
          input: 'empty',
        },
        {},
      );
    });

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchors).toHaveLength(1);
    expect(createdAnchors[0].href).toBe('blob:mock-url');
    expect(createdAnchors[0].download).toContain('legacy_export_');
    expect(clickSpy).toHaveBeenCalled();
    expect(mockMessageApi.success).toHaveBeenCalledWith(
      'File downloaded successfully',
    );
  });
});
