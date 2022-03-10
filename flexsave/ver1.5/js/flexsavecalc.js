(function($) {
    $.fn.FlexSaveCalc = function (options) {
    
    // Default options
    var settings = $.extend({
        type: "Base Cost",
        currency:"$",		
        baseHeader: "Base FlexSave Cost",
        baseLabel100: 'At 100% Usage',
        baseLabel75: 'At 75% Usage',
        baseLabel50: 'At 50% Usage',
        baseLabel25:'At 25% Usage',
        baseTax: 0.05,
        baseService: 0.1,
        addinHeader: "In Province and Travel Additional Coverage",
        singleLabel: "Single Coverage",
        coupleLabel: "Couple Coverage",
        marriedLabel: "Married Coverage",
        annualSingleRate: 137.40,
        annualCoupleRate: 262.80,
        annualMarriedRate: 334.80
    }, options );
  
    // Initialize Variables
    var total = 0;
    var child = this.find('*');
    var grandTotalContainer = document.getElementById('flexsave-grand-total');
    var formDropDowns=this.find('select');

    var total100 = 0;
    var serv100 = 0;
    var tax100 = 0;
    var grandTotal100 = 0;

    var total75 = 0;
    var serv75 = 0;
    var tax75 = 0;
    var grandTotal75 = 0;

    var total50 = 0;
    var serv50 = 0;
    var tax50 = 0;
    var grandTotal50 = 0;

    var total25 = 0;
    var serv25 = 0;
    var tax25 = 0;
    var grandTotal25 = 0;

    var addins = false;

    var singleAddinsNum = 0;
    var coupleAddinsNum = 0;
    var marriedAddinsNum = 0;

    var totalAddins = 0;
    var singleAddinsTotal = 0;
    var coupleAddinsTotal = 0;
    var marriedAddinsTotal = 0;

    var monthSingleRate = parseFloat(settings.annualSingleRate)/12.0;
    var monthCoupleRate = parseFloat(settings.annualCoupleRate)/12.0;
    var monthMarriedRate = parseFloat(settings.annualMarriedRate)/12.0;

    //Built in function that can be called outside of script to update total
    this.updatetotal = function(){ setTimeout(function() {
        UpdateTotal();
    }, 100);};

    this.setAddins = function(boolean){ setTimeout(function() {
        addins = boolean;
        //console.log(addins);
    }, 100);};
      
    this.addClass("flexsave-calc");	
    InitialUpdate();	
      
    // Change select data cost on each change to current selected value
    formDropDowns.change( function() {
        if($(this).attr('multiple')) {
            var selectedOptions = $(this).find(':selected');
            var selectedOptionstotal=0;
            if (selectedOptions != ''){
                selectedOptions.each( function() {
                    selectedOptionstotal += $(this).data('price');				
                });
            }
            $(this).attr('data-total',selectedOptionstotal);
        }else{		
            var selectedOption = $(this).find(':selected');
            if($(this).data('mult') >= 0) 
                $("#flexsave-base-total label").attr('data-mult',selectedOption.val()); 
            else 
                $(this).attr('data-total',selectedOption.data('price')) ;					
        }		
        UpdateTotal();
    });
      
    //Update total when user inputs or changes data from input box
    $(".flexsave-calc input[type=text]").change( function() {
        if($(this).attr('data-price') || $(this).attr('data-mult')) {
            var userinput= $(this).val();
            if($.isNumeric(userinput)) { 
                var usernumber = parseFloat(userinput);
            } else if(userinput != '') { 
                alert('Please enter a valid number'); 
                var usernumber = 1; 
            } else { 
                usernumber = 1; 
            }
            var multiple=parseFloat($(this).data('mult')) || 0;
            var pricecost=parseFloat($(this).data('price')) || 0;
            var percentage=$(this).data('prcnt') || 1;
        
            if($.isNumeric(pricecost) && pricecost !=0) {
                var updpricecost=pricecost * usernumber;
                $(this).attr('data-total', updpricecost);
            }
        
            if(multiple && multiple !=0) {    	
                $("#flexsave-base-total label").attr('data-mult',usernumber);
            }  
        } 
        UpdateTotal();
    });
      
    $(".flexsave-calc input[type=checkbox]").change( function() {
        if($(this).is(':checked')) {
            var checkboxval= $(this).val();
            if($.isNumeric(checkboxval)) {				
                $(this).attr('data-total', checkboxval);				
            }
            else {
                $(this).attr('data-total', 0);
            }
        } else {
            $(this).attr('data-total', 0);
        }		  
        UpdateTotal();
    });
      
    $(".flexsave-calc input[type=radio]").change( function() {
        $(".flexsave-calc input[type=radio]").each( function() {
            if($(this).is(':checked')) {
                var radioval= $(this).val();
                if($.isNumeric(radioval)) {				
                    $(this).attr('data-total', radioval);
                } else {
                    $(this).attr('data-total', 0);
                }
            } else {
                $(this).attr('data-total', 0);
            }		
        });	
        UpdateTotal();
    });
         
    //Initialize all fields if data is there
    function InitialUpdate() {
        formDropDowns.each( function() {
            if($(this).attr('multiple')) {
                var selectedOptions = $(this).find(':selected');
                var selectedOptionstotal=0;
                if (selectedOptions != ''){
                    selectedOptions.each( function() {
                      selectedOptionstotal += $(this).data('price');				
                    });
                }
                $(this).attr('data-total',selectedOptionstotal);
            } else{		
                var selectedOption = $(this).find(':selected');
                $(this).attr('data-total',selectedOption.data('price')) ;					
            }		
        });
      
        //Update total when user inputs or changes data from input box
        $(".flexsave-calc input[type=text]").each( function() {
            if($(this).attr('data-price') || $(this).attr('data-mult')) {
                var userinput= $(this).val();
                if($.isNumeric(userinput)) { 
                    var usernumber = parseFloat(userinput);
                } else if(userinput != '') { 
                    alert('Please enter a valid number'); 
                    var usernumber = 1;
                } else {
                    usernumber = 1; 
                }

                var multiple=parseFloat($(this).data('mult')) || 0;
                var pricecost=parseFloat($(this).data('price')) || 0;
                var percentage=$(this).data('prcnt') || 1;
        
                if($.isNumeric(pricecost) && pricecost !=0) {
                    var updpricecost=pricecost * usernumber;
                    $(this).attr('data-total', updpricecost);
                }
        
                if(multiple && multiple !=0) {    	
                    $("#flexsave-base-total label").attr('data-mult',usernumber);
                }			
            } 
        });
      
        $(".flexsave-calc input[type=checkbox]").each( function() {
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
      
          
        $(".flexsave-calc input[type=radio]").each( function() {
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
  
        $(".flexsave-calc input[type=hidden]").each( function() {
            if($(this).attr('data-price')) {
                var hiddeninputval= $(this).attr('data-price');                                                                 
                if($.isNumeric(hiddeninputval) && hiddeninputval !=0) {				
                    $(this).attr('data-total', hiddeninputval);
                }				
            }
        });			
        UpdateTotal();
    }//End of InitialUpdate()
      
    //Change value of total field by adding all data totals in form    
    function UpdateTotal() {
        total = 0;
        total100 = 0;
        totalmult = $(".flexsave-calc #flexsave-base-total label").attr("data-mult");
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

            var idtotal = arraytotals;

            if($.isNumeric(idtotal)) {					
                $(this).val(idtotal);
                var pricecost=parseFloat($(this).data('price')) || 0;
                var updpricecost= pricecost * parseFloat($(this).val());
                $(this).attr('data-total', updpricecost);						
            }

            if($.isNumeric(idtotal)) {
                $(this).val($.number(idtotal,2));
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
        
        if(totalmult) { 
            total = total * parseFloat(totalmult); 
        }		
        
        if(settings.type === "Base Cost"){
            serv100 = (total * settings.baseService);
            tax100 = ((total * settings.baseService) * settings.baseTax)
            total100 = total;
            grandTotal100 = total + serv100 + tax100;

            serv75 = ((total * 0.75)* settings.baseService);
            tax75 = (((total * 0.75) * settings.baseService) * settings.baseTax);
            total75 = (total * 0.75);
            grandTotal75 = (total * 0.75) + serv75 + tax75;

            serv50 = ((total * 0.5)* settings.baseService);
            tax50 = (((total * 0.5) * settings.baseService) * settings.baseTax);
            total50 = (total * 0.5);
            grandTotal50 = (total * 0.5) + serv50 + tax50;

            serv25 = ((total * 0.25)* settings.baseService);
            tax25 = (((total * 0.25) * settings.baseService) * settings.baseTax);
            total25 = (total * 0.25);
            grandTotal25 = (total * 0.25) + serv25 + tax25;

            $(".flexsave-calc #flexsave-base-total label.hundred").html(settings.currency+$.number(total100,2));
            $("#flexsave-base-total p:eq(0) span").html($.number(serv100,2));
            $("#flexsave-base-total p:eq(1) span").html($.number(tax100,2));
            
            $(".flexsave-calc #flexsave-base-total label.three-quarter").html(settings.currency+$.number(total75,2));
            $("#flexsave-base-total p:eq(2) span").html($.number(serv75,2));
            $("#flexsave-base-total p:eq(3) span").html($.number(tax75,2));
            
            $(".flexsave-calc #flexsave-base-total label.half").html(settings.currency+$.number(total50,2));
            $("#flexsave-base-total p:eq(4) span").html($.number(serv50,2));
            $("#flexsave-base-total p:eq(5) span").html($.number(tax50,2));
            
            $(".flexsave-calc #flexsave-base-total label.quarter").html(settings.currency+$.number(total25,2));
            $("#flexsave-base-total p:eq(6) span").html($.number(serv25,2));
            $("#flexsave-base-total p:eq(7) span").html($.number(tax25,2));
        }

        if(settings.type === "Additional Cost"){
            singleAddinsNum = parseFloat( $("#coverage1").val() );
            coupleAddinsNum = parseFloat( $("#coverage2").val() );
            marriedAddinsNum = parseFloat( $("#coverage3").val() );

            singleAddinsTotal = singleAddinsNum * parseFloat(settings.annualSingleRate);
            coupleAddinsTotal = coupleAddinsNum * parseFloat(settings.annualCoupleRate);
            marriedAddinsTotal = marriedAddinsNum * parseFloat(settings.annualMarriedRate);

            totalAddins = total;

            $(".flexsave-calc #flexsave-addins-total label.single").html(settings.currency+$.number(singleAddinsTotal,2));
            $(".flexsave-calc #flexsave-addins-total label.couple").html(settings.currency+$.number(coupleAddinsTotal,2));
            $(".flexsave-calc #flexsave-addins-total label.married").html(settings.currency+$.number(marriedAddinsTotal,2));
        }   

        setTimeout(function() {
            UpdateDescriptions();
        }, 100);
    }//End of UpdateTotal()
      
    //Update Field Labels and Pricing	
    function UpdateDescriptions() {				
        var selectedformvalues= [];
        var currtag='';
      
        $(".flexsave-calc").find('*').each( function () {
            currtag=$(this).prop('tagName');
            if(currtag == "SELECT") { 
                if($(this).attr('multiple')) {
                    var selectedOptions = $(this).find(':selected');			
                    if (selectedOptions != ''){
                        selectedOptions.each( function() {
                            var optionlabel= $(this).data('label') || ''; 
                            var optionprice = $(this).data('price');
                            if(optionlabel != '') {
                                selectedformvalues.push(optionlabel + ": " + settings.currency + optionprice);				
                            }
                        });
                    }
                } else {		
                    var selectedOption = $(this).find(':selected');
                    if (selectedOption != ''){
                        var optionlabel= selectedOption.data('label') || '';
                        var optionprice = selectedOption.data('price');
                        if(optionlabel != '') {
                            selectedformvalues.push(optionlabel +": " + settings.currency + optionprice);				
                        }
                    }		
                }
            }// End of Form dropdown
        
            if(currtag == "INPUT" && $(this).attr('type') == "text") {        
                if($(this).attr('data-price') || $(this).attr('data-mult') || $(this).attr('data-mult-ids')) {
                    var userinput= $(this).val();			
                    if($.isNumeric(userinput)) { 
                        var usernumber = parseFloat(userinput);
                    } else { 
                        var usernumber = 1; 
                    }			
                    var pricecost=parseFloat($(this).data('price')) || 0;
                    var currlabel= $(this).attr('data-label') || '';
                    var currinput= userinput;				
            
                    if (currlabel != '' && currinput !='') {  
                        if($.isNumeric(pricecost) && pricecost !=0) {
                            var updpricecost=pricecost * usernumber;					
                            selectedformvalues.push(currlabel + ": " + settings.currency + updpricecost);
                        } else{
                            selectedformvalues.push(currlabel + ": " + currinput);
                        }			
                    } 
                }
            } // End of input type text
    
            if(currtag == "INPUT" && $(this).attr('type') == "hidden") {
                if($(this).attr('data-price')) {
                    var hiddeninputval= $(this).attr('data-price');						
                    var currlabel= $(this).attr('data-label') || '';             
                    if (currlabel != '') {  	
                        if($.isNumeric(hiddeninputval) && hiddeninputval !=0) 
                            selectedformvalues.push(currlabel + ": " + settings.currency + hiddeninputval);												
                    }      
                }
            } // End of input type hidden
        
            if(currtag == "INPUT" && $(this).attr('type') == "checkbox" || $(this).attr('type') == "radio" ){            
                if($(this).is(':checked')) {
                    var checkboxval= $(this).val();
                    if($.isNumeric(checkboxval)) {									
                        var currlabel= $(this).attr('data-label') || '';
                        var currprice= checkboxval;				
                        if (currlabel != '') { selectedformvalues.push(currlabel + ": " + settings.currency + currprice); }
                    }
                }							
            }// End of input type checkbox or radio				
        }); 
      
        $("#simple-price-details").html("");
        if (selectedformvalues != '') {
            $("#simple-price-details").append("<h3>"+ settings.detailslabel +"</h3>");								
            $.each(selectedformvalues, function(key,value) {
                $("#simple-price-details").append(value + "<br />");								
            });
        }
    }//End of UpdateDescriptions()

    switch(settings.type){
        case 'Base Cost':
            this.append(''+
            '<div id="sidebar">'+
                '<div id="flexsave-base-total">'+
                    '<h2>Base FlexSave Costs</h2><span>(Usage is Not Including Tax & Fees)</span>'+
                    '<hr>'+
                    '<h3>' + 
                        settings.baseLabel100 + 
                    ' </h3>'+
                    '<label id="flexsave-base-total-num" class="hundred"> ' + 
                        settings.currency + $.number(total100,2) + 
                    '</label>'+
                    '<p>10% Service Fee: ' + 
                        settings.currency + '<span>'+$.number(serv100,2)+'</span>'+
                    '</p>'+
                    '<p>Tax Fee: ' + 
                        settings.currency + '<span>'+$.number(tax100,2)+'</span>'+
                    '</p>'+
                    '<h3>' + 
                    settings.baseLabel75 + 
                    ' </h3>'+
                    '<label id="flexsave-base-total-num" class="three-quarter"> ' + 
                        settings.currency + $.number(total75,2) + 
                    '</label>'+
                    '<p>10% Service Fee: ' + 
                        settings.currency + '<span>'+$.number(serv75,2)+'</span>'+
                    '</p>'+
                    '<p>Tax Fee: ' + 
                        settings.currency + '<span>'+$.number(tax75,2)+'</span>'+
                    '</p>'+
                    '<h3>' + 
                    settings.baseLabel50 + 
                    '</h3>'+
                    '<label id="flexsave-base-total-num" class="half"> ' + 
                        settings.currency + $.number(total50,2) + 
                    '</label>'+
                    '<p>10% Service Fee: ' + 
                        settings.currency + '<span>'+$.number(serv50,2)+'</span>'+
                    '</p>'+
                    '<p>Tax Fee: ' + 
                        settings.currency + '<span>'+$.number(tax50,2)+'</span>'+
                    '</p>'+
                    '<h3>' + 
                    settings.baseLabel25 + 
                    ' </h3>'+
                    '<label id="flexsave-base-total-num" class="quarter"> ' + 
                        settings.currency + $.number(total25,2) + 
                    '</label>'+
                    '<p>10% Service Fee: ' + 
                        settings.currency + '<span>'+$.number(serv25,2)+'</span>'+
                    '</p>'+
                    '<p>Tax Fee: ' + 
                        settings.currency + '<span>'+$.number(tax25,2)+'</span>'+
                    '</p>'+
                '</div>'+
            '</div>');
            return this;
            break;
        case 'Additional Cost':
            this.append(''+
            '<div id="sidebar">'+
                '<div id="flexsave-addins-total">'+
                    '<h2>In Province and Travel Additional Coverage</h2>'+
                    '<hr>'+
                    '<div class="addins-row">'+
                        '<h3>'+ settings.singleLabel + '</h3>'+ 
                        '<span>'+ 
                            settings.currency + $.number(monthSingleRate, 2) +
                        ' (monthly rates)</span>'+
                        '<label class="single">'+ 
                            $.number(singleAddinsTotal,2) +
                        '</label>'+
                    '</div>'+
                    '<div class="addins-row">'+
                        '<h3>'+ settings.coupleLabel + '</h3>'+
                        '<span>'+ 
                            settings.currency + $.number(monthCoupleRate, 2) +
                        ' (monthly rates)</span>'+
                        '<label class="couple">'+ 
                            $.number(coupleAddinsTotal,2) +
                        '</label>'+
                    '</div>'+
                    '<div class="addins-row">'+
                        '<h3>'+ settings.marriedLabel + '</h3>'+
                        '<span>'+ 
                            settings.currency + $.number(monthMarriedRate, 2) +
                        ' (monthly rates)</span>'+
                        '<label class="married">'+ 
                            $.number(marriedAddinsTotal,2) +
                        '</label>'+
                    '</div>'+
                '</div>'+
            '</div>');	
            return this;
            break;
        default:
            
            return this;
            break;
    }

};// End of plugin
}(jQuery));
  