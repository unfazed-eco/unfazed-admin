import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useM2MOperations } from './useM2MOperations';

// Mock the API
jest.mock('@/services/api', () => ({
  saveModelData: jest.fn(),
  deleteModelData: jest.fn(),
  getModelData: jest.fn(),
}));

describe('useM2MOperations', () => {
  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };

  const mockMainRecord = {
    id: 1,
    name: 'Test Crown',
  };

  const mockInlineDesc = {
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleM2MAdd', () => {
    it('should add M2M relations one by one', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      const targetRecords = [{ id: 10 }, { id: 20 }];

      await act(async () => {
        await result.current.handleM2MAdd(
          'tags',
          mockInlineDesc,
          targetRecords,
        );
      });

      expect(api.saveModelData).toHaveBeenCalledTimes(2);
      expect(api.saveModelData).toHaveBeenCalledWith({
        name: 'crown_tags',
        data: { crown_id: 1, tag_id: 10 },
      });
      expect(api.saveModelData).toHaveBeenCalledWith({
        name: 'crown_tags',
        data: { crown_id: 1, tag_id: 20 },
      });
      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Successfully added 2 relation(s)',
      );
    });

    it('should handle add failure', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 1 });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MAdd('tags', mockInlineDesc, [{ id: 10 }]);
      });

      expect(mockMessageApi.error).toHaveBeenCalled();
    });

    it('should do nothing when relation is not m2m', async () => {
      const nonM2MInlineDesc = {
        relation: {
          relation: 'fk',
        },
      };

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MAdd('other', nonM2MInlineDesc, [
          { id: 10 },
        ]);
      });

      expect(api.saveModelData).not.toHaveBeenCalled();
    });

    it('should support primitive IDs as input', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MAdd('tags', mockInlineDesc, [10, 20, 30]);
      });

      expect(api.saveModelData).toHaveBeenCalledTimes(3);
      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Successfully added 3 relation(s)',
      );
    });
  });

  describe('handleM2MRemove', () => {
    it('should remove M2M relations one by one', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: { data: [{ id: 100, crown_id: 1, tag_id: 10 }] },
      });
      (api.deleteModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MRemove('tags', mockInlineDesc, [
          { id: 10 },
        ]);
      });

      expect(api.getModelData).toHaveBeenCalledWith({
        name: 'crown_tags',
        page: 1,
        size: 1,
        cond: [
          { field: 'crown_id', eq: 1 },
          { field: 'tag_id', eq: 10 },
        ],
      });
      expect(api.deleteModelData).toHaveBeenCalledWith({
        name: 'crown_tags',
        data: { id: 100 },
      });
      expect(mockMessageApi.success).toHaveBeenCalledWith('Relation removed');
    });

    it('should support single record as input (not array)', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: { data: [{ id: 100, crown_id: 1, tag_id: 10 }] },
      });
      (api.deleteModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MRemove('tags', mockInlineDesc, {
          id: 10,
        });
      });

      expect(api.deleteModelData).toHaveBeenCalled();
      expect(mockMessageApi.success).toHaveBeenCalledWith('Relation removed');
    });

    it('should show error when through record not found', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: { data: [] },
      });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MRemove('tags', mockInlineDesc, [
          { id: 10 },
        ]);
      });

      expect(mockMessageApi.error).toHaveBeenCalled();
    });

    it('should handle multiple removals with correct message', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: { data: [{ id: 100 }] },
      });
      (api.deleteModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useM2MOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleM2MRemove('tags', mockInlineDesc, [
          { id: 10 },
          { id: 20 },
        ]);
      });

      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Successfully removed 2 relation(s)',
      );
    });
  });
});
