
module.exports = function() {
	var OrderedHashMap = require('ordered-hashmap');
 	var XLS = require('xlsx');
	var merge = require('merge');
	var objectMapper = require('object-mapper');
	var parser={
		parse:function*(path,jsonMappingPath){
			var data=yield this.readXLS(path);
			var fieldsMapping=require(jsonMappingPath);
			
			var keys=Object.getOwnPropertyNames(fieldsMapping);
			
			//init result object.(key:[])
			var result={};
			keys.forEach(function(key){
				result[key]=[];
			});
			
//			console.info(keys)
			for(var i=0;i<data.length;i++){
				var row=data[i]
				keys.forEach(function(key){
		
					var fields=fieldsMapping[key];
					
					var data = objectMapper(row, fields);
					result[key].push(data);
				});

		   	}
			
			return result;
			
		},
		readXLS:function*(path){
			
			var workbook = XLS.readFile(path);
			var sheet_name_list = workbook.SheetNames;
			var map = new OrderedHashMap();
			
			sheet_name_list.forEach(function(sheetName) { /* iterate through sheets */
			  var worksheet = workbook.Sheets[sheetName];
			  var columns={};

			  for (z in worksheet) {
			    if(z[0] === '!') continue;
			    var v=worksheet[z].v;
			  　　var row = z.match(/[0-9]+/g).toString();
			　　  var columnName = z.match(/([a-z]|[A-Z])+/g).toString();
				  if('1'===row.toString()){
					  //console.info(row+":> "+">"+z+":>"+JSON.stringify(v));
					  columns[columnName]=v.toString().toUpperCase();
					  
				  }else{
					  var key=columns[columnName];
					  var cell={};
					  cell[key]=v;
					  var rowData=map.get(row);
					  map.set(row,merge(rowData,cell))
				  }
			  }
			  
			});
			var data=map.values();
			return data;
		}
			
	}
	
	return parser;
       
}
