#!/usr/bin/env bash
###############################################################################
#
# version.sh
#
# 自动提取git commit的信息生成config/version.json
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2015-10-19    hc-romens@issue#224     自动更新version.json
#

cd ${SCC_ROOT}
VER="R1.0"
REV=`git log -1 | grep commit | sed 's/^commit //g' | cut -c 1-8`
PUBTIME=`git log -1 --date='iso' | grep "Date" | sed -e 's/^Date:   //g' -e 's/ +[0-9]*//g'`

VERFILE=${SCC_ROOT}/config/version.json

cat > ${VERFILE} << !EOF
{
    "version":"${VER}",
    "revision":"${REV}",
    "time":"${PUBTIME}"
}
!EOF


