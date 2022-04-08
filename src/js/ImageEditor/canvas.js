import Event from './event'
import Action from './action'
import { setTransform, SIN, COS } from './utils'

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
    frame.style.position = 'relative'
    this.frame = frame
    const container = document.createElement('div')
    container.setAttribute('data-tag', 'container')
    container.style.userSelect = 'none'
    container.style.width = '100%'
    container.style.height = '100%'
    container.style.overflow = 'hidden'
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
    shapes.style.overflow = 'hidden'
    shapes.style.position = 'absolute'
    shapes.style.top = '0'
    shapes.style.left = '0'
    shapes.style.width = '100%'
    shapes.style.height = '100%'
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
      {
        type: 'rotate',
        css: {
          bottom: `-${this.dropNodeWidth * 2}px`,
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
        if (css === 'cursor') {
          if (points[i].type === 't-l' || points[i].type === 'b-r') {
            point.style[css] = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),${points[i].css[css]}`
          } else if (points[i].type === 't-r' || points[i].type === 'b-l') {
            point.style[css] = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),${points[i].css[css]}`
          } else if (points[i].type === 't-c' || points[i].type === 'b-c') {
            point.style[css] = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),${points[i].css[css]}`
          } else {
            point.style[css] = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),${points[i].css[css]}`
          }
        } else {
          point.style[css] = points[i].css[css]
        }

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
  setCanvasSize(w, h) {
    this.canvas.width = w
    this.canvas.height = h
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.maxWidth = w + 'px'
    this.canvas.style.maxHeight = h + 'px'
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
  calculateCanvasWidthAndHeightOfRotate(deg, w, h) {
    deg %= 90
    const aspectRatio = w / h
    let width, height, centerRectangleWidth, centerRectangleHeight, offsetX, offsetY
    if (deg % 90) {
      if (deg > 0) {
        console.log(SIN(deg) * w, COS(deg) * h)
        width = SIN(deg) * w + COS(deg) * h
        centerRectangleWidth = width
        centerRectangleHeight = SIN(deg) * h + COS(deg) * w
      } else {
        width = COS(deg) * w + SIN(deg) * h
        centerRectangleWidth = width
        centerRectangleHeight = COS(deg) * h + SIN(deg) * w
      }
      height = width / aspectRatio
      offsetX = COS(deg) * ((height - centerRectangleHeight) / 2)
      offsetY = SIN(deg) * ((height - centerRectangleHeight) / 2)
      return {
        width,
        height
      }
    } else if (deg === 0) {
      return {
        width: w,
        height: h,
      }
    } else {
      return {
        width: h,
        height: h / aspectRatio
      }
    }
  }
  calculateWidthAndHeightOfRotate(deg, w = this.image.width, h = this.image.height) {
    deg %= 360
    if (deg % 90 === 0) {
      if (deg % 180 === 0) {
        return { width: w, height: h }
      } else {
        return { width: h, height: w }
      }
    } else {
      if (deg > 0) {
        if (deg < 90 || (deg > 180 && deg < 270)) {
          return {
            width: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * h + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * w,
            height: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * w + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * h,
          }
        } else {
          return {
            width: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * w + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * h,
            height: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * h + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * w,
          }
        }
      } else {
        if (Math.abs(deg) < 90 || (Math.abs(deg) > 180 && Math.abs(deg) < 270)) {
          return {
            width: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * h + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * w,
            height: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * w + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * h,
          }
        } else {
          return {
            width: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * w + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * h,
            height: Math.sin(Math.PI / 180 * (Math.abs(deg) % 90)) * h + Math.cos(Math.PI / 180 * Math.abs(deg % 90)) * w,
          }
        }
      }
    }
  }
  rotate(deg, w, h) {
    const size = this.calculateWidthAndHeightOfRotate(deg, w, h)
    this.resetCanvasSize(size.width, size.height)
  }
  resetCanvasImage() {
    this.image = this.originImage
  }
  offsetImage(x, y) {
    const transform = setTransform(this.upperCanvas.style.transform, 'translate', `${x}px,${y}px`)
    console.log(transform)
    this.upperCanvas.style.transform = transform
    this.canvas.style.transform = transform
    this.shapesElement.style.transform = transform
  }
  setImage(imgData) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = imgData.width
      canvas.height = imgData.height
      ctx.putImageData(imgData, 0, 0)
      const image = new Image()
      image.src = canvas.toDataURL('image/png')
      image.onload = () => {
        console.log('setImage')
        this.image = image
        resolve()
      }
    })

  }
  _drawImg(crop) {
    if (!this.image) {
      return
    }
    this.ctx.drawImage(this.image, 0, 0)
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
