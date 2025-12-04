<script setup>
import { ref } from "vue";

const count = ref(5);

const create = () => {
  parent.postMessage(
    { pluginMessage: { type: "create-rectangles", count: count.value } },
    "*"
  );
};

const cancel = () => {
  parent.postMessage({ pluginMessage: { type: "cancel" } }, "*");
};
</script>

<template>
  <h2>Rectangle Creator</h2>
  Count: <input v-model="count" />
  <div class="operate">
    <button @click="create"><AddIcon />Create</button>
    <button @click="cancel">Cancel</button>
  </div>
</template>
<style>
.operate {
    display: flex;
    gap: 16px;
}
</style>
