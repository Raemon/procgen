export function stubTheCanvasTexturesAreRasterizedOnto(): void {
  if ((globalThis as { document?: unknown }).document) return;
  (globalThis as unknown as { document: unknown }).document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () => ({
        clearRect() {},
        fillRect() {},
        putImageData() {},
        createImageData: (width: number, height: number) => ({
          data: new Uint8ClampedArray(width * height * 4),
        }),
      }),
    }),
  };
}
