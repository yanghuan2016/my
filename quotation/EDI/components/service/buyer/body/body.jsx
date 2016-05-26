/**
 * buyer端页面框架
 *      包含：左导航，页眉，页脚
 *
 * added by hzh at 2016-04-18
 */

var React = require('react');
var style = require('./body.css');
var PageHeader = require('ediComponents/basic/pageHeader/pageHeader');
/*var PageFooter = require('ediComponents/basic/pageFooter/pageFooter');*/
var Logo = require('ediComponents/basic/logo/logo');
var PageFooter = require('ediComponents/basic/pageFooter/pageFooter');
/*　未初始化数据库　弹窗　*/
var InitDBModal = require('ediComponents/service/initDBModal/initDBModal');
/*　首次登录未设置　ｅｒｐ　弹窗　*/
var FirstLoginModal = require('ediComponents/service/firstLoginModal/firstLoginModal');

var Spin = require('antd').Spin;
require("sass/edi/main");

var Body = React.createClass({

    getInitialState: function () {
        return {
            windowHeight: null,
            erpStyle: style.hidden,
            modal: <div className={style.spin}><Spin size="large"/></div>
        }
    },

    componentDidMount: function () {
        var self = this;
        setTimeout(function () {
            if (self.isMounted()) {
                self.setState({
                    modal: <div><InitDBModal /><FirstLoginModal /></div>
                });
            }
        }, 3000);
    },

    render: function () {
        return (
            <div className={style.body}>
                <div className={style.header}>
                    <PageHeader />
                </div>
                <div className={style.leftNav}>
                    <Logo />
                </div>
                <PageFooter />

                <div className={style.content}>
                    {this.props.children}
                    {this.state.modal}
                </div>
            </div>
        )
    }
});

module.exports = Body;