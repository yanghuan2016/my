/**
 * 我的客户页面
 *
 */

var React = require('react');

var UserList = require('ediComponents/elements/userList/userList.jsx');
var UserListTop = require('ediComponents/elements/userListTop/userListTop.jsx');
var HomeStore = require('ediStores/homeStore');
var userAction = require('ediAction/userAction');
var HomeAction = require('ediAction/homeAction');
var userListStore = require('ediStores/userListStore');
var userStore = require('ediStores/userStore');

var client = React.createClass({

    getInitialState: function () {
        var list = userListStore.getClientList();
        var enterpriseId = userStore.getEnterpriseId();
        var enterpriseType = userStore.getEnterpriseType();
        if (list.length < 1) {
            userAction.getClientList(enterpriseId, {
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

    componentWillMount: function () {
        HomeStore.addChangeListener(this._getInfo);
        userListStore.addChangeListener(this._getClientListInfo);
    },

    componentWillUnmount: function () {
        HomeStore.removeChangeListener(this._getInfo);
        userListStore.removeChangeListener(this._getClientListInfo);
    },

    _getClientListInfo: function () {
        this.setState({
            dataSource: userListStore.getClientList()
        });
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
        userAction.getClientList(this.state.enterpriseId, filter);
    },


    _onSearch: function (key, value) {
        var filter = this.state.filter;
        filter[key] = value;
        filter['page'] = 1;
        this.setState({
            filter: filter
        });
        userAction.getClientList(this.state.enterpriseId, filter);
    },

    render: function () {
        var self = this;
        var homeInfo = self.state.homeInfo;
        var failed = Number(homeInfo.clientBuyerTotal) - Number(homeInfo.clientBuyerMatched);
        return (
            <div>
                <UserListTop title='我的客户'
                             placeholder='请输入客户名称以及平台编码'
                             onSearch={this._onSearch}
                             total={Number(homeInfo.clientBuyerTotal)}
                             failed={failed}/>
                <UserList dataSource={self.state.dataSource}
                          current={self.state.filter.page}
                          onPagination={this._onPagination}/>
            </div>
        )
    }
});

module.exports = client;