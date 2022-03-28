import Scale from './operate/scale'
import Step from './step'
import Crop from './operate/crop'
import Drwa from './operate/draw'
import Action from './action'
import { UUID, isOnThePath, isOnTheArea } from './utils'

export default class Event {
  constructor(canvas, target) {
    this.canvas = canvas
    this.target = target
    this.listeners = {}
  }
  activeAction(action) {
    this._removeEventListener()
    if (action === Action.NONE) {
      this._noneEvent()
    } else if (action === Action.CROP) {
      this._cropEvent()
    } else if (action === Action.DRAW) {
      this._drawEvent()
    } else if (action === Action.DROP) {
      this._dropEvent()
    } else if (action === Action.SHAPE) {
      this._shapeEvent()
    } else if (action === Action.TEXT) {
      this._textEvent()
    }
  }
  _removeEventListener(event, uuid) {
    if (event) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((item, index) => {
          if (uuid) {
            if (item.uuid === uuid) {
              item.target.removeEventListener(event, item.callback)
              this.listeners[event][index] = null
            }
          } else {
            item.target.removeEventListener(event, item.callback)
            this.listeners[event][index] = null
          }
        })
        console.log('_removeEventListener', event, uuid, this.listeners[event])
        this.listeners[event] = this.listeners[event].filter(item => !!item)
      }
    } else {
      const events = Object.keys(this.listeners)
      events.forEach((event) => {
        if (this.listeners[event]) {
          this.listeners[event].forEach((item) => {
            item.target.removeEventListener(event, item.callback)
          })
          this.listeners[event] = null
        }
      })
    }
  }

  _noneEvent() {
    this._registerEvent('mousedown', () => {
      this._registerEvent('mousemove', (e) => {
        this.canvas.originX += e.movementX
        this.canvas.originY += e.movementY
        this.canvas.offsetImage(this.canvas.originX, this.canvas.originY)
      })
      this._registerEvent('mouseout', () => {
        this._removeEventListener('mousemove')
        this._removeEventListener('mousedown')
      })
    })
    this._registerEvent('mouseup', () => {
      this._removeEventListener('mousemove')
    })
    this._registerEvent('touchstart', (e) => {
      let lastX = e.touches[0].pageX
      let lastY = e.touches[0].pageY
      this._registerEvent(
        'touchmove',
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          this.canvas.originX += e.touches[0].pageX - lastX
          this.canvas.originY += e.touches[0].pageY - lastY
          this.canvas.offsetImage(this.canvas.originX, this.canvas.originY)
          lastX = e.touches[0].pageX
          lastY = e.touches[0].pageY
        },
        { passive: false }
      )
      this._registerEvent(
        'touchend',
        () => {
          this._removeEventListener('touchmove')
        },
        { passive: false }
      )
    })
    this._registerEvent('mouseenter', () => {
      let accumulator = 0
      this._registerEvent(
        'mousewheel',
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          accumulator += e.deltaY
          if (Math.abs(accumulator) >= 20) {
            this.canvas.lastScale += (accumulator > 0 ? 0.01 : -0.01)
            this.canvas.setContainerScale(this.canvas.lastScale)
            accumulator = 0
          }
        },
        { options: { passive: false } }
      )
    })
    this._registerEvent('mouseleave', () => {
      //todo 加步骤
      this._removeEventListener('mousewheel')
    })
  }
  _cropEvent() {
    const lineWidth = this.canvas.lineWidth
    const lineColor = this.canvas.lineColor
    const dropBorderWidth = this.canvas.dropBorderWidth
    const r = ((this.canvas.upperCanvas.clientWidth * this.canvas.upperCanvas.clientHeight) / (this.canvas.upperCanvas.width * this.canvas.upperCanvas.height))
    const realLineWidth = (lineWidth * lineWidth) * r
    //鼠标落点坐标 crop区域宽高
    let w = 0
    let h = 0
    let x = 0
    let y = 0
    this._registerEvent('mousedown', (e) => {
      //非crop模式
      if (!this._hasResisterEvent('click')) {
        x = e.offsetX
        y = e.offsetY
        w = 0
        h = 0
        this._registerEvent('mousemove', (e) => {
          w += e.movementX
          h += e.movementY
          console.log(w, h)
          this._drawCropArea(this.canvas.upperCtx, x, y, w, h, realLineWidth, lineColor)
        }, { uuid: 'crop' })
        // this._registerEvent('mouseout', () => {
        //   this._removeEventListener('mousemove')
        //   this._removeEventListener('mousedown')
        // })
      } else {//crop 模式
        const result = this.calculateDropBorer(e.offsetX, e.offsetY, x, y, w, h, dropBorderWidth)
        if (result.hit) {
          this._registerEvent('mousemove', (e) => {
            w += e.movementX
            h += e.movementY
            this._drawCropArea(this.canvas.upperCtx, x, y, w, h, realLineWidth, lineColor)
          }, { uuid: 'crop' })
        }
      }
    }, { uuid: 'crop' })
    this._registerEvent('mouseenter', () => {
      this._registerEvent('mousemove', (e) => {
        const r = this.calculateDropBorer(e.offsetX, e.offsetY, x, y, w, h, dropBorderWidth)
      }, { uuid: 'dropborder' })
    })
    this._registerEvent('mouseup', () => {
      if (!this._hasResisterEvent('click')) {
        this._removeEventListener('mousemove', 'crop')
      } else {
        this._removeEventListener('mousemove', 'crop')
      }
      this._drawCropApplyArea(this.canvas.upperCtx, { x: x + w / 2 - 40, y: h < 0 ? y : (y + h), w: 80 * r, h: 30 * r, realLineWidth, lineColor, fillColor: 'rgba(0, 0, 0, 0.7)' }, { cropX: x, cropY: y, cropW: w, cropH: h, r })
    })
  }
  calculateDropBorer(pointX, pointY, x, y, w, h, dropBorderWidth) {
    if (pointX >= x - dropBorderWidth / 2 && pointX <= x + dropBorderWidth / 2 && pointY >= y - dropBorderWidth / 2 && pointY <= y + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'nw-resize'
      return {
        hit: true,
        type: 't-l'
      }
    } else if (pointX >= x + w / 2 - dropBorderWidth / 2 && pointX <= x + w / 2 + dropBorderWidth / 2 && pointY >= y - dropBorderWidth / 2 && pointY <= y + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'n-resize'
      return {
        hit: true,
        type: 't-c'
      }
    } else if (pointX >= x + w - dropBorderWidth / 2 && pointX <= x + w + dropBorderWidth / 2 && pointY >= y - dropBorderWidth / 2 && pointY <= y + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'ne-resize'
      return {
        hit: true,
        type: 't-r'
      }
    } else if (pointX >= x - dropBorderWidth / 2 && pointX <= x + dropBorderWidth / 2 && pointY >= y + h / 2 - dropBorderWidth / 2 && pointY <= y + h / 2 + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'w-resize'
      return {
        hit: true,
        type: 'c-l'
      }
    } else if (pointX >= x + w - dropBorderWidth / 2 && pointX <= x + w + dropBorderWidth / 2 && pointY >= y + h / 2 - dropBorderWidth / 2 && pointY <= y + h / 2 + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'e-resize'
      return {
        hit: true,
        type: 'c-r'
      }
    } else if (pointX >= x - dropBorderWidth / 2 && pointX <= x + dropBorderWidth / 2 && pointY >= y + h - dropBorderWidth / 2 && pointY <= y + h + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'sw-resize'
      return {
        hit: true,
        type: 'b-l'
      }
    } else if (pointX >= x + w / 2 - dropBorderWidth / 2 && pointX <= x + w / 2 + dropBorderWidth / 2 && pointY >= y + h - dropBorderWidth / 2 && pointY <= y + h + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 's-resize'
      return {
        hit: true,
        type: 'b-c'
      }
    } else if (pointX >= x + w - dropBorderWidth / 2 && pointX <= x + w + dropBorderWidth / 2 && pointY >= y + h - dropBorderWidth / 2 && pointY <= y + h + dropBorderWidth / 2) {
      this.canvas.upperCanvas.style.cursor = 'se-resize'
      return {
        hit: true,
        type: 'b-r'
      }
    } else {
      this.canvas.upperCanvas.style.cursor = 'default'
      return {
        hit: false
      }
    }

  }
  _drawCropApplyArea(ctx, { x, y, w, h, lineWidth, lineColor, fillColor }, { cropX, cropY, cropW, cropH, r }) {
    if (y + h > this.canvas.upperCanvas.height) {
      y -= h
    }
    this._drawRect(ctx, { x, y }, w / 2, h, lineWidth, lineColor, fillColor, () => {
      this._registerEvent('click', (e) => {
        const cx = e.offsetX
        const cy = e.offsetY
        if (cx >= x && cy >= y && cx <= x + w / 2 && cy <= y + h) {
          console.log('apply crop')
          this.canvas.dispatch.add(new Crop(cropX, cropY, cropW, cropH, r))
          this._removeEventListener('click')
        }
      })
    })
    this._drawRect(ctx, { x: x + w / 2, y }, w / 2, h, lineWidth, lineColor, fillColor, () => {
      this._registerEvent('click', (e) => {
        const cx = e.offsetX
        const cy = e.offsetY
        if (cx >= x + w / 2 && cy >= y && cx <= x + w && cy <= y + h) {
          console.log('cancel crop')
          this._clearCanvas(ctx)
          this._removeEventListener('click')
        }
      })
    })
  }
  _clearCanvas(ctx) {
    ctx.clearRect(0, 0, this.canvas.upperCanvas.width, this.canvas.upperCanvas.height)
  }
  _drawCropArea(ctx, x, y, w, h, lineWidth, lineColor = '#fff') {
    if (Math.abs(w) >= lineWidth * 4 || Math.abs(h) >= lineWidth * 4) {
      this._clearCanvas(ctx)
      this._drawRect(ctx, { x, y }, w, h, lineWidth, lineColor)
      //竖线
      this._drawLine(ctx, { x: x + w / 3, y }, { x: x + w / 3, y: y + h }, lineWidth)
      this._drawLine(ctx, { x: x + w / 3 * 2, y }, { x: x + w / 3 * 2, y: y + h }, lineWidth)
      //横线
      this._drawLine(ctx, { x, y: y + h / 3 }, { x: x + w, y: y + h / 3 }, lineWidth)
      this._drawLine(ctx, { x, y: y + h / 3 * 2 }, { x: x + w, y: y + h / 3 * 2 }, lineWidth)
    }
  }
  //画线
  _drawLine(ctx, start, end, lineWidth, color = '#fff') {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }
  _drawCurve(ctx, start, end, cp, lineWidth, color = '#fff') {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y)
    ctx.stroke()
  }
  //画块
  _drawRect(ctx, start, width, height, lineWidth, color = '#fff', fillColor, cb = () => { }) {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.rect(start.x, start.y, width, height)
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(start.x, start.y, width, height);
    }
    ctx.stroke()
    cb()
  }
  //画图
  _drawImage(ctx, start, src) {
    let img = new Image();
    img.src = src
    img.onload = () => {
      ctx.drawImage(img, start.x, start.y);
    }
  }
  _drawEvent() {
    let draw, currHover
    this._registerEvent('mousedown', (e) => {
      if (currHover) {
        console.log('_addSelect')
        this._removeSelect()
        this._addSelect(currHover)
      } else {
        const uuid = UUID()
        const canvas = document.createElement('canvas')
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.pointerEvents = 'all'
        canvas.width = this.canvas.canvas.width
        canvas.height = this.canvas.canvas.height
        canvas.setAttribute('data-uuid', uuid)
        this.canvas.shapesElement.appendChild(canvas)
        const ctx = canvas.getContext('2d');
        const path = []
        let x = e.offsetX
        let y = e.offsetY
        let target = e.target
        while (target !== this.canvas.container) {
          x += (target.offsetLeft || 0)
          y += (target.offsetTop || 0)
          target = target.parentNode
        }
        draw = new Drwa(uuid, path, this.canvas.actionParams.lineWidth, this.canvas.actionParams.lineColor, canvas)
        path.push({ x, y })
        this._registerEvent('mousemove', (e) => {
          x += (e.movementX / 2)
          y += (e.movementY / 2)
          path.push({ x, y })
          this._drawLine(
            ctx,
            { x: path[path.length - 2].x, y: path[path.length - 2].y },
            { x: path[path.length - 1].x, y: path[path.length - 1].y },
            this.canvas.actionParams.lineWidth,
            this.canvas.actionParams.lineColor,
          )
          x += (e.movementX / 2)
          y += (e.movementY / 2)
          path.push({ x, y })
          this._drawCurve(
            ctx,
            { x: path[path.length - 3].x, y: path[path.length - 3].y },
            { x: path[path.length - 1].x, y: path[path.length - 1].y },
            { x: path[path.length - 2].x, y: path[path.length - 2].y },
            this.canvas.actionParams.lineWidth,
            this.canvas.actionParams.lineColor,
          )
        }, { uuid: 'draw' })
      }
    })
    this._registerEvent('mouseleave', () => {
      this._removeEventListener('mousemove')
    })
    this._registerEvent('mouseenter', () => {
      this._registerEvent('mousemove', (e) => {
        if (this._hasResisterEvent('mousemove', 'selected')) {
          return
        }
        let x = e.offsetX
        let y = e.offsetY
        let target = e.target
        while (target !== this.canvas.container) {
          x += (target.offsetLeft || 0)
          y += (target.offsetTop || 0)
          target = target.parentNode
        }
        const keys = Object.getOwnPropertySymbols(this.canvas.shapes)
        if (keys) {
          keys.forEach(key => {
            const paths = this.canvas.shapes[key].filter((item) => !item.disabled)
            if (paths.length) {
              //移除上一个hover的事件
              currHover = null
              for (let i = paths.length - 1; i >= 0; i--) {
                const curr = paths[i]
                if (isOnTheArea(
                  { x, y },
                  {
                    x: curr.x,
                    y: curr.y,
                    w: curr.w,
                    h: curr.h,
                    offsetX: curr.offsetX,
                    offsetY: curr.offsetY,
                  })) {
                  console.log(x, y, curr)
                }

                if (isOnTheArea(
                  { x, y },
                  {
                    x: curr.x,
                    y: curr.y,
                    w: curr.w,
                    h: curr.h,
                    offsetX: curr.offsetX,
                    offsetY: curr.offsetY,
                  })
                  &&
                  isOnThePath(
                    { x, y, },
                    curr
                  )) {
                  currHover = curr
                } else {
                  curr.selected = false
                  this._removeHover()
                }
              }
              this._addHover(currHover)

            }
          })
        }
      }, 'drop')
    })
    this._registerEvent('mousemove', (e) => {
      if (this._hasResisterEvent('mousemove', 'selected')) {
        return
      }
      let x = e.offsetX
      let y = e.offsetY
      let target = e.target
      while (target !== this.canvas.container) {
        x += (target.offsetLeft || 0)
        y += (target.offsetTop || 0)
        target = target.parentNode
      }
      const keys = Object.getOwnPropertySymbols(this.canvas.shapes)
      if (keys) {
        keys.forEach(key => {
          const paths = this.canvas.shapes[key].filter((item) => !item.disabled)
          if (paths.length) {
            //移除上一个hover的事件
            currHover = null
            for (let i = paths.length - 1; i >= 0; i--) {
              const curr = paths[i]
              if (isOnTheArea(
                { x, y },
                {
                  x: curr.x,
                  y: curr.y,
                  w: curr.w,
                  h: curr.h,
                  offsetX: curr.offsetX,
                  offsetY: curr.offsetY,
                })) {
                console.log(x, y, curr)
              }

              if (isOnTheArea(
                { x, y },
                {
                  x: curr.x,
                  y: curr.y,
                  w: curr.w,
                  h: curr.h,
                  offsetX: curr.offsetX,
                  offsetY: curr.offsetY,
                })
                &&
                isOnThePath(
                  { x, y, },
                  curr
                )) {
                currHover = curr
              } else {
                curr.selected = false
                this._removeHover()
              }
            }
            this._addHover(currHover)

          }
        })
      }
    }, 'drop')
    this._registerEvent('mouseup', () => {
      if (currHover) {

      } else {
        if (!draw) {
          return
        }
        this._removeEventListener('mousemove', 'draw')
        draw.render(this.canvas.shapesElement)
        this.canvas.shapes[Action.DRAW].push(
          draw
        )
        this.canvas.dispatch.add(draw, this.canvas.shapesElement)
      }
    })
  }
  _removeHover() {
    this.canvas.hover.style.display = 'none'
  }
  _addHover(draw) {
    if (!draw) {
      return
    }
    this.canvas.hover.style.width = draw.w + 'px'
    this.canvas.hover.style.height = draw.h + 'px'
    this.canvas.hover.style.top = draw.y + 'px'
    this.canvas.hover.style.left = draw.x + 'px'
    this.canvas.hover.style.display = 'block'
  }
  _removeSelect() {
    this.canvas.selected.style.display = 'none'
    this._removeEventListener('mousemove', 'selected')
    this._removeEventListener('mousedown', 'selected')
    this._removeEventListener('mouseup', 'selected')
  }
  _addSelect(draw) {
    if (!draw) {
      return
    }
    draw.selected = true
    this._removeEventListener('mousemove', 'selected')
    this._removeEventListener('mousedown', 'selected')
    this._removeEventListener('mouseup', 'selected')
    this._setSelectedPosition(draw)
    this._setSelectedPointPosition(draw)
    this._registerEvent('mousedown', (e) => {
      e.stopPropagation()
      this._removeHover()
      this._registerEvent('mousemove', (e) => {
        draw.setOffset(e.movementX, e.movementY)
        this._setSelectedPosition(draw)
        this._setSelectedPointPosition(draw)
        draw.render(this.canvas.shapesElement)
      }, { uuid: 'selected' }, this.canvas.selected)
    }, { uuid: 'selected' }, this.canvas.selected)
    this._registerEvent('mousemove', (e) => {
      this._removeHover()
      draw.setOffset(e.movementX, e.movementY)
      this._setSelectedPosition(draw)
      this._setSelectedPointPosition(draw)
      draw.render(this.canvas.shapesElement)
    }, { uuid: 'selected' }, this.canvas.selected)
    this._registerEvent('mouseup', (e) => {
      this._removeEventListener('mousemove', 'selected')
    }, { uuid: 'selected' }, this.canvas.selected)
  }
  _setSelectedPosition(draw) {
    this.canvas.selected.style.width = draw.w + 'px'
    this.canvas.selected.style.height = draw.h + 'px'
    this.canvas.selected.style.top = draw.y + 'px'
    this.canvas.selected.style.left = draw.x + 'px'
    this.canvas.selected.style.display = 'block'
  }
  _setSelectedPointPosition(draw) {
    console.log('remove _setSelectedPointPosition')
    this._removeEventListener('mousemove', 'resize')
    this._removeEventListener('mousedown', 'resize')
    this._removeEventListener('mouseleave', 'resize')
    this._removeEventListener('mouseup', 'resize')
    const tl = this.canvas.selected.querySelector('div[data-position="t-l"]')
    this._resizeSelected(tl, 'tl', draw)
    const tr = this.canvas.selected.querySelector('div[data-position="t-r"]')
    this._resizeSelected(tr, 'tr', draw)
    const tc = this.canvas.selected.querySelector('div[data-position="t-c"]')
    tc.style.left = draw.w / 2 - this.canvas.dropNodeWidth / 2 + 'px'
    this._resizeSelected(tc, 'tc', draw)
    const cl = this.canvas.selected.querySelector('div[data-position="c-l"]')
    cl.style.top = draw.h / 2 - this.canvas.dropNodeWidth / 2 + 'px'
    this._resizeSelected(cl, 'cl', draw)
    const cr = this.canvas.selected.querySelector('div[data-position="c-r"]')
    cr.style.top = draw.h / 2 - this.canvas.dropNodeWidth / 2 + 'px'
    this._resizeSelected(cr, 'cr', draw)
    const bl = this.canvas.selected.querySelector('div[data-position="b-l"]')
    this._resizeSelected(bl, 'bl', draw)
    const br = this.canvas.selected.querySelector('div[data-position="b-r"]')
    this._resizeSelected(br, 'br', draw)
    const bc = this.canvas.selected.querySelector('div[data-position="b-c"]')
    bc.style.left = draw.w / 2 - this.canvas.dropNodeWidth / 2 + 'px'
    this._resizeSelected(bc, 'bc', draw)
  }
  _resizeSelected(target, type, draw) {
    console.log('add _resizeSelected')
    this._registerEvent('mousedown', (e) => {
      e.stopPropagation()
      let offsetX = 0
      let offsetY = 0
      this._registerEvent('mousemove', (e) => {
        e.stopPropagation()
        offsetX += e.movementX
        offsetY += e.movementY
        const w = draw.w
        const h = draw.h
        if (type === 'tl' || type === 'tr' || type === 'bl' || type === 'br') {
          if (!offsetX || !offsetY) {
            return
          }
          if (type === 'tl' || type === 'bl') {
            this._setScale(draw, 'xScale', Math.abs(offsetX) / w, !(offsetX > 0))
          } else {
            this._setScale(draw, 'xScale', Math.abs(offsetX) / w, offsetX > 0)
          }
          if (type === 'tl' || type === 'tr') {
            this._setScale(draw, 'yScale', Math.abs(offsetY) / h, !(offsetY > 0))
          } else {
            this._setScale(draw, 'yScale', Math.abs(offsetY) / h, offsetY > 0)
          }

          if (type === 'tl') {
            draw.setScaleOffset(offsetX, offsetY)
          } else if (type === 'tr') {
            draw.setScaleOffset(0, offsetY)
          } else if (type === 'bl') {
            draw.setScaleOffset(offsetX, 0)
          }
        } else if (type === 'tc' || type === 'bc') {
          if (!offsetY) {
            return
          }
          if (type === 'tc') {
            this._setScale(draw, 'yScale', Math.abs(offsetY) / h, !(offsetY > 0))
          } else {
            this._setScale(draw, 'yScale', Math.abs(offsetY) / h, offsetY > 0)
          }

          if (type === 'tc') {
            draw.setScaleOffset(0, offsetY)
          }
        } else {
          if (!offsetX) {
            return
          }
          if (type === 'cl') {
            this._setScale(draw, 'xScale', Math.abs(offsetX) / w, !(offsetX > 0))
          } else {
            this._setScale(draw, 'xScale', Math.abs(offsetX) / w, offsetX > 0)
          }
          if (type === 'cl') {
            draw.setScaleOffset(offsetX, 0)
          }

        }
        offsetX = 0
        offsetY = 0
        draw.render(this.canvas.shapesElement)
        this._setSelectedPosition(draw)
        const tc = this.canvas.selected.querySelector('div[data-position="t-c"]')
        tc.style.left = draw.w / 2 - this.canvas.dropNodeWidth / 2 + 'px'
        const cl = this.canvas.selected.querySelector('div[data-position="c-l"]')
        cl.style.top = draw.h / 2 - this.canvas.dropNodeWidth / 2 + 'px'
        const cr = this.canvas.selected.querySelector('div[data-position="c-r"]')
        cr.style.top = draw.h / 2 - this.canvas.dropNodeWidth / 2 + 'px'
        const bc = this.canvas.selected.querySelector('div[data-position="b-c"]')
        bc.style.left = draw.w / 2 - this.canvas.dropNodeWidth / 2 + 'px'
      }, { uuid: 'resize' }, target)
    }, { uuid: 'resize' }, target)
    this._registerEvent('mouseup', (e) => {
      console.log('remove _resizeSelected')
      this._removeEventListener('mousemove', 'resize')
    }, { uuid: 'resize' }, target)
    this._registerEvent('mouseleave', (e) => {
      this._setSelectedPointPosition(draw)
    }, { uuid: 'resize' }, target)
  }
  _setScale(target, key, value, isAdd = true) {
    if (isAdd) {
      target[key] += value
    } else {
      target[key] -= value
    }
  }
  _dropEvent() { }
  _shapeEvent() { }
  _textEvent() { }
  _registerEvent(event, callback, options = {}, target = this.target) {
    let { option, uuid } = options
    console.log('_registerEvent', event, uuid)
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event] = [...this.listeners[event], { callback, uuid, target }]
    target.addEventListener(event, callback, option)
  }
  _hasResisterEvent(event, uuid) {
    if (uuid) {
      console.log(!!(this.listeners[event] && this.listeners[event].some((item) => item.uuid === uuid)))
      return !!(this.listeners[event] && this.listeners[event].some((item) => item.uuid === uuid))
    } else {
      console.log(!!(this.listeners[event] && this.listeners[event].length))
      return !!(this.listeners[event] && this.listeners[event].length)
    }
  }
}
