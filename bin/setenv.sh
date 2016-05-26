#!/bin/bash
###############################################################################
# setenv.sh
#
# 设置scc项目的开发环境变量, 执行方法：
#     $> cd ssc-src/bin
#     $> . ./setenv.sh
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2015-09-29    hc-romens@issue#79     设置redis的登录变量
# 2015-09-20    hc-romens@issue#23     removed customerDB settings
# 2015-09-15    hc-romens@issue#16     新增参数数据库服务器
# 2015-08-19    hc-romens@issue#3      新建文件

function print_help() {
    echo
    echo "必须在项目根路径下, 以source方式执行："
    echo "==========================================================="
    echo "    source bin/setenv.sh [DB Server]"
    echo "或者"
    echo "    . bin/setenv.sh"
    echo

    return 0
}

# 检查是否以source方式运行
[ "`basename $0 2>/dev/null`" = "setenv.sh" ] && print_help && exit 1

# 检查是否在项目根目录下
ls bin/setenv.sh >/dev/null 2>&1
[ $? -ne 0 ] && print_help && return 1

# 设置基本的环境变量
SCC_ROOT=`pwd`
PATH=${SCC_ROOT}/bin:${PATH}
USER=$(whoami)
SCC_LOG_ROOT=${SCC_ROOT}/log
SCC_UPLOAD_ROOT=${SCC_ROOT}/uploads
DB_SUFFIX="_${USER}"

# 检查log路径, 并设置为可写
#[ -d ${SCC_LOG_ROOT} ] || mkdir ${SCC_LOG_ROOT}
#chmod a+w ${SCC_LOG_ROOT}
#[ -d ${SCC_UPLOAD_ROOT} ] || mkdir ${SCC_UPLOAD_ROOT}
#chmod a+w ${SCC_UPLOAD_ROOT}

SCC_DB_USER="root"
if [ "$1" = "" ]
then
  SCC_DB_HOST=localhost
  SCC_REDIS_HOST=localhost
  SCC_DB_PASSWORD=""
  alias mysql="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER}"
else
  SCC_DB_HOST=$1
  SCC_DB_PASSWORD='romens@2015'
  SCC_REDIS_HOST=$1
  alias mysql="mysql -h ${SCC_DB_HOST} -u ${SCC_DB_USER} -p${SCC_DB_PASSWORD}"
fi

SCC_CLOUDDB=`cat config/sysconfig.json  | grep CloudDB | tail -1 | sed -e 's/^.*: *"//g' -e 's/".*$//g'`"${DB_SUFFIX}"
CUSTOMERDB=`cat config/sysconfig.json  | grep customerDBPrefix | tail -1 | sed -e 's/^.*: *"//g' -e 's/".*$//g'`
SCC_CUSTOMERDB_PREFIX=`cat config/sysconfig.json  | grep customerDBPrefix | tail -1 | sed -e 's/^.*: *"//g' -e 's/".*$//g'`"${DB_SUFFIX}"

# export env variables
export SCC_ROOT SCC_UPLOAD_PATH SCC_LOG_PATH SCC_DB_HOST SCC_REDIS_HOST SCC_CLOUDDB SCC_CUSTOMERDB_PREFIX SCC_DB_USER SCC_DB_PASSWORD PATH

export LESS="-eirMX"

