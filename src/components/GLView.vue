
<template>
  <div class="glview" :class="{windowed}" />
</template>


<script lang="ts">

import { Options, Vue } from 'vue-class-component';
import GLApp from "@webgl/GLApp";

@Options({})
export default class GLView extends Vue {
  windowed = false

  isdestroyed = false

  viewer!: GLApp


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
  }


}

</script>



<style lang="stylus">

.glview 
  position absolute
  top 0
  left 0
  touch-action none
  box-sizing border-box


  canvas 
    width 100vw
    height 100vh
    position absolute
    top 0
    left 0

  /** 
   * windowed - test canvas not fullscreen
   */
  &.windowed
    margin 200px 0
    padding 40px
    width 100%
    height 100%

    canvas 
      position initial
      width 100%
      height 100%

</style>