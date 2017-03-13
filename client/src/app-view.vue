<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';

  @Component({
    name: 'AppView',
  })
  export default class AppView extends Vue {
  }
</script>
