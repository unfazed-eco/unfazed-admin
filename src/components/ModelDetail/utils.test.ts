import { capitalizeFirstLetter } from './utils';

describe('utils', () => {
  describe('capitalizeFirstLetter', () => {
    it('should capitalize the first letter of a string', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('world')).toBe('World');
    });

    it('should handle single character strings', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
      expect(capitalizeFirstLetter('z')).toBe('Z');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
      expect(capitalizeFirstLetter('WORLD')).toBe('WORLD');
    });

    it('should handle empty strings', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle strings with underscores', () => {
      expect(capitalizeFirstLetter('crown_history')).toBe('Crown_history');
      expect(capitalizeFirstLetter('user_profile')).toBe('User_profile');
    });

    it('should handle strings with numbers', () => {
      expect(capitalizeFirstLetter('123abc')).toBe('123abc');
      expect(capitalizeFirstLetter('abc123')).toBe('Abc123');
    });
  });
});
