#!/usr/bin/env python
# coding: utf8
# MysqlBakupScript
# BY yanghuan@romenscd.cn

import os
import sys
import datetime
import linecache
import getopt
import re
import json

class DatabaseBackup():
    """
    定义mysql相关参数
    """
    DATABASE_LIST = []
    __MYSQL_BIN = r'/usr/bin'
    __MYSQL_HOST = ''
    __MYSQL_PORT = '3306'
    __MYSQL_USERNAME = ''
    __MYSQL_PASS = ''
    __ONE_DAY = datetime.timedelta(days=1)
    __DATE_NOW = datetime.date.today()
    __DATE_YES = __DATE_NOW -  __ONE_DAY
    __DATE_LAST = __DATE_NOW - (3 * __ONE_DAY)
    __HOLE_DIR = r'../mysqlbak/full'
    __INCREMENT_DIR = r'../mysqlbak/increment'
    __DUMP_COMMAND = __MYSQL_BIN + '/mysqldump'
    __FLUSH_LOG_COMMAND = __MYSQL_BIN + '/mysqladmin'
    __BINLOG_PATH = r'/var/lib/mysql'
    __LOGINARGS = ''

    def __init__(self):
        """从json配置文件读取数据连接信息"""
        json_data = open('../config/sysconfig.json').read()
        data = json.loads(json_data)
        self.__MYSQL_HOST = data['db']['host']
        self.__MYSQL_PASS = data['db']['password']
        self.__MYSQL_USERNAME = data['db']['user']

        self.__LOGINARGS = ' -h' + self.__MYSQL_HOST + ' -P' + str(self.__MYSQL_PORT) + ' -u' + self.__MYSQL_USERNAME + " --password='" + self.__MYSQL_PASS + "'"
        self.DATABASE_LIST = self.getDBList()
        self.checkDatabaseArgs()

    def help(self):
        print "Usage python [script_name]"
        print "-f/--full\tfor full backup"
        print "-b/--binlog\tfor binlog increment bakup"

    """
    导出表结构、存储过程、函数以及视图
    """
    def tableSchemaDump(self, dbname, isfull):
        if isfull == 1:
            os.popen(self.__DUMP_COMMAND + self.__LOGINARGS + ' --opt --skip-triggers --add-drop-table -d ' + dbname + '>' + self.__HOLE_DIR + '/' + str(self.__DATE_NOW) + '/' + dbname + '-tableschema-' + str(self.__DATE_NOW) + '.sql')
    def procDump(self, dbname, isfull):
        if isfull == 1:
            os.popen(self.__DUMP_COMMAND + self.__LOGINARGS + ' --routines --no-create-info --no-data --no-create-db --skip-opt --skip-triggers ' + dbname + '>' + self.__HOLE_DIR + '/' + str(self.__DATE_NOW) + '/' + dbname + '-proc-' + str(self.__DATE_NOW) + '.sql')
    def eventsDump(self, dbname, isfull):
        if isfull == 1:
            os.popen(self.__DUMP_COMMAND + self.__LOGINARGS + ' --events --no-create-info --no-data --no-create-db --skip-opt --skip-triggers ' + dbname + '>' + self.__HOLE_DIR + '/' + str(self.__DATE_NOW) + '/' + dbname + '-events-' + str(self.__DATE_NOW) + '.sql')
    def triggersDump(self, dbname, isfull):
        if isfull == 1:
            os.popen(self.__DUMP_COMMAND + self.__LOGINARGS + ' --triggers --no-create-info --no-data --no-create-db --skip-opt --add-drop-trigger ' + dbname + '>' + self.__HOLE_DIR + '/' + str(self.__DATE_NOW) + '/' + dbname + '-triggers-' + str(self.__DATE_NOW) + '.sql')

    """
    导出数据
    """
    def dataDump(self,dbname, isfull):
        if isfull == 1:
            os.popen(self.__DUMP_COMMAND + self.__LOGINARGS + ' --no-create-info --skip-triggers --add-drop-table ' + dbname + '>' + self.__HOLE_DIR + '/' + str(self.__DATE_NOW) + '/' + dbname + '-data-' + str(self.__DATE_NOW) + '.sql')

    """
    获取需要备份的binlog文件
    """
    def getBinlogFiles(self):
        if not os.path.isfile(self.__BINLOG_PATH + '/' + 'mysql-bin.index'):
            sys.stderr.write("There is no index file found.\n")
            sys.exit(1)
        else:
            try:
                __BINLOG_FILE = linecache.getline(self.__BINLOG_PATH + '/' + 'mysql-bin.index', len(open(self.__BINLOG_PATH + '/' + 'mysql-bin.index', 'r').readlines()) - 1)
                linecache.clearcache()
            except BaseException, e:
                sys.stderr.write(str(e))
                sys.exit(1)
            return __BINLOG_FILE.strip()
    """
    备份binlog
    """
    def backupBinlog(self, isbinlog):
        if isbinlog == 1:
            from shutil import copy2
            try:
                copy2(self.__BINLOG_PATH + str('/' + self.getBinlogFiles().split('/')[1].split('\n')[0]),self.__INCREMENT_DIR + '/' + str(self.__DATE_YES) + '/' + str(self.getBinlogFiles().split('/')[1].split('\n')[0]))
            except BaseException,e:
                sys.stderr.write(str(e))
    def getDBList(self):
        pattern = re.compile(r'C[lu][os][ut][do][Dm][Be][\w]{0,}')
        showDBSql = self.__MYSQL_BIN + '/mysql -u ' + self.__MYSQL_USERNAME + ' -p' + self.__MYSQL_PASS + ' -e ' + "'show databases;'"
        dbliststring = os.popen(showDBSql ).read()
        dblist = pattern.findall(dbliststring)
        return dblist
    """
    定义mysql参数检查函数
    """
    def checkDatabaseArgs(self):
        if not os.path.isdir(self.__HOLE_DIR + '/' + str(self.__DATE_NOW)):
            sys.stderr.write('MYSQL FULL BACKUP DIR:['+ self.__HOLE_DIR + '/' + str(self.__DATE_NOW) + ']is not exist. Auto created\n')
            os.makedirs(self.__HOLE_DIR + '/' + str(self.__DATE_NOW))
        if not os.path.isdir(self.__INCREMENT_DIR + '/' + str(self.__DATE_YES)):
            sys.stderr.write('MYSQL BINLOG BACKUP DIR:[' + self.__HOLE_DIR + ']is not exist. Auto created\n')
            os.makedirs(self.__INCREMENT_DIR + '/' + str(self.__DATE_YES))
        if not os.path.isdir(self.__INCREMENT_DIR):
            sys.stderr.write('MYSQL INCREMENT BACKUP DIR:[' + self.__INCREMENT_DIR + ']is not exist. Auto created\n')
            os.makedirs(self.__INCREMENT_DIR)
        if not os.path.isfile(self.__DUMP_COMMAND):
            sys.stderr.write('MYSQL DUMP COMMAND [' + self.__DUMP_COMMAND + '] IS NOT FOUND.\n')
            sys.exit(1)
        if not os.path.isfile(self.__FLUSH_LOG_COMMAND):
            sys.stderr.write('MYSQL FLUSH LOG COMMAND [' + self.__FLUSH_LOG_COMMAND + '] IS NOT FOUND.\n')
            sys.exit(1)
        if not self.DATABASE_LIST:
            sys.stderr.write('MYSQL DBNAME LIST IS NULL.\n')
            sys.exit(1)


def backup():
    isBinlog = 0
    isFull = 0
    dbback = DatabaseBackup()
    options,remainder = getopt.getopt(sys.argv[1:],'bfh')
    """
    处理命令行参数
    """
    for opt, arg in options:
        if opt in ('-f', '--full'):
            isFull = 1
        elif opt in ('-b', '--binlog'):
            isBinlog = 1
        elif opt in ('-h', '--help'):
            dbback.help()
            sys.exit(1)

    for dbn in dbback.DATABASE_LIST:
        dbback.dataDump(dbname=dbn,isfull=isFull)
        dbback.tableSchemaDump(dbname=dbn, isfull=isFull)
        dbback.procDump(dbname=dbn, isfull=isFull)
        dbback.eventsDump(dbname=dbn, isfull=isFull)
        dbback.triggersDump(dbname=dbn, isfull=isFull)
    dbback.backupBinlog(isbinlog=isBinlog)


if __name__ == '__main__':
        backup()

