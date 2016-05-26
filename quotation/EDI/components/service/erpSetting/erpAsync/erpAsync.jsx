/**
 * erp数据同步页面
 */
var React = require('react');
var Button = require('antd').Button;
var style = require('./erpAsync.css');
var ErpSettingStore = require('ediStores/erpSettingStore');
var ErpSettingAction = require('ediAction/erpAction');
var validateStore = require('ediStores/validateStore');
var userStore = require('ediStores/userStore');
var PasswordModal = require('ediComponents/basic/infoWindow/passwordInfoWindow/component');

module.exports = React.createClass({
    getInitialState: function () {
        return {
            modal: null,
            loading: false
        }
    },
    componentWillMount: function () {
        ErpSettingStore.addChangeListener(this.dataChange);
        if (userStore.getEnterpriseId()) {
            ErpSettingAction.getSyncTime(userStore.getEnterpriseId())
        }
    },
    componentWillUnmount: function () {
        ErpSettingStore.removeChangeListener(this.dataChange);
    },
    dataChange: function () {
        var data = ErpSettingStore.getData();
        var loading = ErpSettingStore.getLoading();
        this.setState(data);
        this.setState({loading: loading});
    },
    openWindow: function (event) {
        var visible = true;
        this.setState({
            modal: <PasswordModal discribe="要进行数据同步,您需要进行管理员身份验证" visible={visible} handleOk={this.syncHandleOk}
                                  handleCancel={this.handleCancel}/>
        })
    },
    syncHandleOk(){
        var key = "SYNC_PASSWORD";
        this.handleOk(key)
    },
    handleOk(key) {
        ErpSettingAction.changeBtLoading();
        var password = document.getElementsByName("savePs")[0] && document.getElementsByName("savePs")[0].value;
        ErpSettingAction.sureWindow(key, password);
        this.handleCancel();
    },
    handleCancel(event) {
        this.setState({
            modal: null
        })
    },
    render: function () {
        return (
            <div className={style.Sync}>
                <AsyncParams/>

                <div>
                    <Button type="primary" className={style.btMargin} onClick={this.openWindow} id="sync"
                            data-key="SYNC_PASSWORD" loading={this.state.loading}>立即同步</Button>
                    {
                        ErpSettingStore.getData().keepLoading.time ?
                            <span>上次数据同步完成时间：<span
                                className={style.time}>{ErpSettingStore.getData().keepLoading.time}</span></span>
                            : ''
                    }

                </div>
                {this.state.modal}
            </div>
        )
    }
});

var AsyncParams = React.createClass({
    render: function () {
        return (
            <div>
                <p className={style.AlertInfo}>
                    重要提醒
                </p>

                <p className={style.DescribeInfo}>
                    1.连接测试成功后，方可进行数据同步操作
                </p>

                <p className={style.DescribeInfo}>
                    2.本操作将会从ERP上拉取基础信息，包括：品种、类别、客户、供应商等数据
                </p>

                <p className={style.DescribeInfo}>
                    3.系统会每日自动同步上述数据
                </p>

                <p className={style.DescribeInfo}>
                    4.本功能仅用于在必要时手动启动ERP的数据同步
                </p>

                <p className={style.DescribeInfo}>
                    5.同步过程耗时较长，请耐心等候，数据同步完成前不可再次启动
                </p>
            </div>
        )
    }
});