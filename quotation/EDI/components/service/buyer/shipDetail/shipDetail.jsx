/**
 * buyer端出库单详情
 * param:
 *      shipId：出库单号
 * added by hzh 2016-04-20
 */
var React = require('react');
var style = require('./shipDetail.css');
var Table = require('antd').Table;
var logger = require('util/logService');
var DetailHead = require('ediComponents/basic/detailHead/detailHead');
var OrderInfo = require('ediComponents/basic/orderInfo/orderInfo');
var shipAction = require('ediAction/buyer/shipAction');
var shipStore = require('ediStores/buyer/shipStore');
var userStore = require('ediStores/userStore');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var FixedBanner = require('ediComponents/basic/fixedBanner/fixedBanner');
var Modal = require('antd').Modal;
var BatchInfoItem = require('ediComponents/basic/batchInfoItem/batchInfoItem');
var Button = require('antd').Button;
var history = require('js/history');

var cookie = require('util/cookieUtil');


var buttons = [{
    name: "返回",
    type: "primary",
    onClick: function () {
        history.pushState(null, '/buyer/ship');
    }
}];

var ShipDetail = React.createClass({
    componentWillMount: function () {
        shipStore.addChangeListener(this.dataChange);
    },
    componentWillUnmount: function () {
        shipStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        var data = shipStore.getShipDetail(this.props.params.id);
        this.setState({
            data: data.detail,
            displayField: data.displayField
        });
    },
    batchWindow: function (event) {
        this.setState({
            batchInfo: shipStore.getBatchList(event.currentTarget.attributes["data"].value),
            visible: true
        });
    },
    handleCancel: function () {
        this.setState({visible: false});
    },
    getInitialState: function () {
        var datas = shipStore.getShipDetail(this.props.params.id);
        if (userStore.getEnterpriseId()) {
            shipAction.getShipDetail(userStore.getEnterpriseId(), this.props.params.id);
        }
        var batchWindow = this.batchWindow;
        return {
            data: datas.detail,
            displayField: datas.displayField,
            columns: [
                {
                    title: '商品信息',
                    dataIndex: 'goodsDetail',
                    key: 'goodsDetail',
                    render: function (p1, data) {
                        return (
                            <GoodsItem goodsDetail={data}/>
                        )
                    }
                },
                //{
                //    title: '订单数量',
                //    dataIndex: 'orderQuantity',
                //    key: 'orderQuantity'
                //},
                {
                    title: '发货数量',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    render: function (p1, data) {
                        var quantity = 0;
                        data.batchDetails.map(function (item) {
                            quantity += Number(item.quantity);
                        });
                        return (<span>{quantity}件</span>)
                    }
                }, {
                    title: '批次/数量',
                    dataIndex: 'batch',
                    key: 'batch',
                    render: function (p1, data) {
                        var batches = [];
                        data.batchDetails.map(function (item) {
                            batches.push(<p className={style.batch} data={data.shipDetailNo} onClick={batchWindow}>
                                【{item.batchNum}】/{item.quantity}</p>);
                        });
                        return batches;
                    }
                }
            ]
        }
    },
    render: function () {
        return (
            <div>
                <DetailHead orderId={"出库单号 "+this.state.data.billNo}
                            name={this.state.data.sellerName}/>

                <div className={style.table}>
                    <Table
                        columns={this.state.columns}
                        dataSource={this.state.data.shipDetails}
                        className="table-font-size"
                        pagination={false}/>
                </div>
                <div className={style.orderInfo}>
                    <OrderInfo orderDetails={this.state.displayField}/>
                </div>
                <div className={style.fixedBanner}><FixedBanner buttons={buttons}/></div>
                <Modal ref="modal" visible={this.state.visible} title="对话框标题" onOk={this.handleOk}
                       width="800px" onCancel={this.handleCancel} footer={[<Button type="primary"
                        size="small" key="1" onClick={this.handleCancel}>关闭</Button>]}>
                    <BatchInfoItem batchInfo={this.state.batchInfo} />
                </Modal>
            </div>
        )
    }
});

module.exports = ShipDetail;