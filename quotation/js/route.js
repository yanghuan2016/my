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

var Login = require('js/components/service/Login/component');
var PersonalCenter = require('js/components/service/personalCenter/component');
var modifyPassword = require('js/components/service/modifyPassword/component');
var queryPage = require('js/components/service/queryQuotation/component');
var quotationList = require('js/components/service/quotationList/component');
var quotationDetail = require('js/components/service/quotationDetail/component');
var goodQuotationItem = require('js/components/service/goodQuotationItem/component');

var loginAction = require('js/actions/LoginAction');
var quotationListAction = require('js/actions/quotationListAction');
var logger = require('util/logService');

var routes = (
    <Router history={history}>
        <Route path='/'>
            <IndexRoute component={Login}></IndexRoute>
            <Route path='login' component={Login}></Route>

            <Route path='Info' component={PersonalCenter} ></Route>

            <Route path='modifyPwd' component={modifyPassword} ></Route>

            <Route path='query/:type' component={queryPage} ></Route>

            <Route path='quotation/:type' component={quotationList}></Route>

            <Route path='quotation/detail/:no/:type' component={quotationDetail} ></Route>

            <Route path='quotationGoodDetail/:no/:goodsNo' component={goodQuotationItem} ></Route>

        </Route>
    </Router>
);
module.exports = routes;