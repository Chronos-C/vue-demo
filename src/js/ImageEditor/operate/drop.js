import { isCanvas } from '../utils'
export default class drop {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
  render(target) {
    if (isCanvas(target)) {
      target.originX = this.x
      target.originY = this.y
      target._drawImg()
    } else {
      target.style.position = 'absolute'
      target.style.top = this.y + 'px'
      target.style.left = this.x + 'px'
    }
  }
}
