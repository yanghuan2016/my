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

var Button = require('basic/button/button.jsx');
var InputWithIcon = require('elements/inputWithIcon/inputWithIcon');

var userAction = require('action/userAction');
var userStore = require('stores/userStore');

var Login = React.createClass({

    getInitialState: function () {
        return {
            userInfo: {
                username: "",
                password: ""
            }
        }
    },

    _inputChange: function (key, val) {
        var userInfo = this.state.userInfo;
        userInfo[key] = val;
    },

    _onClick: function () {
        var data = this.state.userInfo;
        userAction.Login(data);
    },

    render: function () {
        return (
            <div className={style.item}>
                <div className={style.login}>
                    <img src={logo}/>
                    <InputWithIcon placeHolder='请输入用户名'
                                   iconName='user'
                                   tips=''
                                   name='username'
                                   onInputChange={this._inputChange}
                                   inputType='text'/>
                    <InputWithIcon placeHolder='请输入密码'
                                   iconName='lock'
                                   tips=''
                                   name='password'
                                   onInputChange={this._inputChange}
                                   inputType='password'/>
                    <Button size="large"
                            onClick={this._onClick}
                            type='primary'
                            title='登录'
                            buttonClassName={style.button}/>
                </div>
            </div>
        );
    }
});

module.exports = Login;