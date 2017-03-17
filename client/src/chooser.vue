<template>
  <div>
    <p>
      I want to
      <select v-model="selectedType">
        <option v-for="type in types" :value="type.id">{{type.readable ? type.readable : type.id}}</option>
      </select>
      something.
    </p>
    <input type="button" value="Go" @click="gotoItems">
    <oscar-collector-footer></oscar-collector-footer>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { database, Type } from './database';

  @Component({
    name: 'OscarChooser',
  })
  export default class OscarChooser extends Vue {
    types: Type[];
    selectedType: string;

    private data () {
      return {
        selectedType: '',
        types: []
      }
    }

    private created() {
      database.getTypes().then(types => {
        this.types = types;
        if (this.types && this.types.length > 0) {
          this.selectedType = this.types[0].id;
        }
      });
    }

    public gotoItems() {
      this.$router.push({ name: 'items', params: { type: this.selectedType }})
    }
  }
</script>
