/// <reference path="../node_modules/bun-types/test-globals.d.ts" />

export {};

// jest.mock() is not in the bun:test jest namespace by default — add it
declare module 'bun:test' {
  namespace jest {
    function mock(moduleName: string, factory?: () => unknown): void;
  }
}

// Allow jest to be used as a type namespace (jest.SpyInstance, jest.Mock, etc.)
declare global {
  namespace jest {
    type Mock<T extends (...args: never[]) => unknown = (...args: never[]) => unknown> = import('bun:test').jest.Mock<T>;
    type SpyInstance<T extends (...args: never[]) => unknown = (...args: never[]) => unknown> = import('bun:test').jest.Mock<T>;
  }
}
