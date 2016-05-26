本目录下放置所有的自动化集成测试脚本。

按照功能分组命名



新增testDataBuyerInfo使用：创建分库测试数据
. bin/setenv.sh cd

db-init.sh 127.0.0.1    //创建本地CUSTOMER数据库

db-init.sh buyer    //创建buyer数据库


手动插入buyer数据库中的 tests/testDataBuyerInfo

 mysql -h cd -u root -promens@2015 CustomerDB_romens_buyer <tests/testDataBuyerInfo.sql

 备份数据库某张表
 mysqldump -h cd -u root -promens@2015 CustomerDB_dawei_sm_romenscd_cn QuotationDetails>QuotationDetailBak.sql
 恢复到数据库：
 mysql -h cd -u root -promens@2015 CustomerDB_dawei_127_0_0_1 < QuotationDetailBak.sql
