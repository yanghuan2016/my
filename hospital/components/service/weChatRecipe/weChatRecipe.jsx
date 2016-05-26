/**
 * 微信处方页面
 *
 */

var React = require('react');
var Style = require('./weChatRecipe.css');

var CaseHistory = require('elements/caseHistory/caseHistoryWechat');
var GoodsDetail = require('basic/goodDetail/goodDetail');
var WeChatAction = require('action/weChatAction');
var WeChatStore = require('stores/weChatStore');
var Button = require('basic/button/button');
var Row = require('antd').Row;
var Col = require('antd').Col;
var history = require('base/history');
var i=1;
var WeChatRecipe = React.createClass({
    getInitialState: function () {
        return {
            data: WeChatStore.getCustomerRecipe(),
            prescriptionInfoId: this.props.params.prescriptionInfoId
        };
    },
    componentDidMount: function () {
        WeChatStore.addChangeListener(this._getInfo);
        WeChatAction.getCustomerRecipe(this.state.prescriptionInfoId);
        this.setState({
            data: WeChatStore.getCustomerRecipe()
        });
    },
    componentWillUnmount: function () {
        WeChatStore.removeChangeListener(this._getInfo);
    },
    _getInfo: function () {
        this.setState({
            data: WeChatStore.getCustomerRecipe()
        })
    },
    ToPickup: function () {
        //history.pushState(null, '/pickUp/' + this.state.prescriptionInfoId);
        WeChatAction.updatePrescriptionStatus(this.props.params.prescriptionInfoId,'PICKUP','/pickUp/'+this.state.prescriptionInfoId);
    },
    ToAddress: function () {
        history.pushState(null, '/shipAddress/'+this.props.params.prescriptionInfoId);
    },
    render: function () {
        var data = this.state.data;
        var sum = _.reduce(data.prescription, function (total, item) {
            var sum = Number(item.refRetailPrice) * Number(item.quantity);
            return total + sum;
        }, 0);

        return (
            <div>
                <CaseHistory customer={this.state.data} prescriptionInfoId={this.state.prescriptionInfoId}/>
                <GoodsDetail goodsInfo={this.state.data.prescription} sum={sum}/>

                <div className={Style.amount}>实付金额：<span className={Style.money}>&yen;{Number(sum).toFixed(2)}</span>
                </div>
                <Row className={Style.button}>
                    <Col span="12">
                        <Button size="large" title="货到付款" buttonClassName={Style.buttonContainer}
                                buttonSelfName={Style.buttonSelfone} onClick={this.ToAddress}/>
                    </Col>
                    <Col span="12">
                        <Button size="large" title="到店自提" buttonClassName={Style.buttonContainer}
                                buttonSelfName={Style.buttonSelftwo} onClick={this.ToPickup}/>
                    </Col>
                </Row>
            </div>
        )
    }
});

module.exports = WeChatRecipe;