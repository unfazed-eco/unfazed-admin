import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useCrudOperations } from './useCrudOperations';

// Mock the API
jest.mock('@/services/api', () => ({
  saveModelData: jest.fn(),
  deleteModelData: jest.fn(),
  getModelData: jest.fn(),
}));

describe('useCrudOperations', () => {
  const mockMessageApi = {
    success: jest.fn(),
    error: jest.fn(),
  };

  let mockSetInlineData: jest.Mock;
  let mockSetEditingKeys: jest.Mock;
  let mockBuildConditions: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetInlineData = jest.fn();
    mockSetEditingKeys = jest.fn();
    mockBuildConditions = jest
      .fn()
      .mockReturnValue([{ field: 'crown_id', eq: 1 }]);
  });

  describe('handleInlineSave', () => {
    it('should save record and update state on success', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      const record = { id: 1, name: 'Test', crown_id: 1 };

      await act(async () => {
        await result.current.handleInlineSave('crown_history', record);
      });

      expect(api.saveModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        data: record,
      });
      expect(mockMessageApi.success).toHaveBeenCalledWith('Saved successfully');
      expect(mockSetInlineData).toHaveBeenCalled();
      expect(mockSetEditingKeys).toHaveBeenCalled();
    });

    it('should show error message on failure', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({
        code: 1,
        message: 'Save failed',
      });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      await act(async () => {
        await result.current.handleInlineSave('crown_history', { id: 1 });
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith('Save failed');
    });

    it('should handle exception', async () => {
      (api.saveModelData as jest.Mock).mockRejectedValue(
        new Error('Network error'),
      );
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      await act(async () => {
        await result.current.handleInlineSave('crown_history', { id: 1 });
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith('Save failed');
      consoleSpy.mockRestore();
    });
  });

  describe('handleInlineDelete', () => {
    it('should delete record and update state on success', async () => {
      (api.deleteModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      const record = { id: 1, name: 'Test' };

      await act(async () => {
        await result.current.handleInlineDelete('crown_history', record);
      });

      expect(api.deleteModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        data: record,
      });
      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Deleted successfully',
      );
      expect(mockSetInlineData).toHaveBeenCalled();
    });

    it('should show error message on failure', async () => {
      (api.deleteModelData as jest.Mock).mockResolvedValue({
        code: 1,
        message: 'Cannot delete',
      });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      await act(async () => {
        await result.current.handleInlineDelete('crown_history', { id: 1 });
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith('Cannot delete');
    });
  });

  describe('loadInlineData', () => {
    it('should load regular inline data', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({
        code: 0,
        data: { data: [{ id: 1, name: 'Item 1' }] },
      });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      const inlineDesc = {
        relation: {
          relation: 'bk_fk',
          source_field: 'id',
          target_field: 'crown_id',
        },
      };

      await act(async () => {
        await result.current.loadInlineData('crown_history', inlineDesc, {
          id: 1,
        });
      });

      expect(mockBuildConditions).toHaveBeenCalledWith(inlineDesc, { id: 1 });
      expect(api.getModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        cond: [{ field: 'crown_id', eq: 1 }],
        page: 1,
        size: 100,
      });
      expect(mockSetInlineData).toHaveBeenCalled();
    });

    it('should load M2M inline data with through table', async () => {
      (api.getModelData as jest.Mock)
        .mockResolvedValueOnce({
          code: 0,
          data: { data: [{ id: 1, crown_id: 1, tag_id: 10 }] },
        })
        .mockResolvedValueOnce({
          code: 0,
          data: {
            data: [
              { id: 10, name: 'Tag 1' },
              { id: 20, name: 'Tag 2' },
            ],
          },
        });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

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
      };

      await act(async () => {
        await result.current.loadInlineData('crown_tags', m2mInlineDesc, {
          id: 1,
        });
      });

      expect(api.getModelData).toHaveBeenCalledTimes(2);
      expect(mockSetInlineData).toHaveBeenCalled();
    });

    it('should show error when load fails', async () => {
      (api.getModelData as jest.Mock).mockResolvedValue({ code: 1 });

      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      await act(async () => {
        await result.current.loadInlineData(
          'crown_history',
          { relation: { relation: 'bk_fk' } },
          { id: 1 },
        );
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith(
        'Failed to load crown_history data',
      );
    });
  });

  describe('addInlineRecord', () => {
    it('should add new record to inline data and editing keys', () => {
      const { result } = renderHook(() =>
        useCrudOperations({
          messageApi: mockMessageApi,
          setInlineData: mockSetInlineData,
          setEditingKeys: mockSetEditingKeys,
          buildConditions: mockBuildConditions,
        }),
      );

      const newRecord = { id: 'temp-123', name: 'New Item' };

      act(() => {
        result.current.addInlineRecord('crown_history', newRecord);
      });

      expect(mockSetInlineData).toHaveBeenCalled();
      expect(mockSetEditingKeys).toHaveBeenCalled();
    });
  });
});
