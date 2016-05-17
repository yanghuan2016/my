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

TODAY=`date +%Y-%m-%d`
INCDIR="/var/data/mysqlback/inc"
FULLDIR="/var/data/mysqlback/full/"
FULLBACKDIR="/var/data/mysqlback/full/$TODAY"
INCREMENTDIR="/var/data/mysqlback/inc/$TODAY"
BACKUSER="root"
BACKPASSWD="romens@2015"
MYSQLCNF="/etc/my.cnf"
FILEPASSWORD="romens@2016"
BACKHOST="cd"
BACKPORT="22"
BACKHOSTUSER="yh"
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
    #checkFullDir
    sudo innobackupex --defaults-file=$MYSQLCNF --user=$BACKUSER --password=$BACKPASSWD $FULLBACKDIR --no-timestamp
    if [ $? -eq 0 ]
    then
        echo "Full backup success!"
    else
        echo "Full backup failed！"
    fi
}

incrementalBack() {
    checkIncrementalDir
    countPre=`ls ${INCREMENTDIR} | wc -l`
    countNext=$(($countPre+1))
    getLastFullTime
    if [ $countPre -eq 0 ]
    then
        sudo innobackupex --defaults-file=$MYSQLCNF --user=$BACKUSER --password=$BACKPASSWD --incremental --no-timestamp --incremental-basedir=$FULLDIR/$INITTIME $INCREMENTDIR/$countNext
        if [ $? -eq 0 ]
        then
            echo "Incremental backup success!"
        else
            echo "Incremental backup failed！"
        fi
    else
        sudo innobackupex --defaults-file=$MYSQLCNF --user=$BACKUSER --password=$BACKPASSWD --incremental --no-timestamp --incremental-basedir=$INCREMENTDIR/$countPre $INCREMENTDIR/$countNext
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
    sudo scp -P $BACKPORT  $filename.romens $BACKHOSTUSER@$BACKHOST:~/
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
