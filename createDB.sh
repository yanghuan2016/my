#!/bin/bash
###############################################################################
# createDB.sh
#
# 新建并初始化指定名称的数据库
#
# 修订历史：
# -----------------------------------------------------------------------------

myi18n()
{
	if [[ "$#" -ne 1 ]]
	then
		echo "demo: myi18n infotest"
	fi

    if [[ $LANG =~ [Uu][Tt][Ff] ]]	#如果系统是uft-8编码
	then
		echo "$1"
	else	#如果系统是gbk编码
		echo "$1" | iconv -f utf-8 -t gbk
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
    echo '2222'
    myi18n "数据库创建工具:"
    myi18n "----------------------------------------------"
    myi18n "   `basename $0` <options>"
    myi18n "      -h      help"
    myi18n "      -d [dbname]     指定数据库名"
}
while getopts "d:h" arg
do
    case $arg in
        d)
            TARGET_CUSTOMER_DB=$OPTARG
            ;;
        ?)
            print_help
            exit 1
            ;;
    esac
done

# 检查运行环境
[ "$SCC_ROOT" = "" ] && print_setenv && exit 1

if [ "${SCC_DB_PASSWORD}" = "" ]
then
    MYSQL="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER}"
else
    MYSQL="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER} -p${SCC_DB_PASSWORD}"
fi

RESULT=/tmp/$$.err
SCC_CUSTOMERDB=$TARGET_CUSTOMER_DB
DB_ROOT=${SCC_ROOT}/db/ddl

function rebuildDB() {
    dbName=$1
    ${MYSQL} 2>/dev/null << EOF!
        CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
EOF!
}

function makeDB() {
    dbName=$1
    sqlRoot=$2
	echo "show databases;" | mysql | grep ^$dbName$ | grep -v "^Warning: Using a password.*$"
	isExsit=$?
	if [ $isExsit -eq 0 ];then
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
            echo "执行 `basename ${sql}` ..."
            cat ${sql} | ${MYSQL} ${dbName} > ${RESULT} 2>&1
            [ $? -ne 0 ] && myi18n "执行失败!报错如下，请联系系统管理员协助处理！" && cat ${RESULT} | grep -v "^Warning: Using a password.*$" && exit 1
        fi
    done

    myi18n "数据库 <${dbName}> 创建成功!"
    myi18n "---------------------------------------------------------"
    return 0
}

makeDB $SCC_CUSTOMERDB ${DB_ROOT}/customerDB
