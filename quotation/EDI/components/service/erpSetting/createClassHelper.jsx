var React = require('react');
var validateStore = require('ediStores/validateStore');

//不再使用componentDidMount，配置beforeRender事件来实现除了监听store以外的componentDidMount事务
// 不再使用componentWillUnmount，配置afterUnmount事件来实现除了监听store以外的componentWillUnmount事务
var CreateClassHelper = function (param) {
    var defaultProperty = function () {
        return {
            componentDidMount: function () {
                //通过读取storeParam和listenerParam配置项设置store的监听事件
                var me = this;
                _.each(this.storeParam, function (store, key) {
                    var listeners = me.listenerParam()[key];
                    _.each(listeners, function (func, key) {
                        if (key) {
                            store.addChangeListener(func, key);
                        } else
                            store.addChangeListener(func);
                    })
                });
                this.eventHooker();
                this.afterRender && this.afterRender();
            },
            componentWillUnmount: function () {
                //通过读取storeParam和listenerParam配置项销毁store的监听事件
                var me = this;
                _.each(this.storeParam, function (store, key) {
                    var listeners = me.listenerParam()[key];
                    _.each(listeners, function (func, key) {
                        if (key) {
                            store.removeChangeListener(func, key);
                        } else
                            store.removeChangeListener(func);
                    })
                });
                this.afterUnmount && this.afterUnmount();
            },
            eventHooker: function () {
                _.each(this.eventsParam(), function (func, elem) {
                    var type = elem[0];
                    var exc = elem.substring(1, elem.length);
                    var key = exc.split("__")[0];
                    var event = exc.split("__")[1];
                    var elements;
                    switch (type) {
                        case "#":
                            elements = [document.getElementById(key)];
                            break;
                        case ".":
                            elements = document.getElementsByClassName(key);
                            break;
                        default:
                    }
                    _.each(elements, function (item) {
                        item[event] = func;
                    })
                })
            }
        }
    };
    var property = _.extend({}, defaultProperty(), param);
    return React.createClass(property);
};
module.exports = CreateClassHelper;