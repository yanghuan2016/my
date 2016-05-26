
#!/bin/bash -x
###############################################################################
# db-init.sh
#
# 新建初始化数据库脚本
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2016-05-10    yanghuan2016@issue1513  新增db-init.sh -e参数跳过环境变量检查
# 2016-04-07    yanghuan2016@issue#1348 添加参数跳过testData.sql
# 2015-09-22    hc-romens@issue#29     统一数据库名称和域名
# 2015-09-20    hc-romens@issue#3      使用参数作为customerDB名称
# 2015-08-19    hc-romens@issue#3      新建文件


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
    echo "初始化SCC数据库工具:"
    echo "----------------------------------------------"
    echo "   `basename $0` <options>"
    echo "      -h      help"
    echo "      -q      快速模式，不导入商品数据"
    echo "      -i      只初始化initdata，不初始化testdata"
    echo "      -d [dbname]     指定数据库名"
    echo "      -e      不检查环境变量，读取sysconfig.json文件"
    echo

}

trap 'exit 0;' INT

QUICK_MODE=0
INIT_TEST=1
NO_TEST_DIR=0
ISENV=1

while getopts "d:ehqi" arg
do
    case $arg in
        q)
            QUICK_MODE=1
            ;;
        i)
            INIT_TEST=0
            ;;
        d)
            TARGET_CUSTOMER_DB=$OPTARG
            ;;
        e)
            ISENV=0
            ;;
        ?)
            print_help
            exit 1
            ;;
    esac
done


echo
if [ $QUICK_MODE -eq 0 ]
then
    echo "INIT DB IN FULL MODE (WITH 700+ TEST GOODS DATA)"
else
    echo "INIT DB IN QUICK MODE (WITHOUT GOODS)"
fi
echo
echo

if [ $ISENV -eq 0 ]
then
    SCC_ROOT=`pwd`
    SCC_DB_HOST=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="db" -vy="host" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
    SCC_DB_USER=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="db" -vy="user" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
    SCC_DB_PASSWORD=`cat ${SCC_ROOT}/config/sysconfig.json |awk -F\" -vx="db" -vy="password" '$2==x&&/{/{k=1}/}/{k=0}k&&$2==y{print $(NF-1)}'`
    SCC_CLOUDDB=`cat ${SCC_ROOT}/config/sysconfig.json | grep cloudDBName | grep -v "云平台数据库名称" | awk -F\" '{print $4}'`
    SCC_CUSTOMERDB_PREFIX=`cat ${SCC_ROOT}/config/sysconfig.json | grep customerDBPrefix | grep -v "商户数据名称前缀" | awk -F\" '{print $4}'`
else
    # 检查运行环境
    [ "$SCC_ROOT" = "" ] && print_setenv && exit 1
fi

if [ "${SCC_DB_PASSWORD}" = "" ]
then
    MYSQL="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER}"
else
    MYSQL="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER} -p${SCC_DB_PASSWORD}"
fi

# 如果没有指定customerDB，则使用romens作为默认customer数据库
SCC_CUSTOMERDB="${SCC_CUSTOMERDB_PREFIX}_localhost"
if [ "$1" != "" ]
then
    SUFFIX=`echo $1 | sed 's/\./_/g'`
    SCC_CUSTOMERDB="${SCC_CUSTOMERDB_PREFIX}_${SUFFIX}"
fi

DB_ROOT=${SCC_ROOT}/db/ddl
RESULT=/tmp/$$.err

function rebuildDB() {
    dbName=$1
    ${MYSQL} 2>/dev/null << EOF!
        DROP DATABASE IF EXISTS ${dbName};
        CREATE DATABASE IF NOT EXISTS ${dbName} DEFAULT CHARSET utf8 COLLATE utf8_general_ci;
EOF!
}

function delDB() {
    userDB=`echo "show databases;" | ${MYSQL} 2>/dev/null`
    for i in ${userDB}
    do
        len1=`echo $i | grep ${SCC_CUSTOMERDB_PREFIX} | awk -F "_" '{print length($3)}'`
        if [ "$len1" == "32" ]
        then
            echo "Drop database $i"
            ${MYSQL} 2>/dev/null << EOF!
            DROP DATABASE IF EXISTS ${i};
EOF!
        fi
    done
}

function makeDB() {
    dbName=$1
    sqlRoot=$2
    quickMode=$3
    noTestDataSql=$4

    SQL=`find ${sqlRoot} -name "*sql" | sort`
    echo "Initializing Database: ${dbName} ..."
    for sql in ${SQL}
    do
        echo $sql | grep "testDataGoods" > /dev/null 2>&1
        noGoods=$?
        echo $sql | grep "testData.sql" > /dev/null 2>&1
        noTestDataDir=$?
        if [[ ${quickMode} -eq 1 && $noGoods -eq 0 ]]
        then
            echo "QUICK MODE, skipping $sql"
        elif [[ ${noTestDataSql} -eq 0 && $noTestDataDir -eq 0 ]]
        then
            echo "Skip $sql"
        else
            echo "Executing `basename ${sql}` ..."
            cat ${sql} | ${MYSQL} ${dbName} > ${RESULT} 2>&1
            [ $? -ne 0 ] && echo "FAILED!" && cat ${RESULT} | grep -v "^Warning: Using a password.*$" && exit 1
        fi


    done

    echo "Database <${dbName}> is sucessfully created!"
    echo "---------------------------------------------------------"
    echo
    return 0
}

function loadEnterprise() {
    cloudDBName=$1
    echo "SELECT enterpriseType,customerDBSuffix FROM Customer;" | ${MYSQL} ${SCC_CLOUDDB} 2>/dev/null | grep -e '^SELLER' -e '^BUYER'
}

if [ "${TARGET_CUSTOMER_DB}" = "" ]
then
    echo ${SCC_CLOUDDB}
    rebuildDB ${SCC_CLOUDDB}
    makeDB ${SCC_CLOUDDB} ${DB_ROOT}/cloudDB ${QUICK_MODE} ${INIT_TEST}
fi

data=`loadEnterprise ${SCC_CLOUDDB}`
echo "Found Enterprises ..."
echo ${data}
echo
echo "Delete user databases"
delDB

if [ "$TARGET_CUSTOMER_DB" = "" ]
  then
      echo "Initiating all the databases"
  else
      echo "Initiating $TARGET_CUSTOMER_DB ONLY"
  fi

i=0
for x in ${data}
do
    if [ ${i} -eq 0 ]
    then
        i=1
        type=${x}
    else
        xDB="${SCC_CUSTOMERDB_PREFIX}_${x}"
        if [ "${TARGET_CUSTOMER_DB}" = "" -o "${xDB}" = "${TARGET_CUSTOMER_DB}" ]
        then
            i=0
            name=${xDB}
            rebuildDB ${name}
            makeDB ${name} ${DB_ROOT}/customerDB ${QUICK_MODE} ${INIT_TEST}
            if [ "${type}" = "SELLER" ]
            then
                makeDB ${name} ${DB_ROOT}/sellerOnly
            elif [ "${type}" = "BUYER" ]
            then
                makeDB ${name} ${DB_ROOT}/buyerOnly
            fi
        else
            i=1
            name=${TARGET_CUSTOMER_DB}
            rebuildDB ${name}
            makeDB ${name} ${DB_ROOT}/customerDB ${QUICK_MODE} ${INIT_TEST}
            exit 2
        fi
    fi
done