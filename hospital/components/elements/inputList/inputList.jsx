var React = require('react'),
    InputWithLabel = require('basic/inputWithLabel/inputWithLabel'),
    Cascader = require('antd').Cascader,
    style = require('./inputList.css'),
    CustomerCascade=require('basic/cascader/cascader'),
    Select=require('antd').Select,
    Option = Select.Option,
    CustomSelect=require('basic/select/select');

const InputList = React.createClass({
    getInitialState: function () {
        return {
            city:[],
            district:[]
        }
    },
    getDefaultProps: function () {
        return {
            inputListProps: [
                {
                    type: 'input',
                    text: "收货人:",
                    forText: "receiver",
                    value: '',
                    placeHolder: ''
                },
                {
                    type: 'input',
                    text: "手机号码:",
                    forText: "phoneNum",
                    value: '',
                    placeHolder: ''
                },
                {
                    type: 'input',
                    text: '省/市/区:',
                    forText: 'provinceAddress',
                    value: '',
                    placeHolder: ''
                }
                ,
                {
                    type: 'input',
                    text: '详细地址:',
                    forText: 'detailAddress',
                    value: '',
                    placeHolder: ''
                }],

            defaultProvince:[
                    {id:2, name: "北京市"},
                    {id:23, name: "天津市"},
                    {id:44, name: "河北省"},
                    {id:239, name: "山西省"},
                    {id:381, name: "内蒙古自治区"},
                    {id:503, name: "辽宁省"},
                    {id:632, name: "吉林省"},
                    {id:710, name: "黑龙江省"},
                    {id:866, name: "上海市"},
                    {id:888, name: "江苏省"},
                    {id:1021, name: "浙江省"},
                    {id:1134, name: "安徽省"},
                    {id:1274, name: "福建省"},
                    {id:1378, name: "江西省"},
                    {id:1500, name: "山东省"},
                    {id:1675, name: "河南省"},
                    {id:1869, name: "湖北省"},
                    {id:1998, name: "湖南省"},
                    {id:2148, name: "广东省"},
                    {id:2310, name: "广西壮族自治区"},
                    {id:2448, name: "海南省"},
                    {id:2477, name: "重庆市"},
                    {id:2521, name: "四川省"},
                    {id:2742, name: "贵州省"},
                    {id:2843, name: "云南省"},
                    {id:2997, name: "西藏自治区"},
                    {id:3079, name: "陕西省"},
                    {id:3207, name: "甘肃省"},
                    {id:3320, name: "青海省"},
                    {id:3373, name: "宁夏回族自治区"},
                    {id:3405, name: "新疆维吾尔自治区"},
                    {id:3522, name: "台湾省"},
                    {id:3523, name: "香港特别行政区"},
                    {id:3524, name: "澳门特别行政区"}
                ]
        }
    },
    _handleInputChange: function (key, value) {
        this.props.onChange(key, value);
        //this._onChange(key,value);
    },
    render: function() {
        var _this=this;
        var defaultProps = this.props.inputListProps;
        var nodeList = [];
        defaultProps && defaultProps.map(function (item) {

            nodeList.push(<InputWithLabel key={item.forText} forText={item.forText}
                                              containerClass={style.subContainer}
                                              handleInputChange={_this._handleInputChange}
                                              dataProps={item}/>)

        });
        return (
            <div >
                {nodeList}
            </div>
        )

    }
});
module.exports = InputList;

/*<CustomerCascade forText={item.forText}
                 ContainerClass={style.rightItem}
                 options={item.data}
                 placeholder={'请选择'+item.text}/>*/
