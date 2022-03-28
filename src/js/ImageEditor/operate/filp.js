import { isCanvas } from '../utils'
export default class Filp {
  constructor(flip) {
    this.flip = flip
  }
  render(target) {
    if (isCanvas(target)) {
      if (this.flip === 'x') {
        target.ctx.translate(target.canvas.width, 0)
        target.ctx.scale(-1, 1)
      } else {
        target.ctx.translate(0, target.canvas.height)
        target.ctx.scale(1, -1)
      }
    }
  }
}
