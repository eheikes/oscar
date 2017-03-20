<template>
  <div>
    <p>
      I want to
      <select class="input-field" v-model="selectedType">
        <option v-for="type in types" :value="type.id">{{type.readable ? type.readable : type.id}}</option>
      </select>
      something.
    </p>
    <button class="btn-large waves-effect waves-light" type="submit" @click="gotoItems">
      Go
    </button>
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

    private updated() {
      const select = $('select', this.$el);
      select.material_select();
      select.on('change', e => {
        this.selectedType = $(e.currentTarget).val();
      });
    }

    public gotoItems() {
      this.$router.push({ name: 'items', params: { type: this.selectedType }})
    }
  }
</script>
