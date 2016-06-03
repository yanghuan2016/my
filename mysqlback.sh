#!/usr/bin/env bash
###############################################################################
# mysqlback.sh
#
# 用于mysql全量和增量备份
#
# 修订历史：
# -----------------------------------------------------------------------------
# 2016-05-16      yanghuan@romenscd.cn         创建文件
###############################################################################

source /etc/profile
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
BACKHOST="remote host"
BACKPORT="22"
BACKHOSTUSER="yh"
LOGFILE="/tmp/mysqlback.log"
INDEXFILE="/var/data/mysqlback/index"
FULL=0
INCREMENTAL=0
INITTIME="1980-01-01"
filename=""

help() {

    echo
    echo "mysql备份工具:"
    echo "----------------------------------------------"
    echo "   `basename $0` <options>"
    echo "      -h      help"
    echo "      -f      全备份"
    echo "      -i      增量备份"
    echo "      -n      为当前主机指定一个名称"
    echo
}

while getopts "n:hfi" arg
do
    case $arg in
        h)
            help
            exit 2
            ;;
        f)
            FULL=1
            ;;
        i)
            INCREMENTAL=1
            ;;
        n)
            NAMESUBFIX=$OPTARG
            ;;
        ?)
            help
            exit 2
            ;;
    esac
done

checkBin() {
    which innobackupex
    if [ $? -ne 0 ]
    then
        sudo apt-get install percona-xtrabackup
        if [ $? -ne 0 ]
        then
            echo "install xtrabackup failed"
            exit 1
        fi
    fi
}

checkFullDir() {
    if [ ! -d $FULLBACKDIR ]
    then
        echo "Dir ${FULLBACKDIR} is not exist,creating it!"
        mkdir -p $FULLBACKDIR
    fi
}

checkIncrementalDir() {
    if [ ! -d $INCREMENTDIR ]
    then
        echo "Dir ${INCREMENTDIR} is not exist,creating it!"
        mkdir -p $INCREMENTDIR
    fi
}

checkLogFile() {
    if [ ! -f $1 ]
    then
        touch $1
    fi
}

writeIndex() {
    cat << EOF >> $INDEXFILE
{time:$1,   type:$2,    issucess:$3}
EOF
}
tarFile() {
    pwd
    if [ $2 -eq 1 ]
    then
        filename=`date +"%Y-%m-%d"`_${NAMESUBFIX}_FULL
    else
        filename=`date +"%Y-%m-%d"`_${NAMESUBFIX}_INC_$1
    fi
    sudo tar cvzf - $1 | sudo openssl des3 -salt -k $FILEPASSWORD | sudo dd of=$filename.romens
    sudo mv $filename.romens ../
}

fullBack() {
    checkLogFile ${INDEXFILE}
    checkLogFile ${LOGFILE}
    #checkFullDir
    sudo innobackupex --defaults-file=$MYSQLCNF --user=$BACKUSER --password=$BACKPASSWD $FULLBACKDIR --no-timestamp >> $LOGFILE
    time_now=`date +%Y-%m-%d_%H-%M-%S`
    if [ $? -eq 0 ]
    then
        echo "Full backup success!"
        writeIndex ${time_now} full Yes
    else
        echo "Full backup failed！"
        writeIndex ${time_now} full No
    fi
}

incrementalBack() {
    checkLogFile ${INDEXFILE}
    checkLogFile ${LOGFILE}
    checkIncrementalDir
    countPre=`ls ${INCREMENTDIR} | wc -l`
    countNext=$(($countPre+1))
    getLastFullTime
    time_now=`date +%Y-%m-%d_%H-%M-%S`
    if [ $countPre -eq 0 ]
    then
        sudo innobackupex --defaults-file=$MYSQLCNF --user=$BACKUSER --password=$BACKPASSWD --incremental --no-timestamp --incremental-basedir=$FULLDIR/$INITTIME $INCREMENTDIR/$countNext 2>&1 >> $LOGFILE
        echo $time_now
        if [ $? -eq 0 ]
        then
            echo "Incremental backup success!"
            writeIndex ${time_now} inc Yes
        else
            echo "Incremental backup failed！"
            writeIndex ${time_now} inc No
        fi
    else
        sudo innobackupex --defaults-file=$MYSQLCNF --user=$BACKUSER --password=$BACKPASSWD --incremental --no-timestamp --incremental-basedir=$INCREMENTDIR/$countPre $INCREMENTDIR/$countNext 2>&1 >> $LOGFILE
        if [ $? -eq 0 ]
        then
            echo "Incremental backup success!"
            writeIndex ${time_now} inc Yes
        else
            echo "Incremental backup failed！"
            writeIndex ${time_now} inc No
        fi
    fi
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

uploadFile() {
    cd $1
    tarFile $2 $3
    cd ../
    sudo scp -P $BACKPORT  $filename.romens $BACKHOSTUSER@$BACKHOST:~/mysqlbak
    if [ $3 -eq 1 ]
    then
        checkFullPointFile $filename.romens
    else
        checkIncPointFile $filename.romens
    fi
}

checkFullPointFile() {
    if [ -f $FULLDIR/$TODAY/xtrabackup_checkpoints ]
    then
        for i in `ls $FULLDIR$TODAY/ | grep -v "xtrabackup*"`
        do
           rm -rf $FULLDIR$TODAY/$i
        done
        mv $1 $FULLDIR/$TODAY/
    fi
}

checkIncPointFile() {
    if [ -f $INCREMENTDIR/$countNext/xtrabackup_checkpoints ]
    then
        for i in `ls $INCREMENTDIR/$countNext/ | grep -v "xtrabackup*"`
        do
            rm -rf $INCREMENTDIR/$countNext/$i
        done
        mv $1 $INCREMENTDIR/$countNext/
    fi
}

checkName() {
    if [ "$NAMESUBFIX" = "" ]
    then
        echo "You must set a name 'ex:mysqlback.sh -i -n myhost'"
        exit 3
    fi
}

checkName
if [ $FULL -eq 1 ]
then
    fullBack
    uploadFile $FULLDIR $TODAY 1
elif [ $INCREMENTAL -eq 1 ]
then
    incrementalBack
    uploadFile $INCREMENTDIR $countNext 0
fi
