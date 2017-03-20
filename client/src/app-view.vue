<template>
  <main class="row">
    <div class="col s12">
      <router-view></router-view>
    </div>
  </main>
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
