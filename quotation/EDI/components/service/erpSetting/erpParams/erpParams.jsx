/**
 * erp参数设置页面
 */
var React = require('react');
var Button = require('antd').Button;
var message = require('antd').message;
var style = require('./erpParams.css');
var ErpSettingStore = require('ediStores/erpSettingStore');
var ErpSettingAction = require('ediAction/erpAction');
var validateAction = require('ediAction/validateAction');
var validateStore = require('ediStores/validateStore');
var userStore = require('ediStores/userStore');
var PasswordModal = require('ediComponents/basic/infoWindow/passwordInfoWindow/component');
var AppKeyModal = require('ediComponents/basic/infoWindow/appKeyWindow/component');
var ErpDoingModal = require('ediComponents/basic/infoWindow/erpSyncDoingWindow/component');
var notification = require('antd').notification;
var InputItem = require('./inputItem/inputItem');
var InputItemWithButton = require('./inputItemWithButton/inputItemWithButton');
var CopyParams = require('./copyParams/copyParams');

module.exports = React.createClass({
    getInitialState: function () {
        return {
            SccMsgUrl: userStore.getEnterpriseInfo().SccMsgUrl || "",
            SccAppCodeUrl: userStore.getEnterpriseInfo().SccAppCodeUrl || "",
            erpMsgUrl: userStore.getEnterpriseInfo().erpMsgUrl || "",
            erpAppCodeUrl: userStore.getEnterpriseInfo().erpAppCodeUrl || "",
            appKey: userStore.getEnterpriseInfo().appKey || "",
            tips: validateStore.getTips(),
            visible: false,
            modal: null,
            LinkStatus: true,
            SaveStatus: true
        }
    },
    componentWillMount: function () {
        ErpSettingStore.addChangeListener(this.dataChange);
    },
    componentWillUnmount: function () {
        ErpSettingStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        this.setState(ErpSettingStore.getData());
    },
    //input改变时触发验证
    _onInputChange: function (id, value) {
        validateAction.validateFunc(id, value);
        var temp = {};
        temp[id] = value;
        this.setState(temp);
        if (id === "appKey") {
            ErpSettingAction.changeBtStatus(true, true);
        }
        //var linkStatus = true;
        //var validate = true;
        //_.each(validateStore.getTips(), function (value) {
        //    if (value != "") {
        //        validate = false;
        //    }
        //});
        //if (validate)
        //    linkStatus = false;

    },
    _onSave: function () {
        var settingData = {
            appKey: this.state.appKey,
            erpMsgUrl: this.state.erpMsgUrl,
            erpAppCodeUrl: this.state.erpAppCodeUrl
        };
        _.each(settingData, function (value, key) {
            validateAction.validateFunc(key, value);
        });
        var validate = true;
        _.each(validateStore.getTips(), function (value) {
            if (value != "") {
                var warn = function () {
                    message.warn('验证未通过，请检查！');
                };
                warn();
                validate = false;
            }
        });
        return validate;
    },
    _appKeyHandleOk() {
        var key = "SURE_FOR_RELOAD";
        this.handleOk(key)
    },
    _linkHandle(){
        var validate = this._onSave();
        if (!validate)
            return;
        notification['error']({
            message: '测试连接',
            description: "正在进行连接测试，请稍后···",
            duration: 1
        });
        var key = "LINK_TEST";
        ErpSettingAction.sureWindow(key, null, {
            appKey: this.state.appKey,
            erpMsgUrl: this.state.erpMsgUrl,
            erpAppCodeUrl: this.state.erpAppCodeUrl
        });
    },
    _saveHandleOk(){
        var key = "SAVE_PASSWORD";
        this.handleOk(key)
    },
    _syncAppKeyHandleOk(){
        var key = "SYNC_APPKEY";
        this.handleOk(key)
    },
    _syncDoingHandleOk(){
        this.handleCancel()
    },
    handleOk(key) {
        var password = document.getElementsByName("savePs")[0] && document.getElementsByName("savePs")[0].value;
        ErpSettingAction.sureWindow(key, password, {
            appKey: this.state.appKey,
            erpMsgUrl: this.state.erpMsgUrl,
            erpAppCodeUrl: this.state.erpAppCodeUrl
        });
        this.handleCancel();
    },
    handleCancel() {
        this.setState({
            modal: null
        })
    },
    _openWindow: function (event) {
        if (event.currentTarget.id == "Submit") {
            var validate = this._onSave();
            if (!validate)
                return;
        }
        var key = event.currentTarget.attributes["data-key"].value;

        var modal = this._getModal(key, true);
        this.setState({
            modal: modal
        })
    },
    _getModal: function (key, visible) {
        var modal = null;
        switch (key) {
            //确认重新生成APPKEY
            case "SURE_FOR_RELOAD":
                modal = <AppKeyModal visible={visible} handleOk={this._appKeyHandleOk}
                                     handleCancel={this.handleCancel}/>;
                break;
            ////链接测试
            //case "LINK_TEST":
            //    modal = <PasswordModal visible={visible} handleOk={this.linkHandleOk}
            //                           handleCancel={this.handleCancel}/>;
            //    break;
            //保存数据时输入密码
            case "SAVE_PASSWORD":
                modal = <PasswordModal discribe="要保存参数配置,您需要进行管理员身份验证" visible={visible} handleOk={this._saveHandleOk}
                                       handleCancel={this.handleCancel}/>;
                break;
            //同步中
            case "SYNC_DOING":
                modal = <ErpDoingModal visible={visible} handleOk={this._syncDoingHandleOk}
                                       handleCancel={this.handleCancel}/>;
                break;
            //同步appKey到ERP
            case "SYNC_APPKEY":
                modal = <PasswordModal discribe="要同步AppKey,您需要进行管理员身份验证" visible={visible}
                                       handleOk={this._syncAppKeyHandleOk}
                                       handleCancel={this.handleCancel}/>;
                break;
            default:
        }
        return modal;
    },
    render: function () {
        return (
            <div>
                <div className={style.fieldBorder}>
                    <span className={style.field}>ERP端参数</span>
                    <span className={style.validSpan}>（请将ERP中相应参数填写至下方表格中）</span>
                </div>
                <table className={style.erpTable}>
                    <colgroup>
                        <col width="200px"/>
                        <col width="600px"/>
                    </colgroup>
                    <tbody>
                    <InputItemWithButton itemName="APPKEY:"
                                         onInputChange={this._onInputChange}
                                         itemValue={this.state.appKey}
                                         tips={this.state.tips}
                                         id="appKey"/>
                    <InputItem itemName="ERP 消息接口地址:" onInputChange={this._onInputChange}
                               itemValue={this.state.erpMsgUrl}
                               tips={this.state.tips} id="erpMsgUrl"/>
                    <InputItem itemName="ERP APPCODE 接口地址:" onInputChange={this._onInputChange} id="erpAppCodeUrl"
                               itemValue={this.state.erpAppCodeUrl} tips={this.state.tips}/>
                    </tbody>
                </table>
                <div className={style.fieldBorder}>
                    <span className={style.field}>SCC端参数</span>
                    <span className={style.validSpan}>（请将下方参数写入ERP数据库中）</span>
                </div>
                <CopyParams SccMsgUrl={this.state.SccMsgUrl || ""}
                            SccAppCodeUrl={this.state.SccAppCodeUrl || ""}
                            appKey={this.state.appKey || ""}/>

                <div className={style.footer}>

                    <Button type="primary" className={style.btMargin} onClick={this._openWindow}
                            id="appKey" data-key="SYNC_APPKEY">同步AppKey到ERP</Button>

                    <Button type="primary" className={style.btMargin} onClick={this._linkHandle}
                            id="link" data-key="LINK_TEST">测试链接</Button>
                    <Button type="primary" className={style.btMargin} onClick={this._openWindow}
                            id="Submit" data-key="SAVE_PASSWORD" disabled={this.state.SaveStatus}>保存</Button>
                </div>
                {this.state.modal}
            </div>
        )
    }
});