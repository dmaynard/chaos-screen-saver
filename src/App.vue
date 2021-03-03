<template>
  <div id="app" style="padding: 0px">

    <!-- These are the custom components we'll create -->
    <!-- Values for `my-box` are percentages of the width of the canvas. -->
    <!-- Each bar will take up an equal space of the canvas. -->
    <chaos-canvas style="width: 100%; height: 100%;">
    </chaos-canvas>


  </div>
</template>

<script>
import Vue from 'vue';
import ChaosCanvas from './components/ChaosCanvas.vue';
Vue.config.errorHandler = function(err, vm, info) {

  alert(`Error: ${err.toString()}\nInfo: ${info}`)
}

export default {
  name: 'app',
  components: {
    ChaosCanvas
  },

  data () {
    return {
      darkmode: false
    }
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
}

#app {
  position: relative;
  height: 100vh;
  width: 100vw;
  padding: 20px;
  box-sizing: border-box;

}

</style>
