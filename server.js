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
var DOMParser = require('xmldom').DOMParser;

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
    let imgType = imgName.substring(imgName.indexOf('.'));
    console.log(`imgType: ${imgType}`);
    
    tmp.file({postfix: imgType, keep: false, dir: "tmp"}, function _tempFileCreated(err, path, fd, cleanupCallback) {
    if (err) throw err;
    fs.writeFile(path, imgFile.data, function(err){      
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
          outputs.score = scoreSVG;
          
          // now compile
          var cutSVG = new DOMParser().parseFromString(cutSVG, 'text/svg');
          var scoreSVG + 
          var cutPaths = cutSVG.getElementsByTagName('path');
          var scorePaths = new DOMParser().parseFromString(scoreSVG, 'text/svg').getElementsByTagName('path');
          var paths = cutPaths + scorePaths;
          
          var width = new DOMParser().parseFromString(cutSVG, 'text/svg').getElementsByTagName('svg')[0].getAttribute('width');
          var height = new DOMParser().parseFromString(cutSVG, 'text/svg')[0].getAttribute('height');
          var compiledSVG = svgFromPath(paths, width, height);
          console.log(`compiledSVG: ${compiledSVG}`);
          outputs.compiled = compiledSVG;
          
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
  var subj = new DOMParser().parseFromString(full, 'text/svg');
  var clip = new DOMParser().parseFromString(cut, 'text/svg');
  
  var width = subj.getElementsByTagName('svg')[0].getAttribute('width');
  var height = subj.getElementsByTagName('svg')[0].getAttribute('height');
  
  // console.log(`full: ${full}`);
  // console.log('');
  // console.log(`cut: ${cut}`);
  
  // grab d element from path
  var subjD = subj.getElementsByTagName('path')[0].getAttribute('d'); // get path d
  var clipD = clip.getElementsByTagName('path')[0].getAttribute('d');
  
  var subjPaths = createPath(subjD);
  // console.log('got subject paths');
  var clipPaths = createPath(clipD);
  // console.log('got clip paths');
  
  ClipperLib.JS.ScaleUpPaths(subjPaths, scale);
  ClipperLib.JS.ScaleUpPaths(clipPaths, scale);
  var cpr = new ClipperLib.Clipper();
  cpr.AddPaths(subjPaths, ClipperLib.PolyType.ptSubject, true);
  cpr.AddPaths(clipPaths, ClipperLib.PolyType.ptClip, true);
  var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
  var clipTypes = [ClipperLib.ClipType.ctUnion, ClipperLib.ClipType.ctDifference, ClipperLib.ClipType.ctXor, ClipperLib.ClipType.ctIntersection];
  var clipType = ClipperLib.ClipType.ctDifference;
  var solution_paths = new ClipperLib.Paths();
  
  solution_paths = new ClipperLib.Paths();
  cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
  // console.log(JSON.stringify(solution_paths));

  var newSVGPathD = paths2string(solution_paths, scale);  
  console.log(`newSVGPathD: ${newSVGPathD}`);

  var newSVG = svgFromPath(newSVGPathD, width, height);
  console.log(`newSVG: ${newSVG}`);
    
  return newSVG;
}

// createPath 
// create polygon path from an SVG path to use with clipper.js
function createPath(svgPathD){
  var paths = new ClipperLib.Paths();
  // split svgPathD into arrays based on closed paths
  var indexes = getAllIndexes(svgPathD, "M");
  console.log(`indexes.length: ${JSON.stringify(indexes).length}`);
  
  var newSVGpathsD = [];
  for(i=0; i<indexes.length; i++){
    var subPath = "";
    if(i == 0){
      console.log('first index');
      subPath = svgPathD.substring(i, indexes[i+1]);
    }else if(i == indexes.length-1){
      // last path
      console.log('last index');
      subPath = svgPathD.substring(indexes[i]);
    }else{
      console.log(`substring ${indexes[i]} to ${indexes[i+1]}`);
      subPath = svgPathD.substring(indexes[i], indexes[i+1]);
    }
    // sometimes run into issue with the path not ending with Z - a quick fix here
    if(subPath.slice(-1) != "Z"){
      subPath = subPath.replaceAt(subPath.length-1, "Z");
    }
    console.log(`${i} subPath with length ${subPath.length} : ${subPath}`);
    console.log(`----------------------`);
    newSVGpathsD.push(subPath);
  }
  
  console.log(`newSVGpathsD: ${JSON.stringify(newSVGpathsD)}`);
  for(var x=0; x<newSVGpathsD.length; x++){
    console.log(`path creation loop ${x}`);
    var path = new ClipperLib.Path();
    
    // var properties = pathProperties.svgPathProperties(newSVGpathsD[x]);
    // var len = Math.round(properties.getTotalLength());
    var pts = point(newSVGpathsD[x]);
    var len = Math.round(pts.length());

    console.log(`path length ${len}`);
  
    for(var i=0; i<len; i++){
      var p = pts.at(i);
      // var p = properties.getPointAtLength(i);
      console.log(`${i} p ${JSON.stringify(p)}`);
      // path.push(new ClipperLib.IntPoint(p.x, p.y));
      path.push(new ClipperLib.IntPoint(p[0], p[1]));
    }
    console.log(`path: ${JSON.stringify(path)}`);
    console.log('');
    // add this array to paths
    paths.push(path);
  }
  console.log(`paths: ${JSON.stringify(paths)}`);

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
  var svg = `<svg width=${width} height=${height}>`;
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

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}
