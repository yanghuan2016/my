#!/usr/bin/env python
# coding: utf8
# MysqlBakupScript
# BY yanghuan@romenscd.cn

import os
import sys
import datetime
import getopt
import re
import json

class DataImport():
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
    __IMPORT_COMMAND = __MYSQL_BIN + '/mysql'
    __FLUSH_LOG_COMMAND = __MYSQL_BIN + '/mysqladmin'
    __BINLOG_PATH = r'/var/lib/mysql'
    __LOGINARGS = ''
    __GREPWARING = r" | grep -v 'Warning: Using a password on the command line interface can be insecure'"

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
        print "-f/--full\tfor full import"
        print "-i/--increment\tfor increment import"
        print "-t/--time\t set time you want to restore"

    """
    导入数据
    """
    def dataImport(self,dbname,timepoint,isfull):
        if isfull == 1:
            print "import %s data sql" %(dbname)
            DataSqlPath = self.__HOLE_DIR + "/" + timepoint + "/" + dbname + "-data-" + timepoint + '.sql'
            os.popen(self.__IMPORT_COMMAND + self.__LOGINARGS + ' ' + dbname + '<' + DataSqlPath + self.__GREPWARING)
    """
    导入表结构
    """
    def tableSchemaImport(self,dbname,timepoint,isfull):
        if isfull == 1:
            print "import %s tableschema sql" % (dbname)
            SchemaSqlPath = self.__HOLE_DIR + '/' + timepoint + '/' + dbname + '-tableschema-' + timepoint + '.sql'
            os.popen(self.__IMPORT_COMMAND + self.__LOGINARGS + ' ' + dbname + '<' + SchemaSqlPath + self.__GREPWARING)

    """
    导入函数和存储过程
    """
    def funcImport(self,dbname,timepoint,isfull):
        if isfull == 1:
            print "import %s proc sql" % (dbname)
            FuncSqlPath = self.__HOLE_DIR + '/' + timepoint + '/' + dbname + '-proc-' + timepoint + '.sql'
            os.popen(self.__IMPORT_COMMAND + self.__LOGINARGS + ' ' + dbname + '<' + FuncSqlPath + self.__GREPWARING)

    """
    导入事件
    """
    def eventsImport(self,dbname,timepoint,isfull):
        if isfull == 1:
            print "import %s events sql" % (dbname)
            EventSqlPath = self.__HOLE_DIR + '/' + timepoint + '/' + dbname + '-events-' + timepoint + '.sql'
            os.popen(self.__IMPORT_COMMAND + self.__LOGINARGS + ' ' + dbname + '<' + EventSqlPath + self.__GREPWARING)

    """
    导入触发器
    """
    def triggersImport(self,dbname,timepoint,isfull):
        if isfull == 1:
            print "import %s triggers sql" % (dbname)
            triggersSqlPath = self.__HOLE_DIR + '/' + timepoint + '/' + dbname + '-triggers-' + timepoint + '.sql'
            os.popen(self.__IMPORT_COMMAND + self.__LOGINARGS + ' ' + dbname + '<' + triggersSqlPath + self.__GREPWARING)

    """
    恢复前先删除旧的数据库，重新新建
    """
    def dropCreateDatabase(self,dbname):
        dropDB = self.__IMPORT_COMMAND + self.__LOGINARGS + " -e '" + "DROP DATABASE IF EXISTS " + dbname + "'"
        createDB = self.__IMPORT_COMMAND + self.__LOGINARGS + " -e '" + "CREATE DATABASE IF NOT EXISTS " + dbname + " DEFAULT CHARSET utf8 COLLATE utf8_general_ci; '"
        os.popen(dropDB)
        os.popen(createDB)
    """
    获取所有CloudDB和CustomerDB数据库名
    """
    def getDBList(self):
        pattern = re.compile(r'C[lu][os][ut][do][Dm][Be][\w]{0,}')
        showDBSql = self.__MYSQL_BIN + '/mysql -u ' + self.__MYSQL_USERNAME + ' -p' + self.__MYSQL_PASS + ' -e ' + "'show databases;'"
        dbliststring = os.popen(showDBSql).read()
        dblist = pattern.findall(dbliststring)
        return dblist

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
        if not os.path.isfile(self.__IMPORT_COMMAND):
            sys.stderr.write('MYSQL IMPORT COMMAND [' + self.__IMPORT_COMMAND + '] IS NOT FOUND.\n')
            sys.exit(1)
        if not os.path.isfile(self.__FLUSH_LOG_COMMAND):
            sys.stderr.write('MYSQL FLUSH LOG COMMAND [' + self.__FLUSH_LOG_COMMAND + '] IS NOT FOUND.\n')
            sys.exit(1)
        if not self.DATABASE_LIST:
            sys.stderr.write('MYSQL DBNAME LIST IS NULL.\n')
            sys.exit(1)
    """
    获取最近一次全备份的时间
    """
    def getLatestDate(self,timepoint):
        dir_date = os.listdir(self.__HOLE_DIR)
        x_temp = 0
        temp = 100
        for x in dir_date:
            if abs(int(str(datetime.datetime.strptime(timepoint, '%Y-%m-%d') - datetime.datetime.strptime(x, '%Y-%m-%d')).split()[0])) < temp:
                temp = abs(int(str(datetime.datetime.strptime(timepoint, '%Y-%m-%d') - datetime.datetime.strptime(x, '%Y-%m-%d')).split()[0]))
                x_temp = x
        return x_temp
    """
    根据时间获取对应时间的binlog文件
    """
    def getBinlogFile(self,date_Temp):
        list_dirs = os.walk(self.__INCREMENT_DIR + '/' + date_Temp)
        for root, dirs, files in list_dirs:
            return files

    def incrementImport(self,dbname,timepoint,isincrement):
        if isincrement == 1:
            self.tableSchemaImport(dbname=dbname, timepoint=timepoint, isfull=1)
            self.dataImport(dbname=dbname,timepoint=timepoint,isfull=1)

            while datetime.datetime.strptime(timepoint, '%Y-%m-%d') + self.__ONE_DAY < datetime.datetime.strptime(str(self.__DATE_NOW) , '%Y-%m-%d'):
                sqlCommand = self.__IMPORT_COMMAND + " --start-datetime='" + timepoint + " 00:00:00' -d " + dbname + self.__INCREMENT_DIR + '/' + str(self.getBinlogFile(str(datetime.datetime.strptime(timepoint, '%Y-%m-%d') + self.__ONE_DAY)) + ' | mysql -uroot -p' + self.__MYSQL_PASS)
                #os.popen(sqlCommand)
                timepoint = str(datetime.datetime.strptime(timepoint, '%Y-%m-%d') + self.__ONE_DAY)



    """
    导入
    """
def db_import():
    isFull = 0
    isIncrement = 0
    import_time = 0
    dbimport = DataImport()
    options, remainder = getopt.getopt(sys.argv[1:], 't:d:ifh')
    for opt,args in options:
        if opt in ('-h', '--help'):
            dbimport.help()
        elif opt in ('-f', '--full'):
            isFull = 1
        elif opt in ('-i','-increment'):
            isIncrement = 1
        elif opt in ('-t','--time'):
            import_time = args


    #latesttime = dbimport.getLatestDate(timepoint=import_time)
    #print latesttime
    for dbn in dbimport.DATABASE_LIST:
        dbimport.dropCreateDatabase(dbname=dbn)
        dbimport.tableSchemaImport(dbname=dbn, timepoint=import_time, isfull=isFull)
        dbimport.dataImport(dbname=dbn,timepoint=import_time,isfull=isFull)
        dbimport.eventsImport(dbname=dbn,timepoint=import_time,isfull=isFull)
        dbimport.funcImport(dbname=dbn,timepoint=import_time,isfull=isFull)
        #dbimport.incrementImport(dbname=dbn,timepoint=latesttime,isincrement=isIncrement)


if __name__ == '__main__':
    db_import()