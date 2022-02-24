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
        singleLabel: "Single",
        coupleLabel: "Couple",
        marriedLabel: "Married",
        annualSingleRate: 137.40,
        annualCoupleRate: 262.80,
        annualMarriedRate: 334.80
    }, options );

    //Built in function that can be called outside of script to update total
    this.baseUpdateTotal = function(){ setTimeout(function() {
        baseUpdateTotal();
    }, 100);};

    this.addinUpdateTotal = function(){ setTimeout(function() {
        addinUpdateTotal();
    }, 100);};

    this.setAddins = function(boolean){ setTimeout(function() {
        addins = boolean;
        //console.log(addins);
    }, 100);};
  
    // Initialize Variables
    var baseForm = this.children('#flexsave-base');
    var baseChild = baseForm.find('*');
    var baseDropDowns = baseForm.find('select');
    var baseTotal = 0;

    var baseTotal100 = 0;
    var baseServ100 = 0;
    var baseTax100 = 0;
    var baseTotal75 = 0;
    var baseServ75 = 0;
    var baseTax75 = 0;
    var baseTotal50 = 0;
    var baseServ50 = 0;
    var baseTax50 = 0;
    var baseTotal25 = 0;
    var baseServ25 = 0;
    var baseTax25 = 0;

    var addinForm = this.children('#flexsave-addin');
    var addinChild = addinForm.find('*');
    var addinDropDowns = addinForm.find('select');
    var addinTotal = 0;

    var addins = false;
    var singleAddinsNum = 0;
    var coupleAddinsNum = 0;
    var marriedAddinsNum = 0;

    var singleAddinsTotal = 0;
    var coupleAddinsTotal = 0;
    var marriedAddinsTotal = 0;

    var monthSingleRate = parseFloat(settings.annualSingleRate)/12.0;
    var monthCoupleRate = parseFloat(settings.annualCoupleRate)/12.0;
    var monthMarriedRate = parseFloat(settings.annualMarriedRate)/12.0;
        
    var costTotal100 = 0;
    var costTotal75 = 0;
    var costTotal50 = 0;
    var costTotal25 = 0;
      
    baseForm.addClass("flexsave-calc");
    addinForm.addClass("flexsave-calc");

    InitialUpdate();	
      
    // Change select data cost on each change to current selected value
    baseDropDowns.change( function() {
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
        baseUpdateTotal();
    });

    baseForm.find("input[type=text]").change( function() {      
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
        baseUpdateTotal();
    });

    baseForm.find("input[type=checkbox]").change( function() {
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
        baseUpdateTotal();
    });

    baseForm.find("input[type=radio]").change( function() {
        baseForm.children("input[type=radio]").each( function() {
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
        baseUpdateTotal();
    });

    addinDropDowns.change( function() {
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
        addinUpdateTotal();
    });

    addinForm.find("input[type=text]").change( function() {
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
        addinUpdateTotal();
    });

    addinForm.find("input[type=checkbox]").change( function() {
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
        addinUpdateTotal();
    });

    addinForm.find("input[type=radio]").change( function() {
        baseForm.children("input[type=radio]").each( function() {
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
        addinUpdateTotal();
    });

    //Initialize all fields if data is there
    function InitialUpdate() {
        baseDropDowns.each( function() {
            console.log('Initiation... OK');
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

        addinDropDowns.each( function() {
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
      
        baseForm.find("input[type=text]").each( function() {
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
      
        baseForm.find("input[type=checkbox]").each( function() {
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
      
          
        baseForm.find("input[type=radio]").each( function() {
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
  
        baseForm.find("input[type=hidden]").each( function() {
            if($(this).attr('data-price')) {
                var hiddeninputval= $(this).attr('data-price');                                                                 
                if($.isNumeric(hiddeninputval) && hiddeninputval !=0) {				
                    $(this).attr('data-total', hiddeninputval);
                }				
            }
        });
        
        baseUpdateTotal();

        addinForm.find("input[type=text]").each( function() {
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
      
        addinForm.find("input[type=checkbox]").each( function() {
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
          
        addinForm.find("input[type=radio]").each( function() {
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
  
        addinForm.find("input[type=hidden]").each( function() {
            if($(this).attr('data-price')) {
                var hiddeninputval= $(this).attr('data-price');                                                                 
                if($.isNumeric(hiddeninputval) && hiddeninputval !=0) {				
                    $(this).attr('data-total', hiddeninputval);
                }				
            }
        });
        addinUpdateTotal();
    }//End of InitialUpdate()
      
    //Change value of total field by adding all data totals in form    
    function baseUpdateTotal() {
        baseTotal = 0;
        baseTotalMult = $("#flexsave-base-total label").attr("data-mult");
        multids = [];
            
        //For each input with data-merge attr, take merge ids value and multiply by current data-price	
        baseForm.find("input[data-merge]").each(function(){
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
        baseForm.find("[data-mult-ids]").each(function(){			
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
                
        baseChild.each(function () {				
            itemCost = $(this).attr("data-total") || 0;
            baseTotal += parseFloat(itemCost);			
        });	
        
        if(baseTotalMult) { 
            baseTotal = baseTotal * parseFloat(baseTotalMult); 
        }

        baseTotal100 = baseTotal;
        baseServ100 = (baseTotal100 * settings.baseService);
        baseTax100 = ((baseTotal100 * settings.baseService) * settings.baseTax)
        
        baseTotal75 = (baseTotal100 * 0.75);
        baseServ75 = (baseTotal75 * settings.baseService);
        baseTax75 = ((baseTotal75 * settings.baseService) * settings.baseTax);
        
        baseTotal50 = (baseTotal100 * 0.5);
        baseServ50 = (baseTotal50 * settings.baseService);
        baseTax50 = ((baseTotal50 * settings.baseService) * settings.baseTax);
        
        baseTotal25 = (baseTotal100 * 0.25);
        baseServ25 = (baseTotal25 * settings.baseService);
        baseTax25 = ((baseTotal25 * settings.baseService) * settings.baseTax);

        $("#flexsave-base-total label.hundred").html(settings.currency+$.number(baseTotal100,2));
        $("#flexsave-base-total p:eq(0) span").html($.number(baseServ100,2));
        $("#flexsave-base-total p:eq(1) span").html($.number(baseTax100,2));
        
        $("#flexsave-base-total label.three-quarter").html(settings.currency+$.number(baseTotal75,2));
        $("#flexsave-base-total p:eq(2) span").html($.number(baseServ75,2));
        $("#flexsave-base-total p:eq(3) span").html($.number(baseTax75,2));
        
        $("#flexsave-base-total label.half").html(settings.currency+$.number(baseTotal50,2));
        $("#flexsave-base-total p:eq(4) span").html($.number(baseServ50,2));
        $("#flexsave-base-total p:eq(5) span").html($.number(baseTax50,2));
        
        $("#flexsave-base-total label.quarter").html(settings.currency+$.number(baseTotal25,2));
        $("#flexsave-base-total p:eq(6) span").html($.number(baseServ25,2));
        $("#flexsave-base-total p:eq(7) span").html($.number(baseTax25,2));

        setTimeout(function() {
            costsUpdateTotal();
            UpdateDescriptions();
        }, 100);
    }//End of baseUpdateTotal()

    function addinUpdateTotal() {
        addinTotal = 0;
        addinTotalMult = $("#flexsave-base-total label").attr("data-mult");
        multids = [];
            
        //For each input with data-merge attr, take merge ids value and multiply by current data-price	
        addinForm.find("input[data-merge]").each(function(){
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
        addinForm.find("[data-mult-ids]").each(function(){			
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
                
        addinChild.each(function () {				
            itemCost = $(this).attr("data-total") || 0;
            addinTotal += parseFloat(itemCost);			
        });	
        
        if(addinTotalMult) { 
            addinTotal = addinTotal * parseFloat(addinTotalMult); 
        }

        singleAddinsNum = parseFloat( $("#addin-single").val() );
        coupleAddinsNum = parseFloat( $("#addin-couple").val() );
        marriedAddinsNum = parseFloat( $("#addin-married").val() );

        singleAddinsTotal = singleAddinsNum * parseFloat(settings.annualSingleRate);
        addinTotal += singleAddinsTotal;

        coupleAddinsTotal = coupleAddinsNum * parseFloat(settings.annualCoupleRate);
        addinTotal += coupleAddinsTotal;

        marriedAddinsTotal = marriedAddinsNum * parseFloat(settings.annualMarriedRate);
        addinTotal += marriedAddinsTotal;

        addinTotal = singleAddinsTotal + coupleAddinsTotal + marriedAddinsTotal;

        $("#flexsave-addin label.single").html(settings.currency+$.number(singleAddinsTotal,2));
        $("#flexsave-addin label.couple").html(settings.currency+$.number(coupleAddinsTotal,2));
        $("#flexsave-addin label.married").html(settings.currency+$.number(marriedAddinsTotal,2));
        $("#flexsave-addin label.total").html(settings.currency+$.number(addinTotal,2));

        setTimeout(function() {
            costsUpdateTotal();
            UpdateDescriptions();
        }, 100);
    }//End of addinUpdateTotal()

    function costsUpdateTotal(){
        costTotal100 = (baseTotal100 + baseServ100 + baseTax100) + addinTotal;
        costTotal75 = (baseTotal75 + baseServ75 + baseTax75) + addinTotal;
        costTotal50 = (baseTotal50 + baseServ50 + baseTax50) + addinTotal;
        costTotal25 = (baseTotal25 + baseServ25 + baseTax25) + addinTotal;

        $("#flexsave-costs label.hundred").html(settings.currency+$.number(costTotal100,2));
        $("#flexsave-costs label.three-quarter").html(settings.currency+$.number(costTotal75,2));
        $("#flexsave-costs label.half").html(settings.currency+$.number(costTotal50,2));
        $("#flexsave-costs label.quarter").html(settings.currency+$.number(costTotal25,2));
    }
      
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
    }//End of UpdateDescriptions()

    baseDetail = $('#flexsave-base');
    baseDetail.append(''+
    '<div class="flexsave-detail">'+
        '<section id="flexsave-base-total">'+
            '<h2>Base FlexSave Costs</h2><span>(Usage is Not Including Tax & Fees)</span>'+
            '<hr>'+
            '<h3>' + 
                settings.baseLabel100 + 
            ' </h3>'+
            '<label class="hundred"> ' + 
                settings.currency + $.number(baseTotal100,2) + 
            '</label>'+
            '<p>10% Service Fee: ' + 
                settings.currency + '<span>'+$.number(baseServ100,2)+'</span>'+
            '</p>'+
            '<p>Tax Fee: ' + 
                settings.currency + '<span>'+$.number(baseTax100,2)+'</span>'+
            '</p>'+
            '<h3>' + 
            settings.baseLabel75 + 
            ' </h3>'+
            '<label class="three-quarter"> ' + 
                settings.currency + $.number(baseTotal75,2) + 
            '</label>'+
            '<p>10% Service Fee: ' + 
                settings.currency + '<span>'+$.number(baseServ75,2)+'</span>'+
            '</p>'+
            '<p>Tax Fee: ' + 
                settings.currency + '<span>'+$.number(baseTax75,2)+'</span>'+
            '</p>'+
            '<h3>' + 
            settings.baseLabel50 + 
            '</h3>'+
            '<label class="half"> ' + 
                settings.currency + $.number(baseTotal50,2) + 
            '</label>'+
            '<p>10% Service Fee: ' + 
                settings.currency + '<span>'+$.number(baseServ50,2)+'</span>'+
            '</p>'+
            '<p>Tax Fee: ' + 
                settings.currency + '<span>'+$.number(baseTax50,2)+'</span>'+
            '</p>'+
            '<h3>' + 
            settings.baseLabel25 + 
            ' </h3>'+
            '<label class="quarter"> ' + 
                settings.currency + $.number(baseTotal25,2) + 
            '</label>'+
            '<p>10% Service Fee: ' + 
                settings.currency + '<span>'+$.number(baseServ25,2)+'</span>'+
            '</p>'+
            '<p>Tax Fee: ' + 
                settings.currency + '<span>'+$.number(baseTax25,2)+'</span>'+
            '</p>'+
        '</section>'+
    '</div>');

    addinDetail = $('#flexsave-addin');
    addinDetail.append(''+
    '<div class="flexsave-detail">'+
        '<section id="flexsave-addins-total">'+
            '<h2>In Province and Travel Additional Coverage</h2>'+
            '<hr>'+
            '<div class="data-row">'+
                '<h3>'+ settings.singleLabel + '</h3>'+ 
                '<span>'+ 
                    settings.currency + $.number(monthSingleRate, 2) +
                ' (monthly rates)</span>'+
                '<label class="single">'+ 
                settings.currency + $.number(singleAddinsTotal,2) +
                '</label>'+
            '</div>'+
            '<div class="data-row">'+
                '<h3>'+ settings.coupleLabel + '</h3>'+
                '<span>'+ 
                    settings.currency + $.number(monthCoupleRate, 2) +
                ' (monthly rates)</span>'+
                '<label class="couple">'+ 
                settings.currency + $.number(coupleAddinsTotal,2) +
                '</label>'+
            '</div>'+
            '<div class="data-row">'+
                '<h3>'+ settings.marriedLabel + '</h3>'+
                '<span>'+ 
                    settings.currency + $.number(monthMarriedRate, 2) +
                ' (monthly rates)</span>'+
                '<label class="married">'+ 
                settings.currency + $.number(marriedAddinsTotal,2) +
                '</label>'+
            '</div>'+
            '<h3>Total Additional Coverage</h3>'+
            '<label class="total">'+ 
                settings.currency + $.number(addinTotal, 2) +
            '</label>'+
        '</section>'+
    '</div>');
    
    costsDetail = $('#flexsave-calculator');
    costsDetail.append(''+
    '<div class="flexsave-detail">'+
		'<section id="flexsave-costs">'+
        '<h2>Total FlexSave Costs</h2><span>(Including Tax & Fees)</span>'+
        '<hr>'+
        '<div class="data-row">'+
        '<h3>' + 
            '100% Use' + 
        ' </h3>'+
        '<label class="hundred"> ' + 
            settings.currency + $.number(costTotal100,2) + 
        '</label>'+
        '</div>'+
        '<div class="data-row">'+
        '<h3>' + 
            '75% Use' + 
        ' </h3>'+
        '<label class="three-quarter"> ' + 
            settings.currency + $.number(costTotal75,2) + 
        '</label>'+
        '</div>'+
        '<div class="data-row">'+
        '<h3>' + 
            '75% Use' + 
        '</h3>'+
        '<label class="half"> ' + 
            settings.currency + $.number(costTotal50,2) + 
        '</label>'+
        '</div>'+
        '<div class="data-row">'+
        '<h3>' + 
            '25% Use' + 
        ' </h3>'+
        '<label class="quarter"> ' + 
            settings.currency + $.number(costTotal25,2) + 
        '</label>'+
        '</div>'+
        '</section>'+
    '</div>'
    );
    
    return this;

};// End of plugin
}(jQuery));
  