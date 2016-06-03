#!/usr/bin/env bash
###############################################################################
# mysqlrecover.sh
#
# 用于mysql全量和增量恢复
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2016-06-02      yanghuan@romenscd.cn         创建文件
###############################################################################

ulimit -n 65530
TODAY=`date +%Y-%m-%d`
INCDIR="/var/data/mysqlback/inc"
FULLDIR="/var/data/mysqlback/full/"
FULLBACKDIR="/var/data/mysqlback/full/$TODAY"
INCREMENTDIR="/var/data/mysqlback/inc/$TODAY"
BACKUSER="root"
BACKPASSWD="password"
MYSQLCNF="/etc/mysql/my.cnf"
FILEPASSWORD="password"
INDEXFILE="/var/data/mysqlback/index"
FULL=0
INCREMENTAL=0
INITTIME="1980-01-01"
filename=""
RECOVERTMPDIR="/tmp/mysqlRecTmp"
INCTMPNUM=0
DATADIR=`cat $MYSQLCNF | grep datadir | awk -F "=" '{print $2}'`

help() {

    echo
    echo "mysql恢复工具:"
    echo "----------------------------------------------"
    echo "   `basename $0` <options>"
    echo "      -h      help"
    echo
}

while getopts "h" arg
do
    case $arg in
        h)
            help
            exit 2
            ;;
        ?)
            help
            exit 2
            ;;
    esac
done

dirCheck() {
	if [ ! -d $1 ]
	then
		mkdir -p $1
	fi
}

writeIndex() {
    cat << EOF >> $INDEXFILE
{time:$1,   type:$2,    issucess:$3}
EOF
}

getLastFullTime() {
    for lastFull in `ls ${FULLDIR}`
    do
        t1=`date -d "$INITTIME" +%s`
        t2=`date -d "$lastFull" +%s`
        if [ "$t1" -gt "$t2" ]
        then
            INITTIME=$INITTIME
        elif [ "$t1" -eq "$t2" ]
        then
            INITTIME=$INITTIME
        else
            INITTIME=$lastFull
        fi
    done
}

untarFullFile() {
	dirCheck $RECOVERTMPDIR/full
	filename=`ls $FULLDIR$INITTIME | grep romens`
	dd if=$FULLDIR$INITTIME/$filename |openssl des3 -d -k $FILEPASSWORD |tar xvzf - -C $RECOVERTMPDIR/full
}

untarIncFile() {
	dirCheck $RECOVERTMPDIR/inc
	for i in {0..6}
	do
		start=`date -d $INITTIME +%s`
		now=`expr $start + $i \* 86400`
		dir=`date +%Y-%m-%d -d @$now`
		if [ -d $INCDIR/$dir ]
		then
			count=`ls $INCDIR/$dir | wc -l`
			for j in $(seq 1 $count)
			do
				let INCTMPNUM=INCTMPNUM+1
				dirCheck $RECOVERTMPDIR/inc/$INCTMPNUM
				filename=`ls $INCDIR/$dir/$j | grep romens`
				dd if=$INCDIR/$dir/$j/$filename | openssl des3 -d -k $FILEPASSWORD |tar xvzf - -C $INCDIR/$dir/$j/
				sleep 2
				cp -R $INCDIR/$dir/$j/$j/* $RECOVERTMPDIR/inc/$INCTMPNUM
				rm -rf $INCDIR/$dir/$j/$j
			done
		fi
	done
	filename=`ls $FULLDIR$INITTIME | grep romens`
}
preparIncBak() {
	for INCDIR in $(seq 1 $INCTMPNUM)
	do
		innobackupex --apply-log --redo-only $RECOVERTMPDIR/full/$INITTIME --incremental-dir=$RECOVERTMPDIR/inc/$INCDIR
		issucess=$?
		time_now=`date +%Y-%m-%d_%H-%M-%S`
		if [ $issucess -ne 0 ]
		then
			echo "准备增量恢复发生错误!"
			writeIndex $time_now increcpre No
			exit 1
		else
			writeIndex $time_now increcpre Yes
		fi
	done
}

preparFullBak() {
	time_now=`date +%Y-%m-%d_%H-%M-%S`
	innobackupex --apply-log --redo-only $RECOVERTMPDIR/full/$INITTIME
	if [ $? -eq 0 ]
	then
		writeIndex $time_now fullrecpre Yes
		untarIncFile
		preparIncBak
	else
		echo "准备全量恢复发生错误!"
		writeIndex $time_now fullrecpre No
		exit 2
	fi
}

recoverDB() {
	service mysql stop
	mkdir -p /tmp/mysqlbak
	mv $DATADIR /tmp/mysqlbak
	mkdir -p $DATADIR
	innobackupex --apply-log $RECOVERTMPDIR/full/$INITTIME
	innobackupex --copy-back $RECOVERTMPDIR/full/$INITTIME
	chown -R mysql.mysql $DATADIR
	service mysql start
	echo "清理临时目录..."
	rm -rf $RECOVERTMPDIR/*
	echo "恢复完成，请检查数据完整性，若无问题，请删除/tmp/mysqlbak临时备份文件!"
}

getLastFullTime
untarFullFile
preparFullBak
recoverDB

