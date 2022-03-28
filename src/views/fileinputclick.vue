<template>
<div>
  <input type="file" id="file"/>
  <button @click="onclick">111</button>
  </div>
</template>

<script>
export default {
  mounted(){
    const i = document.getElementById('file')
    console.log(i)
    i.click()
  },
  methods: {
    onclick(){
      const i = document.createElement('input')
    i.setAttribute('type', 'file')
    i.click()
    }
  }
}
</script>

<style>

</style>