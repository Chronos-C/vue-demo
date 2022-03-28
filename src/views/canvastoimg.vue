<template>
  <div>
    <canvas ref="canvas"></canvas>
    <button @click="onExport">export</button>
  </div>
</template>

<script>
export default {
  data(){
    return {
      canvas:null
    }
  },
  mounted(){
    this.canvas = this.$refs.canvas
    this.drawImg()
  },
  methods: {
    drawImg(){
      const ctx = this.canvas.getContext('2d')
      const img = new Image()
      img.setAttribute("crossOrigin",'Anonymous')
      img.src = 'https://c.vanceai.com/assets/images/index/banner_after-219dc17310.png'
      img.onload = () => {
        ctx.drawImage(img,0,0,img.width,img.height)
      }
    },
    onExport(){
      this.canvas.toBlob((blob) => {
        const path = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = path
        a.download = 'image.jpeg'
        a.click()
      },'image/jpeg')
      
    }
  }
}
</script>

<style>

</style>