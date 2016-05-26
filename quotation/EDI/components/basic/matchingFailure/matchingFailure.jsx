/**
 * 匹配失败　显示相应的配对失败的页面
 * @type {*|exports|module.exports}
 */

/*
 * matchingFailure.jsx
 *
 * 2015-04-18    wzhongbi-romens     created
 *
 */

var React = require('react');

var Icon = require('ediComponents/basic/icon/icon');

var style = require('./matchingFailure.css');

var MatchingFailure = React.createClass({

    getDefaultProps: function () {
        return {
            name: "frown-o",
            content1: "没找到相关商品,换个搜索词试试？",
            content2: "您也可以将商品信息提交至雨诺云平台,我们将尽快为您补全商品信息"
        }
    },

    render: function () {
        return (
            <div className={style.item}>
                <Icon name={this.props.name}/>
                <ul>
                    <li>
                        {this.props.content1}
                    </li>
                    <li className="font-red">
                        {this.props.content2}
                    </li>
                </ul>
            </div>
        );
    }
});

module.exports = MatchingFailure;