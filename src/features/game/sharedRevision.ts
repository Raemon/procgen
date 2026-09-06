export class Revision {
  private count = 0;

  bump(): void {
    this.count += 1;
  }

  value(): number {
    return this.count;
  }
}
