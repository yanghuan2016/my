/**
 * 订单详情
 * param:
 *      orderDetails:数组格式,只传需要显示的字段，不要全部传进来
 *              [{
                    name: '订单日期',
                    field: billDate
                    value: '2016-04-15'
                },
                 {
                     name: '订单失效期',
                     field: usefulDate
                     value: '2015-1-8'
                 },{
                    name: '业务员',
                    field: sellerEmployeeName
                    value: '洛天依'
                }]
 * added by hzh
 */

var React = require('react');
var style = require('./orderInfo.css');
//需要显示在第一行的字段
var inlineFields = ['billDate', 'usefulDate',
    'advGoodsArriveDate', 'confirmDate', 'closeDate'];
var detailNames = {
    orderTime: "订单日期",
    orderExpireTime: "订单失效日期",
    operator: "业务员",
    addr: "送货地址",
    orderNote: "订单备注",
    recivedTime: "接货日期",
    sendNote: "发货备注",
    returnReason: "退回原因",
    invoice: "发票类型",
    applyNote: "申请备注"
};


var OrderInfo = React.createClass({
    getDefaultProps(){
        return {
            orderDetails: []
        }
    },
    getInitialState: function(){
        return {

        }
    },
    render: function(){
        var detailSingle = [];
        var inlineDetail = [];
        var details = this.props.orderDetails;
        for(var i = 0; i < details.length; i++){
            if(_.indexOf(inlineFields, details[i].field) != -1){
                inlineDetail.push(<span className={style.inlineDetail} key={i}>【{details[i].name}】{details[i].value}</span>);
            } else {
                detailSingle.push(<li key={i}>【{details[i].name}】{details[i].value}</li>);
            }
        }
        return (
            <div className={style.box}>
                <ul>
                    <li>{inlineDetail}</li>
                    {detailSingle}
                </ul>
            </div>
        )
    }
});

module.exports = OrderInfo;
