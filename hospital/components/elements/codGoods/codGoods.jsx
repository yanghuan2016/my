/**
 * wechat-到货自提
 * added by dzw@romens 2016-05-12
 */
var React = require('react');
var style = require('./codGoods.css');


var codGoods = React.createClass({
    getDefaultProps: function () {
        return {
            orderNo:'201505052524',
            returnAddress:'成都市高新区天府大道30号幸福大药房',
            receiver:'崔小夏',
            payment:29
        }
    },
    getInitialState: function () {
        return {
            orderNo: this.props.orderNo,
            returnAddress:this.props.returnAddress,
            receiver:this.props.receiver,
            payment:this.props.payment
        };
    },
    render: function(){
        return (
            <div className={style.box}>
                <div className={style.title}>配送订单已经生成</div>
                <div className={style.subTitle}>药房确认订单后，即刻安排配送，您的药品将会稍后送达。</div>
                <div className={style.orderNo}>处方单号：{this.props.prescriptionInfoId}</div>
                <div className={style.payment}>货到付款：<span className={style.pay}>&yen;{this.props.pickUp.toFixed(2)}</span></div>
            </div>
        )
    }
});
module.exports = codGoods;