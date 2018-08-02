// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

var tmp = require('tmp');
var fs = require('fs');
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');

var potrace = require('potrace');
var autotrace = require('autotrace');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.use(fileUpload());

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

app.post('/convertImg', function(req, res){
  if(!req.files) console.log('no files uploaded')
  else{
    let imgFile = req.files.file;
    let imgName = imgFile.name;
    console.log(`imgName: ${imgName}`);
    let imgType = imgName.substring(imgName.indexOf('.')+1);
    console.log(`imgType: ${imgType}`);
    
    tmp.file({postfix: imgType, keep: false, dir: "tmp"}, function _tempFileCreated(err, path, fd, cleanupCallback) {
    if (err) throw err;
    fs.writeFile(path, imgFile.data, function(err){
      console.log('wrote to file!');
      
      // convert to svg
      var params = {
        threshold: 120
      };
      
//       // potrace test https://github.com/tooolbox/node-potrace#readme
//       potrace.trace(path, function(err, svg){
//         if(err) throw err;
//         console.log(`svg: ${svg}`);
//         // return svg
//         res.send(svg);
         
//         cleanupCallback(); 
//       });
      
      // autotrace test https://www.npmjs.com/package/autotrace
      autotrace(path).outputFormat('svg').stream(function(err, stdout, stderr){
        var writeStream = fs.createWriteStream('tmp/out.svg');
        
        console.log(`stdout ${stdout}`);
        // res.send(stdout);
         
        cleanupCallback(); 
      });
  });
  });
  }
  
});
