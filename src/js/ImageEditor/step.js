class Step {
  constructor({ operate, target, index, prev, next }) {
    this.operate = operate
    this.target = target
    this.index = index
    this.prev = prev
    this.next = next
  }
  setIndex(index) {
    this.index = index
  }
  setPrev(prev) {
    this.prev = prev
  }
  setNext(next) {
    this.next = next
  }
}
export default Step
