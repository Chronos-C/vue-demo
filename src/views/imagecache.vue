<template>
  <div>
    <img :src="url"/>
    <button @click="onDownload">download</button>
  </div>
</template>

<script>
export default {
  name:'imagecache',
  data(){
    return {
      url:'',
      img:null
    }
  },
  mounted(){
    this.img = new Image()
    this.img.src = 'http://10.10.2.147:8199/api/v2/preview?web=vanceai&guest_token_v2=bc91cf1a3ba35a674ff6c4acbe68f5f6&trans_id=9e9626ae57fffed8b5809503eb72d9fe'
    this.img.setAttribute("crossOrigin",'Anonymous')
    this.img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = this.img.width
      canvas.height = this.img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(this.img,0,0,canvas.width,canvas.height)
      const blob = this.dataURLToBlob(canvas.toDataURL("image/png"))
      const path = this.blobToImagePath(blob)
      this.url = path
      this.onDownload(path)
    }
  },
  methods:{
     blobToImagePath(blob) {
      return window.URL.createObjectURL(blob);
    },
     dataURLToBlob(dataURL) {
      let arr = dataURL.split(",");
      let data = window.atob(arr[1]);
      let mime = arr[0].match(/:(.*?);/)[1];
      let ia = new Uint8Array(data.length);
      for (var i = 0; i < data.length; i++) {
        ia[i] = data.charCodeAt(i);
      }
      return new Blob([ia], { type: mime });
    },
    onDownload(path){
      const link = document.createElement('a') // 创建a标签
        link.href = path || this.url
        link.download = 'xxx.png'
        link.click()
    }
  }
}
</script>

<style>

</style>