<template>
  <ul>
    <li v-for="item in logs">
      <div class="title">{{item.timestamp}}</div>
      <div>{{item.log}}</div>
    </li>
  </ul>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, CollectorLog } from './database';

  @Component({
    name: 'OscarLogs',
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
