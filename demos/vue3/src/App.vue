<script setup lang="ts">
import { onMounted } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import EpubElement from '@epub-element/element';

onMounted(() => {
  EpubElement.openEpub('history.epub', {}).then((ins: any) => {
    console.log('EpubElement', ins);
    ins.mount(document.getElementById('epub'), {
      orientation: 'portrait', // landscape
      loadmethod: 'dynamic', // full
      readmode: 'continuous', // pagination
    });
  });
});
</script>

<template>
  <div class="book-wrap">
    <div id="epub"></div>
  </div>
  <HelloWorld msg="epub-element's vue test" />
</template>

<style scoped>
.book-wrap {
  width: 800px;
  height: 1040px;
  margin: 200px auto;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.6);
}
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
