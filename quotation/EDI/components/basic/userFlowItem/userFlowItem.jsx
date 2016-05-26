/**
 *  首页显示的用户流量每一项
 *
 */

var React = require('react');
var Link = require('react-router').Link;
var style = require('./userFlowItem.css');

var userFlowItem = React.createClass({

    render: function () {
        return (
            <div className={style.item}>
                <span>{this.props.title}：</span>
                <span className={style.number}>
                    <span>{this.props.success || 0}</span>
                    <span>/</span>
                    <span>{this.props.total || 0}</span>
                </span>
                {this.props.to ? <Link to={this.props.to}>>查看匹配详情</Link> : ""}
            </div>
        )
    }
});

module.exports = userFlowItem;