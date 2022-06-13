
<template>
  <div class="selector" :class={opened} >
    <h1 @click="toggle">{{currentScene}}</h1>
    <div class="list" v-if="opened">
      <a href="#" class="item" v-for="scene in scenes" :key="scene" @click.prevent="setScene(scene)">
        {{scene}}
      </a>
    </div>
    

  </div>
</template>


<script lang="ts" setup>

import { ref } from "@vue/reactivity";
import { onMounted } from "@vue/runtime-core";
import GLApp from "@webgl/GLApp";
import { SampleScenes, SceneTypes } from "@webgl/samples/SamplesSelector";

const Ids: SceneTypes[] = Object.keys(SampleScenes) as SceneTypes[]

const opened = ref( false )
const scenes = ref( Ids )
const currentScene = ref( Ids[0] )

onMounted(() => {
  let sn = decodeURI(window.location.hash.substring(1)) as SceneTypes
  if( !Ids.includes(sn) ) {
    sn = 'Materials - Clearcoat'
  }
  currentScene.value = sn
  setScene( sn )
})

const setScene = ( scene: SceneTypes )=>{
  currentScene.value = scene
  opened.value = false
  window.location.hash = scene
  GLApp.getInstance().renderer.samples.setScene( scene )
}

const toggle = ()=>{
  opened.value = !opened.value
}

</script>


<style lang="stylus" scoped>

.selector
  position relative
  display flex
  flex-direction column
  color white
  width 340px
  height 100%
  pointer-events none
  background transparent

  &.opened
    background rgba(black,0.8)

  h1
    display inline-flex
    position relative
    pointer-events: auto
    font-size 1.5em
    cursor pointer
    padding 20px

.list

  pointer-events: auto
  display flex
  flex-direction column

  .item
    padding 5px 20px
    color white
    text-decoration none
    border-top 1px solid rgba(white,.1)

    &:hover
      background rgba(white,.1)

</style>