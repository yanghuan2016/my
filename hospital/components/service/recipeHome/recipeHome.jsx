/**
 *  处方单首页
 *
 */

var React = require('react');

var style = require('./recipeHome.css');

var PageHeader = require('elements/pageHeader/pageHeader.jsx');
var CaseHistory = require('elements/caseHistory/caseHistory.jsx');
var Button = require('basic/button/button.jsx');
var Table = require('basic/table/table.jsx');
var history = require('base/history.js');
var patientListAction = require('action/patientListAction.js');

var patientStore = require('stores/patientListStore.js');
var userStore = require('stores/userStore.js');
var cookie = require('util/cookieUtil');
var recipeHome = React.createClass({

        getInitialState: function () {
            var self = this;
            return {
                dataSource: patientStore.getCurrentPatentDiagnosisInfoList(),
                columns: [{
                    title: '处方单号',
                    dataIndex: 'prescriptionInfoId',
                    key: 'prescriptionInfoId',
                    render: function (prescriptionInfoId) {
                        var _onClickDetail = function () {
                            cookie.setItem('prescriptionInfoId', prescriptionInfoId);
                            self._getDetails(prescriptionInfoId);
                        };
                        return <a onClick={_onClickDetail}>{prescriptionInfoId}</a>
                    }
                }, {
                    title: '开立时间',
                    dataIndex: 'prescriptionInfoCreatedOn',
                    key: 'prescriptionInfoCreatedOn',
                    render: function (text) {
                        return moment(text).format('YYYY-MM-DD')
                    }
                }, {
                    title: '处方状态',
                    dataIndex: 'prescriptionStatus',
                    key: 'prescriptionStatus',
                    render: function (text) {
                        return "未取药"
                    }
                }]
            }
        },

        _getDetails: function (prescriptionInfoId) {
            var doctorId = userStore.getDoctorId();
            var diagnosisId = userStore.getDiagnosisId();
            patientListAction.getReciptDetail(prescriptionInfoId, doctorId, diagnosisId);
        },

        /* 表格的行点击事件,获取当前处方单的详细信息　*/
        _onRowClick: function (record, index) {
            var doctorId = userStore.getDoctorId();
            var diagnosisId = userStore.getDiagnosisId();
            cookie.setItem('prescriptionInfoId', record.prescriptionInfoId);
            patientListAction.getReciptDetail(record.prescriptionInfoId, doctorId, diagnosisId);
        },

        _onClickCreate: function () {
            patientListAction.clearReciptList();
            history.pushState(null, '/create');
        },

        _onChange: function () {
            this.setState({
                dataSource: patientStore.getCurrentPatentDiagnosisInfoList()
            });
        },

        componentDidMount: function () {
            patientStore.addChangeListener(this._onChange);
        },

        componentWillUnmount: function () {
            patientStore.removeChangeListener(this._onChange);
        },

        render: function () {
            var self = this;
            var info = patientStore.getCurrentPatentDiagnosisInfo();
            return (
                <div>
                    <PageHeader />

                    <div className={style.content}>
                        <CaseHistory className={style.info}/>
                        {(info && info.name) ?
                            <Button buttonClassName={style.button}
                                    title='新建处方单'
                                    onClick={self._onClickCreate}
                                    type='primary'/>
                            : ''}
                        {self.state.dataSource.length > 0 ?
                            <Table columns={self.state.columns}
                                   onRowClick={self._onRowClick}
                                   dataSource={self.state.dataSource}
                                />
                            : ''}
                    </div>
                </div>
            )
        }
    })
    ;

module.exports = recipeHome;