/**
 * seller端出库单详情
 * param:
 *      shipId：出库单号
 * added by violin 2016-04-20
 */
var React = require('react');
var style = require('./shipDetail.css');
var Table = require('antd').Table;
var Button = require('antd').Button;
var Modal = require('antd').Modal;
var logger = require('util/logService');
var DetailHead = require('ediComponents/basic/detailHead/detailHead');
var OrderInfo = require('ediComponents/basic/orderInfo/orderInfo');
var shipAction = require('ediAction/seller/shipAction');
var shipStore = require('ediStores/seller/shipStore');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var BatchInfoItem = require('ediComponents/basic/batchInfoItem/batchInfoItem');
var userStore = require('ediStores/userStore');
var history = require('js/history');

var cookie = require('util/cookieUtil');
var ShipDetail = React.createClass({
    columns: function () {
        var batchWindow = this.batchWindow;
        return [
            {
                title: '商品信息',
                dataIndex: 'commonName',
                key: 'commonName',
                render: function (p1, data) {
                    return (
                        <GoodsItem goodsDetail={data}/>
                    )
                }
            }, {
                title: '发货数量',
                dataIndex: 'goodsNum',
                key: 'goodsNum',
                render: function (p1, data) {
                    var quantity = 0;
                    data.batchDetails.map(function (item) {
                        quantity += Number(item.quantity);
                    });
                    return (<span>{quantity}件</span>)
                }
            }, {
                title: '批次/数量',
                dataIndex: 'batchDetail',
                key: 'batchDetail',
                render: function (p1, data) {
                    var batches = [];
                    var key = 1;
                    data.batchDetails.map(function (item) {
                        batches.push(<p key={key++} className={style.batch} data={data.shipDetailNo}
                                        onClick={batchWindow}>
                            【{item.batchNum}】/{item.quantity}</p>);
                    });
                    return batches;
                }
            }
        ]
    },
    componentWillMount: function () {
        shipStore.addChangeListener(this.dataChange);
        shipAction.getShipDetail(this.state.userInfo.enterpriseId, this.props.params.id);
    },
    componentWillUnmount: function () {
        shipStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        var data = shipStore.getShipDetail();
        logger.trace(data);
        this.setState({
            data: data,
            orderDetails: shipStore.getOrderInfo(),
            batchInfo: []
        });
    },
    getInitialState: function () {
        return {
            data: [],
            orderDetails: [],
            loading: false,
            visible: false,
            batchInfo: [],
            userInfo: userStore.getEnterpriseInfo()
        }
    },
    _backForward: function () {
        var href = window.location.href;
        window.location.href = href.split("seller")[0] + "seller/ship";
    },
    batchWindow: function (event) {
        shipAction.getBatchAction(event.currentTarget.attributes["data"].value);
        this.showModal();
    },
    showModal: function () {
        this.setState({
            batchInfo: shipStore.getBatchList(),
            visible: true
        });
    },
    handleCancel: function () {
        this.setState({visible: false});
    },
    render: function () {
       var data= this.state.data;
        console.log('当前data:---->');
        console.log(data);
        console.log(this.state);
        return (
            <div>
                <DetailHead orderId={"出库单号 "+(data.length!=0&&data[0] && data[0].shipDetailNo)}
                            name={this.state.data.buyerName}/>
                <div className={style.table}>
                    <Table columns={this.columns()}
                           className="table-font-size"
                           dataSource={this.state.data} pagination={false}/>
                </div>
                <div className={style.orderInfo}>
                    <OrderInfo orderDetails={this.state.orderDetails}/>
                </div>
                <div className={style.fixBt}>
                    <Button type="primary" onClick={this._backForward}>返回</Button>
                </div>
                <Modal ref="modal" visible={this.state.visible} title="对话框标题" onOk={this.handleOk}
                       width="800px" onCancel={this.handleCancel} footer={[<Button type="primary"
                        size="small" key="1" loading={this.state.loading} onClick={this.handleCancel}>关闭</Button>]}>
                    <BatchInfoItem batchInfo={this.state.batchInfo}></BatchInfoItem>
                </Modal>
            </div>
        )
    }
});

module.exports = ShipDetail;