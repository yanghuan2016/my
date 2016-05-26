/**
 * 我的供应商页面
 *
 */

var React = require('react');
var style = require('./supplier.css');

var UserList = require('ediComponents/elements/userList/userList.jsx');
var UserListTop = require('ediComponents/elements/userListTop/userListTop.jsx');
var HomeStore = require('ediStores/homeStore');
var HomeAction = require('ediAction/homeAction');
var userAction = require('ediAction/userAction');
var userListStore = require('ediStores/userListStore');
var userStore = require('ediStores/userStore');

var supplier = React.createClass({

    getInitialState: function () {
        var list = userListStore.getSupplierList();
        var enterpriseId = userStore.getEnterpriseId();
        var enterpriseType = userStore.getEnterpriseType();
        if (list.length < 1) {
            userAction.getSupplierList(enterpriseId, {
                keyWords: '',
                status: -1,
                page: 1
            });
        }
        if (enterpriseId) {
            HomeAction.homeAction(enterpriseId, enterpriseType);
        }
        return {
            dataSource: list,
            homeInfo: HomeStore.getHomeInfo(),
            enterpriseId: userStore.getEnterpriseId(),
            filter: {
                keyWords: '',
                status: -1,
                page: 1
            }
        };
    },

    _getSupplierListInfo: function () {
        this.setState({
            dataSource: userListStore.getSupplierList()
        });
    },

    componentWillMount: function () {
        HomeStore.addChangeListener(this._getInfo);
        userListStore.addChangeListener(this._getSupplierListInfo);
    },

    componentWillUnmount: function () {
        HomeStore.removeChangeListener(this._getInfo);
        userListStore.removeChangeListener(this._getSupplierListInfo);
    },

    _getInfo: function () {
        this.setState({
            homeInfo: HomeStore.getHomeInfo()
        });
    },

    _onPagination: function (value) {
        var filter = this.state.filter;
        filter['page'] = value;
        this.setState({
            filter: filter
        });
        userAction.getSupplierList(this.state.enterpriseId, filter);
    },

    _onSearch: function (key, value) {
        var filter = this.state.filter;
        filter[key] = value;
        filter['page'] = 1;
        this.setState({
            filter: filter
        });
        userAction.getSupplierList(this.state.enterpriseId, filter);
    },

    render: function () {
        var self = this;
        var homeInfo = self.state.homeInfo;
        var failed = Number(homeInfo.clientSellerTotal) - Number(homeInfo.clientSellerMatched);
        return (
            <div>
                <UserListTop title='我的供应商'
                             placeholder='请输入企业名称以及平台编码'
                             onSearch={this._onSearch}
                             total={Number(homeInfo.clientSellerTotal)}
                             failed={failed}/>
                <UserList dataSource={self.state.dataSource}
                          current={self.state.filter.page}
                          onPagination={this._onPagination}/>
            </div>
        )
    }
});

module.exports = supplier;