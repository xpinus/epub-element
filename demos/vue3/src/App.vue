<script setup lang="ts">
import { onMounted, ref } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import { EpubElement, EpubView, ShadowSelection } from 'epub-element';

let epubEl: any = null;
const elWidth = ref('600px');

onMounted(() => {
  EpubElement.openEpub('history.epub').then((ins: any) => {
    epubEl = ins;

    // 注册hooks
    // ins.hooks.content = (...args: any[]) => {
    //   console.log(args);
    // };

    // 事件监听
    ins.event.on('rendered', function () {
      // console.log('epub rendered');

      // 在view被创建后，添加对应dom的事件
      // 例如在选中后高亮内容
      var selecting = false;
      // 在使用mouseup等事件时要注意，mouse最终释放的位置，如果不是选中的view可能会导致错误
      ins.$el.shadowRoot.addEventListener('mouseup', (e: MouseEvent) => {
        // console.log(e.target);
        const view = e.target!;

        var selection = new ShadowSelection(view.shadowRoot);

        if (!selection.isCollapsed) {
          selecting = true;
          var range = selection.getRange();

          // 使用内置的批注插件，高亮选中
          var annotate = ins.plugins['annotate'];
          var annotation = annotate.add('highlight', range, ['highlight']);
          // annotation.element.addEventListener('click', (e) => {
          //   console.log('target', e.target);

          //   annotate.remove(annotation);
          // });
          // Clear the selection
          selection._selection.removeAllRanges();
          // Reset the selecting state in the next tick.
          setTimeout(function () {
            selecting = false;
          }, 0);
        }
      });
      // };
    });

    // 挂载
    ins.mount(document.getElementById('epub'), {
      layout: 'paginated',
      virtual: false,
      spread: elWidth.value == '1200px' ? true : false,
      plugins: [
        'annotate',
        'search',
        {
          name: 'theme',
          theme: 'default',
          register: {
            yellow: {
              rules: {
                body: [
                  ['color', '#000', true],
                  ['background', 'yellow', true],
                ],
              },
              containerStyle: 'background-color: yellow;',
            },
          },
        },
      ],
    });
  });
});

function handleSearch() {
  epubEl?.plugins['search'].search('先生').then((res) => {
    // console.log('搜索结果:', res);
    // console.log(res.map((item) => item.annoation.cfi.toString()));
  });
}

function handleNext() {
  epubEl?.plugins['search'].nextMatch();
}

function handlePrev() {
  epubEl?.plugins['search'].prevMatch();
}

function changeTheme(theme: string) {
  epubEl?.plugins['theme'].active(theme);
}
</script>

<template>
  <div class="book-wrap">
    <div id="epub"></div>
  </div>
  <HelloWorld msg="epub-element's vue test" />
  <div class="search-test">
    <button @click="handleSearch">搜索</button>
    <input
      type="text"
      name=""
      id="searchInput"
    />
    <button @click="handlePrev">上一个</button>
    <button @click="handleNext">下一个</button>
  </div>
  <div class="themes-wrap">
    <button @click="changeTheme('yellow')">默认</button>
    <button @click="changeTheme('light')">白天</button>
    <button @click="changeTheme('dark')">黑夜</button>
    <button @click="changeTheme('eye')">护眼</button>
  </div>
</template>

<style scoped>
.book-wrap {
  width: v-bind(elWidth);
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

<style>
.highlight {
  fill: #44c99080;
}
</style>
