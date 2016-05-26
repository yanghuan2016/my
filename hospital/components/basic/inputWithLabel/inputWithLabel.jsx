/**
 *  input 基础组件  带有一个label
 * @type {*|exports|module.exports}
 */

var React = require('react'),
    style = require('./inputWithLabel.css');

const InputWithLabel = React.createClass({
    getDefaultProps: function () {
        return {}
    },
    getInitialState: function () {
        return {}
    },
    componentWillMount: function () {


    },
    handleInputChange: function (event) {
        this.props.handleInputChange(this.props.forText, event.target.value);
    },
    render: function () {
        return (
            <div className={style.container+' '+ this.props.containerClass }>
                <label className={style.label_item}
                       >{this.props.dataProps.text}</label>
                <input className={style.input_item }
                       placeholder={this.props.dataProps.placeHolder}
                       onChange={this.handleInputChange}
                       onFocus={this.handleFocusBlur} onBlur={this.handleFocusBlur}/>
            </div>
        )
    }

});

module.exports = InputWithLabel;