/**
 * 初始化数据库弹出框
 * @type {*|exports|module.exports}
 */

/*
 * initDBModal.jsx
 *
 * 2015-04-21    wzhongbi-romens     created
 *
 */
var React = require('react');
var Modal = require('antd').Modal;
var Button = require('antd').Button;
var Progress = require('antd').Progress;
var message = require('antd').message;
var ProgressLine = Progress.Line;

var history = require('js/history');

var style = require('./initDBModal.css');

var userAction = require('ediAction/userAction');
var socketIoAction = require('ediAction/socketIoAction');

var userStore = require('ediStores/userStore');

var Url = require('edi/constantsUrl')();
var cookie = require('util/cookieUtil');

var InitDBModal = React.createClass({

    getInitialState: function () {
        return {
            title: "STEP 1 初始化数据库",
            initDbPercent: userStore.getInitDBPercent(),
            feedback: userStore.getFeedback(),
            needInit: false,
            visible: userStore.getInitDBVisible()
        };
    },

    _onChange: function () {
        var self = this;
        self.setState(
            {
                feedback: userStore.getFeedback(),
                initDbPercent: userStore.getInitDBPercent(),
                visible: userStore.getInitDBVisible()
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
        var self = this;
        self.setState({
            needInit: true
        });
        userAction.initDb(Url.initDbUrl);
    },

    handleCancel: function () {
        userAction.Logout();
    },

    nextToSetting: function () {
        var self = this;
        cookie.setItem('needInitDB', 'false');
        if (!userStore.getErpModal()) {
            socketIoAction.displayErpModal();
        }
        self.setState({
            visible: false
        });
    },

    render: function () {
        var needInitDB = cookie.getItem('needInitDB') == 'true';
        var self = this;
        var percent = self.state.initDbPercent;
        var footer = "";
        var content = "";
        if (self.state.feedback.errcode) {
            content = "";
            footer = [
                <Button key="submit" type="primary" size="large" onClick={self.handleOk}>
                    现在执行
                </Button>,
                <Button key="back" type="primary" size="large" onClick={self.handleCancel}>
                    暂不执行
                </Button>
            ];
        } else if (percent != 100 && needInitDB && self.state.needInit) {
            content = <div><ProgressLine percent={percent}/></div>;
            footer = [
                <Button key="submit" type="primary" disabled>
                    下一步
                </Button>
            ];
        } else if (needInitDB && percent == 100) {
            content = <div><ProgressLine percent={percent}/></div>;
            footer = [
                <Button key="submit" type="primary" size="large" onClick={self.nextToSetting}>
                    下一步
                </Button>
            ];
        }
        return (
            <Modal title="设置向导"
                   visible={self.state.visible}
                   closable={false}
                   footer={footer}>
                <h1>初始化数据库</h1>
                <h4 className={style.content}>{self.state.feedback.msg}</h4>
                {content}
            </Modal>
        );
    }
});

module.exports = InitDBModal;