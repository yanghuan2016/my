/**
 * wechat-到货自提
 * added by dzw@romens 2016-05-12
 */
var React = require('react');
var style = require('./pickUpGoods.css');


var PickupGoods = React.createClass({
    getDefaultProps: function () {
        return {
            pickUpInfo: {
                address: '成都市高新区天府大道30号幸福大药房',
                dates: '8:30-18:00',
                phone: '028-9999999',
                payment: 30
            }
        }
    },
    render: function () {
        return (
            <div className={style.box}>
                <div className={style.title}>请您携带导引条至该药房取药</div>
                <div className={style.address}>取药地址： 成都市高新区天府大道30号幸福大药房</div>
                <div className={style.dates}>营业时间： 8:30-18:00</div>
                <div className={style.phone}>联系电话： 028-9999999</div>
                <div className={style.payment}>到店支付：<span
                    className={style.pay}>&yen;{this.props.pickUpInfo ? this.props.pickUpInfo.toFixed(2) : ""}</span>
                </div>
            </div>
        )
    }
});
module.exports = PickupGoods;