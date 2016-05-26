#!/bin/bash
###############################################################################
# clear-redis.sh
#
# 清除所有redis缓存
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
    REDIS_DB=0
else
    REDIS_DB=$1
fi

TEMPFILE=/tmp/$$.keys

cat << !EOF
SELECT $REDIS_DB
KEYS \*
!EOF | redis-cli -h ${SCC_REDIS_HOST} | grep -v 'OK' > $TEMPFILE

keys=`cat $TEMPFILE`

for k in $keys 
do
cat << !EOF
SELECT ${REDIS_DB}
DEL $k
!EOF | redis-cli -h ${SCC_REDIS_HOST} | grep -v 'OK'
done

rm -f ${TEMPFILE}

echo
echo
echo "Session is clear!"
echo
echo
