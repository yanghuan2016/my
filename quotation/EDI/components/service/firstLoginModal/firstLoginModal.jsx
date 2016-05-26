/**
 * 首次登录弹出框
 * @type {*|exports|module.exports}
 */

/*
 * login.jsx
 *
 * 2015-04-19    wzhongbi-romens     created
 *
 */
var React = require('react');
var Modal = require('antd').Modal;
var Button = require('antd').Button;

var style = require('./firstLoginModal.css');

var history = require('js/history');
var userStore = require('ediStores/userStore');
var cookie = require('util/cookieUtil');
var socketIoAction = require('ediAction/socketIoAction');

var FirstLoginModal = React.createClass({

    getInitialState: function () {
        return {
            visible: userStore.getErpVisible()
        }
    },

    _onChange: function () {
        this.setState(
            {
                visible: userStore.getErpVisible()
            }
        );
    },

    componentDidMount: function () {
        userStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        userStore.removeChangeListener(this._onChange);
    },

    handleOk: function () {
        if (userStore.getIdentityInfoAdmin()) {
            history.pushState(null, userStore.getEnterpriseType()+ '/erpSetting');
        } else {
            var r = confirm("出错了，请重新登录");
            if (r == true) {
                cookie.clearCookie();
                history.pushState(null, '/login');
            }
        }
    },

    render: function () {
        var visible = this.state.visible && userStore.getIdentityInfoAdmin();
        if (window.location.href.indexOf('erpSetting') > -1) {
            visible = false;
        }
        return (
            <Modal title="设置向导"
                   visible={visible}
                   closable={false}
                   footer={[
                            <Button key="submit" type="primary" size="large" onClick={this.handleOk}>
                              去设置＞＞
                            </Button>
                    ]}>
                <h1>配置ERP</h1>
                <h4 className={style.content}>请配置好您的ERP参数，以便本系统和您的ERP进行数据传输</h4>
            </Modal>
        );
    }
});

module.exports = FirstLoginModal;