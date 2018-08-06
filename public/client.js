// client-side js
// run by the browser each time your view template is loaded

function uploadImage(){
  var fileName = $('#imgFile')[0].files[0].name;
  // console.log(`filename: ${fileName}`);
  var fileExt = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
  var validFiles = ["png", "jpg", "jpeg", "bmp"];
  if (validFiles.includes(fileExt)){
    var formData = new FormData();
    formData.append('file', $('#imgFile')[0].files[0]);
    
    // run potrace on image
     $.ajax({
            type: 'POST',
            url: '/potraceImg',
            data: formData,
            contentType: false,
            processData: false,
            async: false,
            cache: false,
            success: function(data){
              console.log(data);
              $('#potraceOutput .full .container').html(data.full);
              $('#potraceOutput .cut .container').html(data.cut);
              $('#potraceOutput .score .container').html(data.score);
              $('#potraceOutput .compiled .container').html(data.compiled);
              
              // compile svgs
              // var compiledSVG = compileSVG();
              // $('#potraceOutput .compiled .contianer').html(compiledSVG).fadeIN();
          }
        });
    
    // run autotrace?
    
  }else{
    window.alert("Please upload a bitmap image (png, jpg, bmp)");
    $('#imgFile').val('');
  }
  
}

// compileSVG()
// combines cut and score paths into a single SVG
function compileSVG(){
  var width = $('svg').first()[0].getAttribute('width');
  var height = $('svg').first()[0].getAttribute('height');
  var cutPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  cutPath.setAttribute('d', $('.cut svg').find('path')[0].getAttribute('d'));
  cutPath.setAttribute('class', 'cut');
  
  var scorePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  cutPath.setAttribute('d', $('.score svg').find('path')[0].getAttribute('d'));
  cutPath.setAttribute('class', 'score');
  
  var svg = `<svg width=${width} height=${height}>`;
  svg += cutPath;
  svg += scorePath;
  svg += '</svg>';
  return svg;
}

// ImageTracer.imageToSVG(
//   'https://cdn.glitch.com/a953a0b7-25df-4ce8-a9fd-541788b8c091%2Fsample.png?1533231943459', 
//   function(svgstr){
//     console.log(svgstr),
//       `posterized2`
//   }
//   );