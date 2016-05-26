#!/bin/bash -x
###############################################################################
# clear-session.sh
#
# 清除session
#
# 修订历史：
# -----------------------------------------------------------------------------


function print_setenv() {
    echo
    echo "必须先执行:"
    echo "----------------------------------------------"
    echo "    source bin/setenv.sh"
    echo "或者:"
    echo "    . bin/setenv.sh"
    echo

}

# 检查运行环境
[ "$SCC_ROOT" = "" ] && print_setenv && exit 1

# 如果没有指定customerDB，则使用romens作为默认customer数据库
SCC_CUSTOMERDB="${SCC_CUSTOMERDB_PREFIX}_localhost"
if [ "$1" != "" ]
then
    SUFFIX=`echo $1 | sed 's/\./_/g'`
    SCC_CUSTOMERDB="${SCC_CUSTOMERDB_PREFIX}_${SUFFIX}"
fi

for v in `redis-cli -h ${SCC_REDIS_HOST} KEYS \*`
do
   redis-cli -h ${SCC_REDIS_HOST} dump $v | grep $USER
   [ $? -eq 0 ] && redis-cli -h ${SCC_REDIS_HOST} DEL $v
done

echo
echo
echo "Session is clear!"
echo
echo
