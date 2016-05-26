/**
 * ４０４　页面
 * @type {*|exports|module.exports}
 */

/*
 * notFound.jsx
 *
 * 2015-04-19    wzhongbi-romens     created
 *
 */

var React = require('react');
var Wrong = require('./404.png');

var style = require('./notFound.css');
var Button = require('antd').Button;
var history = require('js/history');

var NotFound = React.createClass({

    _onClick: function () {
        history.goBack();
    },
    render: function () {
        return (
            <div className={style.item}>
                <div>
                    <div className={style.wrongImg}>
                        <img src={Wrong} alt='404'/>
                    </div>
                    <div className={style.login}>
                        <h1>404</h1>
                        <p>对不起页面好像迷路了</p>
                        <p>点击下面按钮找到出路</p>
                        <Button onClick={this._onClick} type='primary' size='large'>返回</Button>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = NotFound;