import { isCanvas } from '../utils'
export default class Filter {
  constructor(caman, type, val) {
    this.caman = caman
    this.type = type
    this.val = val
  }
  render(target,filters,callback) {
    this.caman.Store.flush()
    if(this.val instanceof Function) {
      this.caman(target.canvas,this.val)
    } else {
      
      this.caman(target.canvas,function(){
        const keys = Object.keys(filters)
        for(let key of keys) {
          const _this = filters[key].operate
          this[_this.type](_this.val)
        }
        this.render(callback)
      })
    }
  }
}
