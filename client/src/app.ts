import Vue = require('vue');

Vue.component('app-nav', {
  template: '<div></div>'
});

Vue.component('app-view', {
  template: '<div></div>'
});

Vue.component('oscar-chooser', {
  methods: {
    gotoList: function() {
      // tslint:disable-next-line:no-console
      console.log('going to list');
    }
  },
  props: ['types'],
  template: `
    <div>
      <p>
        I want to
        <select>
          <option v-for="type in types" :value="type.id">{{type.readable ? type.readable : type.id}}</option>
        </select>
        something.
      </p>
      <input type="button" value="Go" @click="gotoList">
    </div>
  `
});

let app = new Vue({
  el: '#app',
  created: function() {
    // load types, set to this.types
  },
  data: {
    types: [{
      id: 'read',
      readable: null,
    }, {
      id: 'watch',
      readable: null,
    }, {
      id: 'interact',
      readable: 'play with',
    }]
  }
});
