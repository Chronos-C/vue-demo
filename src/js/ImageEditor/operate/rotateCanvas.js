import { isCanvas, setTransform, SIN, COS } from '../utils'
export default class RotateCanvas {
  constructor(deg) {
    this.deg = deg
  }
  render(target, deg, w, h) {
    if (isCanvas(target)) {
      deg %= 360
      if (Math.abs(deg) % 90 === 0) {
        if (Math.abs(deg) % 180 === 0) {
          target.ctx.translate(w / 2, h / 2)
          target.ctx.rotate(deg * Math.PI / 180)
          target.ctx.translate(-w / 2, -h / 2)
        } else {
          target.ctx.translate(w / 2, h / 2)
          target.ctx.rotate(deg * Math.PI / 180)
          target.ctx.translate(-h / 2, -w / 2)
        }
      } else {
        if (deg > 0) {
          if (deg < 90) {
            target.ctx.translate(Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.height, 0)
          } else if (deg > 90 && deg < 180) {
            target.ctx.translate(w, Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.height)
          } else if (deg > 180 && deg < 270) {
            target.ctx.translate(Math.cos(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.width, h)
          } else {
            target.ctx.translate(0, Math.cos(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.width)
          }
        } else {
          if (Math.abs(deg) < 90) {
            target.ctx.translate(0, Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.width)
          } else if (Math.abs(deg) > 90 && Math.abs(deg) < 180) {
            target.ctx.translate(Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.width, h)
          } else if (Math.abs(deg) > 180 && Math.abs(deg) < 270) {
            target.ctx.translate(w, Math.cos(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.height)
          } else {
            target.ctx.translate(Math.cos(Math.PI / 180 * (Math.abs(deg) % 90)) * target.image.height, 0)
          }
        }
        target.ctx.rotate(deg * Math.PI / 180)
      }
    } else {
      target.style = setTransform(target.style.transform, 'rotate', this.deg)
    }
  }
}
