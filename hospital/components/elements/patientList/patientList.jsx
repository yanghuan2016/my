/**
 * 患者列表
 * added by hzh 2016-05-12
 */
var React = require('react');
var Table = require('basic/table/table');
var style = require('./patientList.css');
var patientListAction = require('action/patientListAction');
var patientListStore = require('stores/patientListStore');
var userStore = require('stores/userStore');
var logger = require('util/logService');

var PaintList = React.createClass({

    componentWillMount: function () {
        patientListStore.addChangeListener(this._dataChange);
        patientListAction.getPatientList(userStore.getDoctorId());
    },

    componentWillUnmount: function () {
        patientListStore.removeChangeListener(this._dataChange)
    },

    getInitialState: function () {
        return {
            patientList: patientListStore.getPatientList()
        }
    },

    _dataChange: function () {
        this.setState({
            patientList: patientListStore.getPatientList()
        })
    },

    /* 表格的行点击事件,获取改病人点击的当前诊断单所包含的病人信息　*/
    _onRowClick: function (recode, index) {
        $(".ant-table-tbody tr").eq(index).addClass("active").siblings().removeClass("active");
        var diagnosisId = recode.diagnosisId;
        var doctorId = userStore.getDoctorId();
        patientListAction.getPatientDiagnosisInfo(diagnosisId, doctorId);
    },

    render: function () {
        logger.trace(this.state.patientList);
        var genderName = {
            'MALE': '男',
            'FEMALE': '女'
        };
        var columns = [
            {
                title: '姓名',
                dataIndex: 'name',
                key: 'name'
            }, {
                title: '性别',
                dataIndex: 'gender',
                key: 'gender',
                render: function(gender){
                    return genderName[gender];
                }
            }, {
                title: '年龄',
                dataIndex: 'age',
                key: 'age'
            }
        ];
        return (
            <div className={style.tableWrap}>
                <Table dataSource={this.state.patientList}
                       columns={columns}
                       onRowClick={this._onRowClick}
                       size="small"
                       className={style.table}/>
            </div>
        )
    }
});

module.exports = PaintList;