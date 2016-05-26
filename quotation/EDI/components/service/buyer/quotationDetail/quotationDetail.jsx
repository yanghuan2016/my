/**
 * buyer端报价单详情
 * param:
 *      quotationId：询价单号
 * added by hzh 2016-04-20
 */

var React = require('react');
var style = require('./quotationDetail.css');
var Table = require('antd').Table;
var logger = require('util/logService');
var DetailHead = require('ediComponents/basic/detailHead/detailHead');
var Popover = require('antd').Popover;
var Icon = require('ediComponents/basic/icon/icon');
var quotationAction = require('ediAction/buyer/quotationAction');
var quotationStore = require('ediStores/buyer/quotationStore');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var FixedBanner = require('ediComponents/basic/fixedBanner/fixedBanner');
var history = require('js/history');
var userStore = require('ediStores/userStore');

var cookie = require('util/cookieUtil');
var columns = [
    {
        title: '序号',
        dataIndex: 'id',
        key: 'id',
        render: function (p1, data, index) {
            return index + 1;
        }
    }, {
        title: '商品信息',
        dataIndex: 'goodsDetail',
        key: 'goodsDetail',
        render: function (p1, data) {
            if(data.commonName){
                return <GoodsItem goodsDetail={data}/>
            }else{
                var info = <span>该ID的商品信息未同步，请联系管理员补全信息</span>;
                return (<Popover overlay={info} >
                    <span><Icon name="fa fa-info-circle" className={style.info}/> 平台唯一商品编码{data.unicode}</span>
                </Popover>);
            }
        }
    }, {
        title: '计划数量',
        dataIndex: 'inquiryQuantity',
        key: 'inquiryQuantity'
    }, {
        title: '计划价格',
        dataIndex: 'purchaseUpset',
        key: 'purchaseUpset'
    }
    //,{
    //    title: '配对状态',
    //    dataIndex: 'matchStatus',
    //    key: 'matchStatus'
    //}
];
var buttons = [{
    name: "返回",
    type: "primary",
    onClick: function () {
        history.pushState(null, '/buyer/quotation');
    }
}];

var QuotationDetail = React.createClass({
    componentWillMount: function () {
        quotationStore.addChangeListener(this.dataChange);
    },
    componentWillUnmount: function () {
        quotationStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        var data = quotationStore.getQuotationDetail(this.props.params.id);
        this.setState({
            data: data
        });
    },
    getInitialState: function () {
        var user = userStore.getEnterpriseInfo();
        var datas = quotationStore.getQuotationDetail(this.props.params.id);
        if (userStore.getEnterpriseId()) {
            quotationAction.getQuotationDetail(this.props.params.id, userStore.getEnterpriseId(), this.props.params.type);
        }
        return {
            data: datas,
            user: user
        }

    },
    render: function () {
        //判断是否为已报价的报价单
        var columnsTemp = columns.slice();
        //if (this.props.params.type === 'QUOTATION') {
        //    columnsTemp = columnsTemp.concat([{
        //        title: '供货数量',
        //        dataIndex: 'quotationQuantity',
        //        key: 'quotationQuantity'
        //    }, {
        //        title: '供货价格',
        //        dataIndex: 'quotationPrice',
        //        key: 'quotationPrice'
        //    }]);
        //}
        var endTime = '';
        var details = [];
        if (this.state.data.goods) {
            endTime = this.state.data.inquiryExpire;
            details = this.state.data.goods;
        }
        function expend(data){
            var suppliers = [];
            logger.trace(data);
            if(data.suppliers){
                data.suppliers.map(function(item){
                    suppliers.push(
                        <tr>
                            <td>{item.sellerName}</td>
                            <td>{item.quotationQuantity || '未报价'}</td>
                            <td>{item.quotationPrice ? ("\u00A5" + item.quotationPrice) : '未报价'}</td>
                        </tr>
                    )
                });
            }
            return (
                <div className={style.sellerTable}>
                    <Icon className={style.iconUp} name="fa fa-sort-asc fa-5x"/>
                    <table>
                        <tr className={style.sellerTableHead}>
                            <td>供应商名称</td>
                            <td>供货数量</td>
                            <td>供货价格</td>
                        </tr>
                        {suppliers}
                    </table>
                    {
                        //<Table columns={columnInside} dataSource={data.supplyers} size="middle" pagination={false}/>
                    }
                </div>
            )
        }
        //传给table用于设定默认展开的行
        var long = [];
        for(var i = 1; i <= details.length; i++){
            long.push(i);
        }
        return (
            <div>
                <DetailHead orderId={"询价单号 "+ (this.state.data.inquiryId || '')}
                            endTime={new Date(endTime)}/>

                <div className={style.table}>
                    <Table columns={columnsTemp}
                           dataSource={details}
                           pagination={false}
                           className="table-font-size"
                           expandedRowRender={expend}
                           defaultExpandedRowKeys={long}/>
                </div>
                <div className={style.note}>注：供应商不能对未配对商品进行报价，为了不影响您的采购，请尽快去商品配对中心完成商品的配对！</div>
                <div class={style.fixBanner}><FixedBanner buttons={buttons}/></div>
            </div>
        )
    }
});

module.exports = QuotationDetail;