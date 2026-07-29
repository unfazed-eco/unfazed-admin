import { setLocale, SelectLang as UmiSelectLang } from '@umijs/max';
import React from 'react';
import { getExtraSettings } from '@/utils/settings';
import { confirmUnsaved } from '@/utils/unsavedGuard';

export type SiderTheme = 'light' | 'dark';

const SUPPORTED_LOCALES = new Set(['en-US']);

export const SelectLang: React.FC<{ languages?: string[] }> = ({
  languages: languagesProp,
}) => {
  const languages = languagesProp ?? getExtraSettings().LANGUAGE;
  const allowedLocales =
    Array.isArray(languages) && languages.length > 0
      ? new Set(
          languages.filter(
            (language): language is string =>
              typeof language === 'string' && SUPPORTED_LOCALES.has(language),
          ),
        )
      : SUPPORTED_LOCALES;
  const postLocalesData = (locales: { lang: string }[]) =>
    locales.filter((locale) => allowedLocales.has(locale.lang));

  if (allowedLocales && allowedLocales.size <= 1) {
    return null;
  }

  return (
    <UmiSelectLang
      postLocalesData={postLocalesData}
      onItemClick={({ key }: { key: string }) => {
        confirmUnsaved(() => setLocale(key, true));
      }}
      style={{
        padding: 4,
      }}
    />
  );
};
