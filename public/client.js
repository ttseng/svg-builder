// client-side js
// run by the browser each time your view template is loaded

function uploadImage(){
  var fileName = $('#imgFile')[0].files[0].name;
  // console.log(`filename: ${fileName}`);
  var fileExt = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
  var validFiles = ["png", "jpg", "jpeg"
  
}