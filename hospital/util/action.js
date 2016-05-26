/**
 * create action with type and data
 * @param type
 * @param data
 * @constructor
 */
function Action(type, data) {
    this.type = type;
    this.data = data;
}

module.exports = Action;