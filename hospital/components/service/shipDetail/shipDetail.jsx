var React = require('react'),
    InputList = require('elements/inputList/inputList'),
    ShipAddressButton = require('elements/shipAddressButton/shipAddressButton'),
    style = require('./shipDetail.css');
var WeChatAction = require('action/weChatAction');
var WeChatStore = require('stores/weChatStore');

var ShipDetail = React.createClass({
    getDefaultProps: function () {
        return {
            info: {
                receiver: '',
                phoneNum: '',
                provinceAddress:'',
                detailAddress: '',
            }
        }
    },
    getInitialState: function () {
        return {
            info:this.props.info
        }
    },
    _onClick: function () {
        var info = this.state.info;
        WeChatAction.submitAddress(info,this.props.params.prescriptionId);
    },
    _onChange: function (key, value) {
        var info = this.state.info;
        info[key] = value;
        this.setState({
            info: info
        });
    },
    componentWillMount:function(){
        console.log(this.props.params.prescriptionId);
        WeChatAction.getOrderData(this.props.params.prescriptionId);
    }
    ,
    render: function () {
        return (
            <div className={style.bigContainer}>
                <div style={{backgroundColor:'white'}}>
                    <div className={style.container}>
                        <InputList info={this.props.info} onChange={this._onChange}/>
                    </div>
                    <div className={style.secondContainer}>
                        <div className={style.tips}>
                            请确保您的收货信息正确，以免影响药品收取
                        </div>
                        <ShipAddressButton onClick={this._onClick}/>
                    </div>
                </div>
            </div>
        )
    }
});
module.exports = ShipDetail;