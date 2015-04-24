var fs = require('fs');
var path = require('path');


var filePath = path.join(__dirname, '2010.csv');

var f = fs.readFileSync(filePath, {encoding: 'utf-8'}, 
    function(err){console.log(err);});

f = f.split("\r");
headers = f.shift().split(",");
var json = [];

f.forEach(function(d){
    tmp = {}
    row = d.split(",")
    for(var i = 0; i < headers.length; i++){
        tmp[headers[i]] = row[i];
    }
    json.push(tmp);
});


var outPath = path.join(__dirname, '2010.json');
fs.writeFileSync(outPath, JSON.stringify(json), 'utf8', function(err){
    console.log(err); 
})
