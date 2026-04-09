jest.mock('./CommonProTable', () => ({
  __esModule: true,
  default: 'CommonProTable',
}));
jest.mock('./EditorJS', () => ({
  __esModule: true,
  default: 'EditorJS',
}));
jest.mock('./Footer', () => ({
  __esModule: true,
  default: 'Footer',
}));
jest.mock('./JsonFieldEditor', () => ({
  __esModule: true,
  default: 'JsonFieldEditor',
}));
jest.mock('./ModelAdmin', () => ({
  __esModule: true,
  default: 'ModelAdmin',
}));
jest.mock('./ModelCustom', () => ({
  __esModule: true,
  default: 'ModelCustom',
}));
jest.mock('./ModelDetail', () => ({
  __esModule: true,
  default: 'ModelDetail',
}));
jest.mock('./ModelList', () => ({
  __esModule: true,
  default: 'ModelList',
}));
jest.mock('./ProFormEditorJS', () => ({
  __esModule: true,
  default: 'ProFormEditorJS',
}));
jest.mock('./RightContent', () => ({
  __esModule: true,
  SelectLang: 'SelectLang',
}));
jest.mock('./RightContent/AvatarDropdown', () => ({
  __esModule: true,
  AvatarDropdown: 'AvatarDropdown',
  AvatarName: 'AvatarName',
}));

describe('components index exports', () => {
  it('re-exports all component entries', () => {
    const mod = require('./index');
    expect(mod).toEqual(
      expect.objectContaining({
        AvatarDropdown: 'AvatarDropdown',
        AvatarName: 'AvatarName',
        Footer: 'Footer',
        SelectLang: 'SelectLang',
        ModelList: 'ModelList',
        ModelDetail: 'ModelDetail',
        ModelAdmin: 'ModelAdmin',
        CommonProTable: 'CommonProTable',
        ModelCustom: 'ModelCustom',
        EditorJS: 'EditorJS',
        ProFormEditorJS: 'ProFormEditorJS',
        JsonFieldEditor: 'JsonFieldEditor',
      }),
    );
  });
});
