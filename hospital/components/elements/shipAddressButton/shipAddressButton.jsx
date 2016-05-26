var React=require('react'),
    style=require('./shipAddressButton.css'),
    Button=require('basic/button/button');

const ShipAddressButton=React.createClass({
    render:function(){
        var temp=this.props.buttonGroups;
            temp={

            };
        return (
                <Button buttonClassName={style.buttonContainer}
                        buttonSelfName={style.buttonSelf}
                        onClick={this.props.onClick}
                    />
            );
    }
});

module.exports=ShipAddressButton;