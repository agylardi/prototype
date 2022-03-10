(function($) {

  $.fn.SimplePriceCalc= function (options) {
  
   // Default options for text
	  
		var settings = $.extend({		
		totallabel: "Total:",
		detailslabel: "Details:",
		currency:"$"		
		}, options );

// Initialize Variables

	var total=0;
	var child=this.find('*'); 
    var formdropdowns=this.find('select');
	
	//Built in function that can be called outside of script to update total
	this.updatetotal = function(){ setTimeout(function() {
			UpdateTotal();
		}, 100);};
	
	
	this.addClass("simple-price-calc");	
	InitialUpdate();	
	
   // Change select data cost on each change to current selected value
   
	formdropdowns.change( function() {
		if($(this).attr('multiple')) {
			var selectedOptions = $(this).find(':selected');
			var selectedOptionstotal=0;
			if (selectedOptions != '')
			{
				selectedOptions.each( function() {
					selectedOptionstotal += $(this).data('price');				
				});
			}
			$(this).attr('data-total',selectedOptionstotal);
		}
		else{		
		var selectedOption = $(this).find(':selected');
		if($(this).data('mult') >= 0) 
		      $("#simple-price-total label").attr('data-mult',selectedOption.val()); 
		else 
			$(this).attr('data-total',selectedOption.data('price')) ;					
		}		
		UpdateTotal();
	});
	
	//Update total when user inputs or changes data from input box
	
	$(".simple-price-calc input[type=text]").change( function() {
	
		if($(this).attr('data-price') || $(this).attr('data-mult')) {
	
		var userinput= $(this).val();
		if($.isNumeric(userinput)) { var usernumber = parseFloat(userinput);} else if(userinput != '') { alert('Please enter a valid number'); var usernumber = 1; } else { usernumber = 1; }
		var multiple=parseFloat($(this).data('mult')) || 0;
		var pricecost=parseFloat($(this).data('price')) || 0;
		var percentage=$(this).data('prcnt') || 1;
	
		if($.isNumeric(pricecost) && pricecost !=0) {
			var updpricecost=pricecost * usernumber;
			$(this).attr('data-total', updpricecost);
		}
	
		if(multiple && multiple !=0) {    	
			$("#simple-price-total label").attr('data-mult',usernumber);
		}
			
		}
		
		UpdateTotal();
	
	});
	
	$(".simple-price-calc input[type=checkbox]").change( function() {
	
		if($(this).is(':checked')) {
			var checkboxval= $(this).val();
			if($.isNumeric(checkboxval)) {				
				$(this).attr('data-total', checkboxval);				
			}
			else {
				$(this).attr('data-total', 0);
			}
		}					
        else {
			$(this).attr('data-total', 0);
		}		
		
	UpdateTotal();
	
	});
	
		$(".simple-price-calc input[type=radio]").change( function() {
			$(".simple-price-calc input[type=radio]").each( function() {
				if($(this).is(':checked')) {
					var radioval= $(this).val();
					if($.isNumeric(radioval)) {				
						$(this).attr('data-total', radioval);
					}
					else {
						$(this).attr('data-total', 0);
					}
				}					
				else {
					$(this).attr('data-total', 0);
				}		
			});	
		UpdateTotal();
	
		});
	
	
	
	//Initialize all fields if data is there
	
	function InitialUpdate() {
	
		formdropdowns.each( function() {
		    if($(this).attr('multiple')) {
			    var selectedOptions = $(this).find(':selected');
			    var selectedOptionstotal=0;
			    if (selectedOptions != ''){
					selectedOptions.each( function() {
						selectedOptionstotal += $(this).data('price');				
					});
				}
				$(this).attr('data-total',selectedOptionstotal);
			}
		    else{		
				var selectedOption = $(this).find(':selected');
				$(this).attr('data-total',selectedOption.data('price')) ;					
			}		
		});
	
     	//Update total when user inputs or changes data from input box
	
		$(".simple-price-calc input[type=text]").each( function() {
			if($(this).attr('data-price') || $(this).attr('data-mult')) {
				var userinput= $(this).val();
				if($.isNumeric(userinput)) { var usernumber = parseFloat(userinput);} else if(userinput != '') { alert('Please enter a valid number'); var usernumber = 1;} else { usernumber = 1; }
				var multiple=parseFloat($(this).data('mult')) || 0;
				var pricecost=parseFloat($(this).data('price')) || 0;
				var percentage=$(this).data('prcnt') || 1;
		
				if($.isNumeric(pricecost) && pricecost !=0) {
					var updpricecost=pricecost * usernumber;
					$(this).attr('data-total', updpricecost);
				}

				if(multiple && multiple !=0) {    	
					$("#simple-price-total label").attr('data-mult',usernumber);
				}			
			}
		});
	
		$(".simple-price-calc input[type=checkbox]").each( function() {
			if($(this).is(':checked')) {
				var checkboxval= $(this).val();
				if($.isNumeric(checkboxval)) {				
					$(this).attr('data-total', checkboxval);
				}
				else {
					$(this).attr('data-total', 0);
				}
			}					
			else {
				$(this).attr('data-total', 0);
			}					
		});
	
		
		$(".simple-price-calc input[type=radio]").each( function() {
			if($(this).is(':checked')) {
				var radioval= $(this).val();
				if($.isNumeric(radioval)) {				
					$(this).attr('data-total', radioval);
				}
				else {
					$(this).attr('data-total', 0);
				}
			}					
			else {
				$(this).attr('data-total', 0);
			}		
		});

		$(".simple-price-calc input[type=hidden]").each( function() {
			if($(this).attr('data-price')) {
				var hiddeninputval= $(this).attr('data-price');																	
				if($.isNumeric(hiddeninputval) && hiddeninputval !=0) {				
					$(this).attr('data-total', hiddeninputval);
				}				
			}
		});			
			
		UpdateTotal();
	
	}
	
		//Change value of total field by adding all data totals in form
	
	function UpdateTotal() {
		
		total=0;
		totalmult=$(".simple-price-calc #simple-price-total label").attr("data-mult");
		multids = [];
			
		//For each input with data-merge attr, take merge ids value and multiply by current data-price	
		$("input[data-merge]").each(function(){
			var ids=$(this).data('merge');
			var ids=ids.split(',');
			var arraytotals=1;			
			$.each(ids, function(key,value) {
				var inputid =$("#"+value);				
				if( (inputid.attr('type') == 'checkbox' || inputid.attr('type') == 'radio')  && inputid.is(':checked') )
					arraytotals*=$("#"+value).val(); 
				else if (inputid.attr('type') == 'text') 
					arraytotals*=$("#"+value).val();
				else if (inputid.prop('nodeName') == "SELECT")
					arraytotals*=$("#"+value).find(':selected').val();
				});
			var idtotal=arraytotals;
			if($.isNumeric(idtotal)) {					
				var pricecost=parseFloat($(this).data('price')) || 0;
				$(this).val(idtotal);
				var updpricecost= pricecost * parseFloat($(this).val());
				$(this).attr('data-total',updpricecost);						
			}
		});				
		
		// For each item with data-mult-ids attribute, take each id with value and add back into total
		$("[data-mult-ids]").each(function(){			
			var ids=$(this).data('mult-ids');			
			var ids=ids.split(',');			
			var arraytotals=0;		

			multids = ids;
			
			$.each(ids, function(key,value) {												
				var inputid =$("#"+value);				
				if( (inputid.attr('type') == 'checkbox' || inputid.attr('type') == 'radio')  && inputid.is(':checked') )
					arraytotals+=parseFloat($("#"+value).val()); 
				else if (inputid.attr('type') == 'text') 
					arraytotals+=parseFloat($("#"+value).val());
				else if (inputid.prop('nodeName') == "SELECT")
					arraytotals+=parseFloat($("#"+value).find(':selected').val());							
				});
			var idtotal=arraytotals;
			var currmultiple = parseFloat($(this).val());
			
			if($.isNumeric(idtotal)) {											
				
				if(!$.isNumeric(currmultiple))
					currmultiple = 0;				
				else if(currmultiple == 0)
					currmultiple = -1;
				else
					currmultiple -= 1;
				
				var idtotalmult = idtotal * currmultiple;
				$(this).attr('data-total',idtotalmult);						
			}
		});
				
		
		child.each(function () {				
				itemcost= 	$(this).attr("data-total") || 0;
				total += parseFloat(itemcost);			
		});

		
	    if(totalmult) { total = total * parseFloat(totalmult); }
		$(".simple-price-calc #simple-price-total label").html(settings.currency+$.number(total,2));		
		
		setTimeout(function() {
			UpdateDescriptions();
		}, 100);
		
		
	}
	
	//Update Field Labels and Pricing	
		
	function UpdateDescriptions() {				
		
		var selectedformvalues= [];
		var currtag='';
		
		$(".simple-price-calc").find('*').each( function () {
		
		currtag=$(this).prop('tagName');
		
		if(currtag == "SELECT") { 
			if($(this).attr('multiple')) {
			var selectedOptions = $(this).find(':selected');			
			if (selectedOptions != '')
			{
				selectedOptions.each( function() {
					var optionlabel= $(this).data('label') || ''; 
					var optionprice = $(this).data('price');
					if(optionlabel != '') {
							selectedformvalues.push(optionlabel + ": " + settings.currency + optionprice);				
						}
				});
			}
			
		}
		else{		
		var selectedOption = $(this).find(':selected');
		if (selectedOption != '')
			{
				    var optionlabel= selectedOption.data('label') || '';
					var optionprice = selectedOption.data('price');
					 if(optionlabel != '') {
							selectedformvalues.push(optionlabel +": " + settings.currency + optionprice);				
						}
		
		     }		
		 }
		
		} // End of Form dropdown
		
		if(currtag == "INPUT" && $(this).attr('type') == "text") 
		{
				if($(this).attr('data-price') || $(this).attr('data-mult') || $(this).attr('data-mult-ids')) {
	
			var userinput= $(this).val();			
			if($.isNumeric(userinput)) { var usernumber = parseFloat(userinput);}  else { var usernumber = 1; }			
			var pricecost=parseFloat($(this).data('price')) || 0;
			var currlabel= $(this).attr('data-label') || '';
			var currinput= userinput;				
			
			if (currlabel != '' && currinput !='') {  
	
				if($.isNumeric(pricecost) && pricecost !=0) {
					var updpricecost=pricecost * usernumber;					
					selectedformvalues.push(currlabel + ": " + settings.currency + updpricecost);
				}				
				else{
					selectedformvalues.push(currlabel + ": " + currinput);
				}			
     		 }
			
			
		  }
		}  // End of input type text

		if(currtag == "INPUT" && $(this).attr('type') == "hidden") 
		{
			if($(this).attr('data-price')) {
	
			var hiddeninputval= $(this).attr('data-price');						
			var currlabel= $(this).attr('data-label') || '';
							
			
			if (currlabel != '') {  	
				if($.isNumeric(hiddeninputval) && hiddeninputval !=0) 
					selectedformvalues.push(currlabel + ": " + settings.currency + hiddeninputval);												
     		 }
						
		  }
		}  // End of input type hidden
		
		if(currtag == "INPUT" && $(this).attr('type') == "checkbox" || $(this).attr('type') == "radio" )
		{
						
				if($(this).is(':checked')) {
				var checkboxval= $(this).val();
				if($.isNumeric(checkboxval)) {									
					var currlabel= $(this).attr('data-label') || '';
					var currprice= checkboxval;				
					if (currlabel != '') { selectedformvalues.push(currlabel + ": " + settings.currency + currprice); }
					}
				}							
		}  // End of input type checkbox or radio				
		
		}); 
		
		$("#simple-price-details").html("");
			if (selectedformvalues != '') {
				$("#simple-price-details").append("<h3>"+ settings.detailslabel +"</h3>");								
				$.each(selectedformvalues, function(key,value) {
				$("#simple-price-details").append(value + "<br />");								
				});
			}
		
	}// End of UpdateDescriptions()
     	
	this.append('<div id="sidebar">'+
					'<div id="simple-price-total">'+
						'<h3 style="margin:0;">' + settings.totallabel + ' </h3>'+
						'<label id="simple-price-total-num"> ' + settings.currency + $.number(total,2) + ' </label>'+
					'</div>'+
					'<div id="simple-price-details"></div>'+
				'</div>');	
	 
	return this;
   
 };  // End of plugin

}(jQuery));