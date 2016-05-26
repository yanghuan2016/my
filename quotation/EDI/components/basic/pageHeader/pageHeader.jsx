/**
 * 页面的头部(显示客户或者商户登录成功后的用户名)
 *
 * @type {*|exports|module.exports}
 */

/*
 * pageHeader.jsx
 *
 * 2015-04-15    wzhongbi-romens     created
 *
 */

var React = require('react');
var Row = require('antd').Row;
var Col = require('antd').Col;

var style = require('./pageHeader.css');

var userAction = require('ediAction/userAction');
var cookie = require('util/cookieUtil');
var userStore = require('ediStores/userStore');
var pageAction = require('ediAction/pageAction');

var history = require('js/history');

var pageHeader = React.createClass({

    getInitialState: function () {
        if (!cookie.getItem('left') && !cookie.getItem('right')) {
            cookie.setItem('left', style.active);
        }
        return {
            title: '医药365供应链协同平台',
            left: cookie.getItem('left'),
            right: cookie.getItem('right')
        }
    },
    _LogOutOnClick: function () {
        userAction.Logout();
    },

    _onClickOne: function () {
        pageAction.switchType('BUYER');
        history.pushState(null, '/buyer/home');
        pageAction.switchLeftActive('/buyer/home');
        this.setState(
            {
                left: style.active,
                right: ""
            }
        );
        cookie.setItem('left', style.active);
        cookie.setItem('right', "");
    },

    _onClickTwo: function () {
        pageAction.switchType('SELLER');
        history.pushState(null, '/seller/home');
        pageAction.switchLeftActive('/seller/home');
        this.setState(
            {
                left: "",
                right: style.active
            }
        );
        cookie.setItem('right', style.active);
        cookie.setItem('left', "");
    },

    render: function () {
        var self = this;
        var identityInfo = JSON.parse(cookie.getItem('identityInfo'));
        return (
            <header className={style.header}>
                <Row>
                    <Col span="8" className={style.headeNav}>
                        <a className={self.state.left} onClick={self._onClickOne}>我的采购</a>
                        <span/>
                        <a className={self.state.right} onClick={self._onClickTwo}>我的销售</a>
                    </Col>
                    <Col span='12' className={style.headerLeft}>
                        <span>{this.state.title}</span>
                        <span>{identityInfo['USERCompanyName']}</span>
                    </Col>
                    <Col span='4' className={style.headerRight}>
                        <span>{identityInfo['UserName']}</span>
                        <a onClick={this._LogOutOnClick}>注销</a>
                    </Col>
                </Row>
            </header>
        );
    }
});

module.exports = pageHeader;