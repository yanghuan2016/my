/**
 * 页面
 *
 */

var React = require('react');

var PickUpGoods = require('elements/pickUpGoods/pickUpGoods');
var PickUpOrder = require('elements/pickUpOrder/pickUpOrder');
var WeChatAction = require('action/weChatAction');
var WeChatStore = require('stores/weChatStore');
var QrCode = require('elements/qrCode/qrCode');
var PickUp = React.createClass({

    getInitialState: function () {
        var data = WeChatStore.getCustomerRecipe();
        var prescriptionInfoId = this.props.params.prescriptionInfoId;
        if (!data || !data.diagnosis[0] || !data.diagnosis[0].diagnosisId) {
            WeChatAction.getCustomerRecipe(prescriptionInfoId);
        }
        return {
            data: data,
            prescriptionInfoId: prescriptionInfoId
        };
    },

    componentDidMount: function () {
        WeChatStore.addChangeListener(this.getInfo);
    },

    componentWillUnmount: function () {
        WeChatStore.removeChangeListener(this.getInfo);
    },

    getInfo: function () {
        this.setState({
            data: WeChatStore.getCustomerRecipe()
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
                <PickUpGoods pickUpInfo={sum}/>
                <PickUpOrder goods={this.state.data}/>
                <QrCode />
            </div>
        )
    }
});

module.exports = PickUp;