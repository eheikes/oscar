<template>
  <header class="navbar-fixed row">
    <nav class="col s12">
      <div class="nav-wrapper">
        <div href class="brand-logo">
          <a href class="back" v-if="$route.name !== 'choose'" @click="goBack()">‹</a>
          <span v-if="$route.name === 'choose'">OSCAR</span>
          <span v-else-if="$route.name === 'items'">{{$route.params.type | capitalize}}</span>
          <span v-else-if="$route.name === 'item'">{{title}}</span>
          <span v-else-if="$route.name === 'logs'">{{currentCollector}} Logs</span>
          <span v-else>{{$route.name | capitalize}}</span>
        </div>
      </div>
    </nav>
  </header>
</template>

<style>
  header a.back {
    padding-left: 0.25em;
    padding-right: 0.25em;
  }
</style>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Collector } from './database';

  const capitalize = (str?: string) => {
    if (!str) { return ''; }
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  @Component({
    name: 'AppHeader',
    filters: { capitalize }
  })
  export default class AppHeader extends Vue {
    collectors: Collector[];
    title: string|null;

    private data () {
      return {
        collectors: [],
        title: null
      }
    }

    private created() {
      database.getCollectors().then(collectors => {
        this.collectors = collectors;
      });
      if (this.$route.name === 'item') {
        let itemId = Number(this.$route.params.item);
        database.getItem(this.$route.params.type, itemId).then(item => {
          this.title = item.title;
        });
      }
    }

    private get currentCollector(): string {
      let matchingCollector = this.collectors.find(collector => {
        return (collector.id === this.$route.params.collector);
      });
      if (matchingCollector) {
        return matchingCollector.name;
      }
      return '';
    }

    private goBack() {
      this.$router.go(-1);
    }
  }
</script>
