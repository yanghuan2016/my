/**
 * 页脚：目前内容仅有一个链接
 * param:
 *      linkName
 *      link
 * added by hzh
 */
var React = require('react');
var userStore = require('ediStores/userStore');
var userAction = require('ediAction/userAction');

var notification = require('antd').notification;

var PageFooter = React.createClass({

    getDefaultProps: function () {
        return {
            link: 'http://romens.cn/',
            linkName: '本服务由成都雨诺信息技术有限公司提供技术支持'
        }
    },

    getInitialState: function () {
        return {
            sync: userStore.getSyncData()
        }
    },

    _onNotification: function () {
        var self = this;
        self.setState({
            sync: userStore.getSyncData()
        });
        var sync = self.state.sync;
        if (sync != null)
            notification[sync.type]({
                message: sync.message,
                duration: sync.duration,
                description: sync.description
            });
    },

    componentWillMount: function () {
        userStore.addChangeListener(this._onNotification);
    },

    componentWillUnmount: function () {
        userStore.removeChangeListener(this._onNotification);
    },

    render: function () {
        return null
    }

});

module.exports = PageFooter;