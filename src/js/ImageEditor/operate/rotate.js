import { isCanvas,setTransform } from '../utils'
export default class Rotate {
  constructor(deg) {
    this.deg = deg
  }
  render(target,w,h,deg) {
    if (isCanvas(target)) {
      if(Math.abs(deg) % 90 === 0) {
       if(Math.abs(deg) % 180 === 0){
        target.ctx.translate(target.canvas.height / 2, target.canvas.width / 2)
        target.ctx.rotate((this.deg * Math.PI) / 180)
        target.ctx.translate(-target.canvas.width / 2, -target.canvas.height / 2)
       }else {
        target.ctx.translate(target.canvas.width / 2, target.canvas.height / 2)
        target.ctx.rotate((this.deg * Math.PI) / 180)
        target.ctx.translate(-target.canvas.height / 2, -target.canvas.width / 2)
       }
      }else{
        target.ctx.translate(target.canvas.width / 2, target.canvas.height / 2)
        target.ctx.rotate((this.deg * Math.PI) / 180)
        target.ctx.translate(-target.canvas.width / 2, -target.canvas.height / 2)
      }
    } else {
      target.style = setTransform(target.style.transform,'rotate',this.deg)
    }
  }
}
