/**
 * 用于显示价格数据的组件
 * props
 *      float:小数长度，默认２位
 *      value
 *      unit:货币单位,默认人民币
 */

var React = require('react');
var Price = React.createClass({
    getDefaultProps: function(){
        return {
            float: 2,
            unit: "\u00A5",
            value: 0
        }
    },
    getInitialState: function(){
        return {

        }
    },
    render: function(){
        var value = this.props.value && Number(this.props.value);
        return (
            <span>{this.props.unit + value.toFixed(this.props.float)}</span>
        )
    }
});

module.exports = Price;