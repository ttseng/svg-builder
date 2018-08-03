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

const ClipperLib = require('clipper-lib');
var point = require('point-at-length');

var scale = 100;

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
        outputs.full = fullSVG;
        
        // next, create cut paths only
        potrace.trace(path, cut_params, function(err, cutSVG){
          if(err) throw err;
          outputs.cut = cutSVG;         
          
          // now take the diff
          var scoreSVG = getScoreSVG(outputs.full, outputs.cut);
          outputs.scoreSVG = scoreSVG;
          
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

// takes the difference between the full svg and cut svg to get just the score lines
function getScoreSVG(full, cut){
  var width = 700;
  var height = 700; // for now hardcode dimensions
  console.log(`full: ${full}`);
  console.log('');
  console.log(`cut: ${cut}`);
  var subjPaths = createPath(full);
  console.log('got subject paths');
  var clipPaths = createPath(cut);
  console.log('got clip paths');
  
  var clipOutput = {}; // store clip information
  ClipperLib.JS.ScaleUpPaths(subjPaths, scale);
  ClipperLib.JS.ScaleUpPaths(clipPaths, scale);
  var cpr = new ClipperLib.Clipper();
  cpr.AddPaths(subjPaths, ClipperLib.PolyType.ptSubject, true);
  cpr.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true);
  var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clipTypes = [ClipperLib.ClipType.ctUnion, ClipperLib.ClipType.ctDifference, ClipperLib.ClipType.ctXor, ClipperLib.ClipType.ctIntersection];
  var clipTypesString = ["union", "difference", "xor", "intersection"];
  var solution_paths = new ClipperLib.Paths();
  
  for(var i = 0; i < clipTypes.length; i++) {
    solution_paths = new ClipperLib.Paths();
    cpr.Execute(clipTypes[i], solution_paths, subject_fillType, clip_fillType);
    // console.log(JSON.stringify(solution_paths));
    
    var newSVGPathD = paths2string(solution_paths, scale);  
    console.log(`newSVGPathD: ${newSVGPathD}`);
    
    var newSVG = svgFromPath(newSVGPathD, width, height);
    console.log(`newSVG: ${newSVG}`);
    
    clipOutput[clipTypesString[i]] = newSVG;
  }
  console.log(`clipOutput: ${JSON.stringify(clipOutput)}`);
  return clipOutput;
}

// createPath 
// create polygon path from an SVG path to use with clipper.js
function createPath(svgPathD){
  var paths = new ClipperLib.Paths();
  var path = new ClipperLib.Path();
  var pts = point(svgPathD);
  var len = Math.round(pts.length());
  
  for(var i=0; i<len; i++){
      var p = pts.at(i);
    console.log(`${i} with p ${p[0]} ${p[1]}`);
      path.push(new ClipperLib.IntPoint(p[0], p[1]));
    }
    paths.push(path);

  return paths;
}

// path2strings
// takes paths from clipper.js and converts them to svg paths
function paths2string (paths, scale) {
  var svgpath = "", i, j;
  if (!scale) scale = 1;
  for(i = 0; i < paths.length; i++) {
    for(j = 0; j < paths[i].length; j++){
      if (!j) svgpath += "M";
      else svgpath += "L";
      svgpath += (paths[i][j].X / scale) + ", " + (paths[i][j].Y / scale);
    }
    svgpath += "Z";
  }
  // if (svgpath=="") svgpath = "M0,0";
  return svgpath;
}

// svgFromPath(path)
// create an SVG from a given path
function svgFromPath(path, width, height){
  var svg = `<svg style="background-color:#e7e7e7" width=${width} height=${height}>`;
  svg += '<path stroke="black" fill="yellow" stroke-width="2" d="' + path + '"/>';
  svg += '</svg>';
  return svg;
}

// getAllIndexes
// find indexes of all occurences of val within a string
function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i] === val)
            indexes.push(i);
    return indexes;
}

