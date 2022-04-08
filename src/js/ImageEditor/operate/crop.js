import { isCanvas } from '../utils'
export default class Crop {
  constructor(x, y, w, h, r, imgData) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.r = r
    this.imgData = imgData
  }
  async render(target) {
    if (isCanvas(target)) {
      target.resetCanvasSize(this.w, this.h)
      await target.setImage(this.imgData)
    }
  }
}
