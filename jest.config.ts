import { configUmiAlias, createConfig } from '@umijs/max/test.js';

export default async (): Promise<any> => {
  const config = await configUmiAlias({
    ...createConfig({
      target: 'browser',
    }),
  });

  const coverageTargets = [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx,js,jsx}',
    '!src/.umi*/**',
    '!src/**/*.types.ts',
    '!src/**/types.ts',
    '!src/typings.d.ts',
    '!src/global.style.ts',
  ];

  return {
    ...config,
    collectCoverageFrom: coverageTargets,
    coverageThreshold: {
      global: {
        branches: 60,
        functions: 75,
        lines: 80,
        statements: 80,
      },
    },
    testEnvironmentOptions: {
      ...(config?.testEnvironmentOptions || {}),
      url: 'http://localhost:8000',
    },
    setupFiles: [...(config.setupFiles || []), './tests/setupTests.jsx'],
    globals: {
      ...config.globals,
      localStorage: null,
    },
  };
};
