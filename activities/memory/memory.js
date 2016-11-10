(function($) {
    // Memory default options
    var defaults = {
        name        : "memory",             // The activity name
        template    : "template.html",      // Memory's html template
        css         : "style.css",          // Mermory's css style sheet
        lang        : "fr-FR",              // Current localization
        delay       : 2000,                 // Time of display the values
        attempt     : 0,                    // Number of errors authorized
        score       : 1,                    // The score (from 1 to 5)
        level       : 3,                    // The beginning level
        inclevel    : true,                 // Increase the level after each success
        debug       : false                 // Debug mode
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
            $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
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
                var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onload) { settings.context.onload($this); }

                // Resize the template
                $this.css("font-size", Math.floor((Math.min($this.width(),$this.height())-7)/5)+"px");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if(settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                var n = settings.level;
                if (settings.inclevel) n=n+"+";
                $this.find("#number_v").html(n);
                $this.find("#exposure_v").html(settings.delay/1000);
                $this.find("#error_v").html(settings.attempt);
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        hide: function($this) {
            $this.addClass("active").find("td div").each(function(index) { $(this).text(""); });
            helpers.settings($this).response=0;
        },
        // compute the score
        score:function(level, count, inclevel, error) {
            var l = Math.floor((level-3)/2);
            if (!inclevel) { l = Math.ceil(count-error/2); }
            if (l>5) { l = 5; }
            if (l<0) { l = 0; }
            return l;
        },
        cont: function($this) {
            var settings = helpers.settings($this);
            // Load the template
            $this.addClass("active").find(".false").removeClass("false").addClass("active").children().text("");
            settings.response--;
        }
    };

    // The plugin
    $.fn.memory = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The initial settings
                var settings = {
                    response    : 0,        // The number of good found values
                    soluce      : [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    position    : [ 0, 4096,  10240,      21504,      328000,     145536,
                                    459200,   342336,     469440,     473536,     10824010,
                                    720544,   1034208,    1038304,    15149518,   15153614,
                                    33080895, 33084991,   33091135,   33216191,   33408895,
                                    33412991, 33419135,   33544191,   33550335,   33554431 ],
                    error       : 0,        // The number of errors
                    count       : 0         // The number of succeed grid
                };

                return this.each(function() {
                    // Update the settings
                    var $this = $(this);
                    helpers.unbind($this);

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
            // Next level
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);

                 // build the numbers array
                var a = new Array();
                for (i=0; i<settings.level; i++) { a.push(i); }
                for (i=0; i<100; i++) {
                    var first = Math.floor(Math.random()*settings.level);
                    var second = Math.floor(Math.random()*settings.level);
                    var swap = a[first];
                    a[first] = a[second];
                    a[second] = swap;
                }

                // fill the grid
                var i=0;
                $(this).find("td div").each(function(index) {
                    $(this).text("").parent().removeClass("good").removeClass("false").removeClass("active");
                    if (settings.position[settings.level]&Math.pow(2,index)){
                        $(this).text(a[i]+1).parent().addClass("active");
                        settings.soluce[index] = a[i]+1;
                        i++;
                    }
                });

                // launch the game
                var $this=$(this);
                setTimeout(function() { helpers.hide($this); } , settings.delay);
            },
            // click on a cell for showing the value
            click: function(elt, value) {
               var $this = $(this) , settings = helpers.settings($this);
               var $elt=$(elt), $this=$(this);
               if ($this.hasClass("active") && $elt.hasClass("active")) {
                    $elt.removeClass("active").children().text(settings.soluce[value-1]);
                    if (settings.soluce[value-1]==++settings.response) {
                        $elt.addClass("good");
                        if (settings.response >= settings.level) {
                            $this.removeClass("active");
                            settings.count++;
                            if (settings.inclevel) { settings.level++; }
                            if (settings.level>25 || (!settings.inclevel && settings.count>=5)) {
                                settings.score = helpers.score(settings.level, settings.count, settings.inclevel, settings.error);
                                setTimeout(function() { helpers.end($this); }, 1000);
                            }
                            else {
                                setTimeout(function() { $this.memory('next')}, 500);
                            }
                        }
                    }
                    else {
                        $elt.addClass("false");
                        $this.removeClass("active");
                        if (++settings.error>settings.attempt) {
                            settings.score = helpers.score(settings.level, settings.count, settings.inclevel, settings.error);
                            $this.find("#score").addClass(settings.showscore?"s"+settings.score:"done").show();
                            setTimeout(function() { helpers.end($this); }, 2000);
                        }
                        else {
                            setTimeout(function() { helpers.cont($this); }, 300);
                        }
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory plugin!'); }
    };
})(jQuery);
