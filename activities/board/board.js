(function($) {
    // Activity default options
    var defaults = {
        name        : "board",                                  // The activity name
        label       : "Board",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        paintmode   : 0,                        // O:opaque, 1:add, 2:sub, 3:def
        colors      : [[0,0,0],[255,255,255]],
        colorsfont  : 2,
        brushes     : [[3,3]],
        brushesfont : 3,
        exercice    : [],                                       // Exercice
        background  : "",
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
            $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
        },
        // End all timers
        quit: function($this) {
            var settings = helpers.settings($this);
            // if (settings.timerid) { clearTimeout(settings.timerid); }
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

                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                
                // PREPARE MODE + COLORS + BRUSHES
                setTimeout(function() { $this.find("#modes #mmode"+settings.paintmode).show(); }, 100);
                
                for (var i in settings.colors) {
                    var c=settings.colors[i];
                    var $elt = $("<div class='icon' id='c"+i+"' "+
                             "style='background-color:rgb("+c[0]+","+c[1]+","+c[2]+")'></div>");
                    $this.find("#colors").append($elt);
                }
                $this.find("#colors").css("font-size",settings.colorsfont+"em");
                
                var maxw=0,maxh=0;
                var sizes=[];
                for (var i in settings.brushes) {
                    var brush=settings.brushes[i];
                    var bh=brush.length, bw = 0;
                    maxh=Math.max(maxh,bh);
                    for (var j in brush) {
                        var bit = 1;
                        for (var b=0; b<8; b++) { if ((brush[j]&bit)!=0) { bw=b+1; } bit*=2; }
                    }
                    maxw=Math.max(maxw,bw);
                    sizes.push([bw,bh]);
                }
                var max=Math.max(maxw,maxh);
                for (var i=0; i<settings.brushes.length; i++) {
                    var brush=settings.brushes[i];
                    var $elt=$("<div class='icon' id='b'"+i+"'></div>");
                    var svg="<svg width='100%' height='100%' viewBox='0 0 56 56'>";
                    for (var j=0; j<brush.length; j++) {
                        var bit = 1;
                        var offx = (max-sizes[i][0])/2;
                        var offy = (max-sizes[i][1])/2;
                        for (var b=0; b<max; b++) {
                            if ((brush[j]&bit)!=0) {
                                svg+="<rect x='"+(4+(48/max)*(max-b-1-offx))+"' y='"+(4+(48/max)*(j+offy))+"' width='"+((48/max)+0.5)+"' height='"+((48/max)+0.5)+"'/>";
                            }
                            bit*=2;
                        }
                    }
                    svg+="</svg>";
                    $elt.html(svg);
                    $this.find("#brushes").append($elt);
                }
                $this.find("#brushes").css("font-size",settings.brushesfont+"em");
                
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.board = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false
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
            devmode: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devoutput textarea").val("Debug output").parent().show();
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in board plugin!'); }
    };
})(jQuery);

