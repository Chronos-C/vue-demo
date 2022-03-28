export default class Background {
  constructor(val) {
    this.fill = val
  }
  render(canvas) {
    canvas.ctx.fillStyle = this.fill
    canvas.ctx.fillRect(0, 0, canvas.canvas.width, canvas.canvas.height)
  }
}
