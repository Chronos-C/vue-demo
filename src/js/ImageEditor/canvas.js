import Event from './event'
import Action from './action'
import { setTransform } from './utils'

export default class Canvas {
  constructor(dispatch, target, { maxWidth = 0, maxHeight = 0, lineWidth = 2, dropBorderWidth = 10, dropNodeWidth = 20, lineColor = '#fff' }) {
    this.dispatch = dispatch
    this.originImage = null
    this.image = null
    this.originX = 0
    this.originY = 0
    this.maxWidth = maxWidth
    this.maxHeight = maxHeight
    this.selected = null
    this.hover = null
    this.lastScale = 1
    this.deg = 0
    this.lineWidth = lineWidth
    this.lineColor = lineColor
    this.dropBorderWidth = dropBorderWidth
    this.dropNodeWidth = dropNodeWidth
    this.actionParams = null

    this.frame = null
    this.canvas = null
    this.ctx = null
    this.upperCanvas = null
    this.upperCtx = null
    this.shapesElement = null
    this.container = this.initCanvas(target)

    this.events = {
      [Action.NONE]: new Event(this, this.upperCanvas),
      [Action.CROP]: new Event(this, this.upperCanvas),
      [Action.TEXT]: new Event(this, this.container),
      [Action.SHAPE]: new Event(this, this.container),
      [Action.DRAW]: new Event(this, this.container),
    }
    //记录当前所有的对象
    this.shapes = {
      [Action.TEXT]: [],
      [Action.DRAW]: [],
      [Action.SHAPE]: [],
    }
    this.action = Action.NONE
    this.event = this.events[this.action]
    this.event.activeAction(this.action)
  }
  initCanvas(target) {
    const frame = document.querySelector(target)
    if (!frame) {
      throw new Error('Element not found')
    }
    frame.innerHTML = ''
    frame.style.userSelect = 'none'
    frame.style.width = '100%'
    frame.style.height = '100%'
    frame.style.overflow = 'hidden'
    this.frame = frame
    const container = document.createElement('div')
    container.setAttribute('data-tag', 'container')
    container.style.position = 'relative'
    container.style.userSelect = 'none'
    container.style.width = '100%'
    container.style.height = '100%'
    if (this.maxWidth) {
      container.style.maxWidth = this.maxWidth + 'px'
    }

    if (this.maxHeight) {
      container.style.maxHeight = this.maxHeight + 'px'
    }

    const lower = document.createElement('canvas')
    lower.setAttribute('class', 'lower-canvas')
    lower.setAttribute('data-tag', 'lower')
    // lower.style.position = 'absolute'
    // lower.style.top = '0'
    // lower.style.left = '0'
    this.canvas = lower
    this.ctx = lower.getContext('2d')
    const upper = document.createElement('canvas')
    upper.setAttribute('class', 'upper-canvas')
    upper.setAttribute('data-tag', 'upper')
    upper.style.position = 'absolute'
    upper.style.top = '0'
    upper.style.left = '0'
    this.upperCanvas = upper
    this.upperCtx = upper.getContext('2d')
    const shapes = document.createElement('div')
    shapes.setAttribute('class', 'shapes')
    shapes.setAttribute('data-tag', 'shapes')
    shapes.style.position = 'absolute'
    shapes.style.top = '0'
    shapes.style.left = '0'
    this.shapesElement = shapes
    container.appendChild(this.initSelection())
    container.appendChild(this.initHover())
    container.appendChild(lower)
    container.appendChild(shapes)
    container.appendChild(upper)
    frame.appendChild(container)
    return container
  }
  initSelection() {
    const selected = document.createElement('div')
    selected.setAttribute('class', 'selected')
    selected.setAttribute('data-tag', 'selected')
    selected.style.zIndex = '5'
    selected.style.display = 'none'
    selected.style.position = 'absolute'
    selected.style.top = '0'
    selected.style.left = '0'
    selected.style.border = '2px solid #6ccfff'
    selected.style.cursor = 'move'
    this.selected = selected
    const points = [
      {
        type: 't-l',
        css: {
          top: `-${this.dropNodeWidth / 2}px`,
          left: `-${this.dropNodeWidth / 2}px`,
          cursor: 'nw-resize',
        }
      },
      {
        type: 't-c',
        css: {
          top: `-${this.dropNodeWidth / 2}px`,
          cursor: 'n-resize',
        }
      },
      {
        type: 't-r',
        css: {
          top: `-${this.dropNodeWidth / 2}px`,
          right: `-${this.dropNodeWidth / 2}px`,
          cursor: 'ne-resize',
        }
      },
      {
        type: 'c-l',
        css: {
          left: `-${this.dropNodeWidth / 2}px`,
          cursor: 'w-resize',
        }
      },
      {
        type: 'c-r',
        css: {
          right: `-${this.dropNodeWidth / 2}px`,
          cursor: 'e-resize',
        }
      },
      {
        type: 'b-l',
        css: {
          bottom: `-${this.dropNodeWidth / 2}px`,
          left: `-${this.dropNodeWidth / 2}px`,
          cursor: 'sw-resize',
        }
      },
      {
        type: 'b-c',
        css: {
          bottom: `-${this.dropNodeWidth / 2}px`,
          cursor: 's-resize',
        }
      },
      {
        type: 'b-r',
        css: {
          bottom: `-${this.dropNodeWidth / 2}px`,
          right: `-${this.dropNodeWidth / 2}px`,
          cursor: 'se-resize',
        }
      },
    ]
    for (let i = 0; i < points.length; i++) {
      const point = document.createElement('div')
      point.setAttribute('data-position', points[i].type)
      point.style.position = 'absolute'
      point.style.width = this.dropNodeWidth + 'px'
      point.style.height = this.dropNodeWidth + 'px'
      point.style.background = '#6ccfff'
      for (let css in points[i].css) {
        point.style[css] = points[i].css[css]
      }
      selected.appendChild(point)
    }
    return selected
  }
  initHover() {
    const hover = document.createElement('div')
    hover.setAttribute('class', 'hover')
    hover.setAttribute('data-tag', 'hover')
    hover.style.zIndex = '4'
    hover.style.cursor = 'move'
    hover.style.display = 'none'
    hover.style.position = 'absolute'
    hover.style.top = '0'
    hover.style.left = '0'
    hover.style.border = '1px solid #6ccfff'
    this.hover = hover
    return hover
  }
  setContainerScale(scale) {
    this.container.style.transform = `scale(${scale})`
  }
  resetCanvasSize(w, h) {
    this.canvas.width = w
    this.canvas.height = h
    this.upperCanvas.width = w
    this.upperCanvas.height = h
    this.frame.style.width = '100%'
    this.frame.style.height = '100%'
    this.frame.style.maxWidth = w + 'px'
    this.frame.style.maxHeight = h + 'px'
    this.container.style.width = '100%'
    this.container.style.height = '100%'
    this.container.style.maxWidth = w + 'px'
    this.container.style.maxHeight = h + 'px'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.maxWidth = w + 'px'
    this.canvas.style.maxHeight = h + 'px'
    this.upperCanvas.style.width = '100%'
    this.upperCanvas.style.height = '100%'
    this.upperCanvas.style.maxWidth = w + 'px'
    this.upperCanvas.style.maxHeight = h + 'px'
  }
  drawImg(image) {
    this.image = image
    this.originImage = image
    this.canvas.width = this.image.width
    this.canvas.height = this.image.height
    this.upperCanvas.width = this.image.width
    this.upperCanvas.height = this.image.height
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.upperCanvas.style.width = '100%'
    this.upperCanvas.style.height = '100%'
    this.canvas.style.maxWidth = this.container.clientWidth + 'px'
    this.canvas.style.maxHeight = this.container.clientHeight + 'px'
    this.upperCanvas.style.maxWidth = this.container.clientWidth + 'px'
    this.upperCanvas.style.maxHeight = this.container.clientHeight + 'px'
    // this.originX = -this.image.width / 2 + this.canvas.width / 2
    // this.originY = -this.image.height / 2 + this.canvas.height / 2
    this.dispatch._render()
  }
  calculateWidthAndHeightOfRotate(deg) {
    if (deg % 90 === 0) {
      if (deg % 180 === 0) {
        return { width: this.canvas.width, height: this.canvas.height }
      } else {
        return { width: this.canvas.height, height: this.canvas.width }
      }
    } else {
      return {
        width: Math.sin(Math.PI / 180 * Math.abs(deg)) * this.canvas.width + Math.cos(Math.PI / 180 * (90 - Math.abs(deg))) * this.canvas.height,
        height: Math.sin(Math.PI / 180 * Math.abs(deg)) * this.canvas.height + Math.cos(Math.PI / 180 * (90 - Math.abs(deg))) * this.canvas.width,
      }
    }
  }
  rotate(deg) {
    const size = this.calculateWidthAndHeightOfRotate(deg)
    this.resetCanvasSize(size.width, size.height)
  }
  offsetImage(x, y) {
    const transform = setTransform(this.upperCanvas.style.transform, 'translate', `${x}px,${y}px`)
    console.log(transform)
    this.upperCanvas.style.transform = transform
    this.canvas.style.transform = transform
  }
  _drawImg(crop) {
    if (!this.image) {
      return
    }
    if (crop) {
      this.ctx.drawImage(this.image, crop.operate.x, crop.operate.y, crop.operate.w, crop.operate.h, 0, 0, crop.operate.w, crop.operate.h)
    } else {
      this.ctx.drawImage(this.image, 0, 0)
    }

  }
  clearDraw() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.shapesElement.innerHTML = ''
  }
  setAction(action) {
    this.action = action
    this.event.removeEventListener()
    if (action === Action.NONE) {
      this.event.noneEvent()
    } else if (action === Action.CROP) {
      this.event.cropEvent()
    } else if (action === Action.DROW) {
      this.event.drowEvent()
    } else if (action === Action.DROP) {
      this.event.dropEvent()
    } else if (action === Action.SHAPE) {
      this.event.shapeEvent()
    } else if (action === Action.TEXT) {
      this.event.textEvent()
    }
  }
}
