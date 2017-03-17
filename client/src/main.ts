import Vue from 'vue';

import AppHeader from './app-header.vue';
import AppView from './app-view.vue';
import Chooser from './chooser.vue';
import CollectorFooter from './collector-footer.vue';
import Collectors from './collectors.vue';
import Item from './item.vue';
import Items from './items.vue';
import Logs from './logs.vue';

// Register all the components.
Vue.component('app-header', AppHeader);
Vue.component('app-view', AppView);
Vue.component('oscar-chooser', Chooser);
Vue.component('oscar-collector-footer', CollectorFooter);
Vue.component('oscar-collectors', Collectors);
Vue.component('oscar-item', Item);
Vue.component('oscar-items', Items);
Vue.component('oscar-logs', Logs);

import VueRouter from 'vue-router';

Vue.use(VueRouter);

export const routes = [
  { name: 'choose', path: '/', component: Chooser },
  { name: 'items', path: '/items/:type', component: Items },
  { name: 'item', path: '/items/:type/:item', component: Item },
  { name: 'collectors', path: '/collectors', component: Collectors },
  { name: 'logs', path: '/collectors/:collector', component: Logs },
];

export const router = new VueRouter({
  routes
});

let app = new Vue({router}).$mount('#app');
