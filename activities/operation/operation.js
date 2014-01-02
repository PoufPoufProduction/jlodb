(function($) {
    // Activity default parameters
    var defaults = {
        name        : "operation",          // The activity name
        template    : "template.html",      // Activity's html template
        css         : "style.css",          // Activity's css style sheet
        locale      : "fr",                 // Current localization
        score       : 1,                    // The score (from 1 to 5)
        number      : 4,                    // Number of exercices
        time        : 1,                    // Perfect time to solve the operation
        debug       : false                 // Debug mode
    };

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onQuit)  { ret = "mandatory callback onQuit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onQuit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onQuit({'status':'success', 'score':settings.score});
        },
        // compute the score regarding the actual time and the time refence
        score:function(timeref, time) {
            var s = Math.floor(5*timeref/time);
            if (s>5) { s = 5; }
            return s;
        },
        formattime: function(_val) {
            var vS = _val%60;
            var vM = Math.floor(_val/60)%60;
            var vH = Math.floor(_val/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            return (vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS;
        },
        // get the timer value
        timer:function($this) {
            var settings = helpers.settings($this);
            var $time = $this.find("#time");
            settings.timer.value++;
            if (settings.time) {
                var diff = Math.floor(Math.abs(settings.time*settings.number-settings.timer.value));
                $time.text(helpers.formattime(diff));
                $time.toggleClass("late", (settings.timer.value>settings.time*settings.number));
            }
            settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000);
        },
        // Handle the elements sizes and show the activity
        resize: function($this) {
            var settings = helpers.settings($this);

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(false); }

            // Generic resize
            $this.css("font-size", Math.floor($this.height()/12)+"px");

            // Build the first operation
            helpers.build($this);

            // Locale handling
            $this.find("h1#label").html(settings.label);
            if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

            // Handle spash panel
            if (settings.nosplash) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            else                   { $this.find("#intro").show(); }

        },
        // Build the response table regarding the question
        build:function($this) {
            var settings = helpers.settings($this);
            var $board = $this.find("#board").html("");

            // Get the operation
            var vOpTmp;
            if (settings.gen) {
                vOpTmp = eval('('+settings.gen+')')();
            }
            else {
                var vNew;
                do  { vNew = Math.floor(Math.random()*settings.values.length); }
                    while ((settings.values.length>1)&&(vNew==settings.last));
                    vOpTmp = settings.values[vNew];
                    settings.last = vNew;
            }

            // Split the operation regarding the operation type
            var vType = "+";
            if (vOpTmp.indexOf("*")>=0) { vType = "*"; } else
            if (vOpTmp.indexOf("/")>=0) { vType = "/"; } else
            if (vOpTmp.indexOf("-")>=0) { vType = "-"; }
            var vReg = new RegExp("["+vType+"]", "g");
            var vOperation = vOpTmp.split(vReg);

            // Compute the size of the table
            var height = 0 , width = 0;
            if (vType=="*") {
                settings.result = vOperation[0]*vOperation[1];
                width = 1+ String(settings.result).length;
                height = 2+String(vOperation[1]).length + 1;
            }
            else if (vType=="/") {
                settings.result = Math.floor(vOperation[0]/vOperation[1]);
                settings.modulo = vOperation[0]%vOperation[1];
                width = String(vOperation[0]).length+Math.max(String(vOperation[1]).length, String(settings.result).length);
                height = 2*(String(settings.result).length)+1;
            }
            else {
                settings.result = vOperation[0];
                for (var i=0; i<vOperation.length; i++) {
                    width = Math.max(width, String(vOperation[i]).length);
                    if (i>0) {
                        if (vType=="+")         { settings.result = parseInt(settings.result)+parseInt(vOperation[i]); }
                        else if (vType=="-")    { settings.result -= vOperation[i]; }
                    }
                }
                width++;
                height = vOperation.length+1;
            }
            settings.type = vType;

            // BUILD THE TABLE FOR THE DIVISION OPERATION
            var vTable = '<table>';
            if (vType=="/") {

                // TIME AND HEADER
                vTable+='<tr><td class="help clear"><div id="time">'+
                        (settings.time?helpers.formattime(Math.floor(Math.abs(settings.time*settings.number-settings.timer.value))):"")
                        +'</div></td>';
                for (var j=1; j<width; j++) { vTable+='<td class="help"><div></div></td>'; }
                vTable+='</tr>';

                // INITIALISATION
                var vModulo = vOperation[0];
                var vPow = 1;
                for (var i = 0; i<String(settings.result).length-1; i++) { vPow *= 10; }

                // FOR EACH LINE
                for (var i=0; i<height; i++) {
                    vTable+='<tr>';

                    // COMPUTE THE OFFSET OF THE LEFT VALUE
                    var offset=0;
                    var vLineContent="";
                    if (i>0) {
                        if (i%2) {
                            vLineContent = vOperation[1]*vPow*(Math.floor(settings.result/vPow)%10);
                            vModulo -= vLineContent;
                            vPow = vPow/10;
                            offset = String(vLineContent).length;
                         } else {
                            offset = String(vModulo).length;
                         }
                    }

                    for (var j=0; j<width; j++) {
                        // FIRST LINE WITH DIVISION VALUES
                        if (i==0) {
                            if (j==String(vOperation[0]).length-1) { vTable+='<td class="line"><div>'; }
                            else { vTable+='<td><div>'; }
                            if (j<String(vOperation[0]).length) { vTable+=String(vOperation[0])[j]; }
                            else if (j<String(vOperation[0]).length+String(vOperation[1]).length){
                                vTable+=String(vOperation[1])[j-String(vOperation[0]).length]; }
                            vTable+='</div></td>';
                        }
                        // OTHER LINES
                        else {
                            var vClass = "";
                            if (j==String(vOperation[0]).length-1) { vClass = " line"; }
                            if (i==height-1) { vClass+=" modulo";}
                            if ((j<String(vOperation[0]).length && j>=String(vOperation[0]).length-offset)||
                                (j>=String(vOperation[0]).length && i==1)) {
                                if ((i==1) && (j>=String(vOperation[0]).length)) { vClass +=" result"; }
                                vTable+='<td class="active'+vClass+'">';
                                vTable+='<div onclick="$(this).closest(\'.operation\').operation(\'click\',this, event);" ';
                                vTable+='ontouchstart="$(this).closest(\'.operation\').operation(\'click\',this, event);event.preventDefault();" ';
                                vTable+='onmouseover="$(this).closest(\'.operation\').operation(\'onmouseover\',this, true);" ';
                                vTable+='onmouseout="$(this).closest(\'.operation\').operation(\'onmouseover\',this, false);">';
                                vTable+='</div></td>';
                            }
                            else {
                                vTable+='<td class="inactive"><div></div></td>';
                            }
                        }
                    }
                    vTable+='</tr>';
                }

            }
            // BUILD THE TABLE FOR ALL OPERATIONS BUT DIVISION
            else {
                vTable+='<tr>';
                vTable+='<td class="help clear"><div id="time" onclick="$(this).closest(\'.operation\').operation(\'clear\');">'
                            +(settings.time?helpers.formattime(Math.floor(Math.abs(settings.time*settings.number-settings.timer.value))):"")
                            +'</div></td>';
                for (var j=1; j<width; j++) {
                    vTable+='<td class="help"><div onclick="$(this).closest(\'.operation\').operation(\'click\',this, event);" ';
                    vTable+='ontouchstart="$(this).closest(\'.operation\').operation(\'click\',this, event);event.preventDefault();" ';
                    vTable+='onmouseover="$(this).closest(\'.operation\').operation(\'onmouseover\',this, true); "';
                    vTable+='onmouseout="$(this).closest(\'.operation\').operation(\'onmouseover\',this, false);">';
                    vTable+='</div></td>';
                }
                vTable+='</tr>';
                for (var i=0; i<height; i++) {
                    vTable+='<tr';
                    if (i==height-1) { vTable+=" id='result'"; }
                    if ((i==vOperation.length-1)||(i==height-2)) { vTable+=' class="line"'; } 
                    vTable+='>';
                    for (var j=0; j<width; j++) {
                        if (i<vOperation.length) {
                            vTable+='<td><div>';
                            if ((j==0)&&(i>0)) { vTable+=vType; }
                            else if (j>=width-String(vOperation[i]).length) {
                                vTable+=String(vOperation[i])[(j+String(vOperation[i]).length)-width]; }
                            vTable+='</div></td>';
                        }
                        else {
                            vTable+='<td class="active">';
                            vTable+='<div onclick="$(this).closest(\'.operation\').operation(\'click\',this, event);" ';
                            vTable+='ontouchstart="$(this).closest(\'.operation\').operation(\'click\',this, event);event.preventDefault();" ';
                            vTable+='onmouseover="$(this).closest(\'.operation\').operation(\'onmouseover\',this, true);" ';
                            vTable+='onmouseout="$(this).closest(\'.operation\').operation(\'onmouseover\',this, false);">';
                            vTable+='</div></td>';
                        }
                    }
                    vTable+='</tr>';
                }
            }

            vTable+='</table>';
            $board.append(vTable);
            $board.find("td").each(function(index) {
                if (!$(this).hasClass("help")) {
                    var r = index%2+1;
                    $(this).css("background-image", "url('res/img/svginventoryicons/background/border/square0"+r+".svg')");
                }
            });

            // Resize
            var vFont = Math.floor(Math.min(($this.width()-3)/width, ($this.height()-8)/(height+.5)));
            $this.find("#board").css("font-size", vFont+"px");
            $this.find("#keypad").css("font-size", Math.floor(($this.height()-8)/8)+"px");

            settings.finish = false;

        },
        // Load the different elements of the activity
        load:function($this) {
            var settings = helpers.settings($this);
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(true); }

            // Load the template
            var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
            $this.load( templatepath, function(response, status, xhr) {
                if (status=="error") {
                    settings.context.onQuit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                }
                else {
                    var cssAlreadyLoaded = false;
                    $("head").find("link").each(function() {
                        if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                    });

                    if(cssAlreadyLoaded) {
                        helpers.resize($this);
                    }
                    else {
                        // Load the css
                        $("head").append("<link>");
                        var css = $("head").children(":last");
                        var csspath = "activities/"+settings.name+"/"+settings.css+debug;
                        css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(function() {
                            helpers.resize($this); 
                        });
                    }
                }
            });
        },
        key: function($this, value) {
            var settings = helpers.settings($this);
            if (!settings.timer.id) { settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000); }
            if (settings.keypad) { clearTimeout(settings.keypad); settings.keypad=0; }
            $this.find("#keypad").fadeOut("fast");
            if (!settings.elt && settings.elthover) { settings.elt = settings.elthover; }
            if (settings.elt) {
                if (value==-2)   { $(settings.elt).text(""); } else
                if (value>=0)    {
                    $(settings.elt).text(value);
                    settings.elt = 0;
                    settings.finish = helpers.check($this);
                    if (settings.finish) {
                        $this.find("#board table").addClass("good");
                        if (++settings.count >= settings.number) {
                            clearTimeout(settings.timer.id);
                            settings.score = settings.time?helpers.score((settings.time+1)*settings.number, settings.timer.value):5;
                            setTimeout(function() { helpers.end($this); }, 1000);
                        }
                        else {
                            setTimeout(function() { helpers.build($this); }, 1000);
                        }
                    }
                }
            }
        },
        // Check the result
        check: function($this) {
            var settings = helpers.settings($this), vResult = "", vModulo = "";
            var ret = false;
            if (settings.type=="/") {
                $this.find(".result div").each(function(index) { vResult+=$(this).text(); });
                $this.find(".modulo div").each(function(index) { vModulo+=$(this).text(); });
                ret = ( (parseInt(vResult)==parseInt(settings.result)) &&
                        (parseInt(vModulo)==parseInt(settings.modulo)) );
            }
            else {
                $this.find("#result div").each(function(index) { vResult+=$(this).text(); });
                ret = (parseInt(vResult)==parseInt(settings.result));
            }
            return ret;
        }
    };

    // The plugin
    $.fn.operation = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    last        : -1,
                    result      : 0,
                    modulo      : 0,
                    elt         : 0,
                    elthover    : 0,
                    keypad      : 0,
                    finish      : false,
                    timer: {                // the general timer
                        id      : 0,        // the timer id
                        value   : 0         // the timer value
                    },
                    count       : 0,        // the operation number
                    type        : '+'
                };

                // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");
                    $(document).keypress(function(_e) { helpers.key($this, String.fromCharCode(_e.which)); });

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.load($this);
                    }
                });
            },
            key: function(value) { helpers.key($(this), value); },
            click: function(elt, event) {
                var $this = $(this) , settings = $(this).data("settings");
                if (!settings.timer.id) { settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000); }
                if (!settings.finish) {

                    if (settings.keypad) { clearTimeout(settings.keypad); settings.keypad=0; }
                    settings.keypad = setTimeout(function() { $this.operation('key', -1); }, 3000);

                    var $keypad = $(this).find("#keypad");
                    var vTop = Math.floor(event.pageY - $(this).offset().top -  $keypad.height()/2);
                    var vLeft = Math.floor(event.pageX - $(this).offset().left - $keypad.width()/2);
                    if (vTop+$keypad.height()>$(this).height()) { vTop= $(this).height() - $keypad.height() - 1; }
                    if (vLeft+$keypad.width()>$(this).width()) { vLeft= $(this).width() - $keypad.width() - 1; }
                    $keypad.css("top", (vTop>0?vTop:0)).css("left", (vLeft>0?vLeft:0)).fadeIn("fast");

                    settings.elt = elt;
                }
            },
            onmouseover: function(elt, over) {
                var $this = $(this) , settings = $(this).data("settings");
                if (over) {
                    settings.elthover = elt;
                } else {
                    if (settings.elthover ==elt) { settings.elthover= 0; }
                }
            },
            clear: function() {
                $(this).find("td.help div").each(function(index) { if (index>0) { $(this).text(""); } });
            },
            next: function() {
                $(this).find("#intro").hide();
                $(this).find("#board").show();
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            }
        };


        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in operation plugin!'); }
    };
})(jQuery);

