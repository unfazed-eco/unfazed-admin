import { act, renderHook } from '@testing-library/react';
import * as api from '@/services/api';
import { useBackRelationOperations } from './useBackRelationOperations';

// Mock the API
jest.mock('@/services/api', () => ({
  saveModelData: jest.fn(),
}));

describe('useBackRelationOperations', () => {
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
      relation: 'bk_fk',
      source_field: 'id',
      target_field: 'crown_id',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleBackRelationLink', () => {
    it('should link records by updating FK field', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      const targetRecords = [
        { id: 10, name: 'History 1', crown_id: null },
        { id: 20, name: 'History 2', crown_id: null },
      ];

      await act(async () => {
        await result.current.handleBackRelationLink(
          'crown_history',
          mockInlineDesc,
          targetRecords,
        );
      });

      expect(api.saveModelData).toHaveBeenCalledTimes(2);
      expect(api.saveModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        data: {
          id: 10,
          name: 'History 1',
          crown_id: 1, // Updated to main record's id
          updated_at: Math.floor(Date.now() / 1000),
        },
      });
      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Successfully linked 2 record(s)',
      );
    });

    it('should handle link failure', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 1 });

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleBackRelationLink(
          'crown_history',
          mockInlineDesc,
          [{ id: 10 }],
        );
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith(
        'Failed to link record 10',
      );
    });

    it('should work for bk_o2o relation type', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const bkO2ODesc = {
        relation: {
          relation: 'bk_o2o',
          source_field: 'id',
          target_field: 'crown_id',
        },
      };

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleBackRelationLink(
          'crown_insurance',
          bkO2ODesc,
          [{ id: 10 }],
        );
      });

      expect(api.saveModelData).toHaveBeenCalled();
      expect(mockMessageApi.success).toHaveBeenCalled();
    });

    it('should do nothing for non-back-relation types', async () => {
      const fkDesc = {
        relation: {
          relation: 'fk',
          source_field: 'id',
          target_field: 'crown_id',
        },
      };

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleBackRelationLink('other', fkDesc, [
          { id: 10 },
        ]);
      });

      expect(api.saveModelData).not.toHaveBeenCalled();
    });
  });

  describe('handleBackRelationUnlink', () => {
    it('should unlink record by setting FK to negative of record id', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      const targetRecord = { id: 10, name: 'History 1', crown_id: 1 };

      await act(async () => {
        await result.current.handleBackRelationUnlink(
          'crown_history',
          mockInlineDesc,
          targetRecord,
        );
      });

      expect(api.saveModelData).toHaveBeenCalledWith({
        name: 'crown_history',
        data: {
          id: 10,
          name: 'History 1',
          crown_id: -10, // Negative of record's own id
          updated_at: Math.floor(Date.now() / 1000),
        },
      });
      expect(mockMessageApi.success).toHaveBeenCalledWith(
        'Unlinked successfully',
      );
    });

    it('should handle unlink failure', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({
        code: 1,
        message: 'Failed',
      });

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleBackRelationUnlink(
          'crown_history',
          mockInlineDesc,
          { id: 10 },
        );
      });

      expect(mockMessageApi.error).toHaveBeenCalledWith('Failed');
    });

    it('should use -1 for non-positive record ids', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleBackRelationUnlink(
          'crown_history',
          mockInlineDesc,
          { id: 0 },
        );
      });

      expect(api.saveModelData).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            crown_id: -1,
          }),
        }),
      );
    });

    it('should work for bk_o2o relation type', async () => {
      (api.saveModelData as jest.Mock).mockResolvedValue({ code: 0 });

      const bkO2ODesc = {
        relation: {
          relation: 'bk_o2o',
          source_field: 'id',
          target_field: 'crown_id',
        },
      };

      const { result } = renderHook(() =>
        useBackRelationOperations({
          mainRecord: mockMainRecord,
          messageApi: mockMessageApi,
        }),
      );

      await act(async () => {
        await result.current.handleBackRelationUnlink(
          'crown_insurance',
          bkO2ODesc,
          { id: 10 },
        );
      });

      expect(api.saveModelData).toHaveBeenCalled();
      expect(mockMessageApi.success).toHaveBeenCalled();
    });
  });
});
