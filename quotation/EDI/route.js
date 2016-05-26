//import dependencies
var React = require('react');
var ReactRouter = require('react-router');
var IndexRoute = ReactRouter.IndexRoute;
//路由容器
var Router = ReactRouter.Router;
//路由组件
var Route = ReactRouter.Route;
//引入history,用于跳转页面
var history = require('js/history');

require('antd/style/index.less');
require('sass/main.scss');

var logger = require('util/logService');

/*　登录页面　*/
var Login = require('ediComponents/service/login/login');
/*　４０４　页面　*/
var NotFound = require('ediComponents/service/notFound/notFound');

/*  最外层component  */
var Body = require('ediComponents/service/buyer/body/body');

/* 订单列表 */
var Order = require('ediComponents/service/buyer/order/order');
/* 订单详情 */
var OrderDetail = require('ediComponents/service/buyer/orderDetail/orderDetail');
/* 询价单列表 */
var Quotation = require('ediComponents/service/buyer/quotation/quotation');
/* 询价单详情 */
var QuotationDetail = require('ediComponents/service/buyer/quotationDetail/quotationDetail');
/* 出库单列表 */
var Ship = require('ediComponents/service/buyer/ship/ship');
/* 出库单详情 */
var ShipDetail = require('ediComponents/service/buyer/shipDetail/shipDetail');

/*  seller 订单列表 */
var SellerOrder = require('ediComponents/service/seller/order/order');
/*  seller 订单详情 */
var SellerOrderDetail = require('ediComponents/service/seller/orderDetail/orderDetail');
/*  seller 询价单列表 */
var SellerQuotation = require('ediComponents/service/seller/quotation/quotation');
/*  seller 询价单详情 */
var SellerQuotationDetail = require('ediComponents/service/seller/quotationDetail/quotationDetail');
/*  seller 出库查询 */
var SellerShip = require('ediComponents/service/seller/ship/ship');
/*  seller 出库单详情 */
var SellerShipDetail = require('ediComponents/service/seller/shipDetail/shipDetail');
/*  seller 退货查询 */
var SellerReturn = require('ediComponents/service/seller/return/return');
/*  seller 退货详情 */
var SellerReturnDetail = require('ediComponents/service/seller/returnDetail/returnDetail');


/* 商品配对 */
var ProductMatch = require('ediComponents/service/productMatch/productMatch');
/* 退货查询*/
var Return = require('ediComponents/service/buyer/return/return');
/* 退货详情*/
var ReturnDetail = require('ediComponents/service/buyer/returnDetail/returnDetail');
/* Erp设置*/
var ErpSetting = require('ediComponents/service/erpSetting/erp');
/* 首页*/
var Home = require('ediComponents/service/home/home');
/* 我的供应商　*/
var Supplier = require('ediComponents/service/buyer/supplier/supplier.jsx');
/* 我的客户　*/
var Client = require('ediComponents/service/seller/client/client.jsx');
/* 页面的信息显示*/
var Msg = require('ediComponents/elements/msg/msg.jsx');

var cookie = require('util/cookieUtil');

function requireAuth(nextState, replaceState) {
    if (!cookie.getItem('token') && !cookie.getItem('enterpriseType')) {
        replaceState({nextPathname: nextState.location.pathname}, '/login')
    } else if (nextState.location.pathname.indexOf(cookie.getItem('enterpriseType').toLowerCase()) == -1) {
        cookie.clearCookie();
        replaceState({nextPathname: nextState.location.pathname}, '/error')
    }
}

function requireLogin(nextState, replaceState) {
    if (!cookie.getItem('token') && !cookie.getItem('enterpriseType')) {
        replaceState({nextPathname: nextState.location.pathname}, '/login')
    }
}

function verifyAdmin(nextState, replaceState) {
    if (!JSON.parse(cookie.getItem('identityInfo')).isAdmin) {
        replaceState({nextPathname: nextState.location.pathname}, '/error')
    }
}


var SocketIo = require('ediComponents/basic/socketIo/socketIo.jsx');

var routes = (
    <Router history={history}>
        <Route path='/' component={Msg}>
            <IndexRoute component={Login}/>
            <Route component={SocketIo}>
                <Route component={Body}>
                    <Route path="/supplier" component={Supplier} onEnter={requireLogin}/>
                    <Route path="/client" component={Client} onEnter={requireLogin}/>
                    <Route path="buyer" onEnter={requireAuth}>
                        <Route path="home" component={Home}/>
                        <Route path="order">
                            <IndexRoute component={Order}/>
                            <Route path="orderDetail/:id" component={OrderDetail}/>
                        </Route>
                        <Route path="quotation">
                            <IndexRoute component={Quotation}/>
                            <Route path="quotation" component={Quotation}/>
                            <Route path="quotationDetail/:id/:type" component={QuotationDetail}/>
                        </Route>
                        <Route path="ship">
                            <IndexRoute component={Ship}/>
                            <Route path="ship" component={Ship}/>
                            <Route path="shipDetail/:id" component={ShipDetail}/>
                        </Route>
                        <Route path="return">
                            <IndexRoute component={Return}/>
                            <Route path="returnDetail/:id" component={ReturnDetail}/>
                        </Route>

                        <Route path="erpSetting" component={ErpSetting} onEnter={verifyAdmin}/>
                        <Route path="match" component={ProductMatch}/>
                        <Route path='*' component={NotFound}/>
                        <Route path='error' component={NotFound}/>
                    </Route>
                    <Route path="seller" onEnter={requireAuth}>
                        <Route path="home" component={Home}/>
                        <Route path="order">
                            <IndexRoute component={SellerOrder}/>
                            <Route path="orderDetail/:id" component={SellerOrderDetail}/>
                        </Route>
                        <Route path="quotation">
                            <IndexRoute component={SellerQuotation}/>
                            <Route path="quotation" component={SellerQuotation}/>
                            <Route path="quotationDetail/:id/:type" component={SellerQuotationDetail}/>
                        </Route>
                        <Route path="ship">
                            <IndexRoute component={SellerShip}/>
                            <Route path="shipDetail/:id" component={SellerShipDetail}/>
                        </Route>
                        <Route path="return">
                            <IndexRoute component={SellerReturn}/>
                            <Route path="returnDetail/:id" component={SellerReturnDetail}/>
                        </Route>
                        <Route path="erpSetting" component={ErpSetting} onEnter={verifyAdmin}/>

                        <Route path="match" component={ProductMatch}/>
                        <Route path='*' component={NotFound}/>
                        <Route path='error' component={NotFound}/>

                    </Route>
                </Route>
            </Route>
            <Route path="login" component={Login}/>
            <Route path='*' component={NotFound}/>
            <Route path='error' component={NotFound}/>
        </Route>
    </Router>
);
module.exports = routes;