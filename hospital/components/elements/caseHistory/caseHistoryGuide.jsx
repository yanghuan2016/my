/**
 * 引导条预览页-病人病历
 * @type {*|exports|module.exports}
 */

var React = require('react');
var Style = require('./caseHistory.css');
var Row = require('antd').Row;
var Col = require('antd').Col;
var patientStore = require('stores/patientListStore.js');
var productStore = require('stores/productStore');


var CaseHistory = React.createClass({
    getInitialState: function(){
        return {
            info: patientStore.getCurrentPatentDiagnosisInfo(),
            date: productStore.getRecipeTime()
        }
    },

    _onChange: function () {
        this.setState({
            info: patientStore.getCurrentPatentDiagnosisInfo(),
            date: productStore.getRecipeTime()
        });
    },

    componentDidMount: function () {
        patientStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        patientStore.removeChangeListener(this._onChange);
    },
    render: function(){
        var genderName = {
            'MALE': '男',
            'FEMALE': '女'
        };
        return (
            <div className={Style.box}>
                <Row>
                    <Col span='5'><span>姓名：{this.state.info.name}</span></Col>
                    <Col span='5'><span>性别：{genderName[this.state.info.gender]}</span></Col>
                    <Col span='5'><span>年龄：{this.state.info.age}</span></Col>
                    <Col span='9'><span>就诊时间：{moment(this.state.date.createOn).format('YYYY-MM-DD')}</span></Col>
                </Row>
            </div>
        )
    }
});
module.exports = CaseHistory;