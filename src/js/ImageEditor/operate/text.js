export default class Text {
  constructor({ x, y, fontSize = 16, color, strong, bevel, underline, align }, canvas) {
    this.ox = x
    this.oy = y
    this.x = y
    this.y = y
    this.ow = fontSize * 1.425 * 6
    this.oh = fontSize * 1.75
    this.w = fontSize * 1.425 * 6
    this.h = fontSize * 1.75
    this.fontSize = fontSize
    this.color = color
    this.strong = strong
    this.bevel = bevel
    this.underline = underline
    this.offsetX = 0
    this.offsetY = 0
    this.align = align
    this.container = null
    this.input = null
    this.value = 'dbclick edit'
    this.disabled = false
    this.selected = false
    this.xScale = 1
    this.yScale = 1
    this.xScaleOffset = 0
    this.yScaleOffset = 0
    this.wScale = 0
    this.hScale = 0
    this.canvas = canvas
  }
  destory() {
    if (this.container) {
      const parent = this.container.parentNode
      if (this.container.parentNode) {
        parent.removeChild(this.container)
      }
    }
  }
  render(target) {
    this.destory()
    const container = document.createElement('div')
    this.container = container
    container.style.position = 'absolute'
    this.x = this.ox + this.offsetX + this.xScaleOffset
    this.y = this.oy + this.offsetY + this.yScaleOffset
    container.style.top = this.y + 'px'
    container.style.left = this.x + 'px'
    const input = document.createElement('span')
    input.setAttribute('class', 'imge_input')
    input.setAttribute('contenteditable', 'true')
    input.style.display = 'inline-block'
    input.style.width = '100%'
    input.style.height = '100%'
    input.style.wordBreak = 'break-all'
    input.type = 'text'
    input.placeholder = 'input text'
    input.style.fontSize = this.fontSize * this.xScale * this.yScale + 'px'
    input.style.fontWeight = this.strong ? 'bold' : 'normal'
    input.style.textDecoration = this.underline ? 'underline' : 'none'
    input.style.textAlign = this.align
    input.innerHTML = this.value
    input.addEventListener('input', (e) => {
      this.value = e.target.innerHTML
      this.canvas.event._setSelectedPosition(this)
      this.canvas.event._setSelectedPointPosition(this)
    })
    this.input = input
    container.appendChild(input)
    target.appendChild(container)
    this.w = this.ow + Math.abs(this.wScale)
    this.h = this.oh + Math.abs(this.hScale)
    container.style.width = this.w + 'px'
    container.style.height = this.h + 'px'
  }
  setOffset(offsetX, offsetY) {
    this.offsetX += offsetX
    this.offsetY += offsetY
    console.log('setPosition', this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
  }
  setScaleOffset(offsetX, offsetY) {
    this.xScaleOffset += offsetX
    this.yScaleOffset += offsetY
    console.log('setScaleOffset', this.xScaleOffset, this.yScaleOffset, offsetX, offsetY)
  }
  setScaleSize(w, h) {
    this.wScale += w
    this.hScale += h
    console.log('setScaleSize', this.wScale, this.hScale, w, h)
  }
  focus() {
    let range, selection
    if (window.getSelection && document.createRange) {
      range = document.createRange();
      range.selectNodeContents(this.input);
      range.collapse(true);
      range.setEnd(this.input, this.input.childNodes.length);
      range.setStart(this.input, this.input.childNodes.length);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (document.body.createTextRange) {
      range = document.body.createTextRange();
      range.moveToElementText(this.input);
      range.collapse(true);
      range.select();
    }
  }
}
