/**
 * 带前置icon图标的input，用于用户登录等输入框
 * param:
 *      placeHolder
 *      tips
 *      onInputChange
 *      className
 *      iconName　//传入图标名称
 *      type:text,password
 *      value
 * added by hzh
 */
var React = require('react');
var Icon = require('ediComponents/basic/icon/icon');
var style = require('./inputWithIcon.css');
var Tooltip = require('antd').Tooltip;

var InputWithIcon = React.createClass({

    getInitialState: function () {
        return {
            value: ''
        }
    },
    handleInputChange: function (e) {
        var val = e.target.value;
        this.setState({
            value: val
        });
        this.props.onInputChange(this.props.name, val);
    },
    render: function () {
        return (
            <div className={style.box + ' ' + this.props.className}>
                <Icon name={this.props.iconName} className={style.icon}/>
                <Tooltip title={this.props.tips}>
                    <input type={this.props.inputType}
                           placeholder={this.props.placeHolder}
                           onChange={this.handleInputChange}
                           defaultValue={this.props.value}
                           className={style.input}/>
                </Tooltip>
            </div>
        )
    }
});

module.exports = InputWithIcon;