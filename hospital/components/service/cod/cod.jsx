/**
 * 货到付款结尾页面
 *
 */

var React = require('react');

var CodGoods = require('elements/codGoods/codGoods');
var PickUpOrder = require('elements/pickUpOrder/pickUpOrder');
var QrCode = require('elements/qrCode/qrCode');
var WeChatAction = require('action/weChatAction');
var WeChatStore = require('stores/weChatStore');

var Cod = React.createClass({
    getInitialState: function () {
        var data = WeChatStore.getCustomerRecipe();
        return {
            data:data,
            prescriptionInfoId:this.props.params.prescriptionInfoId
        };
    },
    componentDidMount: function () {
        WeChatStore.addChangeListener(this.getInfo);
        WeChatAction.getCustomerRecipe(this.state.prescriptionInfoId);
    },
    componentWillUnmount: function () {
        WeChatStore.removeChangeListener(this.getInfo);
    },
    getInfo: function () {
        var data = WeChatStore.getCustomerRecipe();
        this.setState({
            data:data
        })
    },
    render: function () {
        var data = this.state.data;
        var sum = _.reduce(data.prescription, function (total, item) {
            var sum = Number(item.price) * Number(item.quantity);
            return total + sum;
        }, 0);
        return (
            <div>
                <CodGoods pickUp={sum}  prescriptionInfoId={this.props.params.prescriptionInfoId}/>
                <PickUpOrder goods={this.state.data}/>
                <QrCode />
            </div>
        )
    }
});

module.exports = Cod;