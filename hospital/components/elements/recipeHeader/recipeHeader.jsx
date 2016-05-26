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
var Row = require('antd').Row;
var Col = require('antd').Col;

var style = require('./recipeHeader.css');
var Icon = require('basic/icon/icon.jsx');
var history = require('base/history.js');
var userStore = require('stores/userStore');
var patientListAction = require('action/patientListAction.js');

var recipeHeader = React.createClass({

    _onClick: function () {
        var diagnosisId = userStore.getDiagnosisId();
        var doctorId = userStore.getDoctorId();
        patientListAction.getPatientDiagnosisInfo(diagnosisId, doctorId);
        history.pushState(null, '/home');
    },

    render: function () {
        return (
            <header className={style.header}>
                <Row>
                    <Col span='12' className={style.headerLeft}>
                        <span>新建处方单</span>
                    </Col>
                    <Col span='12' className={style.headerRight}>
                        <Icon name='close' onClick={this._onClick}/>
                    </Col>
                </Row>
            </header>
        );
    }
});

module.exports = recipeHeader;