(function($) {
    // Activity default options
    var defaults = {
        name        : "numbers",                                // The activity name
        label       : "Numbers",                                // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        width       : 1.2,                                      // Cell width
        init        : 0,                                        // Initial value for empty cell
        range       : [0, 100],                                 // Range
        step1       : [10,10],                                  // Vertical step
        step2       : [1,1],                                    // Horizontal step
        fontex      : 1,                                        // Exercice font size
        debug       : false                                     // Debug mode
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
        // Binding clear
        unbind: function($this) {
            $(document).unbind("keypress keydown");
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
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
                var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");
                helpers.build($this);

                if (!settings.step2) { $this.find(".arrow.e").hide(); }

                // DISPLAY STUFF
                if (settings.exercice) { $this.find("#exercice>div").html(settings.exercice); }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");
                $this.find("#exercice").show();

                $this.bind("mousemove touchmove", function(_event) {
                    if (settings.popup.active) {
                        var vEvent = (_event && _event.originalEvent &&
                                    _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                    _event.originalEvent.touches[0]:_event;

                        var vDirection = -1;

                        if (vEvent.clientY-settings.popup.y>settings.popup.s/4  && settings.step1)    { vDirection = 1; } else
                        if (vEvent.clientY-settings.popup.y<-settings.popup.s/4 && settings.step1)    { vDirection = 0; } else
                        if (vEvent.clientX-settings.popup.x>settings.popup.s/4  && settings.step2)    { vDirection = 2; } else
                        if (vEvent.clientX-settings.popup.x<-settings.popup.s/4 && settings.step2)    { vDirection = 3; } else {
                            if (settings.popup.timer) {
                                clearTimeout(settings.popup.timer);
                                settings.popup.timer = 0;
                                settings.popup.count = 0;
                                settings.popup.direction = -1;
                                $this.find(".arrow").removeClass("s").css("opacity",1);
                            }
                        }

                        if (vDirection!=-1) {
                            if (vDirection!=settings.popup.direction) {
                                if (settings.popup.timer) {
                                    clearTimeout(settings.popup.timer);
                                    settings.popup.timer = 0;
                                    $this.find(".arrow").removeClass("s");
                                }
                                settings.popup.count = 0;
                                settings.popup.direction = vDirection;
                            }
                            if (!settings.popup.timer) {
                                $this.find(".arrow").css("opacity",0.3);
                                $this.find(".arrow#a"+settings.popup.direction).addClass("s").css("opacity",1);
                                settings.popup.timer = setTimeout(function() { helpers.update($this); }, 0);
                            }
                        }


                    }
                    event.preventDefault();
                });

                $this.bind("mouseup touchend", function(_event) {
                    $this.find("#popup").hide();
                    settings.popup.active = false;
                    if (settings.popup.timer) {
                        clearTimeout(settings.popup.timer);
                        settings.popup.timer = 0;
                        $this.find(".arrow").removeClass("s");
                    }
                    event.preventDefault();

                });


                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build:function($this) {
            var settings = helpers.settings($this);
            var vSettings = settings;
            if (settings.data) { vSettings = settings.data[settings.id]; }

            $this.find("#submit").removeClass();
            $this.find("#board>div#data").html("");
            $this.find("#effects").hide();
            $this.find("#effects>div").hide();
            for (var j in vSettings.values) {
                var html="<div class='line'>";
                for (var i in vSettings.values[j]) {
                    html+="<div class='cell' id='"+i+"x"+j+"' style='width:"+settings.width+"em;'><div onmousedown='$(this).closest(\".numbers\").numbers(\"down\",event,this);' ontouchstart='$(this).closest(\".numbers\").numbers(\"down\",event,this);event.preventDefault();'></div></div>";
                }
                html+="</div>";
                $this.find("#board>div#data").append(html);
            }
            for (var i in vSettings.fixed) {
                var vValue = vSettings.values[vSettings.fixed[i][1]][vSettings.fixed[i][0]];
                var $vCell = $this.find("#"+vSettings.fixed[i][0]+"x"+vSettings.fixed[i][1]+".cell");
                $vCell.addClass("fixed").find("div").html(vValue);
                if (!vValue.length) { $vCell.addClass("empty"); }
            }
            var min = Math.min(15.6/(vSettings.values[0].length*settings.width),
                               8.9/vSettings.values.length);
            min = Math.floor(min*20)/20;

            $this.find("#board>div").css("font-size", min+"em").css("width",(vSettings.values[0].length*settings.width)+"em");
            $this.find("#popup").css("font-size", (1.2*min)+"em");

            var offV = $this.find("#board").height() - $this.find("#board>div").height();
            if (offV<5) { offV=5; }
            $this.find("#board>div").css("margin-top", (offV/2.5)+"px");

            var offH = $this.find("#board").width() - $this.find("#board>div").width();
            if (offH<4) { offH=4; }
            $this.find("#board>div").css("margin-left", (offH/2)+"px");
        },
        update: function($this) {
            var settings = helpers.settings($this);
            var upd=0;
            var step = settings.popup.direction<2?settings.step1:settings.step2;
            var slow = Math.floor(step[1]/step[0]);
            var stepip = (settings.popup.count>=slow)?1:0;
            var time = settings.popup.count<5?300/(settings.popup.count+1):100;
            switch(settings.popup.direction) {
                case 0: upd = step[stepip]; break;
                case 1: upd =-step[stepip]; break;
                case 2: upd = step[stepip]; break;
                case 3: upd =-step[stepip]; break;
            }
            var val = parseFloat(settings.popup.$elt.html())+upd;
            if (val<settings.range[0]) { val = settings.range[0]; }
            if (val>settings.range[1]) { val = settings.range[1]; }
            settings.popup.$elt.html(val);
            settings.popup.count++;
            settings.popup.timer = setTimeout(function() { helpers.update($this); }, time);
        }
    };

    // The plugin
    $.fn.numbers = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    score           : 5,
                    id              : 0,
                    popup: { active:false, x:0, y:0, s:0, $elt:0, timer:0 }
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);

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
                var $this = $(this) , settings = helpers.settings($this);
                $(this).find("#splash").hide();
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            down: function(_event, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && !$(_elt).parent().hasClass("fixed")) {
                    var $keypad = $this.find("#popup ");
                    var vEvent = (_event && _event.originalEvent &&
                                _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                _event.originalEvent.touches[0]:_event;

                    settings.popup.s = $keypad.height();
                    var vTop = vEvent.clientY - $this.offset().top-settings.popup.s/2;
                    var vLeft = vEvent.clientX - $this.offset().left-settings.popup.s/2;

                    settings.popup.active = true;
                    settings.popup.x = vEvent.clientX;
                    settings.popup.y = vEvent.clientY;
                    settings.popup.$elt = $(_elt);
                    settings.popup.timer= 0;
                    settings.popup.direction = -1;
                    settings.popup.count = 0;

                    if (!$(_elt).html().length) { $(_elt).html(settings.init); }

                    if (vTop<0)   { vTop = 0; }
                    if (vLeft<0)  { vLeft = 0; }
                    if (vTop+settings.popup.s>$this.height())    { vTop=$this.height()-settings.popup.s; }
                    if (vLeft+settings.popup.s>$this.width())    { vLeft=$this.width()-settings.popup.s; }
                    $keypad.find("#border").show().css("opacity",1).animate({opacity:0},1000);
                    $keypad.find(".arrow").css("opacity",1);
                    $keypad.css("top", vTop+"px").css("left", vLeft+"px").show();
                }
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                var vSettings = settings;
                if (settings.data) { vSettings = settings.data[settings.id]; }
                if (settings.interactive) {
                    var good = true;
                    settings.interactive = false;
                    for (var j in vSettings.values) for (var i in vSettings.values[j]) {
                        var $cell = $this.find(".cell#"+i+"x"+j+">div");
                        if (vSettings.values[j][i]!=$cell.text()) {
                            settings.score--;
                            good = false;
                            $cell.addClass("wrong");
                        }
                    }

                    if (good) { $this.find("#effects #good").show(); }
                    else      { $this.find("#effects #wrong").show(); }
                    $this.find("#effects").show();

                    $this.find("#submit").addClass(good?"good":"wrong");
                    settings.id++;
                    if (settings.data && settings.id<settings.data.length) {
                        setTimeout(function() { helpers.build($this); settings.interactive=true; }, 1000);
                    }
                    else {
                        if (settings.score<0) { settings.score = 0; }
                        setTimeout(function() { helpers.end($this); }, 1000);
                    }
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in numbers plugin!'); }
    };
})(jQuery);

