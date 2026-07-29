import { renderNumberField } from './columnRenderers';

describe('columnRenderers', () => {
  it('renders numeric values without thousands separators', () => {
    const render = renderNumberField('score') as any;

    expect(render(null, { score: 760029156 })).toBe('760029156');
    expect(render(null, { score: '760029156' })).toBe('760029156');
  });

  it('renders empty numeric values as fallback', () => {
    const render = renderNumberField('score') as any;

    expect(render(null, { score: null })).toBe('-');
    expect(render(null, { score: undefined })).toBe('-');
  });
});
