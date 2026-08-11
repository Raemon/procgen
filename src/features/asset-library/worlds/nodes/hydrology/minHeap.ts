export class MinHeap {
  private readonly priorities: number[] = [];
  private readonly payloads: number[] = [];

  get size(): number {
    return this.payloads.length;
  }

  push(priority: number, payload: number): void {
    this.priorities.push(priority);
    this.payloads.push(payload);
    this.siftUp(this.payloads.length - 1);
  }

  pop(): number {
    const top = this.payloads[0]!;
    const lastPriority = this.priorities.pop()!;
    const lastPayload = this.payloads.pop()!;
    if (this.payloads.length > 0) {
      this.priorities[0] = lastPriority;
      this.payloads[0] = lastPayload;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(start: number): void {
    let index = start;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.priorities[parent]! <= this.priorities[index]!) return;
      this.swap(parent, index);
      index = parent;
    }
  }

  private siftDown(start: number): void {
    let index = start;
    for (;;) {
      const smallest = this.smallestOfFamily(index);
      if (smallest === index) return;
      this.swap(smallest, index);
      index = smallest;
    }
  }

  private smallestOfFamily(index: number): number {
    const left = index * 2 + 1;
    const right = left + 1;
    let smallest = index;
    if (left < this.payloads.length && this.priorities[left]! < this.priorities[smallest]!) smallest = left;
    if (right < this.payloads.length && this.priorities[right]! < this.priorities[smallest]!) smallest = right;
    return smallest;
  }

  private swap(a: number, b: number): void {
    const priority = this.priorities[a]!;
    const payload = this.payloads[a]!;
    this.priorities[a] = this.priorities[b]!;
    this.payloads[a] = this.payloads[b]!;
    this.priorities[b] = priority;
    this.payloads[b] = payload;
  }
}
