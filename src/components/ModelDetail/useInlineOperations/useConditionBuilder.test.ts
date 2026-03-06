import { renderHook } from '@testing-library/react';
import { useConditionBuilder } from './useConditionBuilder';

describe('useConditionBuilder', () => {
  describe('buildConditions', () => {
    it('should return empty array when no relation', () => {
      const { result } = renderHook(() => useConditionBuilder());
      const conditions = result.current.buildConditions({}, { id: 1 });
      expect(conditions).toEqual([]);
    });

    it('should build conditions for fk relation', () => {
      const { result } = renderHook(() => useConditionBuilder());
      const inlineDesc = {
        relation: {
          relation: 'fk',
          source_field: 'crown_id',
          target_field: 'id',
        },
      };
      const record = { id: 123, name: 'Test Crown' };

      const conditions = result.current.buildConditions(inlineDesc, record);

      expect(conditions).toEqual([{ field: 'crown_id', eq: 123 }]);
    });

    it('should build conditions for o2o relation', () => {
      const { result } = renderHook(() => useConditionBuilder());
      const inlineDesc = {
        relation: {
          relation: 'o2o',
          source_field: 'profile_id',
          target_field: 'id',
        },
      };
      const record = { id: 456, name: 'Test User' };

      const conditions = result.current.buildConditions(inlineDesc, record);

      expect(conditions).toEqual([{ field: 'profile_id', eq: 456 }]);
    });

    it('should build conditions for bk_fk relation', () => {
      const { result } = renderHook(() => useConditionBuilder());
      const inlineDesc = {
        relation: {
          relation: 'bk_fk',
          source_field: 'id',
          target_field: 'crown_id',
        },
      };
      const record = { id: 789, name: 'Test Crown' };

      const conditions = result.current.buildConditions(inlineDesc, record);

      expect(conditions).toEqual([{ field: 'crown_id', eq: 789 }]);
    });

    it('should build conditions for bk_o2o relation', () => {
      const { result } = renderHook(() => useConditionBuilder());
      const inlineDesc = {
        relation: {
          relation: 'bk_o2o',
          source_field: 'id',
          target_field: 'user_id',
        },
      };
      const record = { id: 999, name: 'Test User' };

      const conditions = result.current.buildConditions(inlineDesc, record);

      expect(conditions).toEqual([{ field: 'user_id', eq: 999 }]);
    });

    it('should return empty array for unsupported relation type', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useConditionBuilder());
      const inlineDesc = {
        relation: {
          relation: 'unknown_type',
          source_field: 'id',
          target_field: 'id',
        },
      };
      const record = { id: 1 };

      const conditions = result.current.buildConditions(inlineDesc, record);

      expect(conditions).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unsupported relation type: unknown_type',
      );
      consoleSpy.mockRestore();
    });
  });
});
