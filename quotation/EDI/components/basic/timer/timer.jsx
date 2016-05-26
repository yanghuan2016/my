/**
 * 定时器
 * 需要父组件传递相应的结束时间 endTime
 * 例如：<Timer endTime={new Date(2016, 3, 20)} str={this.state.str} onChange={this._onChange}/>
 * @type {*|exports|module.exports}
 */

/*
 * timer.jsx
 *
 * 2015-04-18    wzhongbi-romens     created
 *
 */

var React = require('react');
var DateFormat = require('util/dataService');

var style = require('./timer.css');

var Timer = React.createClass({

    getInitialState: function () {
        return {
            endTime: this.props.endTime,
            str: DateFormat.dateFormatter(this.props.endTime)
        }
    },

    componentWillMount: function () {
        var _self = this;

        function dateFormatter() {
            var timerStr = DateFormat.dateFormatter(_self.props.endTime);
            _self.props.onChange(timerStr);
            _self.setState({
                str: timerStr
            });
        }

        _self.timer = setInterval(dateFormatter, 1000);
    },

    componentWillUnmount: function () {
        clearInterval(this.timer);
    },

    render: function () {
        var css = style.font + ' ' + (this.state.str ? "font-red" : "font-gray");
        var str = this.state.str || "已过期";
        return <span className={css}>{str}</span>;
    }
});

module.exports = Timer;