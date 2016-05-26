/**
 * 处方单的头部
 *
 * @type {*|exports|module.exports}
 */

/*
 * pageHeader.jsx
 *
 * 2015-05-12    wzhongbi-romens     created
 *
 */

var React = require('react');

var style = require('./recipeTop.css');
var Button = require('basic/button/button.jsx');
var Row = require('antd').Row;
var Col = require('antd').Col;
var medicinePaperAction = require('action/medicinePaperAction');
var patientListAction = require('action/patientListAction.js');
var productStore = require('stores/productStore.js');
var patientListStore = require('stores/patientListStore.js');
var userStore = require('stores/userStore.js');

var recipeTop = React.createClass({

    getDefaultProps: function () {
        return {
            saveDisable: '',
            paperDisable: 'disabled'
        }
    },

    getInitialState: function () {
        return {
            saveDisable: '',
            paperDisable: productStore.getPaperDisable(),
            recipeTime: productStore.getRecipeTime()
        }
    },

    _onChange: function () {
        this.setState({
            paperDisable: productStore.getPaperDisable(),
            recipeTime: productStore.getRecipeTime()
        });
    },

    componentDidMount: function () {
        productStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        productStore.removeChangeListener(this._onChange);
    },

    _showMedicinePaper: function () {
        medicinePaperAction.showMedicinePaper(true);
        medicinePaperAction.getQrcode(this.state.recipeTime.prescriptionId);
    },

    _onClickSave: function () {
        var selectRecipeList = productStore.getSelectRecipeList();
        var doctorId = userStore.getDoctorId();
        var diagnosisId = userStore.getDiagnosisId();
        var info = {
            prescriptionId: this.state.recipeTime.prescriptionId,       // 处方单号
            diagnosisId: userStore.getDiagnosisId(),          // 诊断单Id
            prescriptionType: 'type1',      // 处方类型
            prescriptionStatus: '未取药',  // 处方状态
            remark: '',               // 备注
            prescriptionDetail: selectRecipeList
        };
        patientListAction.saveRecipeList(info, doctorId, diagnosisId);
    },

    render: function () {
        var self = this;
        var recipeTime = self.state.recipeTime;
        return (
            <div className={style.item}>
                <Row>
                    <Col span='4'>
                        <span>处方单号：{recipeTime.prescriptionId}</span>
                    </Col>
                    <Col span='4'>
                        <span>处方日期：{recipeTime.createOn}</span>
                    </Col>
                    <Col span='16' className={style.topButton}>
                        <Button title='保存'
                                type='primary'
                                onClick={self._onClickSave}
                                disabled={self.state.saveDisable}/>
                        <Button title='查看引导条'
                                type='primary'
                                onClick={self._showMedicinePaper}
                                disabled={self.state.paperDisable}/>
                    </Col>
                </Row>
            </div>
        );
    }
});

module.exports = recipeTop;