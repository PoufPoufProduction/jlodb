(function($) {
    // Activity default parameters
    var defaults = {
        name        : "sequence",               // The activity name
        template    : "keypad.html",            // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // Current localization
        number      : 20,                       // Number of questions
        time        : 1,                        // Sequence time reference
        score       : 1,                        // The score (from 1 to 5)
        shuffle     : true,                     // Shuffle the questions
        keyboard    : true,                     // The keyboard is authorized
        vertical    : 2,                        // The vertical position of the current question
        filter      : [],                       // Filter the entry
        erase       : '.',                      // The erase caracter
        font        : 1,                        // Questions font factor
        screenc     : false,                    // Clear the screen between question
        strict      : false,                    // Strictly test the values
        debug       : false                     // Debug mode
    };

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
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
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
                    $("head").append("<link>");
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
                            if (settings.input.class) { $(settings.svg.root()).attr("class",settings.input.class); }
                            for (var i in settings.values) {
                                var vData = settings.values[i][1];
                                if ($.isArray(vData)) {
                                    for (var j in vData) {
                                        var $svg = $("#"+vData[j], settings.svg.root());
                                        var vClass = $svg.attr("class");
                                        if (!vClass || vClass.indexOf("interactive")<0) {
                                            if (vClass) { vClass+=" interactive"; } else { vClass="interactive"; }
                                            $svg.bind("click touchstart", function(event) {
                                                        $this.sequence('key',this.id); event.preventDefault(); })
                                                .css("cursor", "pointer").attr("class",vClass);
                                        }
                                    }
                                }
                                else {
                                    var $svg = $("#"+vData, settings.svg.root());
                                    var vClass = $svg.attr("class");
                                    if (!vClass || vClass.indexOf("interactive")<0) {
                                        if (vClass) { vClass+=" interactive"; } else { vClass="interactive"; }
                                        $svg.bind("click touchstart",function(event) {
                                                    $this.sequence('key',this.id); event.preventDefault();})
                                            .css("cursor", "pointer").attr("class",vClass);
                                    }
                                }
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
                            $(this).html(vLabel).bind("click touchstart",function(event) {
                                $this.sequence('click',vValue); event.preventDefault(); });
                            if (settings.input.css) { for (var i in settings.input.css) { $(this).css(i, settings.input.css[i]); } }
                        }
                        else { $(this).hide(); }
                    });
                }

                // Build the questions
                var vLast = -1, vNew;
                var vRegexp = (settings.regexp&&settings.regexp.input)?new RegExp(settings.regexp.input.from, "g"):0;
                var $ul = $this.find("#values ul").css("font-size",settings.font+"em").hide();

                // Fill the UL list
                for (var i=0; i<settings.number; i++) {
                    var $li = $("<li></li>").appendTo($ul), vNewValue, vValue = { question:0, response:0};

                    // Get the question
                    if (settings.gen) { vNewValue = eval('('+settings.gen+')')(); }
                    else {
                        do  {
                            vNew = (settings.shuffle)?Math.floor(Math.random()*settings.values.length):i;
                        }
                        while ((settings.values.length>2)&&(vNew==vLast));
                        vNewValue = settings.values[vNew];
                    }

                    // The question may be an array [question, response], otherwise response is evaluated from the question
                    if ($.isArray(vNewValue))   { vValue.question = vNewValue[0]; vValue.response = vNewValue[1]; }
                    else                        { vValue.question = vNewValue; vValue.response = eval(vNewValue); }

                    // Fill the dom element, use a regexp if needed
                    if (vRegexp)    { $li.html(vValue.question.replace(vRegexp, settings.regexp.input.to)); }
                    else            { $li.html(vValue.question); }

                    // Store the question
                    settings.questions.push(vValue);
                    vLast = vNew;
                }

                // Handle some elements
                var vScreen = $this.find("#screen");
                if (vScreen) { vScreen.html("&nbsp;"); }
                if (!settings.time) { $this.find("#time").html("&nbsp;"); }
                else                { $this.find("#time").html(helpers.formattime(settings.time*settings.number)); }

                if (settings.context.onload) { settings.context.onload($this); }
                 $this.css("font-size", Math.floor($this.width()/10)+"px");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#comment").html(settings.comment);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        formattime: function(_val) {
            var vS = _val%60;
            var vM = Math.floor(_val/60)%60;
            var vH = Math.floor(_val/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            return (vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS;
        },
        // Update the timer
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
        move: function($this, _anim) {
            var settings = helpers.settings($this);
            var vHeight=Math.floor(($this.find("#values").height()-$this.find("#values li").height())/settings.vertical);
            $this.find("#values li").each(function(index) { if (index<settings.it) { vHeight = vHeight - $(this).outerHeight(); } });
            if (_anim)  { $this.find("#values ul").animate({top: vHeight+"px"}, 250, function() { helpers.next($this); }); }
            else        { $this.find("#values ul").css("top", vHeight+"px"); }
        },
        hidefx: function($this) { $this.find("#effects>div").hide(); },
        next: function($this) {
            var settings = helpers.settings($this);
            $($this.find("#values li").get(settings.it)).addClass("select");
            if (settings.screenc) { $this.find("#screen").html("&nbsp;"); }
            setTimeout(function() { helpers.hidefx($this); }, 200 );
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (!fromkeyboard || settings.keyboard) {

                // Launch the timer if didn't
                if (!settings.timer.id) { helpers.timer($this); }

                // if a timeout was called on the keypad, clear it out
                if (settings.keypadtimer) { window.clearTimeout(settings.keypadtimer); settings.keypadtimer=0; }

                if (settings.interactive) {
                    if (value==settings.erase ){ settings.response.value = 0; settings.response.digit = 0; }
                    else            {
                        if (settings.response.digit==0 || settings.response.digit == settings.input.digit) {
                            settings.response.value = value; settings.response.digit = 1;
                        }
                        else {
                            settings.response.value += ""+value; settings.response.digit++;
                        }
                    }
                    $this.find("#screen").html(settings.response.digit?settings.response.value:"&nbsp;");
                    if (value!=settings.erase) {
                            if (!helpers.check($this, (settings.input.speed==0)))
                            {
                                if ((settings.input.speed!=0)) {
                                    settings.keypadtimer = window.setTimeout(function() { helpers.timeout($this, true); },
                                                                        settings.input.speed);
                            }
                        }
                    }
                }
            }
        },
        // Compute the score
        score:function(timeref, time, wrong) {
            var t = (5-wrong);
            if (timeref>0 && timeref/time<1) { t=Math.floor(t*timeref/time); }
            if (t>5) { t=5; }
            if (t<0) { t=0; }
            return t;
        },
        // Keypad time out is finished, force the check
        timeout: function($this) {
            var settings = helpers.settings($this);
            settings.keypadtimer=0;
            helpers.check($this,true);
        },
        // Check the user entry
        check:function($this, force) {
            var settings = helpers.settings($this);
            var vRet = false;

            if (settings.interactive) {

                // Check the response
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

                if (vRet || force) {

                    // Update the question
                    var vQuestion = $this.find("#values li").get(settings.it);
                    if (settings.regexp && settings.regexp.output) {
                        var vReg = new RegExp(settings.regexp.output, "g");
                        $(vQuestion).html($(vQuestion).html().replace(vReg, settings.response.value));
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
                        settings.score = helpers.score(settings.time*settings.number, settings.timer.value, settings.wrong);
                        setTimeout(function() { helpers.end($this); }, 1000);
                    }
                    settings.response.digit = 0;
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
                    response        : { value:0, digit: 0 },    // Current response
                    keypadtimer     : 0,                        // Keypadtimer (in case of more than one digit)
                    timer: {                                    // The general timer
                        id      : 0,                            // The timer id
                        value   : 0                             // The timer value
                    },
                    interactive     : false,                    // Entry allowed or not
                    combo           : 0,                        // Successive good response
                    svg             : 0,                        // The SVG board
                    wrong           : 0                         // Number of wrong responses
                };

                 // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");
                    $(document).keypress(function(_e) { helpers.key($this, String.fromCharCode(_e.which), true); });

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                var settings = $(this).data("settings");
                // Hide instruction
                $(this).find("#splash").hide();
                $(this).find("#values ul").show();
                settings.interactive=true;
                helpers.move($(this), true);
            },
            key: function(value) { helpers.key($(this), value, false); },
            click: function(value) { helpers.key($(this), value, false); },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in sequence plugin!'); }
    };
})(jQuery);

