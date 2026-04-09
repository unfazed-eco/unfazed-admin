import { parseJson, toJsonString, validateJson } from './json';

describe('json utils', () => {
  it('toJsonString handles null/undefined/string/object/fallback', () => {
    expect(toJsonString(null)).toBe('');
    expect(toJsonString(undefined)).toBe('');
    expect(toJsonString('{"a":1}')).toBe('{"a":1}');
    expect(toJsonString('not-json')).toBe('not-json');
    expect(toJsonString({ a: 1 })).toContain('"a": 1');

    const circular: any = {};
    circular.self = circular;
    expect(toJsonString(circular)).toContain('[object Object]');
  });

  it('parseJson handles values safely', () => {
    expect(parseJson(null)).toBeNull();
    expect(parseJson(undefined)).toBeNull();

    const obj = { x: 1 };
    expect(parseJson(obj)).toBe(obj);

    expect(parseJson('')).toBeNull();
    expect(parseJson('  ')).toBeNull();
    expect(parseJson('{"a":2}')).toEqual({ a: 2 });
    expect(parseJson('not-json')).toBe('not-json');
    expect(parseJson(123)).toBe(123);
  });

  it('validateJson validates string/object/empty/invalid', () => {
    expect(validateJson(null)).toEqual({ valid: true });
    expect(validateJson(undefined)).toEqual({ valid: true });
    expect(validateJson({ a: 1 })).toEqual({ valid: true });
    expect(validateJson('')).toEqual({ valid: true });
    expect(validateJson('   ')).toEqual({ valid: true });
    expect(validateJson('{"a":1}')).toEqual({ valid: true });

    const invalid = validateJson('{bad json');
    expect(invalid.valid).toBe(false);
    expect(invalid.error).toBeTruthy();

    expect(validateJson(1)).toEqual({ valid: true });
  });
});
