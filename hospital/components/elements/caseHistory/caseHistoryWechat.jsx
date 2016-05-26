/**
 * 微信-病人病历
 * @type {*|exports|module.exports}
 */

var React = require('react');
var moment = require('moment');
var Style = require('./caseHistory.css');

var CaseHistory = React.createClass({
    render: function () {
        return (
            <div className={Style.wechat}>
                <div className={Style.wechatshow}>处方号：
                    <span className={Style.number}>{this.props.prescriptionInfoId}
                    </span>
                </div>
                <div className={Style.wechatshow}>患者信息：
                    <span>{this.props.customer.patient[0] ? this.props.customer.patient[0].name : ""}</span>
                    <span
                        className={Style.usrInfo}>{this.props.customer.patient[0] ? ((this.props.customer.patient[0].gender == "MALE") ? "男" : "女") : ""}</span>
                    <span
                        className={Style.usrInfo}>{this.props.customer.patient[0] ? this.props.customer.patient[0].age : ""}岁</span>
                </div>
                <div className={Style.wechatshow}>就诊时间：
                    <span>{this.props.customer.diagnosis[0] ? moment(this.props.customer.diagnosis[0].createdOn).format('YYYY-MM-DD') : ""}</span>

                </div>
            </div>
        )
    }
});
module.exports = CaseHistory;