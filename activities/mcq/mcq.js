(function($) {
    // Activity default options
    var defaults = {
        name        : "mcq",                                    // The activity name
        label       : "Multiple choice questions",              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        number      : 0,                                        // Number of exercices during the same session
        multiple    : false,                                    // General multiple choices
        debug       : false                                     // Debug mode
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
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = $this.data("settings");
            settings.context.onQuit({'status':'success','score':settings.score});
        },
        // Update the timer
        timer:function($this) {
            var settings = $this.data("settings");
            settings.timer.value++;
            var vS = settings.timer.value%60;
            var vM = Math.floor(settings.timer.value/60)%60;
            var vH = Math.floor(settings.timer.value/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            $this.find("#time").text((vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS);
            if (settings.context.onSeconds) { settings.context.onSeconds(settings.timer.value); }
            settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000);
        },
        // Handle the elements sizes and show the activity
        resize: function($this) {
            var settings = $this.data("settings");

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(false); }

            // Prepare the questions
            if (!settings.number || settings.number>settings.data.length) { settings.number = settings.data.length; }
            for (var i=0; i<settings.number; i++) {
                var questionid = i;
                if (settings.number!=settings.data.length) {
                    do {
                        questionid = Math.floor(Math.random()*settings.data.length);
                        var vAlreadyUsed = false;
                        for (var j=0; j<settings.questions.length; j++) {
                                if (settings.questions[j]==questionid) { vAlreadyUsed = true; }
                        }
                    } while (vAlreadyUsed);
                }
                settings.questions.push(questionid);
            }

            // Resize the template
            $this.css("font-size", Math.floor($this.height()/16)+"px");

            // Locale handling
            $this.find("h1#label").html(settings.label);
            $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });

            // Decoration
            if (settings.fgl) { $this.find("#fgl").html("<img src='res/img/"+settings.fgl+".svg'/>"); }
        },
        // Build the question
        build: function($this) {
            var settings = $this.data("settings");
            var classvalue="";
            if (settings.data[settings.it].class) { classvalue= settings.data[settings.it].class; }

            $this.find("#submit").show().attr("class","");
            $this.find("#board").attr("class",classvalue);
            $this.find("#board #responses").html("");
            $this.find("#board #text").html(settings.data[settings.it].question);

            settings.questmul = settings.multiple;
            if (settings.data[settings.it].good.length>1) { settings.questmul = true; }

            settings.r = $.merge([], settings.data[settings.it].good);
            if (settings.data[settings.it].wrong) { settings.r = $.merge(settings.r, settings.data[settings.it].wrong).sort(); }
            $this.find("#board #responses").attr("class","nb"+settings.r.length);

            $(settings.r).each(function(_index) {
                var html = "<div id=\""+_index+"\" ";
                html+="onclick=\"$(this).closest('.mcq').mcq('click',this);\" ";
                html+="ontouchstart=\"$(this).closest('.mcq').mcq('click',this);event.preventDefault();\" ";
                html+=">"+this+"</div>";
                $this.find("#board #responses").append(html);
            });
        },
        // Load the different elements of the activity
        load: function($this) {
            var settings = $this.data("settings");
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
        }
    };

    // The plugin
    $.fn.mcq = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    timer: {                // the general timer
                        id      : 0,        // the timer id
                        value   : 0         // the timer value
                    },
                    questions : [],         // the list of questions id
                    questmul  : false,      // the current question is multiple
                    r         : [],         // the current list of responses
                    it        : 0,          // the questions list iterator,
                    wrong     : 0
                };

                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");
                    this.onselectstart = function() { return false; }

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.load($(this).addClass(defaults.name).data("settings", $settings));
                    }
                });
            },
            click: function(elt) {
                var $this = $(this) , settings = $this.data("settings");
                if (!settings.finish && !$this.find("#board").hasClass("inactive")) {
                    if (!settings.questmul) { $this.find("#responses div").removeClass("selected"); }
                    $(elt).toggleClass("selected");
                }
            },
            submit: function(elt) {
                var $this = $(this) , settings = $this.data("settings");
                if (!settings.finish && !$this.find("#board").hasClass("inactive")) {
                    $this.find("#board").addClass("inactive");

                    // CHECK THE RESPONSES
                    var nbChecked = 0;
                    var good = true;
                    $this.find(".selected").each(function() {
                        var html = settings.r[$(this).attr("id")];
                        if (settings.data[settings.it].wrong) {
                            $(settings.data[settings.it].wrong).each(function() { if (this==html) { good = false; } });
                        }
                        nbChecked++;
                    });
                    if (nbChecked!=settings.data[settings.it].good.length) { good=false; }

                    if (!good) { settings.wrong++; }
                    var value = good?"good":"wrong";
                    $(elt).addClass(value);

                    if (++settings.it >= settings.number) {
                        settings.score = Math.floor(5-settings.wrong/2);
                        if (settings.score<0) { settings.score = 0; }
                        clearTimeout(settings.timer.id);

                        setTimeout(function() { helpers.end($this); }, 2000);

                    }
                    else {  setTimeout(function() { helpers.build($this); }, good?1000:2000); }
                }
            },
            quit: function() {
                var $this = $(this) , settings = $this.data("settings");
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            next: function() {
                $(this).find("#intro").hide();
                // CHECK IF THERE IS AN EVENT BEFORE QUESTION
                if (false) {
                }
                else {
                    helpers.timer($(this));
                    helpers.build($(this));
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mcq plugin!'); }
    };
})(jQuery);

