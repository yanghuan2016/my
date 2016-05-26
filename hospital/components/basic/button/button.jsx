/**
 * 基于　ant design 封装的按钮
 *
 */

/*
 * button.jsx
 *
 * 2015-05-12    wzhongbi-romens     created
 *
 */
var React = require('react');
var Button = require('antd').Button;
var style = require('./button.css');

module.exports = React.createClass({

    getDefaultProps: function () {
        return {
            type: '', /* 按钮的样式　primary ghost dashed*/
            title: '确认', /*　按钮的名字　*/
            size: '', /*　按钮的大小　large small*/
            disabled: '', /* 按钮是否可用 disabled, 若不可见这传入 disabled*/
            buttonClassName: '', /* button 容器 container 样式 */
            buttonSelfName:'',   /* button 的样式*/
            onClick: function () {
                /* 按钮的点击事件*/
            }
        }
    },

    _onClick: function () {
        this.props.onClick();
    },

    render: function () {
        var props = this.props;
        return (
            <div className={style.item + ' ' + props.buttonClassName}>
                <Button type={props.type}
                        size={props.size}
                        disabled={props.disabled}
                        onClick={this._onClick}
                        className={props.buttonSelfName}
                    >
                    {props.title}
                </Button>
            </div>
        );
    }
});