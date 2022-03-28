import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Compress from '../views/compress.vue'
import Filesize from '../views/filesize.vue'
import imagecache from '../views/imagecache.vue'
import canvastoimg from '../views/canvastoimg.vue'
import fileinputclick from '../views/fileinputclick.vue'
import imageeditordemo from '../views/imageeditordemo.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/compress',
    name: 'compress',
    component: Compress
  },
  {
    path: '/filesize',
    name: 'filesize',
    component: Filesize
  },
  {
    path: '/imagecache',
    name: 'imagecache',
    component: imagecache
  },
  {
    path: '/canvastoimg',
    name: 'canvastoimg',
    component: canvastoimg
  },
  {
    path: '/fileinputclick',
    name: 'fileinputclick',
    component: fileinputclick
  },
  {
    path: '/imageeditordemo',
    name: 'imageeditordemo',
    component: imageeditordemo
  },
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
