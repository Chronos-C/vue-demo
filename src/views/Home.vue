<template>
  <div class="home">
    <div class="top">
      <input type="file" @change="onUpload" />
      <el-input-number v-model="paintSize"></el-input-number>
      <el-button style="margin-left:20px;" @click="onDownload">Download</el-button>
    </div>
  <div class="canvas-container" ref="canvasContainer" @mousedown="onMousedown"
      @mouseup="onMouseup">
    <canvas
      class="canvas canvas-up"
      ref="canvasup"
    ></canvas>
    <canvas
    class="canvas canvas-low"
      ref="canvaslow"
      
    ></canvas>
  </div>
  </div>
</template>

<script>
// @ is an alias to /src
export default {
  name: "Home",
  data() {
    return {
      file: null,
      canvasContainer: null,
      canvasup: null,
      canvaslow: null,
      paintColor: "rgba(189, 255, 1, 0.75)",
      paintSize: 200,
      lines: [],
      renders: [],
      original: null,
    };
  },
  mounted() {
    this.canvasContainer = this.$refs.canvasContainer;
    this.canvasup = this.$refs.canvasup;
    this.canvaslow = this.$refs.canvaslow;
  },
  methods: {
    onDownload() {
      const a = document.createElement("a");
      const tempcanvas = document.createElement("canvas")
      const ctx = tempcanvas.getContext('2d')
      tempcanvas.width = this.canvasup.width
      tempcanvas.height = this.canvasup.height
      // ctx.fillStyle="#000000";
      ctx.fillRect(0,0,tempcanvas.width,tempcanvas.height);
      // this.lines.forEach((line) =>{
      //   this.drawLines(ctx, [line]);
      // })
      this.draw(ctx)
      // const dataurl = this.canvaToDataURL(tempcanvas)
      // const blob = this.dataURLToBlob(dataurl)
      tempcanvas.toBlob((blob)=>{
        const imgpath = this.blobToImagePath(blob)
        a.href = imgpath;
        a.download = Date.now()+'.jpg';
        a.click();
        window.URL.revokeObjectURL(imgpath);
      },'image/jpeg',0.2)
      
    },
    onMousedown(e) {
      this.lines.push({ pts: [], size: this.paintSize });
      e.target.addEventListener("mousemove", this.onMousemove);
    },
    async onMouseup(e) {
      e.target.removeEventListener("mousemove", this.onMousemove);
      const dataurl = this.canvaToDataURL(this.canvasup);
      const bolb = this.dataURLToBlob(dataurl);
      const imagepath = this.blobToImagePath(bolb);
      const img = await this.imagePathToImage(imagepath);
      this.renders.push(img);
    },
    onMousemove(e) {
      e.preventDefault();
      e.stopPropagation();
      const r = this.canvasup.width / parseInt(this.canvasContainer.style.width)
      const x = e.offsetX * r;
      const y = e.offsetY * r;
      const currLine = this.lines[this.lines.length - 1];
      currLine.pts.push({ x: x, y: y });
      const ctx = this.canvasup.getContext("2d");
      this.draw(ctx);
    },
    draw(ctx) {
      if (!ctx) {
        return;
      }
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      const currRender = this.renders[this.renders.length - 1];
      if (currRender?.src) {
        ctx.drawImage(currRender, 0, 0);
      } else {
        ctx.drawImage(this.original, 0, 0);
      }
      this.lines.forEach((line) =>{
        this.drawLines(ctx, [line]);
      })
    },
    drawLines(ctx, lines, color = this.paintColor) {
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      lines.forEach((line) => {
        if (!line?.pts.length || !line.size) {
          return;
        }
        ctx.lineWidth = line.size;
        ctx.beginPath();
        ctx.moveTo(line.pts[0].x, line.pts[0].y);
        line.pts.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });
    },
    async onUpload(e) {
      const file = e.target.files[0];
      const dataURL = await this.fileToDataURL(file);
      const blob = this.dataURLToBlob(dataURL);
      const imgpath = this.blobToImagePath(blob);
      const img = await this.imagePathToImage(imgpath);
      const ctx = this.canvaslow.getContext("2d");
      this.canvaslow.width = img.width;
      this.canvaslow.height = img.height;
      this.canvasup.width = img.width;
      this.canvasup.height = img.height;
      if (img.width > 400) {
        this.canvasContainer.style.width = "400px";
        this.canvasContainer.style.height = (400 / img.width) * img.height + "px";
      }
      this.original = img;
      ctx.drawImage(img, 0, 0);
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
<style scoped>
  .canvas-container {
    position: relative;
  }
  .canvas-up {
    position: absolute;
    top: 0;
    left: 0;
  }
  .canvas {
    width: 100%;
    height: 100%;
  }

</style>
