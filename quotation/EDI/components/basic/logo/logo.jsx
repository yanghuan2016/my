/**
 * LOGO导航栏 -by duzhongwen
 * @type {*|exports|module.exports}
 */
var React = require('react');
var style = require('./logo.css');
var Link = require('react-router').Link;
var Icon = require('../icon/icon');
var Romens = require('./romens_png.png');
var logger = require('util/logService');

var pageStore = require('ediStores/pageStore');
var pageAction = require('ediAction/pageAction');
var userStore = require('ediStores/userStore');

var cookie = require('util/cookieUtil');

var Logo = React.createClass({

    getInitialState: function () {
        return {
            defaultValue: cookie.getItem('leftActive') ? cookie.getItem('leftActive') : pageStore.getLeftActive(),
            isAdmin: userStore.getIdentityInfoAdmin()
        }
    },

    _onChange: function () {
        this.setState({
            defaultValue: pageStore.getLeftActive()
        });
    },

    componentDidMount: function () {
        pageStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        pageStore.removeChangeListener(this._onChange);
    },
    _handleClick: function (to) {
        pageAction.switchLeftActive(to);
    },

    render: function () {
        var self = this;
        var enterpriseType = '/' + userStore.getEnterpriseType();
        var css = style.item + ' ';
        var active = self.state.defaultValue;
        return (
            <div className={style.container}>
                <div className={style.page}>
                    <div className={style.left}>
                        <div className={style.font}>
                            <img src={Romens} className={style.img}/>
                        </div>
                        <Item to={enterpriseType + "/home"}
                              font='fa fa-home'
                              name='首页'
                              css={css}
                              onClick={self._handleClick}
                              active={active}
                            />
                        <Item to={enterpriseType + "/quotation"}
                              font='fa fa-jpy'
                              name='报价查询'
                              css={css}
                              onClick={self._handleClick}
                              active={active}
                            />
                        <Item to={enterpriseType + "/order"}
                              font='fa fa-sticky-note'
                              name='订单查询'
                              css={css}
                              onClick={self._handleClick}
                              active={active}
                            />
                        <Item to={enterpriseType + "/ship"}
                              font='fa fa-paper-plane'
                              name='出库查询'
                              css={css}
                              onClick={self._handleClick}
                              active={active}
                            />
                        <Item to={enterpriseType + "/return"}
                              font='fa fa-truck'
                              name='退货查询'
                              css={css}
                              onClick={self._handleClick}
                              active={active}
                            />
                        {self.state.isAdmin ?
                            <Item to={enterpriseType + "/erpSetting"}
                                  font='fa fa-cog'
                                  name='ERP配置'
                                  css={css}
                                  onClick={self._handleClick}
                                  active={active}
                                /> : ''}
                    </div>
                </div>
            </div>
        );
    }
});

/*<Item to={enterpriseType + "/match"}
 font='fa fa-cube'
 name='商品匹配'
 css={css}
 onClick={self._handleClick}
 active={active}
 />*/

var Item = React.createClass({

    _onClick: function () {
        this.props.onClick(this.props.to);
    },

    render: function () {
        var self = this;
        var css = self.props.css + (self.props.active.indexOf(self.props.to) > -1 ? style.itemActive : "");
        return (
            <Link to={self.props.to}
                  className={css}
                  onClick={self._onClick}>
                <div>
                    <Icon name={self.props.font} className={style.font}/>

                    <div className={style.title}>{self.props.name}</div>
                </div>
            </Link>
        )
    }
});

module.exports = Logo;