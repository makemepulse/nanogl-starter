

<template>
  <div class="glview">
  </div>
</template>



<script lang="ts">

import Vue from 'vue'
import Component from 'vue-class-component';
import GLApp from "@webgl/index";

@Component
export default class GLView extends Vue {

  loaded = false
  isdestroyed = false

  viewer: GLApp


  mounted(): void {
    this.isdestroyed = false
    this.viewer = GLApp.getInstance()
    this.viewer.load().then( this.onLoaded )

    this.$el.appendChild( this.viewer.glview.canvas )
  }

  destroyed():void{
    this.isdestroyed = true
    this.viewer.stop()
  }


  onLoaded(): void {
    if( this.isdestroyed ) return
    this.viewer.start()
    this.loaded = true
  }


}

</script>



<style lang="stylus">

.glview 
  position absolute
  top 0
  left 0

  canvas 
    width 100vw
    height 100vh
    position absolute
    top 0
    left 0

  
</style>