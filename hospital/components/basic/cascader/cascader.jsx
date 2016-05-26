var React = require('react'),
    Cascader = require('antd').Cascader,
    style=require('./cascader.css');

const CustomCascader=React.createClass({


    render:function(){

        const options = [{
            value: 'zhejiang',
            label: '浙江'

        }, {
            value: 'jiangsu',
            label: '江苏'

        }];
        var lastOptions=this.props.options;
        return (
            <div className={ style.cascadeCon +' '+this.props.ContainerClass}>
                <Cascader forText={this.props.forText}
                          className={style.cascadeSelf}
                          options={lastOptions}
                          placeholder={this.props.placeholder}
                          popupClassName={style.popupClass}
                    />
            </div>
        );


    }
});

module.exports=CustomCascader;