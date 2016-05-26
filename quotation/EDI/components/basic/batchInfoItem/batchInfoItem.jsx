/**
 * 商品批次信息每一个条目
 * @type {*|exports|module.exports}
 */

/*
 * batchInfoItem.jsx
 *
 * 2015-04-15    wzhongbi-romens     created
 *
 */

var React = require('react');
var Row = require('antd').Row;
var Col = require('antd').Col;

var style = require('./batchInfoItem.css');
var placeholder = require('img/placeholder.jpg');

var BatchInfoItem = React.createClass({

    getDefaultProps: function () {
        return {
            batchInfo: [
                {
                    batchNum: "",
                    goodsProduceDate: "",
                    goodsValidDate: "",
                    drugESC: "",
                    inspectReportURL: ""
                },
                {
                    batchNum: "",
                    goodsProduceDate: "",
                    goodsValidDate: "",
                    drugESC: "",
                    inspectReportURL: ""
                }
            ]
        }
    },

    render: function () {
        var index = -1;
        var list = this.props.batchInfo.map(function (item) {
            index++;
            return <Item batchNum={item.batchNum}
                         key={index}
                         goodsProduceDate={item.goodsProduceDate}
                         goodsValidDate={item.goodsValidDate}
                         drugESC={item.drugESC}
                         inspectReportURL={item.inspectReportURL}
            />
        });

        return (
            <div className={style.banner}>
                {list}
            </div>
        );
    }
});

module.exports = BatchInfoItem;

var Item = React.createClass({
    render: function () {
        var eyeStyle = {
            left: '12px',
            top: '12px',
            margin: '0'
        };
        var inspectReportURL = this.props.inspectReportURL && this.props.inspectReportURL.split(',');
        var index = -1;
        var list = !(inspectReportURL && inspectReportURL.length) ? ["无质检报告"] : inspectReportURL.map(function (item) {
            index++;
            return <div className={'ant-upload-list ant-upload-list-picture-card ' + ' ' + style.picture}>
                        <span>
                            <div className='ant-upload-list-item ant-upload-list-item-done'>
                                <div className='ant-upload-list-item-info'>
                                    <a className='ant-upload-list-item-thumbnail' href={item} target='_blank'>
                                        <img src={item || placeholder} alt={item}/>
                                    </a>
                                    <a href={item} target="_blank" className="ant-upload-list-item-name">{item}</a>
                                    <a href={item} target="_blank">
                                        <i className='anticon anticon-eye-o' style={eyeStyle}></i>
                                    </a>
                                </div>
                            </div>
                        </span>
            </div>
        });

        return (
            <div className={style.batchItem}>
                <Row className={style.row}>
                    <Col span="8">【批次号】{this.props.batchNum}</Col>
                    <Col span="8">【生产日期】{this.props.goodsProduceDate}</Col>
                    <Col span="8">【有效期】{this.props.goodsValidDate}</Col>
                </Row>
                <Row className={style.row}>
                    <Col span="24">【电子监管码】{this.props.drugESC}</Col>
                </Row>
                <Row className={style.row + ' ' + 'changeImgWidthHeight'}>
                    <Col span="24">【质检报告单】
                        {list}
                    </Col>
                </Row>
            </div>
        )
    }
});