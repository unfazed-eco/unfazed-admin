import { render, screen } from '@testing-library/react';
import { SelectLang } from './index';

const React = require('react');
void React.version;

const mockLocales = [
  { lang: 'en-US', label: 'English' },
  { lang: 'ja-JP', label: 'Japanese' },
];

jest.mock('@umijs/max', () => ({
  SelectLang: ({ postLocalesData }: any) => {
    const React = require('react');
    const locales = postLocalesData
      ? postLocalesData(mockLocales)
      : mockLocales;

    return React.createElement(
      'div',
      { 'data-testid': 'umi-lang' },
      locales.map((locale: any) => locale.lang).join(','),
    );
  },
}));

describe('RightContent SelectLang', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('hides language selector when only english locale is supported', () => {
    render(<SelectLang />);

    expect(screen.queryByTestId('umi-lang')).toBeNull();
  });

  it('ignores unsupported locale values from EXTRA.LANGUAGE', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ extra: { LANGUAGE: ['ja-JP'] } }),
    );

    render(<SelectLang />);

    expect(screen.queryByTestId('umi-lang')).toBeNull();
  });

  it('hides language selector when only one language is allowed', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ extra: { LANGUAGE: ['en-US'] } }),
    );

    render(<SelectLang />);

    expect(screen.queryByTestId('umi-lang')).toBeNull();
  });

  it('keeps only supported locale values when multiple are configured', () => {
    localStorage.setItem(
      'unfazed_app_settings',
      JSON.stringify({ extra: { LANGUAGE: ['en-US', 'ja-JP'] } }),
    );

    render(<SelectLang />);

    expect(screen.queryByTestId('umi-lang')).toBeNull();
  });
});
