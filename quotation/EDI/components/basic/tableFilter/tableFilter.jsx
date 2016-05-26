/*
 *  表格的过滤组件
 *  包括：时间段过滤，关键字过滤
 *  param: startTime,endTime,keywords
 *  点击事件：
 *  onFilterTime, onFilterKeywords, onChange
 */

var React = require('react');
var style = require('./tableFilter.css');
var SearchInput = require('ediComponents/basic/searchInput/searchInput');
var DatePicker = require('antd').DatePicker;
var Button= require('antd').Button;
var message = require('antd').message;


var TableFilter = React.createClass({
    getDefaultProps: function(){
        return {
            placeholder: '请输入关键词'
        }
    },
    getInitialState() {
        return {
            startValue: null,
            endValue: null,
            keywords: null
        };
    },
    disabledStartDate(startValue) {
        if (!startValue || !this.state.endValue) {
            return false;
        }
        return startValue.getTime() >= this.state.endValue.getTime();
    },
    disabledEndDate(endValue) {
        if (!endValue || !this.state.startValue) {
            return false;
        }
        return endValue.getTime() <= this.state.startValue.getTime();
    },
    onChange(field, value) {
        this.setState({
            [field]: value
        }, function(){
            this.props.onChange(this.state);
        });
    },
    handleFilterTime: function(){
        if(!this.state.startValue || !this.state.endValue){
            message.error('请输入开始时间和结束时间');
            return;
        }
        this.props.onFilterTime(this.state.startValue, this.state.endValue);
    },
    onInputChange: function(value){
        this.setState({
            keywords: value
        }, function(){
            this.props.onChange(this.state);
        });
    },
    render: function(){
        return (
            <div className={style.box}>
                <label htmlFor="" className={style.label}>时段 </label>
                <div className={style.start}>
                    <DatePicker disabledDate={this.disabledStartDate}
                                value={this.state.startValue}
                                placeholder="开始日期"
                                onChange={this.onChange.bind(this, 'startValue')} />
                </div>
                <div className={style.end}>
                    <DatePicker disabledDate={this.disabledEndDate}
                                value={this.state.endValue}
                                placeholder="结束日期"
                                onChange={this.onChange.bind(this, 'endValue')} />
                </div>
                <div  className={style.btn}>
                    <Button onClick={this.handleFilterTime}>查询</Button>
                </div>
                <div className={style.searchInputWrap}>
                    <SearchInput placeholder={this.props.placeholder}
                                 onSearch={this.props.onFilterKeywords}
                                 onInputChange={this.onInputChange}
                                 className={style.searchInput}/>
                </div>
            </div>
        )
    }
});

module.exports = TableFilter;