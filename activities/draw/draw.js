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
        object      : "path",                                   // type of drawing
        garbage     : [],                                       // garbage elements
        nomenu      : false,                                    // No menu
        debug       : true                                     // Debug mode
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
            $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
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

                var svgContent = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' "+
                            " width='100%' height='100%' viewBox='0 0 "+settings.size[0]+" "+settings.size[1]+"' id='jdraw'><def><style>"+
                            "svg#jdraw path,circle,line,rect {fill:none; stroke:black; stroke-linecap:round;stroke-linejoin:round}"+
                            "</style></def>"+
                            (settings.background?"<rect x='0' y='0' width='"+settings.size[0]+"' height='"+settings.size[1]+"' style='stroke:none;fill:"+settings.background+";'/>":"")+
                            "</svg>";

                $this.find("#board").svg();
                settings.svg = $this.find("#board").svg('get');
                settings.svg.load(svgContent, { addTo: false, changeSize: true});

                settings.group = settings.svg.group();
                $(settings.group).attr("id","foreground");

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
                    switch(settings.object) {
                        case "line":
                            settings.path = settings.svg.line( settings.group,
                                (settings.first[0] - settings.offset[0])*settings.ratio,
                                (settings.first[1] - settings.offset[1])*settings.ratio,
                                (settings.first[0] - settings.offset[0])*settings.ratio,
                                (settings.first[1] - settings.offset[1])*settings.ratio);
                            break;
                        case "rect":
                            settings.path = settings.svg.rect( settings.group,
                                (settings.first[0] - settings.offset[0])*settings.ratio,
                                (settings.first[1] - settings.offset[1])*settings.ratio,0,0);
                            break;
                        case "circle":
                            settings.path = settings.svg.circle( settings.group,
                                (settings.first[0] - settings.offset[0])*settings.ratio,
                                (settings.first[1] - settings.offset[1])*settings.ratio, 0 );
                            break;
                        default:
                            settings.path = settings.svg.path( settings.group,
                              settings.path.move(  
                                (settings.first[0] - settings.offset[0])*settings.ratio,
                                (settings.first[1] - settings.offset[1])*settings.ratio ) );
                            break;
                    }

                    $(settings.path).css("stroke", settings.stroke).css("stroke-width", settings.strokewidth);
                    
                    _event.preventDefault();
                });

                $this.bind("touchend touchleave mouseup mouseleave", function(_event) {
                    if (settings.path) {
                        var e = (_event && _event.originalEvent &&
                                 _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                 _event.originalEvent.touches[0]:_event;
                        settings.path = 0;

                        $this.find("#prev").removeClass("d");
                        settings.garbage=[];
                        $this.find("#next").addClass("d");

                        if (settings.context.onchange) { settings.context.onchange($this, settings.svg); }

                        _event.preventDefault();
                    }
                });

                $this.bind("mousemove touchmove", function(_event) {
                    if (settings.path) {
                        var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                        if (Math.abs(settings.last[0] - e.clientX)+Math.abs(settings.last[1] - e.clientY)>5) {

                            switch(settings.object) {
                                case "rect":
                                    var w = (e.clientX - settings.first[0])*settings.ratio;
                                    var h = (e.clientY - settings.first[1])*settings.ratio;
                                    $(settings.path).attr({
                                        x: ( (w>0?settings.first[0]:e.clientX) - settings.offset[0])*settings.ratio,
                                        y: ( (h>0?settings.first[1]:e.clientY) - settings.offset[1])*settings.ratio,
                                        width: Math.abs(w) , height: Math.abs(h) });
                                    break;
                                case "line":
                                    $(settings.path).attr({x2: (e.clientX - settings.offset[0])*settings.ratio,
                                                           y2: (e.clientY - settings.offset[1])*settings.ratio });
                                    break;
                                case "circle":
                                    $(settings.path).attr({r:
                                        settings.ratio* Math.sqrt(((settings.first[0] - e.clientX) * (settings.first[0] - e.clientX)) +
                                                                  ((settings.first[1] - e.clientY) * (settings.first[1] - e.clientY)) ) });
                                    break;
                                default:
                                    $(settings.path).attr({d:
                                        $(settings.path).attr("d")+" L "+
                                            (e.clientX - settings.offset[0])*settings.ratio + "," +
                                            (e.clientY - settings.offset[1])*settings.ratio });
                                    break;
                            }

                            settings.last = [ e.clientX, e.clientY ];
                        }
                        _event.preventDefault();
                    }
                });

                // MENU BUTTONS
                if (settings.nomenu) { $this.find("#menu").hide(); }
                else {
                    $this.find("#menu .icon").bind("mousedown touchstart", function(_event) {
                        $(this).closest(".action").find(".icon").removeClass("s");
                        $(this).addClass("s");
                        switch ($(this).attr("id")) {
                            case "path" :   settings.object = "path";   break;
                            case "circle" : settings.object = "circle"; break;
                            case "rect" :   settings.object = "rect";   break;
                            case "line" :   settings.object = "line";   break;
                            case "black":   settings.stroke = "black";  break;
                            case "red":     settings.stroke = "red";    break;
                            case "green":   settings.stroke = "green";  break;
                            case "blue":    settings.stroke = "blue";   break;
                            case "white":   settings.stroke = "white";  break;
                            case "yellow":  settings.stroke = "yellow"; break;
                            case "cyan":    settings.stroke = "cyan";   break;
                            case "purple":  settings.stroke = "purple"; break;
                            case "dot1":    settings.strokewidth = 1;   break;
                            case "dot2":    settings.strokewidth = 3;   break;
                            case "dot3":    settings.strokewidth = 6;   break;
                            case "dot4":    settings.strokewidth = 9;   break;
                            case "clear":   helpers.clean($this); 
                                            if (settings.context.onchange) { settings.context.onchange($this, settings.svg); } break;
                            case "prev":
                                if ($("#foreground", settings.svg.root()).children().length) {
                                    settings.garbage.push($("#foreground", settings.svg.root()).children().last().detach());
                                    $this.find("#next").removeClass("d");
                                    if (!$("#foreground", settings.svg.root()).children().length) { $this.find("#prev").addClass("d"); }
                                    if (settings.context.onchange) { settings.context.onchange($this, settings.svg); }
                                }
                                break;
                            case "next":
                                if (settings.garbage.length) {
                                    $("#foreground", settings.svg.root()).append(settings.garbage.pop());
                                    $this.find("#prev").removeClass("d");
                                    if (!settings.garbage.length) { $this.find("#next").addClass("d"); }
                                    if (settings.context.onchange) { settings.context.onchange($this, settings.svg); }
                                }
                            break;
                        }
                        _event.preventDefault();
                    });
                }

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this, settings.svg); }

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }


                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        clean: function($this) {
            var settings = helpers.settings($this);
            if (settings.svg) { $("#foreground>*", settings.svg.root()).detach();}
            $this.find("#prev").addClass("d");
            $this.find("#next").addClass("d");
            settings.garbage=[];
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
            clean: function() { helpers.clean($(this)); },
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

