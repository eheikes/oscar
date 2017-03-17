<template>
  <ul>
    <li v-for="item in collectors" @click="gotoLogs(item.id)">
      <span>{{item.name}}</span>
      <span v-if="item.numErrors === 0">OK</span>
      <span v-else>{{item.numErrors}} errors</span>
    </li>
  </ul>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Collector } from './database';

  @Component({
    name: 'OscarCollectors',
  })
  export default class OscarCollectors extends Vue {
    collectors: Collector[];

    private data () {
      return {
        collectors: []
      }
    }

    private created() {
      database.getCollectors().then(collectors => {
        this.collectors = collectors;
      });
    }

    public gotoLogs(collectorId: string) {
      this.$router.push({ name: 'logs', params: {
        collector: collectorId
      }});
    }
  }
</script>
