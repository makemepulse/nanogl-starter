<template>
  <div id="app">
    <GLView/>
    <SampleSelector/>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import GLView from './components/GLView.vue'
import SampleSelector from './components/SampleSelector.vue'


@Options({
  components: {
    SampleSelector,
    GLView,
  },
})
export default class App extends Vue {}

</script>

<style lang="stylus">

body, html
  margin 0

#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
  width 100vw
  height 100vh

</style>
