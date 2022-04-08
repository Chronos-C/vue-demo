import Scale from './operate/scale'
import Step from './step'
import Crop from './operate/crop'
import Draw from './operate/draw'
import Text from './operate/text'
import Shape from './operate/shape'
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
        // console.log('_removeEventListener', event, uuid, this.listeners[event])
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
          const imgData = this.canvas.ctx.getImageData(cropX, cropY, cropW, cropH)
          this.canvas.dispatch.add(new Crop(cropX, cropY, cropW, cropH, r, imgData))
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
  _generateShapeCanvas(uuid) {
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'all'
    canvas.width = this.canvas.canvas.width
    canvas.height = this.canvas.canvas.height
    canvas.setAttribute('data-uuid', uuid)
    return canvas
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
        const canvas = this._generateShapeCanvas(uuid)
        this.canvas.shapesElement.appendChild(canvas)
        const ctx = canvas.getContext('2d');
        const path = []
        let { x, y } = this._getOffsetToContainer(e)
        draw = new Draw(uuid, path, this.canvas.actionParams.lineWidth, this.canvas.actionParams.lineColor, canvas)
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
        currHover = this._mouseMove(e, currHover)
      }, { uuid: 'drop' })
    })
    this._registerEvent('mousemove', (e) => {
      currHover = this._mouseMove(e, currHover)
    }, { uuid: 'drop' })
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
  _mouseMove(e, currHover) {
    // if (this._hasResisterEvent('mousemove', 'selected')) {
    //   return
    // }
    let { x, y } = this._getOffsetToContainer(e)
    const keys = Object.getOwnPropertySymbols(this.canvas.shapes)
    //移除上一个hover的事件
    currHover = null
    if (keys) {
      keys.forEach(key => {
        const shapes = this.canvas.shapes[key].filter((item) => !item.disabled)
        if (shapes.length) {
          for (let i = shapes.length - 1; i >= 0; i--) {
            const curr = shapes[i]
            if (curr instanceof Shape && curr.type === Shape.CURVE) {
              console.log(isOnTheArea(
                { x, y },
                {
                  x: curr.x,
                  y: curr.y,
                  w: curr.w,
                  h: curr.h,
                }), isOnThePath(
                  { x, y, },
                  curr
                ), curr)
              if (isOnTheArea(
                { x, y },
                {
                  x: curr.x,
                  y: curr.y,
                  w: curr.w,
                  h: curr.h,
                })
                &&
                isOnThePath(
                  { x, y, },
                  curr
                )) {
                currHover = curr
              } else {
                this._removeHover()
              }
            } else if (curr instanceof Text) {
              if (isOnTheArea(
                { x, y },
                {
                  x: curr.x,
                  y: curr.y,
                  w: curr.input.clientWidth,
                  h: curr.input.clientHeight,
                })) {
                curr.w = curr.input.clientWidth
                curr.h = curr.input.clientHeight
                currHover = curr
              } else {
                this._removeHover()
              }
            } else {
              if (isOnTheArea(
                { x, y },
                {
                  x: curr.x,
                  y: curr.y,
                  w: curr.w,
                  h: curr.h,
                })) {
                currHover = curr
              } else {
                this._removeHover()
              }

            }

          }
          this._addHover(currHover)

        }
      })
    }
    return currHover
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
    this.canvas.hover.style.transform = `rotate(${draw.rotate}deg)`
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
        console.log('_addSelect mousemove', e)
        draw.setOffset(e.movementX, e.movementY)
        this._setSelectedPosition(draw)
        this._setSelectedPointPosition(draw)
        draw.render(this.canvas.shapesElement)
      }, { uuid: 'selected' }, this.canvas.selected)
    }, { uuid: 'selected' }, this.canvas.selected)
    this._registerEvent('mousemove', (e) => {
      console.log('_addSelect mousemove2', e)
      this._removeHover()
      draw.setOffset(e.movementX, e.movementY)
      this._setSelectedPosition(draw)
      this._setSelectedPointPosition(draw)
      draw.render(this.canvas.shapesElement)
    }, { uuid: 'selected' }, this.canvas.selected)
    this._registerEvent('mouseup', (e) => {
      this._setSelectedPosition(draw)
      this._setSelectedPointPosition(draw)
      this._removeEventListener('mousemove', 'selected')
    }, { uuid: 'selected' }, this.canvas.selected)
    this._registerEvent('mouseleave', (e) => {
      this._setSelectedPosition(draw)
      this._setSelectedPointPosition(draw)
      this._removeEventListener('mousemove', 'selected')
    }, { uuid: 'selected' }, this.canvas.selected)
  }
  _setSelectedPosition(draw) {
    console.log('_setSelectedPosition', draw)
    this.canvas.selected.style.width = draw.w + 'px'
    this.canvas.selected.style.height = draw.h + 'px'
    this.canvas.selected.style.top = draw.y + 'px'
    this.canvas.selected.style.left = draw.x + 'px'
    this.canvas.selected.style.display = 'block'
    this.canvas.selected.style.transform = `rotate(${draw.rotate}deg)`
  }
  _setSelectedPointPosition(draw) {
    console.log('remove _setSelectedPointPosition')
    this._removeEventListener('mousedown', 'rotate')
    this._removeEventListener('mousemove', 'rotate')
    this._removeEventListener('mouseleave', 'rotate')
    this._removeEventListener('mouseup', 'rotate')
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
    const rotate = this.canvas.selected.querySelector('div[data-position="rotate"]')
    rotate.style.left = draw.w / 2 - this.canvas.dropNodeWidth / 2 + 'px'
    this._rotateSelected(rotate, draw)
  }
  _rotateSelected(target, draw) {
    this._registerEvent('mousedown', (e) => {
      e.stopPropagation()
      this._removeHover()
      this._registerEvent('mousemove', (e) => {
        e.stopPropagation()
        const x = e.movementX
        const y = e.movementY
        if (draw.rotate > 315 || draw.rotate <= 45) {
          draw.setRotate(-x)
        } else if (draw.rotate > 45 && draw.rotate <= 135) {
          draw.setRotate(-y)
        } else if (draw.rotate > 135 && draw.rotate <= 225) {
          draw.setRotate(x)
        } else if (draw.rotate > 225 && draw.rotate <= 315) {
          draw.setRotate(y)
        }
        if (draw.rotate < 0) {
          draw.rotate = 360 - Math.abs(draw.rotate)
        }
        draw.rotate %= 360
        this._setSelectedPosition(draw)
        this._setPostionCursor(draw)
        draw.render(this.canvas.shapesElement)
      }, { uuid: 'rotate' }, target)
    }, { uuid: 'rotate' }, target)
    this._registerEvent('mouseup', (e) => {
      console.log('remove _resizeSelected')
      this._removeEventListener('mousemove', 'rotate')
    }, { uuid: 'rotate' }, target)
    this._registerEvent('mouseleave', (e) => {
      this._setSelectedPointPosition(draw)
      draw.render(this.canvas.shapesElement)
    }, { uuid: 'rotate' }, target)
  }
  _setPostionCursor(draw) {
    const tl = this.canvas.selected.querySelector('div[data-position="t-l"]')
    const tr = this.canvas.selected.querySelector('div[data-position="t-r"]')
    const tc = this.canvas.selected.querySelector('div[data-position="t-c"]')
    const cl = this.canvas.selected.querySelector('div[data-position="c-l"]')
    const cr = this.canvas.selected.querySelector('div[data-position="c-r"]')
    const bl = this.canvas.selected.querySelector('div[data-position="b-l"]')
    const br = this.canvas.selected.querySelector('div[data-position="b-r"]')
    const bc = this.canvas.selected.querySelector('div[data-position="b-c"]')
    if ((draw.rotate <= 25 || draw.rotate > 340) || (draw.rotate >= 160 && draw.rotate < 205)) {
      tl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      br.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      tr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      bl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      tc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      bc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      cl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      cr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
    } else if ((draw.rotate > 25 && draw.rotate < 70) || (draw.rotate >= 205 && draw.rotate < 250)) {
      tl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      br.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      tr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      bl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      tc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      bc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      cl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      cr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
    } else if ((draw.rotate >= 70 && draw.rotate < 115) || (draw.rotate >= 250 && draw.rotate < 295)) {
      tl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      br.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      tr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      bl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      tc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      bc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      cl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      cr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
    } else if ((draw.rotate >= 115 && draw.rotate < 160) || (draw.rotate >= 295 && draw.rotate < 340)) {
      tl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      br.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAACVUlEQVQokW2TPUsjURiFn0zGSZDAFonMKhjYwlgJkt1CsNHKxkIE2T9gYeMPsdpy1WZhhWUlEtFOWLCykRUlokXiB9okk4wmKIkOyczZYhONwQMv3Hvee99b3OeEJPGOEkCjXR2FAQEfgOqLK6m7Pkna1Kt+tP1VvdUvSeE3j0vKdrqu66rRaHS23yXJ930FQaBqtdo9aDXcvvwZ+FYqldje3qZcLpNMJolEIgBfJHFzc8PW1hYPDw8MDAxgWRahUOiLIek38BdgZ2eH3d1dGo0G4XCYVqsFQLPZ5Pz8nLOzM46Pjzk4OODx8REAE/h6f3/PxsYGmUyGeDxOrVbj9PSURCKB7/u4rkutViMSibC/v8/d3R3Dw8Mkk0nMp6cnstksKysrFItFpqamuLi4IJfLUSwWCYKAkZERLi8vcRyH6+trCoUC5XKZ5eXl/wPq9TqxWIxoNEq9Xufk5ITn52fi8Tj9/f0cHR0RjUaxbRvHcbi9vSUIAmzbxjQMg3Q6zcLCAoeHh1iWxfj4ODMzM9i2zdXVFaZpYlkWmUyGXC7H3NwcS0tLDA4OYsZiMSYmJrBtm6GhISqVCrOzs4yNjWEYBqOjowDs7e1RKBSYnJxkcXGRdDqNZVmYpmkCkEql8DyPfD6P53kv3wXgeR6maTI/P8/09DSpVKqDz08k9Un6KEmlUkn5fF6O48j3fUlSEATyfV+VSkWu63YA+iMp1k1hnyQ1m80eYl8RbrVaneXmm9R05WC9fWBdkt1hXZIhaa3dW+vJDqGeNPYBzffi2Yau1Wv+AzdlzzwbCNWGAAAAAElFTkSuQmCC'),move`
      tr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      bl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAQCAYAAAAiYZ4HAAABFElEQVQokXWSMW6DQBBFnwiXcYNcuLWypHVlGrgAlVNR0bGcgIKWK/gMrK+QgpyAW1j6aViyhuRLU+z+92E1M0giqJv2uoVMCF88URSFiqIIQ5dt4Oiduq4FCFBd12Ho6AOxpEmS+r4XIGOMjDEC1Pe9D0ySYiSlkjSOowA1TbMGmqYRoHEcfSiNCXS/38myjDRNAbDWkiQJLwqf5OX/sNEkKY6AJ5AAH8CDvR6LlwDPKDDe/oB3XrzUF3D4B35f6htIIuAMHJxzWGt3tLUW5xzLB88vXWrblnme13NZlgzDgDHmFwq71HXdbnBd1+0Gh6STv62qal2NqqrCtp62y3f1Tp7nyvM8hK/b5fP1uZ3WcrcyP/v/iukOlDsjAAAAAElFTkSuQmCC'),move`
      tc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      bc.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACP0lEQVQ4jX2Tv0tbURTHPzdJX+ujRmIXUZIXKIFgtJNkEIvSPyFDFuemOCmOGYqjuHQzbaVDB8eOjnXoUtKMGaTBIVZU5Cn+6CMNpO99u3jtq7Q98IV7uefLOfd7vsdIIhYJwMTu9jHiH5GInRtACPyMIbxB405urISEpJYkRVGkMAxvEUWRoihSLBp3eBhJZaDZarVYXl7m8vKS4eFhRkZGcF2XxcVFKpUKiUQCYwxA0hgT2a8ngC5APp8HYG9vD8dxcF2X0dFRrq6uCMPQkl8bY/7QIwU8Btjf32d6ehrf9/F9n2q1Sq1Ww3EcS34HvJL0DPgCBLaDhwBBEHB4eMjCwgKZTIbNzU3q9TqdTscW84CvwEfgO/DeijEhSUdHRxobG9P6+rqCIFC1WlU2m9Xq6qoGg4EkqdPpaHd3V0EQWFEfJdfW1n4AL13XpVAokEwmmZmZoVQqcXJyws7ODufn53ieR6/XY2Njg3Q6TbFYBPhsJKWAQRiGSCKVSt0KdHp6ysrKCu12m1KpRDabZXx8nHK5zNzcHMBTO883sVm/lVSQ9EGSms2mlpaWND8/L0Czs7Pqdrs2N2/d9QK4BzjGmBpQByq+73N2dkYul8PzPCYnJ+l2uxwcHPwW1joq5jBXknq9nra3t+V5ngANDQ0pnU6rUChoa2vLdvDcWPLNrJGUAEJJ9Pt9Li4uuL6+pt/vc3x8TC6XY2pqCmAAPLnt4A4a+n98klS0u/DXJbsx2QMgA6SB+8AE8A1o26RfWvKP8ADq6QQAAAAASUVORK5CYII='),move`
      cl.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
      cr.style.cursor = `url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACQUlEQVQ4jX2Tv0vbURTFPy+pIuoQCSikJhGa1IB2k6BiowScg4u4Sagtzg5d/QsEEYqUgKWDi9DRLbgUBMmo1iAO9UfESLfGmNbv950ueUGLeuBxH++9e+7h3XuMJJ5BGHgL/AIugDjwGvgOlAGQ9NT6qqfxV1JKEsYpMMa0ykrqBn7f3NxQLBYJh8NEo1FOT085Pj5mYWGBpopMq2IzMdCMWUna2dnRzMyMVlZWND4+rkgkomQyqf39fafkTeBe1XXAb8YLgP7+fpaXl7m8vGR3d5dQKES1WuXs7MylxRxBAFhsKlkEPgLFZDJJV1cX5+fnTE5OMjIywt3dHZFIxBFUXjQ3nwCstfi+T3t7+zsAz/PY2Njg8PCQTCZDLBbj9vaWjo4OR/AHSQFJstZqa2tLhUJB1lqVy2UtLS0pGo1qbm5Oe3t72t7eVjweV6VScX/w8gFBLpdTPp9Xo9FoJc/Pz+vq6kqSdH19rc3NTdXrdUfQiaSgJPm+r+npaeVyOa2trSmVSml2dlYHBwfu8TdJqtfrsta6s8ADgnQ6rYmJCQ0ODmp0dFS1Wk2+77vHSUlf7g3TuhukIOBZaxkeHubo6IhEIsHU1BSJRILe3l7y+TxAwRjzQVIn0ACsa5/cJIZCIcbGxshms1QqFVZXV+np6cHzPID3ktqMMXVjjHVtcKO8DiyWSiUGBgY4OTmhVqsxNDREX18fAMFgEKDNGOM5D/1vptIz5pGkz3rEdC0zNZEGfgKvgG7gB1Bt3nk8gn/ALOqwNW9xuwAAAABJRU5ErkJggg=='),move`
    }
  }
  _resizeSelected(target, type, draw) {
    this._registerEvent('mousedown', (e) => {
      e.stopPropagation()
      this._removeHover()
      let offsetX = 0
      let offsetY = 0
      this._registerEvent('mousemove', (e) => {
        e.stopPropagation()
        offsetX += e.movementX
        offsetY += e.movementY
        const w = draw.w
        const h = draw.h
        if (type === 'tl') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          }
        } else if (type === 'tr') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          }
        } else if (type === 'bl') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          }
        } else if (type === 'br') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          }
        } else if (type === 'tc') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          }
        } else if (type === 'bc') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          }
        } else if (type === 'cl') {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          }
        } else {
          if (draw.rotate <= 25 || draw.rotate > 340) {
            this._setResizeToType(draw, 'cr', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 160 && draw.rotate < 205) {
            this._setResizeToType(draw, 'cl', w, h, offsetX, offsetY)
          } else if (draw.rotate > 25 && draw.rotate < 70) {
            this._setResizeToType(draw, 'br', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 205 && draw.rotate < 250) {
            this._setResizeToType(draw, 'tl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 70 && draw.rotate < 115) {
            this._setResizeToType(draw, 'bc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 250 && draw.rotate < 295) {
            this._setResizeToType(draw, 'tc', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 115 && draw.rotate < 160) {
            this._setResizeToType(draw, 'bl', w, h, offsetX, offsetY)
          } else if (draw.rotate >= 295 && draw.rotate < 340) {
            this._setResizeToType(draw, 'tr', w, h, offsetX, offsetY)
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
  _setResizeToType(draw, oType, w, h, offsetX, offsetY) {
    if (oType === 'tl') {
      this._setScale(draw, 'xScale', Math.abs(offsetX) / w, !(offsetX > 0))
      this._setScale(draw, 'yScale', Math.abs(offsetY) / h, !(offsetY > 0))
      draw.setScaleOffset(offsetX, offsetY)
      if (draw instanceof Text) {
        draw.setScaleSize(-offsetX, -offsetY)
      }
    } else if (oType === 'tr') {
      this._setScale(draw, 'xScale', Math.abs(offsetX) / w, offsetX > 0)
      this._setScale(draw, 'yScale', Math.abs(offsetY) / h, !(offsetY > 0))
      draw.setScaleOffset(0, offsetY)
      if (draw instanceof Text) {
        draw.setScaleSize(offsetX, -offsetY)
      }
    } else if (oType === 'bl') {
      this._setScale(draw, 'xScale', Math.abs(offsetX) / w, !(offsetX > 0))
      this._setScale(draw, 'yScale', Math.abs(offsetY) / h, offsetY > 0)
      draw.setScaleOffset(offsetX, 0)
      if (draw instanceof Text) {
        draw.setScaleSize(-offsetX, offsetY)
      }
    } else if (oType === 'br') {
      this._setScale(draw, 'xScale', Math.abs(offsetX) / w, offsetX > 0)
      this._setScale(draw, 'yScale', Math.abs(offsetY) / h, offsetY > 0)
      if (draw instanceof Text) {
        draw.setScaleSize(offsetX, offsetY)
      }
    } else if (oType === 'tc') {
      draw.setScaleOffset(0, offsetY)
      if (draw instanceof Text) {
        draw.setScaleSize(0, -offsetY)
      } else {
        this._setScale(draw, 'yScale', Math.abs(offsetY) / h, !(offsetY > 0))
      }
    } else if (oType === 'bc') {
      if (draw instanceof Text) {
        draw.setScaleSize(0, offsetY)
      } else {
        this._setScale(draw, 'yScale', Math.abs(offsetY) / h, offsetY > 0)
      }
    } else if (oType === 'cl') {
      draw.setScaleOffset(offsetX, 0)
      if (draw instanceof Text) {
        draw.setScaleSize(-offsetX, 0)
      } else {
        this._setScale(draw, 'xScale', Math.abs(offsetX) / w, !(offsetX > 0))
      }
    } else {
      if (draw instanceof Text) {
        draw.setScaleSize(offsetX, 0)
      } else {
        this._setScale(draw, 'xScale', Math.abs(offsetX) / w, offsetX > 0)
      }
    }
  }
  _setScale(target, key, value, isAdd = true) {
    if (isAdd) {
      target[key] += value
    } else {
      target[key] -= value
    }
  }
  _dropEvent() { }
  _shapeEvent() {
    let currHover, shape, currSelected = false
    if (this.canvas.actionParams.type === Shape.CURVE) {
      this._registerEvent('mousedown', (e) => {
        if (currHover) {
          console.log('_addSelect')
          currSelected = true
          this._removeSelect()
          this._addSelect(currHover)
        } else {
          if (!currSelected) {
            const uuid = UUID()
            const canvas = this._generateShapeCanvas(uuid)
            this.canvas.shapesElement.appendChild(canvas)
            const ctx = canvas.getContext('2d');
            const path = []
            shape = new Shape({
              uuid,
              path,
              lineWidth: this.canvas.actionParams.lineWidth,
              opacity: this.canvas.actionParams.opacity,
              lineColor: this.canvas.actionParams.lineColor,
              dom: canvas,
              type: this.canvas.actionParams.type,
            })
            let { x, y } = this._getOffsetToContainer(e)
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
          } else {
            this._removeSelect()
            if (currHover) {
              currHover.selected = false
            }
            currSelected = false
            currHover = null
          }

        }
      })
      this._registerEvent('mouseleave', () => {
        this._removeEventListener('mousemove')
      })
      this._registerEvent('mouseenter', () => {
        this._registerEvent('mousemove', (e) => {
          currHover = this._mouseMove(e, currHover)
        }, { uuid: 'drop' })
      })
      this._registerEvent('mousemove', (e) => {
        currHover = this._mouseMove(e, currHover)
      }, { uuid: 'drop' })
      this._registerEvent('mouseup', () => {
        if (currHover) {

        } else {
          if (!shape) {
            return
          }
          this._removeEventListener('mousemove', 'draw')
          shape.render(this.canvas.shapesElement)
          this.canvas.shapes[Action.DRAW].push(
            shape
          )
          this.canvas.dispatch.add(shape, this.canvas.shapesElement)
        }
      })
    } else {
      this._registerEvent('mousedown', (e) => {
        if (currHover) {
          this._removeSelect()
          currSelected = true
          this._addSelect(currHover)
          currHover.selected = true
        } else {
          if (!currSelected) {
            const uuid = UUID()
            const canvas = this._generateShapeCanvas(uuid)
            this.canvas.shapesElement.appendChild(canvas)
            console.log(this.canvas.actionParams)
            shape = new Shape({
              ox: e.offsetX,
              oy: e.offsetY,
              lineWidth: this.canvas.actionParams.lineWidth,
              opacity: this.canvas.actionParams.opacity,
              lineColor: this.canvas.actionParams.lineColor,
              fillColor: this.canvas.actionParams.fillColor,
              dom: canvas,
              type: this.canvas.actionParams.type,
            })
            let { x, y } = this._getOffsetToContainer(e), w = 0, h = 0
            this._registerEvent('mousemove', (e) => {
              let path
              if (this.canvas.actionParams.type === Shape.LINE || this.canvas.actionParams.type === Shape.ARROW) {
                path = [
                  { x, y },
                  this._getOffsetToContainer(e)
                ]
              } else {
                w += e.movementX
                h += e.movementY
                path = [
                  { x, y },
                  { x: x + w, y },
                  { x: x + w, y: y + h },
                  { x, y: y + h },
                  { x, y, offsetY: -shape.lineWidth / 2 },
                ]
              }
              shape.setPath(path)
              shape.render(this.canvas.shapesElement)
            }, { uuid: 'shape' })
          } else {
            this._removeSelect()
            if (currHover) {
              currHover.selected = false
            }
            currSelected = false
            currHover = null
          }
        }
      }, { uuid: 'shape' })
      this._registerEvent('mousedown', (e) => {
        this._registerEvent('mousemove', (e) => {
          currHover = this._mouseMove(e, currHover)
        }, { uuid: 'shape' })
      })
      this._registerEvent('mousemove', (e) => {
        currHover = this._mouseMove(e, currHover)
      }, { uuid: 'shape' })
      this._registerEvent('mouseleave', () => {
        this._removeEventListener('mousemove', 'shape')
      })
      this._registerEvent('dblclick', () => {
        if (currHover) {
          currHover.focus()
        }
      })
      this._registerEvent('mouseup', () => {
        if (!currHover) {
          if (!shape) {
            return
          }
          this._removeEventListener('mousemove', 'shape')
          shape.render(this.canvas.shapesElement)
          this.canvas.shapes[Action.SHAPE].push(
            shape
          )
          this.canvas.dispatch.add(shape, this.canvas.shapesElement)
        }
      })
    }
  }
  _textEvent() {
    let currHover, text, currSelected = false
    this._registerEvent('mousedown', (e) => {
      if (currHover) {
        this._removeSelect()
        currSelected = true
        this._addSelect(currHover)
        currHover.selected = true
      } else {
        if (!currSelected) {
          text = new Text({
            x: e.offsetX,
            y: e.offsetY,
            fontSize: this.canvas.actionParams.fontSize,
            color: this.canvas.actionParams.color,
          }, this.canvas)
          text.render(this.canvas.shapesElement)
          this.canvas.shapes[Action.TEXT].push(text)
        } else {
          console.log(currHover)
          this._removeSelect()
          currHover.selected = false
          currSelected = false
          currHover = null
        }
      }
      console.log(currHover, currSelected)
    }, { uuid: 'text' })
    this._registerEvent('mousedown', (e) => {
      this._registerEvent('mousemove', (e) => {
        currHover = this._mouseMove(e, currHover)
      }, { uuid: 'text' })
    })
    this._registerEvent('mousemove', (e) => {
      currHover = this._mouseMove(e, currHover)
    }, { uuid: 'text' })
    this._registerEvent('mouseleave', () => {
      this._removeEventListener('mousemove', 'text')
    })
    this._registerEvent('dblclick', () => {
      if (currHover) {
        currHover.focus()
      }
    })
    this._registerEvent('mouseup', () => {
      if (!currHover) {
        if (!text) {
          return
        }
        this._removeEventListener('mousemove', 'text')
        text.render(this.canvas.shapesElement)
        this.canvas.shapes[Action.TEXT].push(
          text
        )
        this.canvas.dispatch.add(text, this.canvas.shapesElement)
      }
    })
  }
  _getOffsetToContainer(e) {
    let x = e.offsetX
    let y = e.offsetY
    let target = e.target
    while (target !== this.canvas.container) {
      x += (target.offsetLeft || 0)
      y += (target.offsetTop || 0)
      target = target.parentNode
    }
    return {
      x, y
    }
  }
  _registerEvent(event, callback, options = {}, target = this.target) {
    let { option, uuid } = options
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event] = [...this.listeners[event], { callback, uuid, target }]
    target.addEventListener(event, callback, option)
  }
  _hasResisterEvent(event, uuid) {
    if (uuid) {
      return !!(this.listeners[event] && this.listeners[event].some((item) => item.uuid === uuid))
    } else {
      return !!(this.listeners[event] && this.listeners[event].length)
    }
  }
}
