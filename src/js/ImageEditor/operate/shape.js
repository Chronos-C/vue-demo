import { getPosition } from '../utils'
export default class Shape {
  constructor({ x, y, w, h, type, fillColor = 'none', borderWidth = 0, borderColor = '#333', opacity = 1, path, uuid, lineWidth = 5, lineColor = '#333', lineStyle = 'solid', dom }) {
    this.uuid = uuid
    this.dom = dom
    this.x = x
    this.ox = x
    this.y = y
    this.oy = y
    this.w = w
    this.ow = w
    this.h = h
    this.oh = h
    this.path = path
    this.type = type
    this.fillColor = fillColor
    this.lineWidth = lineWidth
    this.lineColor = lineColor
    this.lineStyle = lineStyle
    this.borderWidth = borderWidth
    this.borderColor = borderColor
    this.opacity = opacity
    this.offsetX = 0
    this.offsetY = 0
    this.xScale = 1
    this.yScale = 1
    this.xScaleOffset = 0
    this.yScaleOffset = 0
    this.svg = null
    this.container = null
    this.position = null
    this.disabled = false
    this.selected = false
    this.rotate = 0
  }
  render(target) {
    // this.destory()
    if (this.type === Shape.RECTANGLE) {
      this._rectangleMode(target)
    } else if (this.type === Shape.CIRCULAR) {
      this._circularMode(target)
    } else if (this.type === Shape.TRIANGLE) {
      this._triangleMode(target)
    } else if (this.type === Shape.ARROW) {
      this._arrowMode(target)
    } else if (this.type === Shape.LINE) {
      this._lineMode(target)
    } else if (this.type === Shape.CURVE) {
      this._curveMode(target)
    }
  }
  _arrowMode(target) {
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    this.calculatePosition(position, this.lineWidth, this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
    this.svg = document.createElement('div')
    this.svg.style.position = 'absolute'
    this.svg.style.top = '0'
    this.svg.style.left = '0'
    this.drawArrow(this.svg, this.path, position, this.lineWidth, this.lineColor)
    this.container = this.generateContainer(this.x, this.y, this.w, this.h, this.svg, this.rotate)
    if (this.container.parentNode !== target) {
      target.appendChild(this.container)
    }
  }
  _lineMode(target) {
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    this.calculatePosition(position, this.lineWidth, this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
    const line = this.drawLine(this.path, position, this.lineWidth, this.lineColor, this.fillColor)
    this.svg = this.generateSvg(this.w, this.h, line)
    this.container = this.generateContainer(this.x, this.y, this.w, this.h, this.svg, this.rotate)
    if (this.container.parentNode !== target) {
      target.appendChild(this.container)
    }
  }
  _triangleMode(target) {
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    this.calculatePosition(position, this.lineWidth, this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
    const triangle = this.drawTriangle(this.w, this.h, this.lineWidth, this.lineColor, this.fillColor)
    this.svg = this.generateSvg(this.w, this.h, triangle)
    this.container = this.generateContainer(this.x, this.y, this.w, this.h, this.svg, this.rotate)
    if (this.container.parentNode !== target) {
      target.appendChild(this.container)
    }
  }
  _circularMode(target) {
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    this.calculatePosition(position, this.lineWidth, this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
    // if (this.w > this.h) {
    //   this.w = this.h
    // } else {
    //   this.h = this.w
    // }
    const ellipse = this.drawCircle(this.w, this.h, this.lineWidth, this.lineColor, this.fillColor)
    this.svg = this.generateSvg(this.w, this.h, ellipse)
    this.container = this.generateContainer(this.x, this.y, this.w, this.h, this.svg, this.rotate)
    if (this.container.parentNode !== target) {
      target.appendChild(this.container)
    }
  }
  _rectangleMode(target) {
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    this.calculatePosition(position, this.lineWidth, this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
    this.svg = this.generateSvg(this.w, this.h)
    this.drawPath(this.svg, this.path, position, this.lineWidth, this.lineColor, this.fillColor, this.xScale, this.yScale)
    this.container = this.generateContainer(this.x, this.y, this.w, this.h, this.svg, this.rotate)
    target.appendChild(this.container)
  }
  _curveMode(target) {
    const position = getPosition(this.path,
      this.lineWidth,
      { x: this.xScale, y: this.yScale, }
    )
    this.position = position
    if (!position) {
      return
    }
    this.calculatePosition(position, this.lineWidth, this.offsetX, this.offsetY, this.xScaleOffset, this.yScaleOffset)
    this.svg = this.generateSvg(this.w, this.h)
    this.drawPath(this.svg, this.path, position, this.lineWidth, this.lineColor, this.fillColor, this.xScale, this.yScale, true)
    const container = this.generateContainer(this.x, this.y, this.w, this.h, this.svg, this.rotate)
    target.appendChild(container)
  }
  calculatePosition(position, lineWidth, offsetX, offsetY, xScaleOffset, yScaleOffset) {
    this.y = position.oy - Number(lineWidth) / 2 + offsetY + yScaleOffset
    this.x = position.ox - Number(lineWidth) / 2 + offsetX + xScaleOffset
    this.w = position.maxx - position.minx ? position.width + Number(lineWidth) : position.width
    this.h = position.maxy - position.miny ? position.height + Number(lineWidth) : position.height
  }
  generateSvg(w, h, child) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.setAttribute('width', w)
    svg.setAttribute('height', h)
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    if (child) {
      svg.appendChild(child)
    }
    return svg
  }
  generateContainer(x, y, w, h, child, rotate) {
    if (this.container) {
      this.container.style.position = 'absolute'
      this.container.style.top = y + 'px'
      this.container.style.left = x + 'px'
      this.container.style.width = w + 'px'
      this.container.style.height = h + 'px'
      console.log(`rotate(${rotate}deg)`)
      this.container.style.transform = `rotate(${rotate}deg)`
      this.container.appendChild(child)
      return this.container
    } else {
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.top = y + 'px'
      container.style.left = x + 'px'
      container.style.width = w + 'px'
      container.style.height = h + 'px'
      container.appendChild(child)
      return container
    }
  }
  destory() {
    if (this.svg) {
      const parent = this.svg.parentNode
      if (this.svg.parentNode) {
        parent.removeChild(this.svg)
      }
    }
    const domParent = this.dom.parentNode
    if (this.dom.parentNode) {
      domParent.removeChild(this.dom)
    }
  }
  drawArrow(svg, path, position, lineWidth, lineColor) {
    const r = lineWidth / 20
    const arrowWidth = 64 * r
    const arrowHeight = 86 * r
    const line = this.drawLine(path, position, lineWidth, lineColor, { offsetX: arrowWidth / 4, offsetY: arrowHeight / 4 })
    const svg1 = this.generateSvg(this.w, this.h, line)
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    arrow.style.position = 'absolute'
    arrow.style.top = '0'
    arrow.style.left = '0'
    arrow.setAttribute('fill', lineColor)
    arrow.setAttribute('d', `M60 36.3l-52.1-35.2c-4.2-3-9.9 1.5-7.2 5.4l20.4 24.1v22.6l-20.4 24.1c-2.4 3.9 3 8.7 7.2 5.4l52.1-35.2c4.2-3.1 3.9-8.2 0-11.2z`)
    const svg2 = this.generateSvg(64, 86, arrow)

    const hypotenuse = Math.sqrt(Math.pow(position.width, 2) + Math.pow(position.height, 2))
    svg2.setAttribute('width', arrowWidth)
    svg2.setAttribute('height', arrowHeight)

    if (position.ox === path[0].x && position.oy === path[0].y) { //第三象限
      svg2.style.left = position.maxx - position.minx + lineWidth / 2 - arrowWidth / 4 * 3
      svg2.style.top = position.maxy - position.miny + lineWidth / 2 - arrowHeight / 4 * 3
      svg2.style.transform = `matrix(${position.width / hypotenuse},${position.height / hypotenuse},${-(position.height / hypotenuse)},${position.width / hypotenuse},0,0)`
    } else if (position.omaxx === path[0].x && position.omaxy === path[0].y) { //第二象限
      svg2.style.left = lineWidth / 2 - arrowWidth / 4
      svg2.style.top = lineWidth / 2 - arrowHeight / 4
      svg2.style.transform = `matrix(${-(position.width / hypotenuse)},${-(position.height / hypotenuse)},${position.height / hypotenuse},${-(position.width / hypotenuse)},0,0)`
    } else if (position.ox === path[0].x && position.omaxy === path[0].y) {//第一象限
      svg2.style.left = position.maxx - position.minx + lineWidth / 2 - arrowWidth / 4 * 3
      svg2.style.top = lineWidth / 2 - arrowHeight / 4
      svg2.style.transform = `matrix(${position.width / hypotenuse},${-(position.height / hypotenuse)},${position.height / hypotenuse},${position.width / hypotenuse},0,0)`
    } else {//第四象限
      svg2.style.left = lineWidth / 2 - arrowWidth / 4
      svg2.style.top = position.maxy - position.miny + lineWidth / 2 - arrowWidth
      svg2.style.transform = `matrix(${-(position.width / hypotenuse)},${position.height / hypotenuse},${-(position.height / hypotenuse)},${-(position.width / hypotenuse)},0,0)`
    }
    svg.appendChild(svg1)
    svg.appendChild(svg2)
  }
  drawLine(path, position, lineWidth, lineColor, { offsetX = 0, offsetY = 0 }) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.style.position = 'absolute'
    line.style.top = '0'
    line.style.left = '0'
    line.setAttribute('stroke-width', lineWidth)
    line.setAttribute('stroke', lineColor)
    line.setAttribute('stroke-linecap', 'round')
    console.log(position, path,)
    if (position.ox === path[0].x && position.oy === path[0].y) {//第三象限
      console.log(lineWidth / 2, lineWidth / 2, position.maxx - position.minx, position.maxy - position.miny)
      line.setAttribute('x1', lineWidth / 2)
      line.setAttribute('y1', lineWidth / 2)
      line.setAttribute('x2', position.maxx - position.minx + lineWidth / 2 - offsetX)
      line.setAttribute('y2', position.maxy - position.miny + lineWidth / 2 - offsetY)
    } else if (position.omaxx === path[0].x && position.omaxy === path[0].y) {//第二象限
      line.setAttribute('x1', position.maxx - position.minx + lineWidth / 2)
      line.setAttribute('y1', position.maxy - position.miny + lineWidth / 2)
      line.setAttribute('x2', lineWidth / 2 + offsetX)
      line.setAttribute('y2', lineWidth / 2 + offsetY)
    } else if (position.ox === path[0].x && position.omaxy === path[0].y) {//第一象限
      line.setAttribute('x1', lineWidth / 2)
      line.setAttribute('y1', position.maxy - position.miny + lineWidth / 2)
      line.setAttribute('x2', position.maxx - position.minx + lineWidth / 2 - offsetX)
      line.setAttribute('y2', lineWidth / 2 + offsetY)
    } else {
      line.setAttribute('x1', position.maxx - position.minx + lineWidth / 2)//第四象限
      line.setAttribute('y1', lineWidth / 2)
      line.setAttribute('x2', lineWidth / 2 + offsetX)
      line.setAttribute('y2', position.maxy - position.miny + lineWidth / 2 - offsetY)
    }
    return line
  }
  drawTriangle(w, h, lineWidth, lineColor, fillColor) {
    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    triangle.style.position = 'absolute'
    triangle.style.top = '0'
    triangle.style.left = '0'
    triangle.setAttribute('stroke-width', lineWidth)
    triangle.setAttribute('stroke', lineColor)
    triangle.setAttribute('stroke-linecap', 'round')
    triangle.setAttribute('fill', !fillColor || fillColor === 'transparent' ? 'none' : fillColor)
    triangle.setAttribute('points', `${w / 2},${lineWidth} ${lineWidth},${h - lineWidth / 2} ${w - lineWidth},${h - lineWidth / 2}`)
    return triangle
  }
  drawCircle(w, h, lineWidth, lineColor, fillColor) {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
    ellipse.style.position = 'absolute'
    ellipse.style.top = '0'
    ellipse.style.left = '0'
    ellipse.setAttribute('stroke-width', lineWidth)
    ellipse.setAttribute('stroke', lineColor)
    ellipse.setAttribute('stroke-linecap', 'round')
    ellipse.setAttribute('fill', !fillColor || fillColor === 'transparent' ? 'none' : fillColor)
    ellipse.setAttribute('cx', w / 2)
    ellipse.setAttribute('cy', h / 2)
    ellipse.setAttribute('rx', w / 2 - lineWidth / 2)
    ellipse.setAttribute('ry', h / 2 - lineWidth / 2)
    return ellipse
  }
  drawPath(svg, path, position, lineWidth, lineColor, fillColor, xScale, yScale, isRound = false) {
    const ctx = d3.select(svg)
    const canvas = d3.path()
    for (let i = 0; i < path.length; i++) {
      const { x, y, offsetX = 0, offsetY = 0 } = path[i]
      if (i === 0) {
        canvas.moveTo(x * xScale - position.minx + lineWidth / 2 + offsetX, y * yScale - position.miny + lineWidth / 2 + offsetY)
      } else {
        canvas.lineTo(x * xScale - position.minx + lineWidth / 2 + offsetX, y * yScale - position.miny + lineWidth / 2 + offsetY)
      }
    }
    ctx.append('path')
      .attr('d', canvas.toString())
      .attr('stroke-width', lineWidth)
      .attr('stroke', lineColor)
      .attr('fill', !fillColor || fillColor === 'transparent' ? 'none' : fillColor)
    if (isRound) {
      ctx.attr('stroke-linecap', 'round')
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
  setPath(path) {
    this.path = path
  }
  setRotate(rotate) {
    this.rotate += rotate / 2.5
  }
  static RECTANGLE = Symbol('rectangle')
  static CIRCULAR = Symbol('circular')
  static TRIANGLE = Symbol('triangle')
  static ARROW = Symbol('arrow')
  static LINE = Symbol('line')
  static CURVE = Symbol('curve')
}
