<template>
  <div>
    <span v-if="$route.name === 'choose'">OSCAR</span>
    <span v-else-if="$route.name === 'items'">{{$route.params.type | capitalize}}</span>
    <span v-else-if="$route.name === 'item'">{{title}}</span>
    <span v-else>{{$route.name | capitalize}}</span>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database } from './database';

  const capitalize = (str?: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  @Component({
    name: 'AppHeader',
    filters: { capitalize }
  })
  export default class AppHeader extends Vue {
    title: string|null;

    private data () {
      return {
        title: null
      }
    }

    created() {
      if (this.$route.name === 'item') {
        let itemId = Number(this.$route.params.item);
        database.getItem(this.$route.params.type, itemId).then(item => {
          this.title = item.title;
        });
      }
    }
  }
</script>
