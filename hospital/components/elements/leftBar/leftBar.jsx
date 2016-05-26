/**
 * 左侧菜单栏
 * added by hzh 2016-05-12
 */
var React = require('react');
var style = require('./leftBar.css');
var SearchInput = require('basic/searchInput/searchInput');
var PatientList = require('elements/patientList/patientList');
var Logo = require('elements/logo/logo');
var patientListAction = require('action/patientListAction');

var LeftBar = React.createClass({
    inputChange: function(value){
        patientListAction.filter(value);
    },
    render: function(){
        return (
            <div>
                <Logo />
                <SearchInput className={style.search} onInputChange={this.inputChange}  placeholder="请输入病人姓名"/>
                <PatientList className={style.table} />
            </div>
        )
    }
});
module.exports = LeftBar;