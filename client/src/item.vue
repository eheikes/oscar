<template>
  <div class="oscar-item">
    <div v-if="item">
      <div class="badge">
        <div class="rank">
          <a href="#ranking-modal" @click="openRankingModal()">
            <span v-if="item.expectedRank">{{item.expectedRank | toFixed}}</span>
            <span class="rank" v-else>{{item.rank | toFixed}}</span>
          </a>
        </div>
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
    <div id="ranking-modal" class="modal">
      <div class="modal-content">
        <h4>Set New Rank</h4>
        <div class="input-field">
          <input id="ranking-value" type="number" class="validate">
          <label for="ranking-value">Rank</label>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="saveRanking()" class="waves-effect waves-light btn">Save</button>
      </div>
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
  .oscar-item .badge .rank a {
    cursor: pointer;
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
  import { readableDate, toFixed } from './filters';

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

    private mounted() {
      $('#ranking-modal').modal('init');
    }

    private openRankingModal() {
      $('#ranking-modal').modal('open');
    }

    private saveRanking() {
      let newRank = $('#ranking-value').val();
      database.setRank(
        this.$route.params.type,
        Number(this.$route.params.item),
        newRank
      ).then(item => {
        this.item = item;
        $('#ranking-modal').modal('close');
      });
    }
  }
</script>
