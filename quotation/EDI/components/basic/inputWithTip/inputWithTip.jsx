/**
 * 普通输入框
 * param:
 *      placeHolder
 *      tips:值为空时不显示tip
 *      onInputChange
 *      style
 *      defaultValue
 *      disabled
 *      onBlur
 * added by hzh
 */
var React = require('react');
var style = require('./inputWithTip.css');
var Tooltip = require('antd').Tooltip;
var Input = require('antd').Input;

var InputWithTip = React.createClass({
    getDefaultProps: function(){
        return {
            value: '',
            tips: ''
        }
    },
    getInitialState: function(){
        return {
            value: ''
        }
    },
    handleInputChange: function(e){
        var val = e.target.value;
        this.setState({
            value: val
        });
        this.props.onInputChange(val, this.props.index || '');
    },
    handleBlur: function(){
        this.props.onBlur && this.props.onBlur(this.props.index);
    },
    render: function(){
        return (
            <div style={this.props.style} className={style.box}>
                <Tooltip title={this.props.tips}>
                    <Input defaultValue={this.props.defaultValue}
                           onChange={this.handleInputChange}
                           disabled={this.props.disabled}
                           type={this.props.type}
                           onBlur={this.handleBlur}
                           placeholder={this.props.placeHolder} />
                </Tooltip>
            </div>
        )
    }
});

module.exports = InputWithTip;