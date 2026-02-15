declare module "bun:ffi" {
  export type Pointer = unknown;
  export const dlopen: (...args: unknown[]) => unknown;
  export const toArrayBuffer: (...args: unknown[]) => ArrayBuffer;
  export const JSCallback: new (...args: unknown[]) => unknown;
  export const ptr: (...args: unknown[]) => unknown;
}
