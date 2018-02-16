(function($) {
    // Activity default parameters
    var defaults = {
        name        : "sequence",               // The activity name
        template    : "keypad.html",            // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // Current localization
        number      : 20,                       // Number of questions
        time        : 1,                        // Sequence time reference
        timemode    : 0,                        // 0: global, 1: individual
        score       : 1,                        // The score (from 1 to 5)
        shuffle     : true,                     // Shuffle the questions
        keyboard    : true,                     // The keyboard is authorized
        vertical    : 2,                        // The vertical position of the current question
        filter      : [],                       // Filter the entry
        erase       : '*',                      // The erase caracter
        font        : 1,                        // Questions font factor
        screenc     : false,                    // Clear the screen between question
        strict      : false,                    // Strictly test the values (Not sure is still mandatory)
        decimal     : false,                    // Accept decimal values
        negative    : false,                    // Accept negative values
        fontex      : 1,                        // exercice font
        debug       : true                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<span style='font-size:.6em;'>$1</span>",
        "\\\[img\\\]([^\\\[]+)\\\[/img\\\]",        "<img src='$1'/>",
        "\\\[dice\\\]([^\\\[]+)\\\[/dice\\\]",      "<div class='dice'>$1</div>",
        "\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",      "<div class='icon'>$1</div>",
        "\\\[char\\\]([^\\\[]+)\\\[/char\\\]",      "<div class='char'>$1</div>",
        "\\\[svg48\\\]([^\\\[]+)\\\[/svg48\\\]",    "<svg xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' version='1.0' viewBox='0 0 48 48'>$1</svg>",
        "\\\[math\\\]([^\\\[]+)\\\[/math\\\]",      "<div class='math'><math>$1</math></div>"
    ];

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onquit)  { ret = "mandatory callback onquit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onquit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Binding clear
        unbind: function($this) {
            $(document).unbind("keypress keydown");
            $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
        },
        format: function(_text) {
            for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
                var vReg = new RegExp(regExp[i*2],"g");
                _text = _text.replace(vReg,regExp[i*2+1]);
            }
            return _text;
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                $("head").find("link").each(function() {
                    if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                });

                if(cssAlreadyLoaded) { helpers.loader.template($this); }
                else {
                    $("head").append("<link></link>");
                    var css = $("head").children(":last");
                    var csspath = "activities/"+settings.name+"/"+settings.css+debug;

                    css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(
                        function() { helpers.loader.template($this); });
                }
            },
            template: function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                // Load the template
                if (settings.template.indexOf(".html")==-1) { settings.template+=".html"; }
                var templatepath = "activities/"+settings.name+"/template/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },        // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this);
                if (settings.input && settings.input.svg) {
                    var debug = "";
                    if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                    var elt= $("<div id='svg' style='width:100%; height:100%'></div>").appendTo($this.find("#keypad"));
                    elt.svg();
                    settings.svg = elt.svg('get');
                    settings.svg.load( settings.input.svg + debug,
                        {addTo: true, changeSize: true, onLoad:function() {
                            if (settings.input["class"]) { $(settings.svg.root()).attr("class",settings.input["class"]); }
                            var svgBind = function($svg) {
                                var vClass = $svg.attr("class");
                                if (!vClass || vClass.indexOf("interactive")<0) {
                                    if (vClass) { vClass+=" interactive"; } else { vClass="interactive"; }
                                    $svg.bind("click touchstart",function(event) {
                                                    $this.sequence('key',this.id, this); event.preventDefault();})
                                        .css("cursor", "pointer").attr("class",vClass);
                                }
                            };

                            if (settings.input.key) {
                                $(settings.input.key, settings.svg.root()).each(function() { svgBind($(this)); });
                            }
                            else for (var i in settings.values) {
                                var vData = settings.values[i][1];
                                if ($.isArray(vData))   { for (var j in vData) { svgBind($("#"+vData[j], settings.svg.root())); } }
                                else                    { svgBind($("#"+vData, settings.svg.root())); }
                                
                            }
                            helpers.loader.build($this);
                        }
                    });
                }
                else { helpers.loader.build($this); }
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Build the response if need
                if (settings.input && settings.input.values) {
                    $this.find(".input").each( function(_index) {
                        if (_index < settings.input.values.length) {
                            var vLabel, vValue;
                            if ($.isArray(settings.input.values[_index])) {
                                vLabel = settings.input.values[_index][0];
                                vValue = settings.input.values[_index][1];
                            }
                            else {
                                vLabel = settings.input.values[_index];
                                vValue = settings.input.values[_index];
                            }
                            $(this).html(helpers.format(vLabel.toString())).addClass("bluekeypad").bind("click touchstart",function(event) {
                                $this.sequence('key',vValue, this); event.preventDefault(); });
                               
                            if (settings.input.attr) {
                                var css=["font-size","width","height"];
                                for (var i=0; i<settings.input.attr.length; i++) { $(this).css(css[i], settings.input.attr[i]+"em"); }
                            }
                        }
                        else { $(this).hide(); }
                    });
                }

                
                // Build the questions
                var vLast = -1, vNew;
                var vRegexp = (settings.regexp&&settings.regexp.input)?new RegExp(settings.regexp.input.from, "g"):0;
                var $ul = $this.find("#values ul").css("font-size",settings.font+"em").hide();

                // Fill the UL list
                var vValueArray = [];
                if (!settings.gen) {
                    var cpt = 0;
                    for (var i=0; i<settings.values.length; i++) { vValueArray.push(settings.values[i]); }
                    if (settings.shuffle) { for (var i=0;i<50;i++) { vValueArray.sort(function(){return (Math.random()>0.5); }); } }
                    for (var i=0; i<settings.number-settings.values.length; i++) { vValueArray.push(vValueArray[i%settings.values.length]); }
                    if (settings.shuffle) { for (var i=0;i<50;i++) { vValueArray.sort(function(){return (Math.random()>0.5); }); } }
                }

                for (var i=0; i<settings.number; i++) {
                    var $li = $("<li></li>").appendTo($ul), vNewValue, vValue = { question:0, response:0};

                    // Get the question
                    if (settings.gen)   { vNewValue = eval('('+settings.gen+')')($this,settings,i); }
                    else                { vNewValue = vValueArray[i%vValueArray.length]; }

                    // The question may be an array [question, response], otherwise response is evaluated from the question
                    if ($.isArray(vNewValue))   { vValue.question = vNewValue[0].toString(); vValue.response = vNewValue[1]; }
                    else                        { vValue.question = vNewValue.toString(); vValue.response = eval(vNewValue.toString().replace("×","*")); }
                    

                    // Special treatment
                    var vRegExpMult = new RegExp("\\\*", "g")
                    vValue.question = vValue.question.toString().replace(vRegExpMult,"×");

                    // Fill the dom element, use a regexp if needed
                    if (vRegexp)    { $li.html(helpers.format(vValue.question.replace(vRegexp, settings.regexp.input.to))); }
                    else            { $li.html(helpers.format(vValue.question)); }

                    // Store the question
                    settings.questions.push(vValue);
                    vLast = vNew;
                }

                // Handle some elements
                $this.find("#screen>div").html("&#xA0;");
                $this.find("#guide_number").html(settings.number);
                if (!settings.time) {
                    $this.find("#timeval").html("&#xA0;");
                    $this.find("#guide_time").html("........");
                }
                else {
                    var vTime = helpers.formattime(
                        Math.floor(settings.time*(settings.timemode?1:settings.number))*1000);
                    $this.find("#timeval").html(vTime);
                    $this.find("#guide_time").html((settings.timemode?"× ":"")+vTime);
                }

                if (settings.context.onload) { settings.context.onload($this); }
                 
                if (settings.decimal)   { $this.find("#keydec").removeClass("disable"); }
                if (settings.negative)  { $this.find("#keyneg").removeClass("disable"); }

                // Locale handling

                if (settings.comment && !settings.exercice ) { settings.exercice = settings.comment; } // OLD DEFINITION (TO REMOVE IN DATA)
                if (settings.exercice) {
                    if ($.isArray(settings.exercice)) {
                        $this.find("#exercice>div").html("");
                        for (var i in settings.exercice) { $this.find("#exercice>div").append("<p>"+helpers.format(settings.exercice[i])+"</p>"); }
                    }
                    else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");
                
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                setTimeout(function() { $this.find("#values ul").show(); helpers.move($this, true);}, 500);
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        formattime: function(_val) {
            _val=Math.floor(_val/100);
            var vMS = _val%10;
            var vS  = Math.floor(_val/10)%100;
            var vM  = Math.floor(_val/1000);
            if (vM>59) { vMS=9; vS=99; vM=59; }
            return (vM<10?"0":"")+vM+(vS<10?":0":":")+vS+"."+vMS;
        },
        // Update the timer
        timer:function($this) {
            var settings = helpers.settings($this);
            if (settings.time) {
                var $time   = $this.find("#timeval");
                var delay   = Date.now() - settings.timer.begin;
                var ref     = settings.time*(settings.timemode==0?settings.number:1);
                var diff    = ref*1000 - delay;
                $time.text(helpers.formattime(Math.abs(diff)));
                $time.parent().toggleClass("late", (diff<0));
                if (diff>=0) {
                    var ratio = 100-(diff/(ref*10));
                    $this.find("#timeslider").width(ratio+"%");
                }
                else {
                    $this.find("#timeslider").width("100%");
                    if (settings.timemode==1) { helpers.timeout($this); }
                }
            }
            if (settings.interactive) {
                settings.timer.id = setTimeout(function() { helpers.timer($this); }, 50);
            }
        },
        move: function($this, _anim) {
            var settings = helpers.settings($this);
            var vHeight=Math.floor(($this.find("#values").height()-$this.find("#values li").height())/settings.vertical);
            $this.find("#values li").each(function(index) { if (index<settings.it) { vHeight = vHeight - $(this).outerHeight(); } });
            if (_anim)  { $this.find("#values ul").animate({top: vHeight+"px"}, 250, function() { helpers.next($this); }); }
            else        { $this.find("#values ul").css("top", vHeight+"px"); }
            
            if (settings.timemode==1) { settings.timer.begin = Date.now(); }
        },
        hidefx: function($this) { $this.find("#effects>div").hide(); },
        next: function($this) {
            var settings = helpers.settings($this);
            $($this.find("#values li").get(settings.it)).addClass("select");
            if (settings.screenc) { $this.find("#screen>div").html("&#xA0;"); }
            setTimeout(function() { helpers.hidefx($this); }, 200 );
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (!fromkeyboard || settings.keyboard) {
                value = value.toString();

                // Launch the timer if didn't
                if (!settings.timer.id) {
                    settings.timer.begin = Date.now();
                    helpers.timer($this);
                }

                // if a timeout was called on the keypad, clear it out
                if (settings.keypadtimer) { window.clearTimeout(settings.keypadtimer); settings.keypadtimer=0; }

                if (settings.interactive) {
                    if (value==settings.erase ){ settings.response.value = ""; settings.response.digit = 0; }
                    else if (value=='.') {
                        if (settings.decimal) {
                            if (settings.response.digit!=0) {
                                if (settings.response.value.indexOf(".")==-1) { settings.response.value+="."; }
                            }
                            else {
                                settings.response.value = "0.";
                                settings.response.digit = 1;
                            }
                        }
                    }
                    else if (value=='-') {
                        if (settings.negative) {
                            if (settings.response.digit!=0) {
                                if (settings.response.value[0]=='-') { settings.response.value = settings.response.value.substr(1); }
                                else                                 { settings.response.value = "-"+settings.response.value; }
                            }
                            else { settings.response.value = "-"; }
                        }
                    }
                    else            {
                        if (settings.response.digit==0 ) {
                            // IN CASE OF INITIAL NEGATIVE STUFF
                            settings.response.value += value.toString(); settings.response.digit = 1;
                        }
                        else if ( settings.response.digit == settings.input.digit) {
                            settings.response.value = value.toString(); settings.response.digit = 1;
                        }
                        else {
                            settings.response.value += value.toString(); settings.response.digit++;
                        }
                    }
                    $this.find("#screen>div").html(settings.response.digit?settings.response.value:"&#xA0;");
                    if (value!=settings.erase) {
                            if (!helpers.check($this, (settings.input.speed==0)))
                            {
                                if ((settings.input.speed!=0)) {
                                    settings.keypadtimer = window.setTimeout(function() { helpers.timeout($this); },
                                                                        settings.input.speed);
                            }
                        }
                    }
                }
            }
        },
        // Keypad time out is finished, force the check
        timeout: function($this) {
            var settings = helpers.settings($this);
            clearTimeout(settings.keypadtimer);
            settings.keypadtimer=0;
			settings.response.value="";
            helpers.check($this,true);
        },
        // Check the user entry
        check:function($this, force) {
            var settings = helpers.settings($this);
            var vRet = false;

            if (settings.interactive) {

                // Check the response
				if (settings.response.value.toString().length)
				{
					if ($.isArray(settings.questions[settings.it].response)) {
					  for (var i in settings.questions[settings.it].response) {
						if ((!settings.strict&&settings.questions[settings.it].response[i]==settings.response.value) ||
							 (settings.strict&&settings.questions[settings.it].response[i].toString()==settings.response.value.toString()))
						{
						  vRet = true;
						}
					  }
					}
					else {
						vRet=((!settings.strict && settings.questions[settings.it].response == settings.response.value) ||
							  ( settings.strict && settings.questions[settings.it].response.toString()==settings.response.value.toString()));
					}
				}

                if (vRet || force) {

                    // Update the question
                    var vQuestion = $this.find("#values li").get(settings.it);
                    if (settings.regexp && settings.regexp.output) {
                        var vReg = new RegExp(settings.regexp.output, "g");
                        var value = settings.response.value;
                        if (vRet && $.isArray(settings.questions[settings.it].response)) {
                            value = settings.questions[settings.it].response[0];
                        }
                        $(vQuestion).html($(vQuestion).html().replace(vReg, value));
                    }
                    $(vQuestion).removeClass("select").addClass(vRet?"good":"wrong");

                    // Continue to next question if any
                    if (vRet) {
                        settings.combo++;
                        if (settings.combo==1 || settings.combo==2 || settings.combo==5 || settings.combo==10 || settings.combo==20 ) {
                            $this.find("#effects #good"+settings.combo).show();
                        }
                    }
                    else {
                        settings.wrong++;
                        settings.combo = 0;
                        $this.find("#effects #wrong").show();
                    }
                    if (++settings.it==settings.number) {
                        settings.interactive = false;
                        clearTimeout(settings.timer.id);
                        
                        settings.score = 5 - settings.wrong;
                        if (settings.timemode==0 && $this.find("#time").hasClass("late")) { settings.score--; }
                        if (settings.score<0) { settings.score = 0; }
      
                        setTimeout(function() { helpers.end($this); }, 1000);
                    }
                    settings.response.digit = 0;
                    settings.response.value = "";
                    helpers.move($this, true);
                }
            }
            return vRet;
        }
    };

    // The plugin
    $.fn.sequence = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    it              : 0,                        // Current question index
                    questions       : [],                       // Questions array
                    response        : { value:"", digit: 0 },   // Current response
                    keypadtimer     : 0,                        // Keypadtimer (in case of more than one digit)
                    timer: {                                    // The general timer
                        id      : 0,                            // The timer id
                        begin   : 0                             // The begining time
                    },
                    interactive     : false,                    // Entry allowed or not
                    combo           : 0,                        // Successive good response
                    svg             : 0,                        // The SVG board
                    wrong           : 0                         // Number of wrong responses
                };

                 // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    
                    $(document).keypress(function(_e) {
                        if (_e.keyCode!=116) { helpers.key($this, String.fromCharCode(_e.which), true); _e.preventDefault(); } });
                    
                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings["class"]) { $this.addClass($settings["class"]); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                var settings = $(this).data("settings");
                // Hide instruction
                settings.interactive=true;
            },
            key: function(value, _elt) {
                var $this = $(this), settings = helpers.settings($this);
                if (_elt) {
                    $(_elt).attr("class", $(_elt).attr("class")+" touch");
                    setTimeout(function() { $(_elt).attr("class", $(_elt).attr("class").replace(" touch","")); },
                               (settings.input && settings.input.svg)?500:50);
                }
                helpers.key($(this), value, false);
            },
            click: function(value) { helpers.key($(this), value, false); },
            quit: function() {
                var $this = $(this), settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                helpers.unbind($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in sequence plugin!'); }
    };
})(jQuery);

