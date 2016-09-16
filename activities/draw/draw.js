(function($) {
    // Activity default options
    var defaults = {
        name        : "draw",                            // The activity name
        label       : "Draw",                            // The activity label
        template    : "template.html",                   // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        size        : [640,480],                                // Exercice
        background  : "white",                                  // Background
        stroke      : "black",                                  // Stroke color
        strokewidth : 3,                                        // stroke width
        debug       : false                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
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
                var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", ($this.height()/12)+"px");


                var svgContent = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' "+
                            " width='100%' height='100%' viewBox='0 0 "+settings.size[0]+" "+settings.size[1]+"'><def><style>"+
                            "path {fill:none; stroke:black; stroke-linecap:round;stroke-linejoin:round}"+
                            "</style></def>"+
                            (settings.background?"<rect x='0' y='0' width='"+settings.size[0]+"' height='"+settings.size[1]+"' style='fill:"+settings.background+";'/>":"")+
                            "</svg>";

                $this.find("#board").svg();
                settings.svg = $this.find("#board").svg('get');
                settings.svg.load(svgContent, { addTo: false, changeSize: true});

                settings.group = settings.svg.group();

                $this.find("#board").bind("touchstart mousedown", function(_event) {
                    var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                    if (!settings.ratio) {
                        settings.ratio  = settings.size[0]/$(this).width();
                        settings.offset = [$(this).offset().left, $(this).offset().top];
                    }

                    settings.first  = [ e.clientX, e.clientY ];
                    settings.last   = [ e.clientX, e.clientY ];
                    settings.path = settings.svg.createPath();
                    settings.path = settings.svg.path( settings.group,
                      settings.path.move(  
                        (settings.last[0] - settings.offset[0])*settings.ratio,
                        (settings.last[1] - settings.offset[1])*settings.ratio ) );

                    $(settings.path).css("stroke", settings.stroke).css("stroke-width", settings.strokewidth);
                    
                    _event.preventDefault();
                });

                $this.bind("touchend mouseup", function(_event) {
                    if (settings.path) {
                        var e = (_event && _event.originalEvent &&
                                 _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                 _event.originalEvent.touches[0]:_event;
                        settings.path = 0;

                        _event.preventDefault();
                    }
                });

                $this.bind("mousemove touchmove", function(_event) {
                    if (settings.path) {
                        var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                        if (Math.abs(settings.last[0] - e.clientX)+Math.abs(settings.last[1] - e.clientY)>5) {

                            settings.last = [ e.clientX, e.clientY ];
                            $(settings.path).attr({d:
                                $(settings.path).attr("d")+" L "+
                                    (e.clientX - settings.offset[0])*settings.ratio + "," +
                                    (e.clientY - settings.offset[1])*settings.ratio });
                        }
                        _event.preventDefault();
                    }
                });


                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }


                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.draw = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    offset          : [0,0],
                    first           : [0,0],
                    last            : [0,0],
                    path            : 0,
                    ratio           : 0
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
                        if ($settings["class"]) { $this.addClass($settings["class"]); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            clean: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.svg) { $("path",settings.svg.root()).detach(); }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in draw plugin!'); }
    };
})(jQuery);

