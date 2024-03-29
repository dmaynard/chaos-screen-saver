<template>
  <div class="chaos-canvas-wrapper">
    <h3 align="center">
      Using {{ language }}
    </h3>
    <canvas
      id="mycanvas"
      ref="chaos-canvas"
      @click="resetAttractor(false)"
    />
    <span
      class="menu-wrapper"
      style="width: 150px "
    >

      <div v-if="menuUp">
        <button
          class="close labeltag"
          @click="toggleMenuUp"
        >
          X
        </button>
        <myprogressbar
          size="medium"
          :bar-color="pbarcolor"
          :bg-color="pbgcolor"
          :val="progress"
        />
        <myprogressbar
          id="lastprogressbar"
          size="medium"
          :bar-color="tbarcolor"
          :bg-color="pbgcolor"
          :val="countdownpct"
        />
        <div v-if="useRust">
          <button
            id="useES6Button"
            ref="useES6"
            class="uiButton"
            @click="switchToES6"
          >
            Use ES6
          </button>
        </div>
        <div v-else>
          <button
            id="useRustButton"
            ref="useRust"
            class="uiButton"
            @click="switchToRust"
          >
            Use WASM
          </button>
           
        </div>
        <div>
          <vue-speedometer
            id="Iterations"
            :value="meanItersPerMillisonds"
            :width="150"
            :height="100"
            :max-value="20000"
          />
          <label
            id="itersperms"
            align="center"
            for="Iterations"
          >Pixels per ms
          </label>
          <div v-if="paused">
            <button
              ref="resume"
              class="uiButton"
              @click="startAnimation"
            >
              Resume
            </button>
          </div>
          <div v-else>
            <button
              id="pauseButton"
              ref="pause"
              class="uiButton"
              @click="pauseAnimation"
            >
              Pause
            </button>
          </div>
          <button
            ref="next"
            class="uiButton"
            @click="resetAttractor(true)"
          >
            Next
          </button>
          <button
            class="uiButton"
            @click="doTestAttractor"
          >
            Test
          </button>
          
          <button
            id="about"
            class="uiButton"
            @click="doAbout"
          >
            About
          </button>

          
        </div>
      </div>
      <div v-else>
        <span>
          <button
            id="menubutton"
            style="float: left"
            class="close labeltag"
            @click="toggleMenuUp"
          >
            &#9776;
          </button>
        </span>
      </div>
      <div v-if="menuUp" />
      <div v-else>
        <myprogressbar
          id="firstshortprogressbar"
          class="shorty"
          size="small"
          :bar-color="pbarcolor"
          :bg-color="pbgcolor"
          :val="progress"
        />
        <myprogressbar
          id="secondprogressbar"
          class="shorty"
          size="small"
          :bar-color="tbarcolor"
          :bg-color="pbgcolor"
          :val="countdownpct"
        />
      </div>
    </span>
  </div>
</template>

<script>
/* eslint-disable no-console */
/* eslint-disable */ 
import myprogressbar from "vue-simple-progress";
import VueSpeedometer from "vue-speedometer";
import { AttractorObj } from "@davidsmaynard/attractor_iterator";
// import { memory } from "rust-wasm-attractor/rust_wasm_attractor_bg"
const logPerfArraySize = 6;
export default {
  components: {
    VueSpeedometer,
    myprogressbar
  },
  data() {
    return {
      // This is the CanvasRenderingContext that children will draw to.
      ctx: null,
      image: null,
      imageData: null,
      putImageData: null,
      data: null,
      randomize: 0, // 0 randomize, 1 test case, 2 same as last
      frames: 0,
      iters: 0,
      paused: false,
      startNewAttractor: true,
      displayDelayDefault: 600,
      displayDelay: 0,
      initialIterations: 10000,

      pbarcolor: "rgba(0,200,0,0.5)",
      tbarcolor: "rgba(240,180,0,0.5)",

      pbgcolor: "rgba(255, 225, 255, 0.0)",
      elapsedCPU: 0,
      enoughMaxed: 10.0, // quit when 10% of the pixels touched have maxed out
      progress: 0,
      menuUp: true,
      prevMaxed: 0,
      prevTouched: 0,
      nFramesSame: 0,
      window: {
        width: 0,
        height: 0,
      },
      x: 0.1,
      y: 0.1,
      animationRequestID: null,
      msFrameBudget: 13, // should be less than 16 for 60 fps.
      att: null,
      framePerfs: new Array(2 ** logPerfArraySize),
      meanItersPerMillisonds: 0,
      countdownpct: 0,
      wasmPromise: null,
      wasm: null,
      wasmbg: null,
      useRust: false,
      language: "ES6 to Javascript",
      aboutUrl:
        "https://github.com/dmaynard/chaos-screen-saver/blob/master/README.md",
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

    // this.wasmPromise = import("File ../../../rust/rust-wasm-attractor")
    this.wasmPromise = import("@davidsmaynard/rust-wasm-attractor")
      .then((wasm) => {
        this.wasm = wasm;
      })
      .catch((err) => alert("Failed to load wasm module" + err));
    import("@davidsmaynard/rust-wasm-attractor/rust_wasm_attractor_bg.wasm")
      .then((wasmbg) => {
        this.wasmbg = wasmbg;
      })
      .catch((err) => alert("Failed to load wasmbg module" + err));
      
    this.att = this.allocAttractorObj();
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
        this.randomize = 2;
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

      this.prevMaxed = this.att ? this.att.getn_maxed() : 0;
      this.prevTouched = this.att ? this.att.getn_touched() : 0;
      if (this.startNewAttractor) {
        this.startTime = performance.now();
      }

      this.iterateAttractor(
        this.startNewAttractor,
        this.randomize,
      );
      this.startNewAttractor = false;
      if (this.att.getn_touched() > 0 && this.att.getn_touched() < 500) {
        this.startNewAttractor = true;
        this.displayDelay = 0;
      }
      if (
        this.att.getn_touched() == this.prevTouched &&
        this.att.getn_maxed() == this.prevMaxed
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

      let percentMaxed = (this.att.getn_maxed() * 100) / this.att.getn_touched();
      this.progress = Math.min((percentMaxed * 100) / this.enoughMaxed, 100);
      this.calculateProgress(this.displayDelay);
      if (percentMaxed > this.enoughMaxed) {
        this.startNewAttractor = true;
        this.displayDelay =
          this.att.getn_touched() > 5000 ? this.displayDelayDefault : 0;
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
      // window.greet();
      this.paused = true;
    },
  
    doToggleRust() {

    },
    
    switchToRust () {
        this.useRust = true;
        this.language = "Rust compiled to WASM (Web Assembly)";
        this.randomize = 2; 
        this.resetAttractor();
    },
     switchToES6 () {
        this.useRust = false;
        this.language = "ES6 to Javascript";
        this.randomize = 2; 
        this.resetAttractor();
    },

    resetAttractor() {
      if (this.paused) {
        this.paused = false;
        // this.animationRequestID = window.requestAnimationFrame(this.doAnimation);
      }
      this.displayDelay = 0;
      this.startNewAttractor = true;
    },

    iterateAttractor(init, randomize) {
      // let nx = 0;
      // let ny = 0;
      let msElapsed = 1;
      let loopCount = 0;

      if (init) {
        this.frames = 0;
        this.att = this.allocAttractorObj(
          this.width,
          this.height
        );
    
      }
      let startTime = performance.now();
      loopCount = this.att.calculate_frame(
        this.msFrameBudget,
        init,
        this.initialIterations
      );
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
    doAbout() {
      window.open(
        this.aboutUrl,
        "_blank" // <- This is what makes it open in a new window.
      );
    },
    doTestAttractor() {
      this.randomize = 1;
      this.startNewAttractor = true;
      this.att.calculate_frame(this.msFrameBudget, true, this.initialIterations);
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
   allocAttractorObj( w, h) {
      switch (this.randomize) {
	       case 0:
          this.a = 3.0 * (Math.random() * 2.0 - 1.0);
          this.b = 3.0 * (Math.random() * 2.0 - 1.0);
          this.c = Math.random() * 2.0 - 1.0 + 0.5;
          this.d = Math.random() * 2.0 - 1.0 + 0.5;
	        break;
	      case  1:
          this.a =  -2.3983540752995394;
          this.b = -1.8137134453341095;
          this.c = 0.010788338377923257;
          this.d = 1.0113015602664608;
          this.randomize = 0;
	        break;
	      case  2:
	         break;   
       default:
       }
      if (this.useRust) {
        if (this.att) {
          this.att.free_pixels();  // free the previous pixel buffer
        }
       let ao = this.wasm.AttractorObj.new( this.width, this.height, this.x, 
                this.y, this.a, this.b, this.c, this.d);
       const dataPtr = ao.pixels();
       ao.data = new Uint8Array(this.wasmbg.memory.buffer, dataPtr, this.width * this.height*4);
       this.imageData.data.set(ao.data);
       this.ctx.putImageData(this.imageData, 0, 0);
       this.randomize = 0;
       return ao;

      } else
       this.randomize = 0;
       return new AttractorObj( this.width,this.height, this.x, 
                this.y, this.a, this.b, this.c, this.d);
     
    },
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
  font-size: 14px;
}

#itersperms {
  display: block;
  background: rgba(255, 255, 255, 255);
  margin-bottom: 10px;
}
#Iterations {
  display: block;
  background: rgba(255, 255, 255, 255);
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
#about {
  display: block;
  height: 30px;
  font-size: 14px;
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
p {
  font-size: 14px;
}
</style>
