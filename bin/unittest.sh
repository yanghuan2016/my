#!/bin/bash
###############################################################################
# go-developer.sh
#
# 执行单元测试的启动脚本
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2015-09-24   hc-romens@issue#6      新建文件
#

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

# traverse the folders
TESTCASES=`find ${SCC_ROOT} -name "test*.js" -not \( -path "${SCC_ROOT}/node_modules/*" \)`

# start test
for ts in ${TESTCASES}
do
    echo "testing the file: ${ts}"
    [ -f ${ts} ] && echo "Executing test case: ${ts}" && mocha ${ts} || break
done
