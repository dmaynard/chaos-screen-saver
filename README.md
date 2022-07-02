# chaos-screen-saver

Computes real time chaotic attractors to act as a browser based screen saver, as a visual meditation, and as a comparison benchmark program for a single threaded compute bound task on a given browser. It compare ES6 (Javascript) vs. Web Assembly (compiled from the Rust programming language). Click the menu button on the upper left to reveal the performance numbers and to switch between Javascript and Rust versions of the code.

### History and Context

"Far from the bright twinkling city lights and the chaotic world of humans, lives a shy, sentient race of creatures known as the Latööcarfians. Their home is Ganymede, a moon of planet Jupiter." It is said that these beautiful patterns are displayed on the foreheads of the Latööcarfians as they contemplate the mathematics of chaotic attractors. See [Chaos in Wonderland](https://www.amazon.com/Chaos-Wondyaerland-Visual-Adventures-Fractal/dp/0312107439/ref=sr_1_1?dchild=1&keywords=Chaos+in+Wonderland&qid=1614816144&s=books&sr=1-1) by Clifford Pickover.

Here is the function that iterates the attractor to create the images. It has 4 parameters a, b, c, and d which are randomly set for each new attractor. The function continues iterating x and y jumping prom point to point, darkening each pixel it lands on until 10% of the points have reached their maximum value (255).

```
iteratePoint: function(x, y) {
  let nx = Math.sin(y * this.b) - (this.c * Math.sin(x * this.b));
  let ny = Math.sin(x * this.a) + this.d * Math.cos(y * this.a);
  return [nx, ny];
}
```

### Performance Benchmark

If you click the menu button you will see a benchmark speedometer. This measures how many pixels the attractor visits every millisecond, (averaged over the last second.) A pixel's darkness is increased every time the attractor visits a it. An image is considered completed when 10% of it's visited points have reached total black, or when the image stops changing. The animation always runs at 60 frames per second. The attractor runs for 13 milliseconds of each animation frame, leaving 3 remaining milliseconds for copying the data out and rendering the page. This benchmark is single threaded. It measures JavaScript performance on one core. If you click the Use Rust button the application will switch to using a Rust -> Web Assembly module for iterating calculating the next frame's pixels.  Thus you can compare  the Javascript vs Web Assembly versions of this compute bound iteration algorithm. In both cases only a single thread is used. In both cases the all the image drawing is done in Javascript using canvas. In both cases the speedometer measure how many points can be iterated , mapped to a pixel and updating the pixels value can be done in one 

### Dedication

This application is dedicated to the memory of my favorite Jovian, [Dave Needle](https://en.wikipedia.org/wiki/Dave_Needle), a gentle, joyful, Jovian, genius. RIP Dave.

[![Netlify Status](https://api.netlify.com/api/v1/badges/d91842a9-dfd7-48eb-b6ff-c3d57032dfab/deploy-status)](https://app.netlify.com/sites/chaotic/deploys)

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

To change from npm published rust package to a local rust package

```
diff --git a/package.json b/package.json
-    "@davidsmaynard/rust-wasm-attractor": "^0.1.0"
+    "rust-wasm-attractor": "file:../rust/rust-wasm-attractor/pkg"
diff --git a/src/components/ChaosCanvas.vue b/src/components/ChaosCanvas.vue
index 100166f..10af94f 100644
--- a/src/components/ChaosCanvas.vue
+++ b/src/components/ChaosCanvas.vue
-    this.wasmPromise = import("@davidsmaynard/rust-wasm-attractor")
+    this.wasmPromise = import("rust-wasm-attractor")
```
