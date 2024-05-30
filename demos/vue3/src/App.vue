<script setup lang="ts">
import { onMounted } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import EpubElement from '@epub-element/element';

onMounted(() => {
  EpubElement.openEpub('history.epub', {}).then((ins: any) => {
    console.log('EpubElement', ins);
    ins.mount(document.getElementById('epub'), {
      layout: 'paginated',
      virtual: true,
      orientation: 'vertical',
      class: 'test-style',
    });
  });

  document.querySelector('.book-wrap')!.addEventListener('rendered', (e) => {
    const target = (e as CustomEvent).detail.target;

    console.log(target.width, target.height);
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
  width: 600px;
  height: 800px;
  margin: 80px auto;
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
