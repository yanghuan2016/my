/**
 * 引导条
 * 　包含药品信息，取药地址等
 * added by hzh 2016-05-12
 */

var React = require('react');
var style = require('./medicinePaper.css');
var CaseHistory = require('elements/caseHistory/caseHistoryGuide');
var Table = require('basic/table/table');
var Icon = require('basic/icon/icon');
var Qrcode = require('basic/qrcode/qrcode');
var medicinePaperAction= require('action/medicinePaperAction');
var medicinePaperStore = require('stores/medicinePaperStore');
var productStore = require('stores/productStore');
var logger = require('util/logService');

var MedicinePaper = React.createClass({
    componentWillMount: function(){
        medicinePaperStore.addChangeListener(this.dataChange);
    },
    componentWillUnmount: function(){
        medicinePaperStore.removeChangeListener(this.dataChange)
    },
    dataChange: function(){
        logger.trace(medicinePaperStore.getQrcode());
        var prescription = productStore.getRecipeTime();
        var ifShow =  medicinePaperStore.ifShowMedicinePaper();
        this.setState({
            isShow: ifShow,
            medicineList: productStore.getSelectRecipeList(),
            recipeTime: prescription,
            qrcodeUrl: medicinePaperStore.getQrcode()
            //    [
            //    {
            //        medicineName:'黯然销魂片',
            //        spec:'盒',
            //        quntity: '1',
            //        unitPrice: '9',
            //        price:'9'
            //    },{
            //        medicineName:'含笑半步癫',
            //        spec:'瓶',
            //        quntity: '2',
            //        unitPrice: '10',
            //        price:'20'
            //    }
            //]
        })
    },
    print: function(e){
        e.preventDefault();
        e.stopPropagation();
        $("#operation").hide();
        var mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function(mql) {
            if (!mql.matches) {
                $("#operation").show();
            }
        });
        window.print();
    },
    close: function(e){
        e.preventDefault();
        e.stopPropagation();
        medicinePaperAction.showMedicinePaper(false);
    },
    getInitialState: function(){
        return {
            isShow: medicinePaperStore.ifShowMedicinePaper(),
            medicineList: productStore.getSelectRecipeList(),
            recipeTime: productStore.getRecipeTime(),
            columns: [
                {
                    title: "序号",
                    dataIndex: "index",
                    key: "index",
                    render: function(text,data,index){
                        return index + 1;
                    }
                },{
                    title: "药品名称",
                    dataIndex: "commonName",
                    key: "commonName"
                },{
                    title: "规格",
                    dataIndex: "spec",
                    key: "spec"
                },{
                    title: "取药数量",
                    dataIndex: "quantity",
                    key: "quantity"
                },{
                    title: "单价",
                    dataIndex: "price",
                    key: "price",
                    render: function(price){
                        return Number(price).toFixed(2);
                    }
                },{
                    title: "总价",
                    dataIndex: "subtotal",
                    key: "subtotal",
                    render: function(subtotal){
                        return Number(subtotal).toFixed(2);
                    }
                }
            ]
        }
    },
    render: function(){
        function footer(data){
            var subtotal = 0;
            data.map(function(item){
                subtotal += item.subtotal;
            });
            return (
                <div style={{textAlign:'right'}}>
                    <span>合计：&yen;{Number(subtotal).toFixed(2)}</span>
                </div>
            )
        }
        logger.trace(this.state.qrcodeUrl);
        return (
            <div className={this.state.isShow ? style.mask : style.hide}>
                <div className={style.pannel}>
                    <span>处方单号：{this.state.recipeTime.prescriptionId}</span>
                    <div className={style.info}>
                        <CaseHistory />
                    </div>
                    <div>处方详情：</div>
                    <Table dataSource={this.state.medicineList} columns={this.state.columns} bordered footer={footer}/>
                    <div className={style.storeInfo}>
                        <ul>
                            <li>取药地址：四川省成都市高新区天府大道30号幸福大药房美年店</li>
                            <li>营业时间：8:00-17:00</li>
                            <li>联系电话：028-83755456</li>
                        </ul>
                    </div>
                    <div>
                        <span>您也可以扫描下方二维码关注我们的公众号，我们为您提供了快递送货上门服务哦！</span>
                        <div className={style.qrcode}>
                            <Qrcode  content={this.state.qrcodeUrl}/>
                        </div>
                    </div>
                    <div className={style.operation} id="operation">
                        <div className={style.print}  onClickCapture={this.print}>
                            <Icon name="fa fa-print fa-2x" className={style.icon}/>
                        </div>
                        <div className={style.close} onClickCapture={this.close}>
                            <Icon name="fa fa-times fa-2x" className={style.icon}/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = MedicinePaper;