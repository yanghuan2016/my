/**
 *  首页显示的用户流量
 *
 */

var React = require('react');
var style = require('./userFlow.css');
var Row = require('antd').Row;
var Col = require('antd').Col;
var HomeStore = require('ediStores/homeStore');
var userStore = require('ediStores/userStore');
var UserFlowItem = require('ediComponents/basic/userFlowItem/userFlowItem.jsx');

var userFlow = React.createClass({

    render: function () {
        var homeInfo = this.props.homeInfo;
        var type = userStore.getEnterpriseType();
        return (
            <Row className={style.flow}>
                <Col span='8' className={style.border}>
                    <UserFlowItem title='我的客户'
                                  total={homeInfo.clientBuyerTotal}
                                  to='/client'
                                  success={homeInfo.clientBuyerMatched}/>
                </Col>
                <Col span='8' className={style.border}>
                    <UserFlowItem title='我的供应商'
                                  total={homeInfo.clientSellerTotal}
                                  to='/supplier'
                                  success={homeInfo.clientSellerMatched}/>
                </Col>
                <Col span='8'>
                    <UserFlowItem title='我的商品'
                                  total={homeInfo.goodsInfoTotal}
                                  /*to={'/' + type + '/match'}*/
                                  success={homeInfo.goodsInfoMatched}/>
                </Col>
            </Row>
        )
    }
});

module.exports = userFlow;