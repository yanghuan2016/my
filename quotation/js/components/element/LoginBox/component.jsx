var React=require('react');

var LoginInput=require('js/components/element/LoginInput/component');
var Span=require('js/components/basic/span/component');

var WeUI=require('react-weui');
var weiUI=require('weui/dist/style/weui.css');
var style=require('./LoginBox.css');

var Button=WeUI.Button;

var LoginStore=require('stores/LoginStore');
var LoginAction=require('actions/LoginAction');

var cookieUtil=require('util/cookieUtil');

require('sass/main.scss');

var LoginBox=React.createClass({
    getInitialState: function() {
        return {
            username:'',
            password:'',
            rightFirstSpanProps:{
                className:style.spanRightFirstMobile ,
                content:'Romens '
            },
            rightSecondSpanProps :{
                className:style.spanRightSecondMobile + ' ' +style.marginUpLessMobile,
                content:'雨人业务员报价系统'
            },
            inputPropsUserName:{
                value:this.username,
                className:style.usernameInputMobile,
                placeHolderContent:'请输入用户名',
                type:'text'
            },
            inputPropsPwd:{
                value:this.password,
                className:style.usernameInputMobile,
                placeHolderContent:'请输入密码',
                type:'password'
            },
            loginTips:LoginStore.getLoginTips()
        }
    },
    componentDidMount: function() {
        LoginStore.addChangeListener(this._onChange);
    },

    componentWillUnmount: function() {
        LoginStore.removeChangeListener(this._onChange);
    },
    _handleLoginBtnClick:function(event){
        window.location.hash='/info';
    },
    _onChange:function(){
        this.setState({
            loginTips:LoginStore.getLoginTips()
        });
    },
    _onClick:function(){
        var data={
            username:this.state.username,
            password:this.state.password
        };
        LoginAction.logIn(data);
    },
    _handleUserNameInput:function(event){
        var currentUserName=event.target.value;
        this.setState({
            username:currentUserName
        })
    },
    _handlerPwdInput:function(event){
        var currentPwd=event.target.value;
        this.setState({
            password:currentPwd
        })
    },
    render:function(){
            return  (
                <div className={this.props.className}>
                    <Span spanProps={this.state.rightFirstSpanProps} />
                    <Span spanProps={this.state.rightSecondSpanProps}  />


                    <div className={style.loginContent}>
                        <LoginInput  className={style.usernameDivMobile}  onChange={this._handleUserNameInput} inputProps={this.state.inputPropsUserName} />
                        <LoginInput  className={style.pwdDivMobile}  onChange={this._handlerPwdInput} inputProps={this.state.inputPropsPwd} />
                        <div className={style.loginTipsContainer}>
                            <span className={style.loginTips}>{this.state.loginTips}</span>
                        </div>
                        <Button  onClick={this._onClick}    className={"primary"+' '+style.loginBtnMobile} >  登陆</Button>

                    </div>
                </div>
            );
    }
});

module.exports=LoginBox;


