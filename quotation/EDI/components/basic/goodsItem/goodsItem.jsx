/**
 * 单个商品详情带图片，包括字段：
 *      图片，商品名，生产厂家，规格，货号，批准文号
 * param:
 *      data：商品数据:
 *   name: '氯雷他定片(开瑞坦)',
 *   producer: '上海先灵葆雅制药有限公司',
 *   standard: '10mg*6s(T)',
 *   goodsCode: '20152152115',
 *   img: 'https://modao.cc/uploads/images/2122631/raw_1452668986.jpeg',
 *   jx: '',
 *   pzwh: ''
 * added by hzh 2016-04-18
 */


var React = require('react');
var style = require('./goodsItem.css');

var placeholder = require('img/placeholder.jpg');

var GoodsItem = React.createClass({

    getDefaultProps: function () {
        return {
            goodsDetail: {}
        }
    },

    getInitialState: function () {
        return {}
    },

    _onError: function () {
        this.refs.img.src = placeholder;
        this.refs.imgA.href = placeholder;
    },

    render: function () {
        return (
            <div className={style.box}>
                <a href={this.props.goodsDetail.imageUrl || placeholder}
                   ref='imgA'
                   target='_blank'
                   className={style.item}>
                    <img src={this.props.goodsDetail.imageUrl || placeholder}
                         alt={this.props.goodsDetail.commonName}
                         ref='img'
                         className={style.img}
                         onError={this._onError}/>
                </a>
                <ul className={style.ul}>
                    <li>{this.props.goodsDetail.commonName}</li>
                    <li>{this.props.goodsDetail.producer}</li>
                    <li>{this.props.goodsDetail.spec}</li>
                    {this.props.goodsDetail.drugsType ? <li>剂型：{this.props.goodsDetail.drugsType}</li> : ''}
                    {this.props.goodsDetail.goodsNo ? <li>货号：{this.props.goodsDetail.goodsNo}</li> : ''}
                    {this.props.goodsDetail.licenseNo ? <li>批准文号：{this.props.goodsDetail.licenseNo}</li> : ''}
                </ul>
            </div>
        )
    }

});

module.exports = GoodsItem;