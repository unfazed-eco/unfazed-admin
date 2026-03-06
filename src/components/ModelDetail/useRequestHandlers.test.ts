import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useRequestHandlers } from './useRequestHandlers';

// Mock the API
jest.mock('@/services/api', () => ({
  getModelData: jest.fn(),
}));

describe('useRequestHandlers', () => {
  const mockRecord = {
    id: 1,
    name: 'Test Crown',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBackRelationRequestHandler', () => {
    it('should create handler for back relation', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: {
          data: [{ id: 1, name: 'History 1', crown_id: 1 }],
          count: 1,
        },
      });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const inlineDesc = {
        relation: {
          relation: 'bk_fk',
          source_field: 'id',
          target_field: 'crown_id',
        },
        attrs: {
          search_fields: ['name'],
          list_per_page: 10,
        },
      };

      const handler = result.current.createBackRelationRequestHandler(
        'crown_history',
        inlineDesc,
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(api.getModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        page: 1,
        size: 10,
        cond: [{ field: 'crown_id', eq: 1 }],
      });

      expect(response).toEqual({
        data: [{ id: 1, name: 'History 1', crown_id: 1 }],
        total: 1,
        success: true,
      });
    });

    it('should add search conditions when provided', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: { data: [], count: 0 },
      });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const inlineDesc = {
        relation: {
          relation: 'bk_fk',
          source_field: 'id',
          target_field: 'crown_id',
        },
        attrs: {
          search_fields: ['name', 'description'],
        },
      };

      const handler = result.current.createBackRelationRequestHandler(
        'crown_history',
        inlineDesc,
      );

      await act(async () => {
        await handler({
          current: 1,
          pageSize: 10,
          name: 'test',
          description: 'desc',
        });
      });

      expect(api.getModelData).toHaveBeenCalledWith(
        expect.objectContaining({
          cond: expect.arrayContaining([
            { field: 'crown_id', eq: 1 },
            { field: 'name', icontains: 'test' },
            { field: 'description', icontains: 'desc' },
          ]),
        }),
      );
    });

    it('should cache handler and return same instance', () => {
      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const inlineDesc = {
        relation: {
          relation: 'bk_fk',
          source_field: 'id',
          target_field: 'crown_id',
        },
      };

      const handler1 = result.current.createBackRelationRequestHandler(
        'crown_history',
        inlineDesc,
      );
      const handler2 = result.current.createBackRelationRequestHandler(
        'crown_history',
        inlineDesc,
      );

      expect(handler1).toBe(handler2);
    });

    it('should return failure response on API error', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({ code: 1 });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const handler = result.current.createBackRelationRequestHandler(
        'crown_history',
        {
          relation: {
            relation: 'bk_fk',
            source_field: 'id',
            target_field: 'crown_id',
          },
        },
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(response).toEqual({ data: [], total: 0, success: false });
    });

    it('should handle exception gracefully', async () => {
      (api.getModelData as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const handler = result.current.createBackRelationRequestHandler(
        'crown_history',
        {
          relation: {
            relation: 'bk_fk',
            source_field: 'id',
            target_field: 'crown_id',
          },
        },
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(response).toEqual({ data: [], total: 0, success: false });
      consoleSpy.mockRestore();
    });
  });

  describe('createForwardRelationRequestHandler', () => {
    it('should create handler for forward relation (fk/o2o)', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: {
          data: [{ id: 10, name: 'Related Item' }],
          count: 1,
        },
      });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: { id: 1, related_id: 10 } }),
      );

      const inlineDesc = {
        relation: {
          relation: 'fk',
          source_field: 'id',
          target_field: 'related_id',
        },
        attrs: {},
      };

      const handler = result.current.createForwardRelationRequestHandler(
        'related_model',
        inlineDesc,
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(api.getModelData).toHaveBeenCalledWith({
        name: 'related_model',
        page: 1,
        size: 10,
        cond: [{ field: 'id', eq: 10 }],
      });

      expect(response.success).toBe(true);
    });

    it('should cache handler', () => {
      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const inlineDesc = {
        relation: { relation: 'fk', source_field: 'id', target_field: 'id' },
      };

      const handler1 = result.current.createForwardRelationRequestHandler(
        'model',
        inlineDesc,
      );
      const handler2 = result.current.createForwardRelationRequestHandler(
        'model',
        inlineDesc,
      );

      expect(handler1).toBe(handler2);
    });
  });

  describe('createM2MRequestHandler', () => {
    const m2mInlineDesc = {
      relation: {
        relation: 'm2m',
        target: 'tags',
        through: {
          through: 'crown_tags',
          source_field: 'id',
          target_field: 'id',
          source_to_through_field: 'crown_id',
          target_to_through_field: 'tag_id',
        },
      },
      attrs: {
        list_per_page: 10,
      },
    };

    it('should create handler for M2M relation with pagination', async () => {
      // First call: through table
      (api.getModelData as jest.Mock)
        .mockResolvedValueOnce({
          code: 0,
          data: {
            data: [{ id: 1, crown_id: 1, tag_id: 10 }],
            count: 1,
          },
        })
        // Second call: target table
        .mockResolvedValueOnce({
          code: 0,
          data: {
            data: [{ id: 10, name: 'Tag 1' }],
            count: 1,
          },
        });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const handler = result.current.createM2MRequestHandler(
        'crown_tags',
        m2mInlineDesc,
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      // Should query through table first
      expect(api.getModelData).toHaveBeenNthCalledWith(1, {
        name: 'crown_tags',
        page: 1,
        size: 10,
        cond: [{ field: 'crown_id', eq: 1 }],
      });

      // Then query target table with linked IDs
      expect(api.getModelData).toHaveBeenNthCalledWith(2, {
        name: 'tags',
        page: 1,
        size: 1,
        cond: [{ field: 'id', in_: [10] }],
      });

      expect(response).toEqual({
        data: [{ id: 10, name: 'Tag 1' }],
        total: 1,
        success: true,
      });
    });

    it('should return empty data when no through records', async () => {
      (api.getModelData as jest.Mock).mockResolvedValueOnce({
        code: 0,
        data: { data: [], count: 0 },
      });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const handler = result.current.createM2MRequestHandler(
        'crown_tags',
        m2mInlineDesc,
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(response).toEqual({
        data: [],
        total: 0,
        success: true,
      });

      // Should only query through table, not target table
      expect(api.getModelData).toHaveBeenCalledTimes(1);
    });

    it('should return failure when no through info', async () => {
      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const noThroughDesc = {
        relation: {
          relation: 'm2m',
          target: 'tags',
          // No through info
        },
      };

      const handler = result.current.createM2MRequestHandler(
        'tags',
        noThroughDesc,
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(response).toEqual({ data: [], total: 0, success: false });
    });

    it('should cache handler', () => {
      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const handler1 = result.current.createM2MRequestHandler(
        'crown_tags',
        m2mInlineDesc,
      );
      const handler2 = result.current.createM2MRequestHandler(
        'crown_tags',
        m2mInlineDesc,
      );

      expect(handler1).toBe(handler2);
    });

    it('should handle through table query failure', async () => {
      (api.getModelData as jest.Mock).mockResolvedValueOnce({ code: 1 });

      const { result } = renderHook(() =>
        useRequestHandlers({ record: mockRecord }),
      );

      const handler = result.current.createM2MRequestHandler(
        'crown_tags',
        m2mInlineDesc,
      );

      let response: any;
      await act(async () => {
        response = await handler({ current: 1, pageSize: 10 });
      });

      expect(response).toEqual({ data: [], total: 0, success: false });
    });
  });
});
