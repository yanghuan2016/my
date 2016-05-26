var React = require('react');
var style = require('./detailHead.css');
var Row = require('antd').Row;
var Col = require('antd').Col;
var Timer = require('../timer/timer');
var DateFormat = require('util/dataService');


var DetailHead = React.createClass({

    getDefaultProps: function () {
        return {
            orderId: '',
            name: '',
            endTime: ''
        }
    },

    onChange: function (str) {
        this.props.onTimeChange && this.props.onTimeChange(str);


    },

    render: function () {
        var Time;
        if (DateFormat.dateFormatter(this.props.endTime)) {
            Time = <div>剩余：<Timer endTime={this.props.endTime} onChange={this.onChange}/></div>
        } else {
            Time = <div className={style.status}>{this.props.status || ''}</div>
        }
        return (
            <div>
                <Row className={style.head}>
                    <Col span='8' className={style.order}>
                        <span title={this.props.orderId}>{this.props.orderId || ''}</span>
                    </Col>
                    <Col span='8' className={style.name}>
                        <span title={this.props.name}>{this.props.name || ''}</span>
                    </Col>
                    <Col span='8' className={style.status || ''}>
                        <span title={Time}>{Time || ''}</span>
                    </Col>
                </Row>
            </div>
        );
    }
});

module.exports = DetailHead;