/**
 * erp参数设置页面
 */
var React = require('react');
var Button = require('antd').Button;
var style = require('./inputItemWithButton.css');
var validateStore = require('ediStores/validateStore');
var myId = require('util/createCode');
module.exports = React.createClass({

    getInitialState: function () {
        return {
            tip: validateStore.getTips()[this.props.id]
        }
    },

    onChange: function (event) {
        this.props.onInputChange(this.props.id, event.target.value);
    },

    createKey: function () {
        this.props.onInputChange(this.props.id, myId());
    },

    render: function () {
        return (
            <tr>
                <td className={style.first}>{this.props.itemName}</td>
                <td className={style.line}>
                    <input type="text" className={style.input} onChange={this.onChange}
                           value={this.props.itemValue}/>
                    <Button className={style.createKey} type="primary" onClick={this.createKey}>帮我生成</Button>
                </td>
                <td>
                    <span className={style.validSpan}>{this.props.tips[this.props.id]}</span>
                </td>
            </tr>
        )
    }
});