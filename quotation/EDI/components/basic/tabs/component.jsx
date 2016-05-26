/**
 * 页面的头部(显示客户或者商户登录成功后的用户名)
 *
 * @type {*|exports|module.exports}
 */

/*
 * pageHeader.jsx
 *
 * 2015-04-15    wzhongbi-romens     created
 *
 */

var React = require('react');
var Row = require('antd').Row;
var Col = require('antd').Col;

var style = require('./tabs.css');

var Header = React.createClass({

    getInitialState: function () {
        return {
            left: style.active,
            right: null
        }
    },
    onChange: function (event) {
        var id = event.currentTarget.attributes["id"].value
        this.props.onChange(id);
        if (id == "ErpParams") {
            this.setState({
                left: style.active,
                right: null
            })
        } else {
            this.setState({
                left: null,
                right: style.active
            })
        }
    },
    render: function () {
        return (
            <header className={style.header}>
                <Row>
                    <Col span="8" className={style.headeNav}>
                        <a className={this.state.left} id="ErpParams" onClick={this.onChange}>参数配置</a>
                        <a className={this.state.right} id="ErpAsync" onClick={this.onChange}>数据同步</a>
                    </Col>
                </Row>
            </header>
        );
    }
});

module.exports = Header;