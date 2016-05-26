/**
 * erp设置页面
 * @type {*|exports|module.exports}
 */

/*
 * erpSetting.jsx
 *
 * 2015-04-19    violinW-romens     created
 *
 */

var React = require('react');
var CreateClassHelper = require("ediComponents/service/erpSetting/createClassHelper");
var Button = require('antd').Button;
var message = require('antd').message;
var style = require('./erpSetting.css');
var ErpSettingStore = require('ediStores/erpSettingStore');
var ErpSettingAction = require('ediAction/erpAction');
var validateAction = require('ediAction/validateAction');
var validateStore = require('ediStores/validateStore');

var cookie = require('util/cookieUtil');
var userStore = require('ediStores/userStore');

var ErpSetting = CreateClassHelper({
    storeParam: {
        "ErpSettingStore": ErpSettingStore,
        "validateStore": validateStore
    },
    listenerParam: function () {
        return {
            "ErpSettingStore": {
                "change_appkey": this._onChangeAPPKEY,
                "get_initialdata": this._onRenderData,
                "interval_import": this._onIntervalImport,
                "stop_import": this._onStopImport,
                "": this._onTotalChange
            },
            "validateStore": {
                "": this._onValidateChange
            }
        }
    },
    eventsParam: function () {
        return {
            "#Submit__onclick": this._onClick,
            ".infoInput__onkeyup": this._onInputChange,
            "#APPKEYMaker__onclick": this._onMakeAPPKEY,
            "#link__onclick": this._onLink,
            "#sync__onclick": this._onSync
        }
    },
    getInitialState: function () {


        return {
            infoAdress: "",
            appCodeAdress: "",
            APPCODE: "",
            settingData: ErpSettingStore.getInitialData().settingData,
            prograssRate: 0,
            BtState: false,
            linkBtState: true,
            syncBtState: true,
            visibProgress: style.hidden,
            tips: [],
            userInfo: userStore.getEnterpriseInfo(),
            noPassValidate: validateStore.getNoPassValidate()
        }
    },
    _onTotalChange: function () {
        var BtState = ErpSettingStore.getBtState();
        this.setState({
            linkBtState: BtState.LinkBtState,
            syncBtState: BtState.SyncBtState
        })
    },
    //listener
    //监听函数
    //listener
    _onChangeAPPKEY: function () {
        var settingDataNew = _.extend({}, this.state.settingData,
            {appKey: ErpSettingStore.getAPPKEY()});
        var stateNew = _.extend({}, this.state, {settingData: settingDataNew});
        this.setState(stateNew);
    },
    _onRenderData: function () {
        this.setState(ErpSettingStore.getInitialData());
    },
    _onValidateChange: function () {
        this.setState({tips: validateStore.getTips()});
    },
    _onIntervalImport: function () {
        var rate = ErpSettingStore.getPrograssData();
        if (rate == 100)
            this.setState({prograssRate: rate, BtState: false});
        else
            this.setState({prograssRate: rate});
    },
    _onStopImport: function () {
        this.setState({BtState: false});
    },
    //end listener

    //event
    //事件
    //event

    //提交按钮事件
    _onClick: function () {
        _.each(this.state.settingData, function (value, key) {
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
        if (validate) {
            this.setState({BtState: false});
            ErpSettingAction.saveSettings(this.state.userInfo.enterpriseId, this.state.settingData);
        }
    },
    //input改变时触发验证
    _onInputChange: function (event) {
        var key = event.target.id;
        var value = event.target.value;
        validateAction.validateFunc(key, value);
        var json = eval('({' + key + ': value})');
        var settingDataNew = _.extend({}, this.state.settingData, json);
        var stateNew = _.extend({}, this.state, {settingData: settingDataNew});
        this.setState(stateNew);
    },
    //获取appKey按钮事件
    _onMakeAPPKEY: function () {
        ErpSettingAction.createAPPKEY(this.state.userInfo.enterpriseId);
    },
    //连接按钮事件
    _onLink: function () {
        ErpSettingAction.createLink(this.state.userInfo.enterpriseId);
    },
    //同步数据按钮事件
    _onSync: function () {
        ErpSettingAction.createSync(this.state.userInfo.enterpriseId,this.props.initErp);

    },
    //end event

    render: function () {
        return (
            <div>
                <table className={style.erpTable}>
                    <colgroup>
                        <col width="25%"/>
                    </colgroup>
                    <tbody>
                    <ErpItem itemName="消息接口地址:" itemValue={this.state.userInfo.SccMsgUrl}/>
                    <ErpItem itemName="AppCode获取地址:" itemValue={this.state.userInfo.SccAppCodeUrl}/>
                    <GetKeyItem itemName="APPKEY:" itemValue={this.state.settingData.appKey} id="appKey"
                                tips={this.state.tips}/>
                    <ErpItem itemName="ERP 消息接口地址:" itemValue={this.state.settingData.erpMsgUrl} whetherInput="true"
                             id="erpMsgUrl" tips={this.state.tips}/>
                    <ErpItem itemName="ERP APPCODE 接口地址:" itemValue={this.state.settingData.erpAppCodeUrl}
                             whetherInput="true" tips={this.state.tips} id="erpAppCodeUrl"/>
                    <tr>
                        <td className={style.first}>
                            <Button type="primary" className={style.btMargin} disabled={this.state.BtState} size="large"
                                    id="Submit">提交</Button>
                            <Button type="primary" className={style.btMargin} disabled={this.state.linkBtState}
                                    size="large" id="link">连接</Button>
                            <Button type="primary" disabled={this.state.syncBtState} size="large"
                                    id="sync">同步数据</Button>

                            <div id="ErpPrograss"></div>
                        </td>
                        <td className={style.line}>
                            <div className={this.state.visibProgress}>
                            </div>
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        )
    }
});

var ErpItem = React.createClass({
    getDefaultProps: function () {
        return {
            itemName: "未命名",
            itemValue: ""
        }
    },
    getInitialState: function () {
        return {
            tip: validateStore.getTips()[this.props.id]
        }
    },
    render: function () {
        if (this.props.whetherInput) {
            return (
                <tr>
                    <td className={style.first}>{this.props.itemName}</td>
                    <td className={style.line}>
                        <input type="text" className={style.input+" infoInput"} id={this.props.id} ref={this.props.id}
                               defaultValue={this.props.itemValue}/>
                        <span className={style.validSpan}>{this.props.tips[this.props.id]}</span>
                    </td>
                </tr>
            )
        } else {
            return (
                <tr>
                    <td className={style.first}>{this.props.itemName}</td>
                    <td className={style.line}>
                        {this.props.itemValue}
                    </td>
                </tr>
            )
        }
    }
});
var GetKeyItem = React.createClass({
    getDefaultProps: function () {
        return {
            itemName: "未命名",
            itemValue: ""
        }
    },
    getInitialState: function () {
        return {
            tip: validateStore.getTips()[this.props.id]
        }
    },
    render: function () {
        return (
            <tr>
                <td className={style.first}>{this.props.itemName}</td>
                <td className={style.line}>
                    <span className={style.keygenSpan}>{this.props.itemValue}</span>
                    <Button type="primary" id="APPKEYMaker" size="small">生成APPKEY</Button>
                    <span className={style.validSpan}>{this.props.tips[this.props.id]}</span>
                </td>
            </tr>
        )
    }
});
module.exports = ErpSetting;