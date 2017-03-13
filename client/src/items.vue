<template>
  <div>
    <div v-if="items.length === 0">
      No items yet!
    </div>
    <div v-for="item in items" @click="gotoItem(item.id)">
      <div>{{item.rank}}</div>
      <div>{{item.title}}</div>
      <div>{{item.url}}</div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Item } from './database';

  @Component({
    name: 'OscarItems',
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
