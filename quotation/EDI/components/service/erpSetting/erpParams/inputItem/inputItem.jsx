/**
 * erp参数设置页面
 */
var React = require('react');
var style = require('./inputItem.css');
var validateStore = require('ediStores/validateStore');

module.exports = React.createClass({
    getInitialState: function () {
        return {
            tip: validateStore.getTips()[this.props.id]
        }
    },
    onChange: function (event) {
        this.props.onInputChange(this.props.id, event.target.value);
    },
    render: function () {
        return (
            <tr>
                <td className={style.first}>{this.props.itemName}</td>
                <td className={style.line}>
                    <input type="text" className={style.input} onChange={this.onChange}
                           defaultValue={this.props.itemValue}/>
                </td>
                <td>
                    <span className={style.validSpan}>{this.props.tips[this.props.id]}</span>
                </td>
            </tr>
        )
    }
});