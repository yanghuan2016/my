/**
 * buyer端报价单详情
 * param:
 *      quotationId：询价单号
 * added by sunshine 2016-04-20
 */

var React = require('react');
var style = require('./quotationDetail.css');
var Table = require('antd').Table;
var InputNumber = require('antd').InputNumber;
var Popover = require('antd').Popover;
var message = require('antd').message;
var Icon = require('ediComponents/basic/icon/icon');
var Price = require('ediComponents/basic/price/price');
var logger = require('util/logService');
var DetailHead = require('ediComponents/basic/detailHead/detailHead');
var quotationAction = require('ediAction/seller/quotationAction');
var quotationStore = require('ediStores/seller/quotationStore');
var userStore = require('ediStores/userStore');
var GoodsItem = require('ediComponents/basic/goodsItem/goodsItem');
var InputWithTip = require('ediComponents/basic/inputWithTip/inputWithTip');
var FixedBanner = require('ediComponents/basic/fixedBanner/fixedBanner');
var history = require('js/history');
var Form = require('antd').Form;
var FormItem  = Form.Item;

var cookie = require('util/cookieUtil');
var QuotationDetail = React.createClass({
    componentWillMount: function(){
        quotationStore.addChangeListener(this.dataChange);
    },
    componentWillUnmount: function(){
        quotationStore.removeChangeListener(this.dataChange);
    },
    dataChange: function(){
        var data = quotationStore.getQuotationDetail(this.props.params.id);
        this.setState({
            data: data
        });
    },
    _onInputChange: function(value, attr){
        var inputTip = this.state.inputTip;
        var inputState = this.state.inputState;
        if(+value < 0){
            inputTip[attr.index] = '请输入大于0的数字';
            inputState[attr.index] = true;
            this.setState({
                inputTip : inputTip,
                inputState : inputState
            });
            return;
        } else if(+value > this.state.data.addInquiryDetails[attr.index].inquiryQuantity){
            inputTip[attr.index] = '报价数量不能超过计划数量';
            inputState[attr.index] = true;
            this.setState({
                inputTip : inputTip,
                inputState : inputState
            });
            return;
        } else{
            inputTip[attr.index] = '';
            inputState[attr.index] = false;
        }
        this.setState({
            inputTip : inputTip
        });
        //name是用于区分报价数量和报价金额两个input
        value = value || '0';
        var name = attr.name;
        //此处判断当前详情页是已报价还是未报价
        if(this.state.data.addInquiryDetails){
            this.state.data.addInquiryDetails[_.findIndex(this.state.data.addInquiryDetails,
                {'unicode': attr.unicode})][name]
                = value;
        }else if(this.state.data.quotationDetails){
            this.state.data.quotationDetails[_.findIndex(this.state.data.quotationDetails,
                {'unicode': attr.unicode})][name]
                = value;
        }

    },
    onTimeChange: function(time){
        this.setState({
            editable: !!time
        })
    },
    onInputBlur: function(attr){

    },
    getInitialState: function(){
        var _this = this;
        var user = userStore.getEnterpriseInfo();
        var datas = quotationStore.getQuotationDetail(this.props.params.id);
        quotationAction.getQuotationDetail(this.props.params.id, user.enterpriseId, this.props.params.type);
        return {
            data: datas,
            user: user,
            enableSubmit: true,
            editable: false,
            inputTip: [],
            inputState: [],
            columns: [
                {
                    title: '序号',
                    dataIndex: 'id',
                    key: 'id',
                    render: function(p1,data,index){
                        return index + 1;
                    }
                },{
                    title: '商品信息',
                    dataIndex: 'goodsDetail',
                    key: 'goodsDetail',
                    render: function(p1,data){
                        if(data.commonName !== ''){
                            return <GoodsItem goodsDetail={data}/>
                        }else{
                            _this.state.enableSubmit = false;
                            var info = <span>该ID的商品信息未同步，请联系管理员补全信息</span>;
                            return (<Popover overlay={info} >
                                <span><Icon name="fa fa-info-circle" className={style.info}/> 平台唯一商品编码:{data.unicode}</span>
                            </Popover>);
                        }
                    }
                },{
                    title: '计划数量',
                    dataIndex: 'inquiryQuantity',
                    key: 'inquiryQuantity',
                    render: function(text, data){
                        return (
                            <span>{data.inquiryQuantity}件</span>
                        )
                    }
                },
                //{
                //    title: '计划价格',
                //    dataIndex: 'purchaseUpset',
                //    key: 'purchaseUpset',
                //    render: function(text, data){
                //        return <Price value={data.purchaseUpset}/>
                //    }
                //},
                {
                    title: '供货数量',
                    dataIndex: 'QtySupplied',
                    width: 100,
                    key: 'QtySupplied',
                    render:function(p1,data,index) {
                        if(_this.state.data.addInquiryDetails){
                            //给未报价的详情添加quotationQuantity字段和具体商品的询价单id
                            _this.state.data.addInquiryDetails[index].inquiryId = _this.state.data.inquiryId;
                            _this.state.data.addInquiryDetails[index].quotationQuantity
                            || (_this.state.data.addInquiryDetails[index].quotationQuantity = null);
                        }
                        return (
                            <div　style={{position:'absolute'}}>
                                <Form style={{position:'relative',top:-17,left:-25}}>
                                    <FormItem
                                        validateStatus={_this.state.inputState[index] ? 'error': ''}
                                        help={_this.state.inputTip[index]}>
                                        <InputWithTip style={{width:100,display:'inline-block'}}
                                                      index={{'unicode':data.unicode, 'name':'quotationQuantity', 'index':index}}
                                                      onInputChange={_this._onInputChange}
                                                      defaultValue={data.quotationQuantity || null}
                                                      type="text"
                                                      onBlur={_this.onInputBlur}
                                                      disabled={!_this.state.editable || (!!data.quotationQuantity && (_this.props.params.type === 'QUOTATION'))}
                                                      placeholder="单行输入"/>
                                        <span> 件</span>
                                    </FormItem>
                                </Form>
                            </div>
                        )
                    }
                }, {
                    title: '供货价格',
                    dataIndex: 'SuppliedPrice',
                    width: 140,
                    key: 'SuppliedPrice',
                    render:function(p1,data,index) {
                        if(_this.state.data.addInquiryDetails){
                            //给未报价的详情添加quotationPrice字段
                            _this.state.data.addInquiryDetails[index].quotationPrice
                            || (_this.state.data.addInquiryDetails[index].quotationPrice = null);
                        }
                        return (
                            <div>
                                &yen; <InputWithTip style={{width:100,display:'inline-block'}}
                                              index={{'unicode':data.unicode,'name':'quotationPrice', 'index':index}}
                                              onInputChange={_this._onInputChange}
                                              disabled={!_this.state.editable || (data.quotationPrice && (_this.props.params.type === 'QUOTATION'))}
                                              type="text"
                                              defaultValue={data.quotationPrice || null}
                                              placeholder="单行输入"/>
                            </div>
                        )
                    }
                }
            ]
        }
    },
    render: function(){
        var self = this;
        var buttons = [
            {
                name: "确认报价",
                type: "primary",
                onClick: function () {
                    if(!self.state.enableSubmit){
                        message.error('有商品未配对成功，不能提交报价');
                        return;
                    }
                    if(!self.state.editable){
                        message.error('该询价单已过期，不能提交报价');
                        return;
                    }

                    for(var i=0; i < self.state.inputState.length; i++){
                        if(self.state.inputState[i] == true){
                            message.error('有报价信息填写错误，不能提交报价');
                            return;
                        }
                    }
                    var reqData = self.state.data.addInquiryDetails || self.state.data.quotationDetails;
                    quotationAction.replyInquiry(reqData, self.state.user.enterpriseId);
                }
            },
            {
                name: "返回",
                type: "ghost",
                onClick: function () {
                    history.pushState(null, '/seller/quotation');
                }
            }
        ];
        //判断是否为已报价的报价单
        var columnsTemp = this.state.columns.slice();
        if(this.props.params.type.toLowerCase() === 'inquiry'){
            columnsTemp.splice(-2, 0, {
                title: '该客户最近报价',
                dataIndex: 'lastQuotationPrice',
                key: 'lastQuotationPrice',
                render: function(text, data){
                    return (
                        <span>{data.lastQuotationPrice ? (<Price value={data.lastQuotationPrice}/>) : '无'}</span>
                    )
                }
            },{
                title: '该商品最近报价',
                dataIndex: 'lastClientPrice',
                key: 'lastClientPrice',
                render: function(text, data){
                    return (
                        <span>{data.lastClientPrice ? (<Price value={data.lastClientPrice}/>) : '无'}</span>
                    )
                }
            });
        }
        var endTime = '';
        var details = [];
        if(this.state.data.addInquiryDetails){
            endTime =  this.state.data.addInquiryDetails[0].inquiryExpire;
            details = this.state.data.addInquiryDetails;
        }else if(this.state.data.quotationDetails){
            endTime =  this.state.data.quotationDetails[0].quotationExpire;
            details = this.state.data.quotationDetails;
        }

        return (
        <div>
                <DetailHead orderId={"询价单号 "+this.state.data.inquiryId}
                            endTime={new Date(endTime)}
                            onTimeChange={this.onTimeChange}
                            name={details[0].buyerName}/>
                <div className={style.table}>
                    <Table columns={columnsTemp}
                           dataSource={details}
                           pagination={false}
                           className="table-font-size"/>
                </div>
                <div className={style.filter}>
                    <FixedBanner buttons={buttons}/>
                </div>
            </div>
        )
    }
});

module.exports = QuotationDetail;