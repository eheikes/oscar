<template>
  <footer @click="gotoLogs()">
    <span>Collectors</span>
    <span v-if="totalErrors === 0">OK</span>
    <span v-else>{{totalErrors}}</span>
  </footer>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Collector } from './database';

  @Component({
    name: 'OscarCollectorFooter',
  })
  export default class OscarCollectorFooter extends Vue {
    collectors: Collector[];
    totalErrors: number;

    private data () {
      return {
        collectors: [],
        totalErrors: 0
      }
    }

    private created() {
      database.getCollectors().then(collectors => {
        this.collectors = collectors;
        this.totalErrors = this.collectors.reduce((acc, collector) => {
          return acc + collector.numErrors;
        }, 0);
      });
    }

    public gotoLogs() {
      this.$router.push({ name: 'collectors' });
    }
  }
</script>
