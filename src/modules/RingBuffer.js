// RingBuffer
export class RingBuffer {
  constructor(capacity) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.head = this.tail = this.size = 0;
  }

  reset() {
    this.head = this.tail = this.size = 0;
  }
  enqueue(data) {
    var next = this.head + 1;
    if (next >= this.capacity)
      next = 0;
    if (this.size < this.capacity)
      this.size++;

    this.buffer[this.head] = data;
    this.head = next;
  }

  dequeue() {
    var data = this.buffer[this.tail],
      next = this.tail + 1;
    if (next >= this.capacity)
      next = 0;
    if (this.size > 0)
      this.size--;

    this.tail = next;
    return data;
  }
  peek() {
    var data = this.buffer[this.tail];
    return data;
  }

  *[Symbol.iterator]() {
    for (var i = 0; i < this.size; i++)
      yield this.buffer[(this.tail + i) % this.capacity];
  }
}
