// Code goes here
function printPdf(){
  
  var doc = new jsPDF();
  
  doc.fromHTML(document.getElementById('printDiv'), 20, 20, {
    'width': 1000
  });
  
  doc.save('Test.pdf');
}
