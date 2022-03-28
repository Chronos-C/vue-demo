export default class Shape {
  constructor({ x, y, w, h, type, fill, borderWidth, borderColor }) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.type = type
    this.fill = fill
    this.borderWidth = borderWidth
    this.borderColor = borderColor
  }
  render(target) {}
}
