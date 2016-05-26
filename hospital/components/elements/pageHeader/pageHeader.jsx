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
var userStore = require('stores/userStore');
var userAction = require('action/userAction');

var style = require('./pageHeader.css');

var pageHeader = React.createClass({

    getInitialState: function () {
        return {
            username: userStore.getUserName()
        }
    },

    _onClick: function () {
        userAction.Logout(userStore.getDoctorId());
    },

    render: function () {
        var self = this;
        return (
            <header className={style.header}>
                <Row>
                    <Col span='12' className={style.headerLeft}>
                        <span>处方单管理</span>
                    </Col>
                    <Col span='12' className={style.headerRight}>
                        <span>{self.state.username}</span>
                        <a onClick={this._onClick}>注销</a>
                    </Col>
                </Row>
            </header>
        );
    }
});

module.exports = pageHeader;