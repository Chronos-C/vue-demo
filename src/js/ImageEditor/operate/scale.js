import { isCanvas } from '../utils'
export default class scale {
  constructor(scale) {
    this.scale = scale
  }
  render(target) {
    if (!this.scale || this.scale < 0) {
      return
    }
    if (isCanvas(target)) {
      const scale = this.scale
      target.ctx.translate((target.canvas.width / 2) * (1 - scale), (target.canvas.height / 2) * (1 - scale))
      target.ctx.scale(scale, scale)
    } else {
      target.style = setTransform(target.style.transform,'scale',this.scale)
    }
  }
}
