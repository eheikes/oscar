<template>
  <ul class="oscar-logs collection">
    <li class="collection-item" v-for="item in logs">
      <div class="title">{{item.timestamp | readableTime}}</div>
      <pre>{{item.log}}</pre>
    </li>
  </ul>
</template>

<style>
  .oscar-logs .title {
    font-weight: bold;
  }
</style>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, CollectorLog } from './database';

  const readableTime = (val?: string) => {
    if (!val) { return ''; }
    let date = new Date(val);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  @Component({
    name: 'OscarLogs',
    filters: { readableTime }
  })
  export default class OscarLogs extends Vue {
    logs: CollectorLog[];

    private data () {
      return {
        logs: []
      }
    }

    private created() {
      database.getCollectorLogs(this.$route.params.collector).then(logs => {
        this.logs = logs;
      });
    }
  }
</script>
