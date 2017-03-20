<template>
  <div class="oscar-item">
    <div v-if="item">
      <div class="badge">
        <div class="rank" v-if="item.expectedRank">{{item.expectedRank | toFixed}}</div>
        <div class="rank" v-else>{{item.rank | toFixed}}</div>
        <div v-if="!item.expectedRank">Best Guess</div>
      </div>
      <div class="subtitle"><a :href="item.url" target="_blank">{{item.url}}</a></div>
      <div class="details grey-text text-darken-1">
        <span v-if="item.author">{{item.author}}</span>
        <span>{{item.added | readableDate}}</span>
        <span v-if="categories">{{categories}}</span>
        <span v-if="item.rating">{{item.rating}} stars</span>
        <span v-if="item.length">Length {{item.length}}</span>
        <span v-if="item.due">Due {{item.due | readableDate}}</span>
      </div>
      <div class="flow-text" v-if="item.summary">{{item.summary}}</div>
    </div>
  </div>
</template>

<style>
  .oscar-item .badge {
    float: right;
  }
  .oscar-item .badge .rank {
    font-size: 200%;
    text-align: center;
  }
  .oscar-item .subtitle {
    font-size: 125%;
    font-weight: bold;
  }
  .oscar-item .details span:not(:first-child) {
  }
  .oscar-item .details span:not(:first-child)::before {
    content: "•";
    margin-right: 0.25em;
  }
</style>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Item } from './database';

  const readableDate = (val?: string) => {
    if (!val) { return ''; }
    let date = new Date(val);
    return date.toLocaleDateString();
  };

  const toFixed = (val?: string) => {
    if (!val) { return ''; }
    let num = Number(val);
    return num.toFixed(1);
  };

  @Component({
    name: 'OscarItem',
    filters: { readableDate, toFixed }
  })
  export default class OscarItem extends Vue {
    item: Item|null;
    categories: string;

    private data () {
      return {
        categories: '',
        item: null
      }
    }

    private created() {
      let itemId = Number(this.$route.params.item);
      database.getItem(this.$route.params.type, itemId).then(item => {
        this.item = item;
        this.categories = this.item.categories.length > 0 ?
          this.item.categories.join(', ') :
          '';
      });
    }
  }
</script>
