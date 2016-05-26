//import dependencies
var React = require('react');
var ReactRouter = require('react-router');
var IndexRoute = ReactRouter.IndexRoute;
//路由容器
var Router = ReactRouter.Router;
//路由组件
var Route = ReactRouter.Route;
//引入history,用于跳转页面
var history = require('base/history.js');

require('antd/style/index.less');
require('sass/main.scss');


var logger = require('util/logService');

var Body = require('service/body/body.jsx');

var shipAddress=require('service/shipDetail/shipDetail');
/* 页面的信息显示*/
var Msg = require('elements/msg/msg.jsx');
/*　登录页面　*/
var Login = require('service/login/login.jsx');
/* 处方单首页 */
var RecipeHome = require('service/recipeHome/recipeHome.jsx');
/*　处方单详情 */
var RecipeDetail = require('service/recipeDetail/recipeDetail.jsx');
var RecipeCreate = require('service/recipeCreate/recipeCreate.jsx');
/*　404页面　*/
var NotFound = require('service/notFound/notFound');

var PickUpGoods = require('elements/pickUpGoods/pickUpGoods');
var PickUpOrder = require('elements/pickUpOrder/pickUpOrder');
var TextCard=require('elements/textCard/textCard');
var PickUp = require('service/pickUp/pickUp');
var Cod = require('service/cod/cod');//货到付款 cash on delivery
var WeChatRecipe = require('service/weChatRecipe/weChatRecipe');

var cookie = require('util/cookieUtil');

function requireAuth(nextState, replaceState) {
    if (!cookie.getItem('token')) {
        replaceState({nextPathname: nextState.location.pathname}, '/login')
    }
}

var routes = (
    <Router history={history}>
        <Route path='/' component={Msg}>
            <Route path="shipAddress/:prescriptionId" component={shipAddress} />
            <Route path="login" component={Login}/>
            <IndexRoute component={Login}/>
            <Route component={Body}>
                <Route path="home" component={RecipeHome}/>
                <Route path="create" component={RecipeCreate}/>
                <Route path="detail" component={RecipeDetail}/>
            </Route>
            <Route path="weChatRecipe/:prescriptionInfoId" component={WeChatRecipe}/>
            <Route path="textCard" component={TextCard}/>
            <Route path="pickUp/:prescriptionInfoId" component={PickUp}/>
            <Route path="Cod/:prescriptionInfoId" component={Cod}/>

            <Route path='*' component={NotFound}/>
            <Route path='error' component={NotFound}/>
        </Route>
    </Router>
);
module.exports = routes;