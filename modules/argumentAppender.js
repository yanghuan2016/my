module.exports = function() {
	var env = require('node-env-file');
	var appender={
		append:function(src,req){
			var dbsuffix=process.env.dbsuffix;
			if(dbsuffix){
				
			}else{
				
			}
			var user=req.user;
			var dbName=user['DBNAME'];
			src['DBNAME']=dbName;
			
			src['CUSTOMERDBNAME']=dbName;
			src['CLOUDDBNAME']=dbName;
			
			return src;
		}
	}
	
	return appender;
	
}