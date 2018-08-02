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
              $('#potraceOutput').empty();
              $('#potraceOutput').append(data);
          }
        });
    
    // run autotrace?
    
  }else{
    window.alert("Please upload a bitmap image (png, jpg, bmp)");
    $('#imgFile').val('');
  }
  
}