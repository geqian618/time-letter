import Element from './Element.js'

class Rect extends Element {
    constructor(options = {}) {
        super(options);
        this.fill = '#000'
    }
}

export default Rect
