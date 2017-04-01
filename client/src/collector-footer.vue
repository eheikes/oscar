<template>
  <footer class="grey lighten-2" @click="gotoLogs()" v-if="$route.name === 'choose'">
    <div class="row">
      <div class="col s9">Collectors</div>
      <div class="col s3 white-text green lighten-2" v-if="totalErrors === 0">OK</div>
      <div class="col s3 white-text red lighten-2" v-else>{{totalErrors}} errors</div>
    </div>
  </footer>
</template>

<style>
  footer {
    cursor: pointer;
    flex: 0 1 auto;
  }
  footer .row {
    margin-bottom: 0;
  }
  footer .row .col {
    padding-top: 0.5em;
    padding-bottom: 0.5em;
  }
  footer .row .col:nth-of-type(2) {
    text-align: right;
  }
</style>

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
