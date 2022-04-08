import { isCanvas, setTransform, SIN, COS } from '../utils'
export default class Rotate {
  constructor(deg, accumulative) {
    this.deg = deg
    this.accumulative = accumulative
  }
  render(target, deg, w, h) {
    if (isCanvas(target)) {
      target.canvas.style.transform = `matrix(${COS(deg)},${SIN(deg)},${-1 * SIN(deg)},${COS(deg)},0,0)`
    } else {
      target.style = setTransform(target.style.transform, 'rotate', this.deg)
    }
  }
}
