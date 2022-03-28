import Step from './step'
import Background from './operate/background'
import Filter from './operate/filter'
import Rotate from './operate/rotate'
import Crop from './operate/crop'
import Draw from './operate/draw'
import Canvas from './canvas'

export default class ImageEditor {
  constructor(target, options = {}) {
    this.historys = []
    this.index = -1
    this.canvas = new Canvas(this, target, options)
  }

  add(operate, target = this.canvas) {
    if (!operate) {
      return
    }
    const step = new Step({ operate, target })
    const lastSetp = this._getLastStep()
    step.setPrev(lastSetp)
    this.historys.push(step)
    if (this.index !== -1) {
      lastSetp.next = step
    }
    this.index = this.historys.length - 1
    step.setIndex(this.index)
    this.render()
  }
  undo() {
    if (this.index === -1) {
      return false
    }
    const current = this.historys[this.index]
    if (current.operate instanceof Draw) {
      current.disabled = true
      if (current.selected) {
        this.canvas.event._removeSelect()
        current.selected = false
      }
    }
    if (!current.prev) {
      this.index = -1
    } else {
      this.index = current.prev.index
    }
    this.render()
  }
  redo() {
    if (this.index === this.historys.length - 1) {
      return false
    }
    if (this.index === -1) {
      this.index = 0
    } else {
      const current = this.historys[this.index]
      if (!current.next) {
        return false
      }
      if (current.operate instanceof Draw) {
        current.disabled = false
      }
      this.index = current.next.index
    }

    this.render()
  }
  loadImage(image) {
    if (!image || !(image instanceof Image)) {
      throw new Error('image must be an Image')
    }
    this.canvas.resetCanvasSize(image.width, image.height)
    this.canvas.drawImg(image)
  }
  _getLastStep() {
    if (!this.historys.length || this.index === -1) {
      return null
    }
    return this.historys[this.index]
  }
  getCurrentStep() {
    if (this.index === -1) {
      return null
    }
    return this.historys[this.index]
  }
  render(template = false) {
    const rotates = []
    let crop = null
    const renders = []
    const filters = {}
    let background = null
    if (this.historys.length && this.index !== -1) {
      let current = this.historys[this.index]
      while (current) {
        if (current.operate instanceof Background) {
          background = current
        } else if (current.operate instanceof Filter) {
          filters[current.operate.type] = current
        } else if (current.operate instanceof Crop) {
          //多个crop操作坐标叠加
          if (crop) {
            crop = Object.assign(current,
              {
                operate: {
                  ...current.operate,
                  x: crop.operate.x + current.operate.x,
                  y: crop.operate.y + current.operate.y,
                  render: current.operate.render
                }
              })
          } else {
            crop = current
          }
        } else if (current.operate instanceof Rotate) {
          rotates.unshift(current)
        } else {
          renders.unshift(current)
        }
        current = current.prev
      }
    }

    this._render(template, rotates, crop, renders, filters, background)
  }
  _render(template, rotates, crop, renders, filters, background) {
    this.canvas.resetCanvasSize(this.canvas.image.width, this.canvas.image.height)
    this.canvas.clearDraw()
    if (crop) {
      crop.operate.render(crop.target)
    }
    if (rotates && rotates.length) {
      let deg = 0
      for (let i = 0; i < rotates.length; i++) {
        deg += rotates[i].operate.deg
      }
      this.canvas.rotate(deg)
    }
    if (rotates && rotates.length) {
      let deg = 0
      for (let i = 0; i < rotates.length; i++) {
        deg += rotates[i].operate.deg
        const size = this.canvas.calculateWidthAndHeightOfRotate(deg)
        rotates[i].operate.render(rotates[i].target, size.width, size.height, deg)
      }
    }
    if (background) {
      background.operate.render(background.target)
    }

    if (renders && renders) {
      for (let i = 0; i < renders.length; i++) {
        renders[i].operate.render(renders[i].target)
      }
    }
    this.canvas._drawImg(crop)
    if (filters && Object.keys(filters).length) {
      const keys = Object.keys(filters)
      filters[keys[0]].operate.render(filters[keys[0]].target, filters, () => {
        this.canvas.event.activeAction(this.canvas.action)
      })
    } else {
      if (!template) {
        this.canvas.event.activeAction(this.canvas.action)
      }
    }
  }
  setAction(action, params) {
    //TODO 删除
    params = {
      lineWidth: 20,
      lineColor: '#333',
    }
    this.canvas.event._removeEventListener()
    this.canvas.action = action
    this.canvas.event = this.canvas.events[this.canvas.action]
    this.canvas.actionParams = params
    this.canvas.event.activeAction(this.canvas.action)
  }
}
