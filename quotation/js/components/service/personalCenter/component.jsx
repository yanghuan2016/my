var React = require('react');
var Header = require('js/components/element/header/component.jsx');
var Span = require('js/components/basic/span/component');

var style = require('./personalCenter.css');
var SingleSpanRow = require('js/components/element/SingleSpanRow/component');

var history = require('js/history');
var WeUI = require('react-weui');
var weiUI = require('weui/dist/style/weui.css');
var Button = WeUI.Button;
var cookieUtil = require('util/cookieUtil');

var LoginStore = require('stores/LoginStore');
var LoginAction = require('actions/LoginAction');

var personalCenter = React.createClass({

    getInitialState: function () {
        return {
            iconProps: {
                firstIconProps: {
                    url: 'quotation/inquiry',
                    iconClassName: 'fa fa-angle-left'
                },
                secondIconProps: {}
            },
            spanProps: {
                content: '个人信息',
                className: style.contentSpanDivText,
                spanClassName: style.contentSpanLabelText
            },
            iconName: 'chevron-right',
            userInfo: LoginStore.getUserInfo()
        };
    },
    componentDidMount: function () {
        LoginStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        LoginStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        this.setState({
            userInfo: LoginStore.getUserInfo()
        });
    },
    _logOut: function () {
        cookieUtil.clearCookie();
        history.pushState(null, '/login');
    },
    _modifyPwdClick: function () {
        history.pushState(null, '/modifyPwd');
    },
    render: function () {
        var _this = this;
        var userInfo = this.state.userInfo;
        return (
            <div style={{backgroundColor:'#F0F0F2',height:'100%'}}>
                <Header spanText="个人中心"
                        iconProps={this.state.iconProps}/>
                <Span spanProps={this.state.spanProps}/>
                <SingleSpanRow
                    inputDisabled="false"
                    key="name"
                    keyWord="姓名"
                    keyValue={userInfo.name}/>
                <SingleSpanRow
                    inputDisabled="false"
                    key="phoneNumber"
                    keyWord="电话号码"
                    keyValue={userInfo.phoneNumber}/>
                <SingleSpanRow
                    inputDisabled="false"
                    key="email"
                    keyWord="邮件地址"
                    keyValue={userInfo.email}/>
                {// <SingleSpanRow
                //    inputDisabled="false"
                //    key="修改密码"
                //    className={style.spaceUp}
                //    onClick={_this._modifyPwdClick}
                //    keyWord="修改密码"
                //    iconName={_this.state.iconName}/>
                }

                <div className={style.btnContent}>
                    <Button onClick={this._logOut} className={"primary"+' '+style.infoBtnMobile}>注销登陆</Button>
                </div>
            </div>
        );
    }
});

module.exports = personalCenter;