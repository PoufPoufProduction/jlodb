(function($) {
    // Activity default parameters
    var defaults = {
        name        : "equation",               // The activity name
        template    : "template.html",          // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // Current localization
        url         : "desktop/equation.svg",   // The equation svg
        font        : 1,                        // Font size of the exercice
        source      : [],                       // Source element
        top         : 20,                       // top position of the first equation
        debug       : false                     // Debug mode
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
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                if (settings.context.onload) { settings.context.onload(true); }

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
                $this.load( templatepath, function(response, status, xhr) {
                    if (status=="error") {
                        settings.context.onquit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                    }
                    else { helpers.loader.svg($this); }
                });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div></div>").appendTo($this.find("#svg"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings.class);
                settings.svg.load('res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onLoad) { settings.context.onLoad(false); }
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                // EXERCICE AND FIGURE
                if (settings.figure) { $this.find("#figure").html("<img src='res/img/"+settings.figure+"'/>"); }
                if (settings.exercice) {
                    if ($.isArray(settings.exercice)) {
                        $this.find("#exercice").html("");
                        for (var i in settings.exercice) { $this.find("#exercice").append("<p>"+settings.exercice[i]+"</p>"); }
                    }
                    else { $this.find("#exercice").html("<p>"+settings.exercice+"</p>"); }
                }
                $this.find("#exercice p").css("font-size",(0.6*settings.font)+"em");

                // SOURCE
                for (var i in settings.source) {
                    var $val = $("#template .val", settings.svg.root()).clone().appendTo($("#source", settings.svg.root()));
                    $val.attr("transform","translate(40,"+(40+i*50)+")").attr("class","val source");
                    $("text",$val).text(settings.source[i]);

                    $val.bind("mousedown touchstart", function() {
                        //$(this).clone().appendTo($("#source", settings.svg.root()));
                    });
                }

                // EQUATIONS
                for (var i=0; i<settings.data.length; i++) {
                    var $equ = $("#template .equ", settings.svg.root()).clone().appendTo($("#equ", settings.svg.root()));
                    $equ.attr("transform","translate(85,"+(settings.top+i*50)+")").attr("class","equ");
                    if (i!=settings.data.length-1) { $equ.find(".large").hide(); } else { $equ.find(".small").hide(); }

                }


                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.equation = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    score           : 0,                        // The score
                    interactive     : false                    // Entry allowed or not
                };

                 // Check the context and send the load
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
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                var settings = $(this).data("settings");
                $(this).find("#splash").hide();
                settings.interactive=true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            submit: function() { helpers.submit($(this)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in equation plugin!'); }
    };
})(jQuery);

