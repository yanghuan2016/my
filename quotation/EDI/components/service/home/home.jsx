/**
 * home首页显示
 *      字段：昨日询价笔数,昨日订单量,昨日订单金额,昨日出库,昨日退货
 *
 */

var React = require('react');
var style = require('./home.css');
var Link = require('react-router').Link;
var Row = require('antd').Row;
var Col = require('antd').Col;
var Chart = require('react-google-charts').Chart;
var URL = require('edi/constantsUrl')();
var Icon = require('ediComponents/basic/icon/icon');
var UserStore = require('ediStores/userStore');
var HomeStore = require('ediStores/homeStore');
var HomeAction = require('ediAction/homeAction');
var UserFlow = require('ediComponents/elements/userFlow/userFlow.jsx');
var logger = require('util/logService');

var Home = React.createClass({

    componentWillMount: function () {
        logger.enter();
        var enterpriseId = UserStore.getEnterpriseId();
        var enterpriseType = UserStore.getEnterpriseType();
        HomeStore.addChangeListener(this._getInfo);
        if (enterpriseId) {
            HomeAction.homeAction(enterpriseId, enterpriseType);
        }
    },

    componentWillUnmount: function () {
        HomeStore.removeChangeListener(this._getInfo);
    },

    _getInfo: function () {
        logger.enter();
        var homeInfo = HomeStore.getHomeInfo();
        this.setState({
            homeInfo: homeInfo,
            data: {
                columns: [
                    {
                        label: "time",
                        type: "string"
                    },
                    {
                        label: "金额",
                        type: "number"
                    }
                ],
                rows: homeInfo.data
            }
        });
    },

    getInitialState: function () {
        var homeInfo = HomeStore.getHomeInfo();
        return {
            homeInfo: homeInfo,
            data: {
                columns: [
                    {
                        label: "time",
                        type: "string"
                    },
                    {
                        label: "金额",
                        type: "number"
                    }
                ],
                rows: homeInfo.data
            }
        }
    },

    render: function () {
        var self = this;
        var options = {
            title: "订单金额",
            hAxis: {
                title: '日期'
            },
            fontSize: 12
        };
        return (
            <div>
                <div className={style.home}>欢迎回来 （上次登录：{self.state.homeInfo.lastlogin}）</div>
                <UserFlow homeInfo={self.state.homeInfo}/>

                <div className={style.home}>昨日业务统计</div>
                <div>
                    <Row className={style.head}>
                        <Col span="5" className={style.ydayInfo}>
                            <p>昨日询价</p>

                            <p className={style.font}>{self.state.homeInfo.quotation ? self.state.homeInfo.quotation : 0}笔</p>
                        </Col>
                        <Col span="4" className={style.ydayInfo}>
                            <p>昨日订单量</p>

                            <p className={style.font}>{self.state.homeInfo.number ? self.state.homeInfo.number : 0}笔</p>
                        </Col>
                        <Col span="6" className={style.ydayInfo}>
                            <p>昨日订单金额</p>

                            <p className={style.font}>{self.state.homeInfo.amount ? self.state.homeInfo.amount : 0}元</p>
                        </Col>
                        <Col span="5" className={style.ydayInfo}>
                            <p>昨日出库</p>

                            <p className={style.font}>{self.state.homeInfo.ship ? self.state.homeInfo.ship : 0}笔</p>
                        </Col>
                        <Col span="4" className={style.ydayInfo}>
                            <p>昨日退货</p>

                            <p className={style.font}>{self.state.homeInfo.returns ? self.state.homeInfo.returns : 0}笔</p>
                        </Col>
                    </Row>
                </div>
                <div className={style.home}>近30天经营趋势
                    <span className={style.svg}>日平均订单额：&yen;{this.state.homeInfo.averageAmount}</span>
                </div>
                <Chart chartType="LineChart" rows={this.state.data.rows} columns={this.state.data.columns}
                       options={options} graph_id="amount" width={"100%"} height={"400px"}/>
            </div>
        )
    }
});

module.exports = Home;