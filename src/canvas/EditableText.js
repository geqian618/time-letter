import Text from './Text.js'

class EditableText extends Text {
    constructor(text, options = {}) {
        super(text, {...options, editable: true});
    }
}

export default EditableText
