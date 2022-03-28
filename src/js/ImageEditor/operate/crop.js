import { isCanvas } from '../utils'
export default class Crop {
  constructor(x, y, w, h, r) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.r = r
  }
  render(target) {
    if (isCanvas(target)) {
      target.resetCanvasSize(this.w,this.h)
    }
  }
}
