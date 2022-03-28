export default class Text {
  constructor({ x, y, w, h, fontSize, color, strong, bevel, underline, align, value }) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.fontSize = fontSize
    this.color = color
    this.strong = strong
    this.bevel = bevel
    this.underline = underline
    this.align = align
    this.value = value
    this.container = null
    this.disabled = false
    this.selected = false
  }
  destory() {
    if (this.container) {
      const parent = this.container.parentNode
      if (this.container.parentNode) {
        svgParent.removeChild(this.container)
      }
    }
    const domParent = this.dom.parentNode
    if (this.dom.parentNode) {
      domParent.removeChild(this.dom)
    }
  }
  render(target) {
    const container = document.createElement('div')
    this.container = container
    const input = document.createElement('input')
    input.type = 'text'
    input.border = 'none'
    input.placeholder = 'input text'
    input.style.fontSize = this.fontSize + 'px'
    input.style.fontWeight = this.strong ? 'bold' : 'normal'
    input.style.textDecoration = this.underline ? 'underline' : 'none'

    container.appendChild(input)
  }
}
