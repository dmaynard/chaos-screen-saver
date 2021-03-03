ª<template>
  <div class="chaos-canvas-wrapper">
    <canvas
      id="mycanvas"
      ref="chaos-canvas"
      @click="resetAttractor(false)"
    ></canvas>
    <span class="menu-wrapper" style="width: 150px ">
      <div v-if="menuUp">
        <button class="close labeltag" v-on:click="toggleMenuUp">
          X
        </button>
        <div v-if="paused">
          <button ref="resume" class="uiButton" v-on:click="startAnimation">
            Resume
          </button>
        </div>
        <div v-else>
          <button
            ref="pause"
            class="uiButton"
            id="pauseButton"
            v-on:click="pauseAnimation"
          >
            Pause
          </button>
        </div>
        <button ref="next" class="uiButton" v-on:click="resetAttractor(true)">
          Next
        </button>
        <myprogressbar
          size="medium"
          :bar-color="pbarcolor"
          :bg-color="pbgcolor"
          :val="progress"
        >
        </myprogressbar>
        <myprogressbar
          id="lastprogressbar"
          size="medium"
          :bar-color="tbarcolor"
          :bg-color="pbgcolor"
          :val="countdownpct"
        >
        </myprogressbar>

        <div>
          <vue-speedometer
            id="Iterations"
            :value="meanItersPerMillisonds"
            :width="150"
            :height="100"
            :maxValue="4000"
          />
          <label id="itersperms" align="center" for="Iterations"
            >Pixels per ms
          </label>
          <button class="uiButton" v-on:click="doTestAttractor">
            Test
          </button>
        </div>
      </div>
      <div v-else>
        <span>
          <button
            id="menubutton"
            style="float: left"
            class="close labeltag"
            v-on:click="toggleMenuUp"
          >
            &#9776;
          </button>
        </span>
      </div>
      <div v-if="menuUp"></div>
      <div v-else>
        <myprogressbar
          class="shorty"
          id="firstshortprogressbar"
          size="small"
          :bar-color="pbarcolor"
          :bg-color="pbgcolor"
          :val="progress"
        >
        </myprogressbar>
        <myprogressbar
          class="shorty"
          id="secondprogressbar"
          size="small"
          :bar-color="tbarcolor"
          :bg-color="pbgcolor"
          :val="countdownpct"
        >
        </myprogressbar>
      </div>
    </span>
  </div>
</template>

<script>
/* eslint-disable no-console */

// Todo eliminate extraneous UI and functions
import myprogressbar from "vue-simple-progress";
import VueSpeedometer from "vue-speedometer";
// import { RingBuffer } from "../modules/RingBuffer";
import { AttractorObj } from "../modules/Attractor";
const logPerfArraySize = 6; // 2**6 = 64 perfSamples
export default {
  data() {
    return {
      // This is the CanvasRenderingContext that children will draw to.
      ctx: null,
      image: null,
      imageData: null,
      putImageData: null,
      data: null,
      randomize: true,
      frames: 0,
      iters: 0,
      paused: false,
      startNewAttractor: true,
      displayDelayDefault: 600,
      displayDelay: 0,

      pbarcolor: "rgba(0,200,0,0.5)",
      tbarcolor: "rgba(240,180,0,0.5)",

      pbgcolor: "rgba(255, 225, 255, 0.0)",
      elapsedCPU: 0,
      enoughMaxed: 10.0, // quit when 10% of the pixels touched have maxed out
      progress: 0,
      menuUp: false,
      prevMaxed: 0,
      prevTouched: 0,
      nFramesSame: 0,
      window: {
        width: 0,
        height: 0,
      },
      animationRequestID: null,
      msFrameBudget: 13, // should be less than 16 for 60 fps.
      clearScreen: true,
      att: null,
      framePerfs: new Array(2 ** logPerfArraySize),
      meanItersPerMillisonds: 0,
      countdownpct: 0,
    };
  },

  created() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
  destroyed() {
    window.removeEventListener("resize", this.handleResize);
    if (this.animationRequestID) {
      window.cancelAnimationFrame(this.animationRequestID);
    }
  },

  mounted() {
    // We can't access the rendering context until the canvas is mounted to the DOM.
    //  Once we have it, provide it to all child components.
    this.$refs["chaos-canvas"].width = this.$refs[
      "chaos-canvas"
    ].parentElement.clientWidth;
    this.$refs["chaos-canvas"].height = this.$refs[
      "chaos-canvas"
    ].parentElement.clientHeight;
    this.ctx = this.$refs["chaos-canvas"].getContext("2d");
    this.width = this.$refs["chaos-canvas"].width;
    this.height = this.$refs["chaos-canvas"].height;
    this.image = new Image(this.width, this.height);
    this.ctx.drawImage(
      this.image,
      0,
      0,
      this.width,
      this.height,
      0,
      0,
      this.width,
      this.height
    );
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.data = this.imageData.data;
    this.paused = false;

    this.animationRequestID = window.requestAnimationFrame(this.doAnimation);
    this.att = new AttractorObj(true, this.width, this.height);
    // this.pbarcolor = "rgba(0, 225, 0, 0.3)";
    // this.pbgcolor = "rgba(255, 225, 255, 0.3)";
  },
  methods: {
    initImageData(w, h) {
      this.width = w;
      this.height = h;
      this.$refs["chaos-canvas"].width = w;
      this.$refs["chaos-canvas"].height = h;
      this.ctx = this.$refs["chaos-canvas"].getContext("2d");
      this.width = this.$refs["chaos-canvas"].width;
      this.height = this.$refs["chaos-canvas"].height;
      this.image = new Image(this.width, this.height);
      this.ctx.drawImage(
        this.image,
        0,
        0,
        this.width,
        this.height,
        0,
        0,
        this.width,
        this.height
      );
      this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
      this.data = this.imageData.data;

      this.fillImage(0xff, 0xff, 0xff);

      this.ctx.putImageData(this.imageData, 0, 0);
    },
    handleResize() {
      if (this.$refs["chaos-canvas"]) {
        // Has Vue loaded yet?
        if (this.animationRequestID) {
          window.cancelAnimationFrame(this.animationRequestID);
        }
        this.randomize = false;
        this.startNewAttractor = true;
        this.initImageData(window.innerWidth, window.innerHeight);
        this.animationRequestID = window.requestAnimationFrame(
          this.doAnimation
        );
      }
    },
    timeIt(context, f, ...params) {
      let elapsed = -performance.now();
      f.call(context, ...params);
      elapsed += performance.now();
      window.console.log(f.name + " : " + elapsed + " ms");
      return elapsed;
    },
    invert(r, g, b) {
      for (var i = 0; i < this.att.data.length; i += 4) {
        this.att.data[i] ^= r; // red
        this.att.data[i + 1] ^= g; // green
        this.att.data[i + 2] ^= b; // blue
      }
    },
    zeroImage() {
      for (var i = 0; i < this.att.data.length; i += 4) {
        this.att.data[i] = 0; // red
        this.att.data[i + 1] = 0; // green
        this.att.data[i + 2] = 0; // blue
        this.att.data[i + 3] = 255; // opaque
      }
    },
    fillImage(r, g, b) {
      for (var i = 0; i < this.att.data.length; i += 4) {
        this.att.data[i] = r; // red
        this.att.data[i + 1] = g; // green
        this.att.data[i + 2] = b; // blue
        this.att.data[i + 3] = 255; // opaque
      }
    },
    clickMethod() {
      this.timeIt(this, this.invert, 0xff, 0xff, 0xff);
      this.timeIt(this.ctx, this.ctx.putImageData, this.imageData, 0, 0);
    },
    timeTest() {
      this.zeroImage();
      this.timeIt(this, this.testAttractor);
    },
    doAnimation: function() {
      // called every frame
      const frameStartTime = performance.now();
      this.frames++;
      if (this.paused) {
        this.animationRequestID = window.requestAnimationFrame(
          this.doAnimation
        );
        return; // breaks the animation callback chain
      }
      if (this.displayDelay > 0) {
        this.displayDelay--;
        this.calculateProgress(this.displayDelay);
        this.animationRequestID = window.requestAnimationFrame(
          this.doAnimation
        );
        return;
      }

      this.prevMaxed = this.att ? this.att.nMaxed : 0;
      this.prevTouched = this.att ? this.att.nTouched : 0;
      if (this.startNewAttractor) {
        this.startTime = performance.now();
      }

      this.iterateAttractor(
        this.startNewAttractor,
        this.randomize,
        this.clearScreen
      );
      this.startNewAttractor = false;
      this.clearScreen = true;
      if (this.att.nTouched > 0 && this.att.nTouched < 500) {
        this.startNewAttractor = true;
        this.displayDelay = 0;
      }
      if (
        this.att.nTouched == this.prevTouched &&
        this.att.nMaxed == this.prevMaxed
      ) {
        this.nFramesSame++;
        if (this.nFramesSame > 120) {
          // console.log("no changes for 120 frames, abort or pause this attractor")

          this.startNewAttractor = true;
          this.progress = 100;
          this.displayDelay = this.displayDelayDefault;
        }
      } else {
        this.nFramesSame = 0;
      }

      let percentMaxed = (this.att.nMaxed * 100) / this.att.nTouched;
      this.progress = Math.min((percentMaxed * 100) / this.enoughMaxed, 100);
      this.calculateProgress(this.displayDelay);
      if (percentMaxed > this.enoughMaxed) {
        this.startNewAttractor = true;
        this.displayDelay =
          this.att.nTouched > 5000 ? this.displayDelayDefault : 0;
        // console.log(
        //   this.nTouched +
        //     " touched " +
        //     this.nMaxed +
        //     " maxed " +
        //     percentMaxed +
        //     " percent " +
        //     "  Progress " +
        //     this.progress
        // );

        // console.log(" Enough ");
      }

      this.elapsedCPU += performance.now() - frameStartTime;
      if (this.elapsedCPU < 0) {
        console.log(" impossible ");
      }
      this.framesPerSecond = Math.floor(
        0.5 + (this.frames * 1000) / (performance.now() - this.startTime)
      );
      // console.log(" frames per second: " + this.framesPerSecond);
      if (this.startAnimation) {
        // limit recurrion on the doAnimation calls to one attractor
        window.cancelAnimationFrame(this.animationRequestID);
      }
      this.animationRequestID = window.requestAnimationFrame(this.doAnimation);
      return;
    },
    startAnimation: function() {
      this.paused = false;
      // this.animationRequestID = window.requestAnimationFrame(this.doAnimation);
    },
    pauseAnimation() {
      this.paused = true;
    },
    resetAttractor() {
      if (this.paused) {
        this.paused = false;
        // this.animationRequestID = window.requestAnimationFrame(this.doAnimation);
      }
      this.displayDelay = 0;
      this.startNewAttractor = true;
      this.randomize = true;
      this.clearScreen = true;
    },

    iterateAttractor(init, randomize, clearScreen) {
      // let nx = 0;
      // let ny = 0;
      let msElapsed = 1;
      let loopCount = 0;

      if (init) {
        this.frames = 0;
        let savedParams = [...this.att.params];
        this.att = new AttractorObj(
          randomize,
          this.width,
          this.height,
          savedParams
        );
        if (clearScreen) {
          this.ctx.fillStyle = "rgba(255,255,255,1.0)";
          this.ctx.fillRect(0, 0, this.width, this.height);
          this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
          this.data = this.imageData.data;
        }

        this.randomize = true;
      }
      let startTime = performance.now();
      loopCount = this.att.calculateFrame(this.msFrameBudget, init);
      msElapsed = performance.now() - startTime;
      this.framePerfs[this.frames & (2 ** logPerfArraySize - 1)] =
        loopCount / msElapsed;

      this.meanItersPerMillisonds = Math.round(
        this.framePerfs.reduce((a, b) => a + b, 0) / this.framePerfs.length
      );
      // console.log(
      //   " iterations per ms: " + Math.floor(this.meanItersPerMillisonds)
      // );
      if (!init) {
        //  copy the image data from the module's memory
        this.imageData.data.set(this.att.data);
        this.ctx.putImageData(this.imageData, 0, 0);
      }
    },
    toggleMenuUp() {
      this.menuUp = !this.menuUp;
      this.imageData.data.set(this.att.data);
      this.ctx.putImageData(this.imageData, 0, 0);
    },
    drawAttractor() {
      this.displayDelay = 0;
      this.clearScreen = false;
      this.randomize = false;
    },
    doAbout() {
      window.open(
        this.aboutUrl,
        "_blank" // <- This is what makes it open in a new window.
      );
    },
    doTestAttractor() {
      let testParam = [
        -2.3983540752995394,
        -1.8137134453341095,
        0.010788338377923257,
        1.0113015602664608,
        0.1,
        0.1,
      ];
      this.att.params = [...testParam];
      this.randomize = false;
      this.startNewAttractor = true;
      this.initImageData(window.innerWidth, window.innerHeight);
      this.animationRequestID = window.requestAnimationFrame(this.doAnimation);
    },
    calculateProgress(delay) {
      this.countdownpct =
        delay == 0
          ? 0
          : ((this.displayDelayDefault - delay) * 100) /
            this.displayDelayDefault;
    },
  },
  components: {
    VueSpeedometer,
    myprogressbar,
  },
};
</script>
<style scoped>
#mycanvas {
  position: absolute;
  top: 5%;
  left: 5%;
  width: 90%;
  height: 90%;
}
button.uiButton {
  width: 100%;
  margin-bottom: 4px;
  height: 30px;
  text-align: center;
  border: solid 2px gray;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0);
  font-size: 16px;
}
#itersperms {
  display: block;
  margin-bottom: 10px;
}
#lastprogressbar {
  display: block;
  margin-bottom: 10px;
}
#firstshortprogressbar {
  margin-top: 35px;
}

.shorty {
  width: 35px;
  margin-bottom: 2px;
}
#shortprogressbar {
  display: block;
}
button.close {
  display: block;
  width: 30px;
  margin-bottom: 4px;
  border: solid 2px gray;
  float: right;
  text-align: center;
  height: 30px;
  border-radius: 6px;
  font-size: 16px;
  background-color: Transparent;
}
#menubutton {
  display: block;
}
canvas {
}

div.checkdiv {
  height: 40px;
}

input[type="checkbox"] {
  margin-top: 10px;
}

span.menu-wrapper {
  position: absolute;
  top: 10px;
  left: 10px;
}

.inline {
  margin-top: 10px;
  vertical-align: middle;
}
</style>
