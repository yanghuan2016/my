#!/bin/bash
###############################################################################
# go-developer.sh
#
# 执行单元测试的启动脚本
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2016-05-03    yanghuan@issue#1481    修改更换supervisor为pm2-dev,新增检查pm2和gulp函数
# 2016-04-25    yanghuan@issue#1461    修改脚本支持离线任务
# 2015-08-19    hc-romens@issue#3      新建文件
#

function env_check() {
    which gulp > /dev/null
    if [ $? -ne 0 ];then
        echo "gulp is not install,please 'sudo npm install gulp -g' first."
        exit 1
    fi
    which supervisor > /dev/null
    if [ $? -ne 0 ];then
        echo "supervisor is not install,please 'sudo npm install supervisor -g' first."
        exit 2
    fi
}

function print_setenv() {
    echo
    echo "必须先执行:"
    echo "----------------------------------------------"
    echo "    source bin/setenv.sh"
    echo "或者:"
    echo "    . bin/setenv.sh"
    echo

}

function print_help() {
    echo
    echo "启动脚本:"
    echo "----------------------------------------------"
    echo "   `basename $0` <options>"
    echo "      -h      指定主机名"
    echo "      -s      启动离线任务"
    echo "      -p      指定端口"
    echo
}
PORT=3300
OFFLINE=0
while getopts "h:p:s" arg
do
    case $arg in
        s)
            OFFLINE=1
            ;;
        h)
            HOST_NAME=$OPTARG
            ;;
        p)
            PORT=$OPTARG
            ;;
        ?)
            print_help
            exit 1
            ;;
    esac
done

source bin/setenv.sh $HOST_NAME

# 检查运行环境
[ "$SCC_ROOT" = "" ] && print_setenv && exit 1

env_check
NODEJS=`which node`


OLDPWD=`pwd`
cd ${SCC_ROOT}
gulp
version.sh
if [ $OFFLINE -eq 1 ]
then
    (
      supervisor -p 2000 -e js,ejs,json,conf -- app.js -p ${PORT} -s > /tmp/offlinetasks.log &
        (
            supervisor -p 2000 -e js,ejs,json,conf -- app.js -p ${PORT}
        )

    )
else
    supervisor -p 2000 -e js,ejs,json,conf -- app.js -p ${PORT}
fi
