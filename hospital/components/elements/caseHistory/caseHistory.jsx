/**
 * 处方单详情-病人病历
 * @type {*|exports|module.exports}
 */

var React = require('react');
var Style = require('./caseHistory.css');
var patientStore = require('stores/patientListStore.js');

var CaseHistory = React.createClass({

    getInitialState: function () {
        return {
            info: patientStore.getCurrentPatentDiagnosisInfo()
        }
    },

    _onChange: function () {
        this.setState({
            info: patientStore.getCurrentPatentDiagnosisInfo()
        });
    },

    componentDidMount: function () {
        patientStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function () {
        patientStore.removeChangeListener(this._onChange);
    },

    render: function () {
        var info = this.state.info;
        var genderName = {
            'MALE': '男',
            'FEMALE': '女'
        };
        if (info && info.name) {
            var diseaseDescription = '';
            if(info.diseaseDescription && (info.diseaseDescription.toLowerCase() !== 'null')){
                diseaseDescription = info.diseaseDescription;
            }
            return (
                <div className={Style.box + ' ' + this.props.className}>
                    <div className={Style.user}>{info.name}/{genderName[info.gender]}/{info.age}</div>
                    <div>
                        <span>就诊卡/住院卡：{info.patientCardId}</span>
                        <span className={Style.hospital}>就诊时间：{moment(info.diagnoseDate).format('YYYY-MM-DD')}</span>
                    </div>
                    <div className={Style.description}>病情描述：{diseaseDescription}</div>
                </div>
            )
        } else {
            return null
        }
    }
});
module.exports = CaseHistory;