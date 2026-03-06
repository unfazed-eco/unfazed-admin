import { defaultConfig } from 'antd/lib/theme/internal';

defaultConfig.hashed = false;

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: jest.fn(),
});

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}
window.Worker = Worker;

if (typeof window !== 'undefined') {
  // ref: https://github.com/ant-design/ant-design/issues/18774
  if (!window.matchMedia) {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn(() => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  }
  if (!window.matchMedia) {
    Object.defineProperty(global.window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: jest.fn((query) => ({
        matches: query.includes('max-width'),
        addListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });
  }
}
const errorLog = console.error;
Object.defineProperty(global.window.console, 'error', {
  writable: true,
  configurable: true,
  value: (...rest) => {
    const logStr = String(rest[0] || '');
    // Filter out known warnings and errors
    if (
      logStr.includes(
        'Warning: An update to %s inside a test was not wrapped in act(...)',
      ) ||
      // Filter out CKEditor CSS parsing errors in jsdom
      logStr.includes('Could not parse CSS stylesheet') ||
      rest[0]?.message?.includes('Could not parse CSS stylesheet')
    ) {
      return;
    }
    errorLog(...rest);
  },
});

// Mock CKEditor5 to avoid CSS parsing issues in jsdom
jest.mock('@ckeditor/ckeditor5-build-classic', () => ({
  __esModule: true,
  default: {
    create() {
      return Promise.resolve({
        destroy: jest.fn(),
        getData: jest.fn(() => ''),
        setData: jest.fn(),
        model: {
          document: {
            on: jest.fn(),
          },
        },
        editing: {
          view: {
            document: {
              on: jest.fn(),
            },
          },
        },
      });
    },
  },
}));

jest.mock('@ckeditor/ckeditor5-react', () => ({
  __esModule: true,
  CKEditor: () => {
    return null;
  },
}));
