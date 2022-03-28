<template>
  <div id="app">
    <GLView/>
  </div>
</template>


<script lang="ts">
import { Options, Vue } from 'vue-class-component'
import GLView from './components/GLView.vue'


@Options({
  components: {
    GLView,
  },
})
export default class App extends Vue {}

</script>

<style lang="stylus" scoped>
#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  margin-top 60px

</style>
