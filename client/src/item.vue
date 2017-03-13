<template>
  <div>
    <div v-if="item">
      <div class="rank">
        <div>{{formattedRank}}</div>
        <div v-if="!item.expectedRank">Best Guess</div>
      </div>
      <div>{{item.url}}</div>
      <div class="details">
        <span v-if="item.author">{{item.author}}</span>
        <span>{{item.added}}</span>
        <span v-if="categories">{{categories}}</span>
        <span v-if="item.rating">{{item.rating}} stars</span>
        <span v-if="item.length">Length {{item.length}}</span>
        <span v-if="item.due">Due {{item.due}}</span>
      </div>
      <div v-if="item.summary">{{item.summary}}</div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Item } from './database';

  @Component({
    name: 'OscarItem',
  })
  export default class OscarItem extends Vue {
    item: Item|null;
    categories: string;
    formattedRank: string;

    private data () {
      return {
        categories: '',
        formattedRank: '',
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
        this.formattedRank = this.item.expectedRank ?
          this.item.expectedRank.toFixed(1) :
          this.item.rank.toFixed(1);
      });
    }
  }
</script>
