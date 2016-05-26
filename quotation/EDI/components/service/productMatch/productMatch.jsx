/**
 * 商品配对
 *
 * @type {*|exports|module.exports}
 */

/*
 * login.jsx
 *
 * 2015-04-19    wzhongbi-romens     created
 *
 */

var React = require('react');
var Tabs = require('antd').Tabs;
var TabPane = Tabs.TabPane;
var Button = require('antd').Button;

var style = require('./productMatch.css');

var Left = require('./left/left.jsx');
var Right = require('./right/right.jsx');

var OperationOne = require('./operationOne/operationOne');
var OperationTwo = require('./operationTwo/operationTwo');
var OperationThere = require('./operationThere/operationThere');


var ProductMatch = React.createClass({

    getInitialState: function () {
        return {
            tabsKey: '1',
            leftChecked: '',
            rightChecked: ''
        }
    },

    _onClickTabsType: function (key) {
        this.setState({
            tabsKey: key,
            leftChecked: '',
            rightChecked: ''
        });
    },

    _onCheckedLeft: function (value) {
        this.setState({
            leftChecked: value
        });
    },

    _onCheckedRight: function (value) {
        this.setState({
            rightChecked: value
        });
    },

    render: function () {
        var self = this;
        return (
            <div>
                <div className='tabs'>
                    <Tabs defaultActiveKey="1" onChange={self._onClickTabsType}>
                        <TabPane tab="待配对（60）" key="1"/>
                        <TabPane tab="待确认（120）" key="2"/>
                        <TabPane tab="已配对（80）" key="3"/>
                    </Tabs>
                </div>
                <div>
                    <Left tabsKey={self.state.tabsKey} onClickLeftChecked={self._onCheckedLeft}/>

                    <div className={"ant-transfer-operation  " + style.operation}>
                        {this.state.tabsKey == '1' ? <OperationOne leftChecked={this.state.leftChecked}
                                                                   rightChecked={this.state.rightChecked}/> : ''}
                        {this.state.tabsKey == '2' ? <OperationTwo leftChecked={this.state.leftChecked}/> : ''}
                        {this.state.tabsKey == '3' ? <OperationThere leftChecked={this.state.leftChecked}/> : ''}
                    </div>

                    <Right tabsKey={self.state.tabsKey} onClickRightChecked={self._onCheckedRight}/>
                </div>
            </div>
        );
    }
});
module.exports = ProductMatch;