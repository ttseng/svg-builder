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
const read = require('svg-reader');

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

app.post('/potraceImg', function(req, res){
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
      
      var outputs = {};
      
      var orig_params = {};
      
      var cut_params = {
        turdSize: 25
      };
      
      // // convert to svg
    
      
      // first create original path
      // potrace test https://github.com/tooolbox/node-potrace#readme
      potrace.trace(path, orig_params, function(err, fullSVG){
        if(err) throw err;
        console.log(`fullSVG: ${fullSVG}`);
        outputs.full = fullSVG;
        
        // next, create cut paths only
        potrace.trace(path, cut_params, function(err, cutSVG){
          if(err) throw err;
          outputs.cut = cutSVG;         
          
          // now take the diff
          
          // return svg
          res.send(outputs);
         
          cleanupCallback(); 
        });
        
      });
      
//       var outPath = 'tmp/out.svg';
      
//       autotrace(path, {
//         outputFile: outPath
//       }, function(err, buffer) {
//         if (!err) console.log('done');
//       });
  });
  });
  }
});
