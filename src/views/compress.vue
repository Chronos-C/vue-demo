<template>
  <div>
    <input
      type="file"
      id="file"
      name="file"
      @change="onUpload"
      accept="image/*"
    />
    <div ref="origin" class="img-box" v-if="originImg">
      <p>origin image</p>
      <p>size:{{ computedFileSize(originSize) }}</p>
      <img class="img" :src="originImg" />
    </div>
    <div ref="result" class="result">
      <div
        class="img-box"
        v-for="(item, i) in resultList.sort((a, b) => a.quality - b.quality)"
        :key="i"
      >
        <p>quality:{{ item.quality }}</p>
        <p>size:{{ computedFileSize(item.size) }}</p>
        <img class="img" :src="item.result" @click="onPreview(item)" />
      </div>
    </div>
    <div class="img-preview-mask" v-if="visible">
      <div class="img-preview">
        <span class="close" @click="visible = false">X</span>
        <div class="img-preview-container">
          <div
            class="img-slider"
            :style="{ width: imgW + 'px', height: imgH + 'px' }"
            @mousemove="onMousemove"
            @mouseout="onMouseout"
          >
            <div
              class="img-preview-result"
              :style="{
                width: imgW + 'px',
                height: imgH + 'px',
                background: `url(${currentResult.result}) no-repeat`,
              }"
            ></div>
            <div
              ref="previewOrigin"
              class="img-preview-origin"
              :style="{
                width: imgW + 'px',
                height: imgH + 'px',
                background: `url(${originImg}) no-repeat`,
              }"
            ></div>
            <div ref="line" class="line"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Compressor from "compressorjs";

export default {
  data() {
    return {
      originImg: "",
      originSize: 0,
      resultList: [],
      visible: false,
      currentResult: null,
      imgW: 0,
      imgH: 0,
    };
  },
  methods: {
    onMousemove(e) {
      console.log(e.clientX);
      const x = e.clientX;
      const previewOrigin = this.$refs.previewOrigin;
      const line = this.$refs.line;
      previewOrigin.style.width = x + "px";
      line.style.left = x + "px";
    },
    onMouseout() {
      // const previewOrigin = this.$refs.previewOrigin
    },
    onPreview(item) {
      this.currentResult = item;
    //   this.visible = true;
    },
    computedFileSize(size) {
      if (!size) {
        return 0;
      }
      return (size / 1024).toFixed(2) + "kb";
    },
    async onUpload(e) {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      this.resultList = [];
      this.originImg = await this.fileToDataURL(file);
      const img = new Image();
      img.src = this.originImg;
      img.onload = () => {
        this.imgW = img.width;
        this.imgH = img.height;
      };
      this.originSize = file.size;
      for (let i = 0; i < 10; i++) {
        const _this = this;
        const quality = Number((i * 0.1).toFixed(1));
        new Compressor(file, {
          quality: quality,
          async success(res) {
            console.log(res);
            _this.resultList.push({
              quality: quality,
              size: res.size,
              result: await _this.fileToDataURL(res),
            });
          },
        });
      }
    },
    fileToDataURL(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          resolve(e.target.result);
        };
      });
    },
  },
};
</script>

<style scoped>
.img-box {
  box-sizing: border-box;
  width: 20%;
  padding: 0 10px;
}
.img {
  width: calc(100% - 20px);
  height: 300px;
  object-fit: contain;
}
.result {
  display: flex;
  flex-wrap: wrap;
}
.img-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99;
  width: 100vw;
  height: 100vh;
  background: #ffffffd7;
  display: flex;
  justify-content: center;
  align-items: center;
}
.img-preview {
  position: relative;
  width: calc(100vw - 100px);
  height: calc(100vh - 100px);
}
.close {
  position: absolute;
  z-index: 99;
  right: -20px;
  top: -30px;
  font-size: 20px;
}
.img-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.img-preview-origin {
  position: absolute;
  z-index: 1;
  left: 0;
  top: 0;
}
.line {
  position: absolute;
  top: 0;
  z-index: 99;
  width: 2px;
  height: 100%;
  background: #000;
}
</style>