var React = require('react');
var style = require('./modifyPassword.css');
var Header = require('js/components/element/header/component');
var SingleSpanRow = require('js/components/element/SingleSpanRow/component');
var BottomButtonGroup = require('js/components/element/bottomButtonGroup/component');

var history = require('js/history');
var LoginStore = require('stores/LoginStore');
var LoginAction = require('actions/LoginAction');

var ModifyPassword = React.createClass({
    getInitialState: function () {
        return {
            headerSpanTxt: '修改密码',
            iconProps: {
                firstIconProps: {
                    url: '/info',
                    iconClassName: 'fa fa-angle-left' + ' ' + style.spaceLef
                },
                secondIconProps: {
                    url: undefined,
                    iconClassName: undefined,
                    context: undefined
                }
            },
            pwdData: {
                oldPwdTitle: '输入原密码',
                newPwdTitle: '输入新密码',
                rePwdTitle: '确认新密码'
            },
            newPwd: '',
            reNewPwd: '',
            iconName: 'chevron-right',
            inputDisabled: false,
            tips: LoginStore.getLoginTips()
        }
    },
    componentDidMount: function () {
        LoginStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        LoginStore.removeChangeListener(this._onChange);
    },
    _onChange: function () {
        this.setState({
            tips: LoginStore.getLoginTips()
        });
    },
    _pwdOldChange: function (event) {
        LoginAction.validateUserOldPwd(event.target.value);
    },
    _pwdNewChange: function (event) {
        LoginAction.validateUserNewPwd(event.target.value);
        this.setState({
            newPwd: event.target.value
        });
    }
    ,
    _pwdReNewChange: function (event) {
        LoginAction.validateUserReNewPwd(this.state.newPwd, event.target.value);
        this.setState({
            reNewPwd: event.target.value
        });
    },
    _leftBtnClick: function () {
        var newPwd = this.state.newPwd;
        LoginAction.userUpdatePwd(newPwd);
    },
    _rightBtnClick: function () {
        history.goBack();
    },
    render: function () {
        return (
            <div className={style.parentPosition}>
                <Header spanText={this.state.headerSpanTxt}
                        iconProps={this.state.iconProps}/>

                <SingleSpanRow
                    inputDisabled="true"
                    className={style.spaceUp}
                    inputType={'password'}
                    keyWord={this.state.pwdData.oldPwdTitle}
                    onChange={this._pwdOldChange}
                    placeholder={'旧密码'}
                    />
                <SingleSpanRow
                    inputType={'password'}
                    inputDisabled="true"
                    keyWord={this.state.pwdData.newPwdTitle}
                    onChange={this._pwdNewChange}
                    placeholder={'新密码'}
                    />
                <SingleSpanRow
                    inputType={'password'}
                    inputDisabled="true"
                    keyWord={this.state.pwdData.rePwdTitle}
                    onChange={this._pwdReNewChange}
                    placeholder={'再次输入'}
                    />
                <span className={style.tips}>{this.state.tips}</span>
                <BottomButtonGroup
                    leftBtnText={'确认'}
                    rightBtnText={'取消'}
                    onLeftClick={this._leftBtnClick}
                    onRightClick={this._rightBtnClick}
                    />

            </div>
        );
    }
});

module.exports = ModifyPassword;