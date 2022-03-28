<template>
  <div class="container">
    <div class="btns">
      <input type="file" @change="onUpload" />
      <button @click="onRedo">redo</button>
      <button @click="onUndo">undo</button>
      <button @click="onRotate(90)">rotate 90°</button>
      <button @click="onRotate(-90)">rotate -90°</button>
      <select v-model="action" @change="onActionChange(action)">
        <option
          v-for="(item, i) in actions"
          :key="i"
          :value="item.value"
          :label="item.label"
        />
      </select>
      brightness:
      <input
        type="range"
        min="-100"
        max="100"
        v-model="brightness"
        @change="onFilter('brightness')"
        style=""
      />
      contrast:
      <input
        type="range"
        min="-100"
        max="100"
        v-model="contrast"
        @change="onFilter('contrast')"
        style=""
      />
      saturation:
      <input
        type="range"
        min="-100"
        max="100"
        v-model="saturation"
        @change="onFilter('saturation')"
        style=""
      />
      hue:
      <input
        type="range"
        min="0"
        max="100"
        v-model="hue"
        @change="onFilter('hue')"
        style=""
      />
      sharpen:
      <input
        type="range"
        min="-100"
        max="100"
        v-model="sharpen"
        @change="onFilter('sharpen')"
        style=""
      />
    </div>
    <div id="image-editor"></div>
    <div class="father">
      <div class="child">
        <div class="grandchild"></div>
      </div>
    </div>
    <div>
      <ul>
        <li>旋转后draw旋转问题</li>
        <li>放大缩小后鼠标事件移动像素尺寸问题</li>
      </ul>
    </div>
  </div>
</template>

<script>
import ImageEditor from "@/js/ImageEditor/index";
import Rotate from "@/js/ImageEditor/operate/rotate";
import Filter from "@/js/ImageEditor/operate/filter";
import Action from "@/js/ImageEditor/action";
export default {
  data() {
    return {
      img: "",
      imageEditor: null,
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      sharpen: 0,
      action: Action.NONE,
      actions: [
        { label: "none", value: Action.NONE },
        { label: "crop", value: Action.CROP },
        { label: "draw", value: Action.DRAW },
        { label: "drop", value: Action.DROP },
        { label: "shape", value: Action.SHAPE },
        { label: "text", value: Action.TEXT },
      ],
    };
  },
  mounted() {
    this.initCaman();
    this.imageEditor = new ImageEditor("#image-editor");
    const father = document.querySelector('.father')
    const child = document.querySelector('.child')
    const grandchild = document.querySelector('.grandchild')
    father.addEventListener('mousedown',()=>{
      console.log('father')
    })
    child.addEventListener('mousedown',()=>{
      console.log('child')
    })
    grandchild.addEventListener('mousedown',()=>{
      console.log('grandchild')
    })
  },
  methods: {
    onActionChange(val) {
      console.log(val);
      this.imageEditor.setAction(val);
    },
    onFilter(type) {
      // eslint-disable-next-line no-undef
      this.imageEditor.add(new Filter(Caman, type, this.brightness));
    },
    initCaman() {
      const caman = document.createElement("script");
      caman.type = "text/javascript";
      caman.src = "https://c.vanceai.com/script/caman.full.js";
      document.head.appendChild(caman);
      const d3 = document.createElement("script");
      d3.type = "text/javascript";
      d3.src = "https://c.vanceai.com/script/d3.js";
      document.head.appendChild(d3);
    },
    onRedo() {
      this.imageEditor.redo();
    },
    onUndo() {
      this.imageEditor.undo();
    },
    onRotate(deg) {
      this.imageEditor.add(new Rotate(deg));
    },
    async onUpload(e) {
      const file = e.target.files[0];
      const dataurl = await this.fileToDataURL(file);
      const blob = this.dataURLToBlob(dataurl);
      const imgpath = this.blobToImagePath(blob);
      const image = new Image();
      image.src = imgpath;
      image.onload = () => {
        this.img = image;
        this.imageEditor.loadImage(image);
      };
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
    blobToImagePath(blob) {
      return window.URL.createObjectURL(blob);
    },
    imagePathToImage(imagePath) {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = imagePath;
        img.onload = () => {
          resolve(img);
        };
      });
    },
    canvaToDataURL(canvas) {
      return canvas.toDataURL("image/png");
    },
  },
};
</script>

<style>
* {
  box-sizing: border-box;
}
.container {
  display: flex;
  flex-direction: column;
}
.lower-canvas {
  border: 1px solid #000000;
}
.father {
  width: 300px;
  height: 300px;
  background: rgb(248, 211, 0);
  position: relative;
}
.child {
  width: 200px;
  height: 200px;
  background: rgb(0, 255, 42);
  position: absolute;
  left: 0;
  top: 0;
}
.grandchild {
  width: 100px;
  height: 100px;
  background: red;
  position: absolute;
  left: 0;
  top: 0;
}
</style>