var CONSTANTS={
    Comments:{
        ShopWindow_Mode:"新增橱窗的类别选择,当下默认的都使用的是LIST,KEY表示橱窗类型,ENABLED 表示是否启动",
        CheckClientResult:"用户注册后,管理员审核后发送短信的内容,第一条为通过审核发送给用户的内容,第二条为被退回的时候发送给用户的短信内容",
        UpdatedToApprovedSMS:"用户注册审核通过,重新提交资料【证件到期 重办 或者其他原因 然后提交】,审核通过后 通知用户的内容",
        UpdatedToApproved_R_SMS:"用户注册审核通过,重新提交资料【证件到期 重办 或者其他原因 然后提交】,审核没有通过 通知用户的内容",
        registerSMSContent: {
            sendSMSContent: "用户注册发送验证码的内容",
            registerRedisKeyPrefix: 'prefix,存储用户的手机验证码的时候,构造key需要加的前缀,比如手机号码为15644448585,存到redis中的验证码的key 就是 register_phone_captcha_15644448585',
            TTL:'验证码失效时间'
        }
    },
    ShopWindow_Mode:{
        LIST:
            {
                KEY:"LIST",
                ALIAS:'列表橱窗',
                SIZE:7,
                ENABLED:true
            },
        ICONLIST:{
                KEY:"ICONLIST",
                ALIAS:'图标橱窗',
                SIZE:9,
                ENABLED:true
                },
        SCROLL:{
                KEY:"SCROLL",
                ALIAS:'滚动橱窗',
                ENABLED:false
        },


    },
    CheckClientResult:{
        // 注册审核已通过
        ApprovedSMS:"尊敬的客户，您在神木医药网注册的账户 account 已通过审核reasonContent，详情请登录网站查询。【神木医药网】",
        // 注册审核未通过
        RejectedSMS:"尊敬的客户，您在神木医药网注册的账户 account 未通过审核，备注 reasonContent ，详情请登录网站查询。【神木医药网】",
        UpdatedToApprovedSMS:"account 您在神木医药网提交的资料审核已经通过,请登陆后查看详情【神木医药网】",
        UpdatedToApproved_R_SMS:"account 您在神木医药网提交的资料审核由于 reasonContent 未通过审核,请重新提交【神木医药网】"
    },
    registerSMSContent:{
        // 验证码提示
        sendSMSContent: "尊敬的客户，您本次手机验证码为： mobileCode ，请在15分钟内使用，请勿外泄。【神木医药网】",
        // 注册申请接收确认
        ApplySMS: "欢迎注册神木医药网，您的注册申请已成功提交，请等待审核，如有需要我们的客服会与您联系。【神木医药网】",

        registerRedisKeyPrefix:'register_phone_captcha_',
        TTL:900
    },
    OrderSMSContent:{
        // 订单接收
        ReceiveSMS: "您提交的单据号为 orderNo 的订单我们已成功受理，请等待商户审核。【神木医药网】",
        // 订单审核
        AuditSMS: "您提交的单据号为 orderNo 的订单我们已成功受理，请等待商户审核。【神木医药网】",
        // 订单发货
        ShipmentSMS: "您提交的单据号为 orderNo 的订单我们已成功受理，请等待商户审核。【神木医药网】"
    },
    ReturnSMSContent:{
        // 退货申请接收
        ApplySMS: "您提交的单据号为 orderNo 的退货单我们已成功受理，请等待商户审核。【神木医药网】",
        // 退货审核结果
        AuditSMS: "您提交的单据号为 orderNo 的退货单已通过审核/未通过审核，备注 reasonContent ，详情请登录网站查询。【神木医药网】 ",
        // 退货入库结果
        StorageSMS: "您提交的单据号为 orderNo 的退货单已成功入库，备注 reasonContent ，详情请登录网站查询。【神木医药网】"
    },
    actualInventoryPlanContent:'按照实际数量显示'
};
module.exports=CONSTANTS;