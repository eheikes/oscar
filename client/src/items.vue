<template>
  <div class="oscar-items">
    <div v-if="items.length === 0">
      No items yet!
    </div>
    <ul class="collection" v-if="items.length > 0">
      <li class="collection-item" v-for="item in items" @click="gotoItem(item.id)">
        <span class="badge">{{item.rank | toFixed}}</span>
        <div class="title">{{item.title}}</div>
        <div>{{item.url}}</div>
      </li>
    </ul>
  </div>
</template>

<style>
  .oscar-items .collection-item {
    cursor: pointer;
  }
  .oscar-items .collection-item span.badge {
    font-size: 200%;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
</style>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Item } from './database';

  const toFixed = (val?: string) => {
    if (!val) { return ''; }
    let num = Number(val);
    return num.toFixed(1);
  };

  @Component({
    name: 'OscarItems',
    filters: { toFixed }
  })
  export default class OscarItems extends Vue {
    items: Item[];

    private data () {
      return {
        items: []
      }
    }

    private created() {
      database.getItems(this.$route.params.type).then(items => {
        this.items = items;
      });
    }

    public gotoItem(itemId: number) {
      let id = String(itemId);
      this.$router.push({ name: 'item', params: {
        type: this.$route.params.type,
        item: id
      }})
    }
  }
</script>
