import Vue from 'vue';

import AppHeader from './app-header.vue';
import AppView from './app-view.vue';
import Chooser from './chooser.vue';
import Item from './item.vue';
import Items from './items.vue';

// Register all the components.
Vue.component('app-header', AppHeader);
Vue.component('app-view', AppView);
Vue.component('oscar-chooser', Chooser);
Vue.component('oscar-item', Item);
Vue.component('oscar-items', Items);

import VueRouter from 'vue-router';

Vue.use(VueRouter);

export const routes = [
  { name: 'choose', path: '/', component: Chooser },
  { name: 'items', path: '/items/:type', component: Items },
  { name: 'item', path: '/items/:type/:item', component: Item },
];

export const router = new VueRouter({
  routes
});

let app = new Vue({router}).$mount('#app');
