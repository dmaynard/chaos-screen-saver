// Attractor
export class AttractorObj {
  constructor(randomize, width, height, params) {
    this.x = 0.1;
    this.y = 0.1;
    this.width = width;
    this.iters = 0;
    this.loopCount = 0;
    this.height = height;
    this.nTouched = 0;
    this.nMaxed = 0;
    this.params = [0.1, 0.2, 0.3, 0.4, 0.1, 0.1];
    if (randomize) {
      this.params[0] = 3.0 * (Math.random() * 2.0 - 1.0);
      this.params[1] = 3.0 * (Math.random() * 2.0 - 1.0);
      this.params[2] = Math.random() * 2.0 - 1.0 + 0.5;
      this.params[3] = Math.random() * 2.0 - 1.0 + 0.5;
    } else {
      this.params = [...params];
    }
    this.xmax = -100.0;
    this.xmin = 100.0;
    this.ymax = -100.0;
    this.ymin = 100.0;
    this.xRange = 1.0;
    this.yRange = 1.0;

    this.data = new Uint8ClampedArray(width * height * 4).map(() => 255); // RGBA
    /* eslint-disable no-console */
    console.log ( "New AttractorObg creates randomize is ", randomize);
    /* eslint-enable no-console */
  }
  calculateFrame(budget, firstFrame) {
    let startTime = performance.now();
    let msElapsed = 0;
    let loopCount = 0;
    while (msElapsed < budget) {
      this.iters++;
      loopCount++;
      [this.x, this.y] = this.iteratePoint(this.x, this.y, firstFrame);
      if ((loopCount & 0x3f) == 0) {
        msElapsed = performance.now() - startTime;
      }
    }
    return loopCount; //
  }

  iteratePoint(x, y, firstFrame) {
    let nx =
      Math.sin(y * this.params[1]) -
      this.params[2] * Math.sin(x * this.params[1]);
    let ny =
      Math.sin(x * this.params[0]) +
      this.params[3] * Math.cos(y * this.params[0]);

    if (firstFrame) {
      if (nx < this.xmin) this.xmin = nx;
      if (nx > this.xmax) this.xmax = nx;
      if (ny < this.ymin) this.ymin = ny;
      if (ny > this.ymax) this.ymax = ny;
      this.xRange = this.xmax - this.xmin;
      this.yRange = this.ymax - this.ymin;
    } else {
      // Assumes white background with black attractor
      this.decPixel(this.pixelx(nx), this.pixely(ny));
    }
    return [nx, ny];
  }
  pixelx(x) {
    let px = Math.floor(((x - this.xmin) / this.xRange) * this.width);
    // if ((px < 0) || (px > this.width)) console.log(" bad x " + px + " " + x);
    px = px < 0 ? 0 : px;
    px = px > this.width - 1 ? this.width - 1 : px;
    return px;
  }
  pixely(y) {
    let py = Math.floor(((y - this.ymin) / this.yRange) * this.height);
    // if ((px < 0) || (px > this.width)) console.log(" bad x " + px + " " + x);
    py = py < 0 ? 0 : py;
    py = py > this.height - 1 ? this.height - 1 : py;
    return py;
  }

  decPixel(x, y) {
    let i = (y * this.width + x) * 4;
    if (this.data[i] == 255) {
      this.nTouched++;
    }
    if (this.data[i] == 1) {
      this.nMaxed++;
    }
    if (this.data[i] > 0) {
      this.data[i] -= 1;
      this.data[i + 1] -= 1;
      this.data[i + 2] -= 1;
    }
    // this.data[i + 3] = 255;
  }
}
