<template>
  <div class="container">
    <div class="btns">
      <input type="file" @change="onUpload" />
      <button @click="onRedo">redo</button>
      <button @click="onUndo">undo</button>
      <button @click="onRotateCanvas(90)">rotate 90°</button>
      <button @click="onRotateCanvas(-90)">rotate -90°</button>
      rotate
      <input
        type="range"
        :min="-90"
        :max="90"
        v-model="rotate"
        @input="onRotate(rotate, false)"
        @change="onRotate(rotate, false)"
      />
      <input type="number" v-model="rotate" @change="onRotate(rotate, false)" />
      <select v-model="action" @change="onActionChange(action)">
        <option
          v-for="(item, i) in actions"
          :key="i"
          :value="item.value"
          :label="item.label"
        />
      </select>
      <select v-model="type" @change="onTypeChange(type)">
        <option
          v-for="(item, i) in types"
          :key="i"
          :value="item.value"
          :label="item.label"
        />
      </select>
      linewidth
      <input type="range" :min="1" :max="100" v-model="shapeConfig.lineWidth" />
      fillColor
      <input type="color" v-model="shapeConfig.fillColor" />
      color
      <input type="color" v-model="shapeConfig.lineColor" />
      opacity
      <input
        type="range"
        :min="0"
        :max="1"
        :step="0.01"
        v-model="shapeConfig.opacity"
      />
      brightness:
      <input
        type="range"
        :min="-100"
        :max="100"
        v-model="brightness"
        @change="onFilter('brightness')"
        style=""
      />
      contrast:
      <input
        type="range"
        :min="-100"
        :max="100"
        v-model="contrast"
        @change="onFilter('contrast')"
        style=""
      />
      saturation:
      <input
        type="range"
        :min="-100"
        :max="100"
        v-model="saturation"
        @change="onFilter('saturation')"
        style=""
      />
      hue:
      <input
        type="range"
        :min="0"
        :max="100"
        v-model="hue"
        @change="onFilter('hue')"
        style=""
      />
      sharpen:
      <input
        type="range"
        :min="-100"
        :max="100"
        v-model="sharpen"
        @change="onFilter('sharpen')"
        style=""
      />
    </div>
    <div class="image-editor-box">
      <div id="image-editor"></div>
    </div>
    <div class="father">
      <div class="child">
        <div class="grandchild"></div>
      </div>
    </div>
    <div>
      <ul>
        <li>旋转后draw旋转问题</li>
        <li class="delline">旋转后crop问题</li>
        <li>放大缩小后鼠标事件移动像素尺寸问题</li>
      </ul>
    </div>
    <div class="re">
      <div class="co">
        <div class="ab">
          <div class="ab2">
            <span contenteditable="true">1111</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageEditor from "@/js/ImageEditor/index";
import Rotate from "@/js/ImageEditor/operate/rotate";
import RotateCanvas from "@/js/ImageEditor/operate/rotateCanvas";
import Filter from "@/js/ImageEditor/operate/filter";
import Action from "@/js/ImageEditor/action";
import Shape from "@/js/ImageEditor/operate/shape";
export default {
  data() {
    return {
      type: Shape.CURVE,
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
        { label: "shape", value: Action.SHAPE },
        { label: "text", value: Action.TEXT },
      ],
      types: [
        { label: "rectangle", value: Shape.RECTANGLE },
        { label: "circular", value: Shape.CIRCULAR },
        { label: "triangle", value: Shape.TRIANGLE },
        { label: "arrow", value: Shape.ARROW },
        { label: "line", value: Shape.LINE },
        { label: "curve", value: Shape.CURVE },
      ],
      rotate: 0,
      shapeConfig: {
        lineColor: "#333",
        lineWidth: 20,
        fillColor: "#333",
        opacity: 1,
      },
    };
  },
  mounted() {
    this.initCaman();
    this.imageEditor = new ImageEditor("#image-editor");
    const father = document.querySelector(".father");
    const child = document.querySelector(".child");
    const grandchild = document.querySelector(".grandchild");
    father.addEventListener("mousedown", () => {
      console.log("father");
    });
    child.addEventListener("mousedown", () => {
      console.log("child");
    });
    grandchild.addEventListener("mousedown", () => {
      console.log("grandchild");
    });
  },
  methods: {
    onTypeChange(val) {
      this.imageEditor.setAction(this.action, {
        type: val,
        ...this.shapeConfig,
      });
    },
    onActionChange(val) {
      console.log(val);
      this.imageEditor.setAction(val, { type: this.type, ...this.shapeConfig });
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
    onRotateCanvas(deg) {
      this.imageEditor.add(new RotateCanvas(deg));
    },
    onRotate(deg, isAdd = true) {
      this.imageEditor.add(new Rotate(deg, isAdd));
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
  margin: 0;
  padding: 0;
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
.imge_input {
  border: none;
  background: transparent;
  outline: none;
}
.imge_input:focus {
  border: none;
  border-bottom: 1px solid #333;
}
.re {
  width: 200px;
  height: 50px;
  position: relative;
  background-color: rgb(167, 248, 16);
  overflow: hidden;
}
.co {
  width: 200px;
  height: 50px;
}
.ab {
  position: absolute;
  left: 160px;
  top: 30px;
}
.ab2 {
  position: absolute;
  left: 0;
  top: 0;
}
.ab span {
  display: inline-block;
  width: 100px;
  height: 20px;
}
.delline {
  text-decoration: line-through;
}
.image-editor-box {
  width: 100%;
  padding: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
</style>