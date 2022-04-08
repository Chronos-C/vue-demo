import { getPosition } from '../utils'
export default class Drwa {
  constructor(uuid, path, lineWidth, lineColor, dom) {
    this.uuid = uuid
    this.path = path
    this.lineWidth = lineWidth
    this.lineColor = lineColor
    this.offsetX = 0
    this.offsetY = 0
    this.dom = dom
    this.x = 0
    this.y = 0
    this.w = 0
    this.h = 0
    this.xScale = 1
    this.yScale = 1
    this.xScaleOffset = 0
    this.yScaleOffset = 0
    this.svg = null
    this.container = null
    this.position = null
    this.disabled = false
    this.selected = false
  }
  destory() {
    if (this.container) {
      const svgParent = this.container.parentNode
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
    console.log('render')
    this.destory()
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    const container = document.createElement('div')
    this.container = container
    container.style.position = 'absolute'
    this.y = position.oy - this.lineWidth / 2 + this.offsetY + this.yScaleOffset
    this.x = position.ox - this.lineWidth / 2 + this.offsetX + this.xScaleOffset
    container.style.top = this.y + 'px'
    container.style.left = this.x + 'px'
    this.w = position.maxx - position.minx ? position.width + this.lineWidth : position.width
    this.h = position.maxy - position.miny ? position.height + this.lineWidth : position.height
    container.style.width = this.w + 'px'
    container.style.height = this.h + 'px'
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.setAttribute('width', this.w)
    svg.setAttribute('height', this.h)
    svg.setAttribute('viewBox', `0 0 ${this.w} ${this.h}`)
    container.appendChild(svg)
    target.appendChild(container)
    const ctx = d3.select(svg)
    const canvas = d3.path()
    this.drawPath(canvas, this.path, position, this.lineWidth)
    ctx.append('path')
      .attr('d', canvas.toString())
      .attr('stroke-width', this.lineWidth)
      .attr('stroke', this.lineColor)
      .attr('stroke-linecap', 'round')
      .attr('fill', 'none')
    this.svg = svg
  }
  drawPath(ctx, path, position, lineWidth) {
    for (let i = 0; i < path.length; i++) {
      const curr = path[i]
      if (i === 0) {
        ctx.moveTo(curr.x * this.xScale - position.minx + lineWidth / 2, curr.y * this.yScale - position.miny + lineWidth / 2)
      } else {
        ctx.lineTo(curr.x * this.xScale - position.minx + lineWidth / 2, curr.y * this.yScale - position.miny + lineWidth / 2)
      }
    }
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
}
