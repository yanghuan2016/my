#!/bin/bash 
###############################################################################
# createDB.sh
#
# 新建并初始化指定名称的数据库
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2016-04-28    yanghuan@romenscd.cn    增加redis订阅功能
# 2016-04-27    yanghuan@romenscd.cn    修改redis信息通过参数传入
# 2016-04-21	yanghuan@romenscd.cn	添加进度参数并写入redis
# 2016-04-20	yanghuan@romenscd.cn	添加删除失败数据功能
#

myi18n()
{
	if [[ "$#" -ne 1 ]]
	then
		echo "demo: myi18n infotest"
	fi

    if [[ $LANG =~ [Uu][Tt][Ff] ]]
    then
        echo "$1" >&2
    else
        echo "$1" | iconv -f utf-8 -t gbk >&2
    fi
}

function print_setenv() {
    myi18n "必须先执行:"
    myi18n "----------------------------------------------"
    myi18n "    source bin/setenv.sh"
    myi18n "或者:"
    myi18n "    . bin/setenv.sh"
}
function print_help() {
    myi18n "数据库创建工具:"
    myi18n "----------------------------------------------"
    myi18n "   `basename $0` <options>"
    myi18n "      -h [host]     指定redishost"
    myi18n "      -d [dbname]   指定数据库名"
    myi18n "      -k [keyname]  指定redis中的keyname"
    myi18n "      -n [dbNum]    指定reids数据库number"
    myi18n "      -p [name]     指定redis订阅名"
}
PUB_REDIS=0
SAVE_REDIS=0
while getopts "h:n:d:k:p:" arg
do
    case $arg in
        d)
            TARGET_CUSTOMER_DB=$OPTARG
            ;;
        k)
            KEY_NAME=$OPTARG
            SAVE_REDIS=1
            ;;
        h)
            REDIS_HOST=$OPTARG
            ;;
        n)
            REDIS_DBNUM=$OPTARG
            ;;
        p)
            PUB_CHANNEL=$OPTARG
            ;;
        ?)
            print_help
            exit 1
            ;;
    esac
done
# 检查运行环境
if [ "$SCC_ROOT" = "" ]
then
    SCC_ROOT=`pwd`
    SCC_DB_HOST=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="db" -vy="host" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
    SCC_DB_USER=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="db" -vy="user" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
    SCC_DB_PASSWORD=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="db" -vy="password" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
fi

if [ "${SCC_DB_PASSWORD}" = "" ]
then
    MYSQL="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER}"
else
    MYSQL="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER} -p${SCC_DB_PASSWORD}"
fi

RESULT=/tmp/$$.err
SCC_CUSTOMERDB=$TARGET_CUSTOMER_DB
DB_ROOT=${SCC_ROOT}/db/ddl
FILES=0
TOTAL_COUNT=0
#REDIS_HOST=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="redis" -vy="host" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
#REDIS_DBNUM=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="redis" -vy="dbNum" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
#REDIS_PORT=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="redis" -vy="port" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
REDIS_PORT='6379'
function redisOP() {
    echo "set $1 $2" | redis-cli -h $REDIS_HOST -p $REDIS_PORT -n $REDIS_DBNUM >/dev/null
}

function redisPUB() {
    echo "publish '$1' '$2'" | redis-cli -h $REDIS_HOST -p $REDIS_PORT -n $REDIS_DBNUM 
}
function rebuildDB() {
    dbName=$1
    ${MYSQL} 2>/dev/null << EOF!
        CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
EOF!
}

function getSQLCOUNT() {
    SQL=`find ${sqlRoot} -name "*sql" | sort`
    for sql in ${SQL}
    do
        echo $sql | grep "testData" > /dev/null 2>&1
        noTestDataDir=$?
        if [ $noTestDataDir -eq 0 ]
        then
            :
        else
            TOTAL_COUNT=$((TOTAL_COUNT + 1))
        fi
    done
}

function makeDB() {
    dbName=$1
    sqlRoot=$2
    keyname=$3
    isExsit=0
    getSQLCOUNT
    echo "show databases;" | ${MYSQL} > ${RESULT} 2>&1
    isExsit=`cat ${RESULT} | grep -v "^Warning: Using a password.*$" | grep ^$dbName$ | wc -l`
    if [ $isExsit -eq 1 ];then
        myi18n "已经存在相同数据库！若仍然需要初始化，请联系系统管理员手动操作！"
        exit 2
    else
        rebuildDB $dbName
    fi
    SQL=`find ${sqlRoot} -name "*sql" | sort`
    echo "Initializing Database: ${dbName} ..."
    for sql in ${SQL}
    do
        echo $sql | grep "testData" > /dev/null 2>&1
        noTestDataDir=$?
        if [ $noTestDataDir -eq 0 ]
        then
            myi18n "跳过$sql"
        else
            myi18n "执行 `basename ${sql}` ..."
            cat ${sql} | ${MYSQL} ${dbName} > ${RESULT} 2>&1
            isSuccess=$?
            if [ $isSuccess -eq 0 ];then
                FILES=$((FILES + 1))
                percent=$(awk 'BEGIN{printf "%.f\n",('$FILES'/'$TOTAL_COUNT')*100}')
                if [ "$PUB_CHANNEL" != "" ];then
                    #redisPUB $PUB_CHANNEL $percent
                    redisPUB $PUB_CHANNEL '{"taskProgress":'$percent'}'
                fi
            else
                myi18n "执行失败!报错如下，请联系系统管理员协助处理！"
                cat ${RESULT} >&2
                myi18n "正在清理创建失败的数据库$dbName..."
                ${MYSQL} 2>/dev/null << EOF!
                    DROP DATABASE IF EXISTS ${dbName};
EOF!
                exit 1
            fi
        fi
    done

    myi18n "数据库 <${dbName}> 创建成功!"
    myi18n "---------------------------------------------------------"
    return 0
}

makeDB $SCC_CUSTOMERDB ${DB_ROOT}/customerDB 


