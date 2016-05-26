/**
 * 登录页面
 * @type {*|exports|module.exports}
 */

/*
 * login.jsx
 *
 * 2015-04-18    wzhongbi-romens     created
 *
 */

var React = require('react');

var style = require('./login.css');
var logo = require('./logo.png');

var Button = require('antd').Button;

var InputWithIcon = require('ediComponents/basic/inputWithIcon/inputWithIcon');

var validateAction = require('ediAction/validateAction');
var userAction = require('ediAction/userAction');

var validateStore = require('ediStores/validateStore');

var encodePwd = require('plugin/jquery.base64.min');
var cookie = require('util/cookieUtil');
var history = require('js/history');

/** @namespace style.division */
var Login = React.createClass({

    getInitialState: function () {
        var token = cookie.getItem('token');
        if (token && cookie.getItem('enterpriseType')) {
            history.pushState(null, cookie.getItem('enterpriseType').toLowerCase() + '/quotation');
        }
        return {
            userInfo: {
                username: "",
                password: ""
            },
            noPassValidate: validateStore.getNoPassValidate()
        }
    },

    _onChange: function () {
        this.setState(
            {
                noPassValidate: validateStore.getNoPassValidate()
            }
        );
    },

    componentDidMount: function () {
        validateStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        validateStore.removeChangeListener(this._onChange);
    },

    _inputChange: function (key, val) {
        var userInfo = this.state.userInfo;
        userInfo[key] = val;
        validateAction.validateFunc(key, val);
    },

    _onClick: function () {
        var data = this.state.userInfo;
        userAction.Login(data);
    },

    render: function () {
        return (
            <div className={style.item}>
                <div className={style.login}>
                    <img src={logo} alt='logo'/>
                    <span className={style.division}></span>

                    <div className={style.loginBox}>
                        <span className={style.title}>医药365供应链协同平台</span>
                        <InputWithIcon placeHolder='请输入用户名'
                                       iconName='user'
                                       className={style.input}
                                       tips=''
                                       name='username'
                                       onInputChange={this._inputChange}
                                       inputType='text'/>
                        <InputWithIcon placeHolder='请输入密码'
                                       iconName='lock'
                                       tips=''
                                       name='password'
                                       className={style.input}
                                       onInputChange={this._inputChange}
                                       inputType='password'/>
                        <span className={style.tips}>{this.state.noPassValidate.msg}</span>
                        <Button size="large" onClick={this._onClick}>登录</Button>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Login;