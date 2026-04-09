const mockRenderFormField = jest.fn();
const mockRenderFormFields = jest.fn();

jest.mock('./formFieldRenderer', () => ({
  renderFormField: (...args: any[]) => mockRenderFormField(...args),
  renderFormFields: (...args: any[]) => mockRenderFormFields(...args),
}));

describe('utils index exports', () => {
  it('re-exports form renderer and settings helpers', () => {
    const utils = require('./index');

    expect(typeof utils.renderFormField).toBe('function');
    expect(typeof utils.renderFormFields).toBe('function');
    expect(typeof utils.getAppSettings).toBe('function');
    expect(typeof utils.getApiPrefix).toBe('function');
    expect(typeof utils.getPageSize).toBe('function');

    utils.renderFormField('name', {}, null, {});
    utils.renderFormFields({}, null, {});
    expect(mockRenderFormField).toHaveBeenCalled();
    expect(mockRenderFormFields).toHaveBeenCalled();
  });
});
