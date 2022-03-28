export default class Action {
  constructor() {}
  static NONE = Symbol('none')
  static CROP = Symbol('crop')
  static DRAW = Symbol('draw')
  static DROP = Symbol('drop')
  static SHAPE = Symbol('shape')
  static TEXT = Symbol('text')
}
