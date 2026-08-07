export const SCRIPT_TEMPLATE = `const field = ctx.newField();
for (let y = 0; y < ctx.size; y++) {
  for (let x = 0; x < ctx.size; x++) {
    const worldX = ctx.originX + x;
    const worldY = ctx.originY + y;
    field[y * ctx.size + x] = ctx.hash01(worldX, worldY, 'my-label');
  }
}
return field;`;
