import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Only apply browser-specific mocks in jsdom environment
if (process.env.VITEST_ENV === 'jsdom') {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  global.localStorage = localStorageMock;

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock window
  global.window = {
    ...global.window,
    localStorage: localStorageMock,
    location: {
      href: 'http://localhost',
      pathname: '/',
    },
  };

  // Mock document
  global.document = {
    ...global.document,
    createElement: vi.fn(),
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(),
  };
}

// Configure Vue Test Utils
config.global.mocks = {
  $t: (key: string) => key,
}; 