(function($) {
    // Activity default options
    var defaults = {
        name        : "wordmix",                            // The activity name
        label       : "Wordmix",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        prefix      : "",                                   // prefix for illustration
        grid        : [""],
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

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                settings.result = [];

                if (settings.legend) {
                    settings.legend.sort();
                    for (var i=0; i<settings.legend.length; i++) {
                        var legend = settings.legend[i];
                        if ($.isArray(legend)) { settings.result.push(legend[1]); legend = legend[0]; }
                        else                   { settings.result.push(legend); }
                        $this.find("#values").append("<div id='l"+i+"' class='txt'>"+legend+"</div>");
                    }
                }
                else
                if (settings.illustration) {
                    for (var i in settings.illustration) {
                        settings.result.push(settings.illustration[i][1]);
                        $this.find("#values").append("<div id='l"+i+"' class='icon'><img src='res/img/"+
                                                     settings.prefix+settings.illustration[i][0]+".svg'/></div>");
                    }
                }

                var sy = settings.grid.length, sx = settings.grid[0].length, s=Math.max(sx,sy);
                var ss = 100/s;
                var offset = s-sx;

                var svgContent = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' "+
                            " width='100%' height='100%' viewBox='0 0 100 100' id='mix'><def><style>"+
                            "#mix .a { stroke-dasharray:8,8; }"+
                            "#mix text { font-size: "+ss+"px;text-anchor:middle; }"+
                            ".done #mix line {stroke:#0F0; }"+
                            "#mix line { fill:none; stroke:yellow; stroke-linecap:round; stroke-opacity:0.4; stroke-width:0.8; }"+
                            "#mix line#user { stroke:red; }" +
                            "</style></def>";

                svgContent += "<g transform='translate("+offset*ss+",0)'>";
                svgContent += "<rect x='0' y='0' width='"+sx*ss+"' height='"+sy*ss+"' style='fill:#ccc;'/>";
                for (var j=0; j<settings.grid.length; j++) for (var i=0; i<settings.grid[j].length; i++) {
                    svgContent += "<g transform='translate("+((i+0.5)*ss)+","+((j+0.5)*ss)+")' >";
                    svgContent += "<rect x='"+(-0.48*ss)+"' y='"+(-0.48*ss)+"' height='"+(0.96*ss)+"' width='"+(0.96*ss)+"' "+
                                    "transform='rotate("+((Math.random()-0.5)*2)+")' style='fill:white;'/>";
                    svgContent += "<text y='"+ss/3+"'>"+settings.grid[j][i]+"</text>";
                    svgContent += "</g>";
                }

                svgContent += "<g id='lines' transform='scale("+ss+")'></g>";
                svgContent += "</g>";

                svgContent += "</svg>";
                var $board = $this.find("#board>div");

                settings.data = { sx:sx, sy:sy, s:s, ss:ss, offset:offset, pos:0 };

                $board.svg();
                settings.board = $board.svg('get');
                settings.board.load(svgContent, { addTo: false, changeSize: true});

                setTimeout(function() { helpers.handle($this); }, 100);


                // Exercice
                if (settings.exercice) {
                    if ($.isArray(settings.exercice)) {
                        $this.find("#exercice").html("");
                        for (var i in settings.exercice) { $this.find("#exercice").append(
                            "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                    } else { $this.find("#exercice").html(helpers.format(settings.exercice)); }
                    setTimeout(function() { $this.find("#exercice").show(); }, 100);
                }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        handle: function($this) {
            var settings = helpers.settings($this);

            var $board = $this.find("#board>div");
            settings.data.$group = $("#lines", settings.board.root());

            $board.bind("mousedown touchstart", function(event) {
                settings.data.pos = 0;
                $("#user",settings.board.root()).detach();
                settings.data.line= 0;
                if (settings.interactive) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                         event.originalEvent.touches[0]:event;

                    var px = Math.floor(((vEvent.clientX-$(this).offset().left)/$(this).width())*settings.data.s) -
                             settings.data.offset;
                    var py = Math.floor(((vEvent.clientY-$(this).offset().top)/$(this).height())*settings.data.s);

                    if (px>=0 && px<settings.data.sx && py>=0 && py<settings.data.sy ) {
                        settings.data.pos = [px, py];
                        settings.data.line = settings.board.line(settings.data.$group, px+0.5, py+0.5, px+0.5, py+0.5, {id:"user"});
                    }
                }
                
                event.preventDefault();
            });

            $board.bind("mousemove touchmove", function(event) {
                if (settings.data.pos && settings.data.line) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;

                    var px = Math.floor(((vEvent.clientX-$(this).offset().left)/$(this).width())*settings.data.s) -
                             settings.data.offset;
                    var py = Math.floor(((vEvent.clientY-$(this).offset().top)/$(this).height())*settings.data.s);

                    if (px!=settings.data.pos[0] && py!=settings.data.pos[1]) {
                        var r = Math.abs(px-settings.data.pos[0]) / Math.abs(py-settings.data.pos[1]);

                        if (r<0.5)  { px = settings.data.pos[0]; } else
                        if (r<2)    {
                            var v = Math.round((Math.abs(px-settings.data.pos[0])+Math.abs(py-settings.data.pos[1]))/2);
                            px = settings.data.pos[0]+(px<settings.data.pos[0]?-v:v);
                            py = settings.data.pos[1]+(py<settings.data.pos[1]?-v:v);
                        } else { py = settings.data.pos[1]; }
                    }

                    if (px>=0 && px<settings.data.sx && py>=0 && py<settings.data.sy ) {
                        $(settings.data.line).attr("x2", px+0.5);
                        $(settings.data.line).attr("y2", py+0.5);
                        settings.data.pos = [ settings.data.pos[0], settings.data.pos[1], px, py ]; 
                    }
                    event.preventDefault();
                }
            });

            $board.bind("mouseup mouseleave touchend touchleave", function(event) {
                if (settings.data.pos && settings.data.line) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;
                    if (settings.data.pos && settings.data.pos.length==4 && settings.data.line) {
                        var nb = 1+ Math.max( Math.abs(settings.data.pos[0]-settings.data.pos[2]),
                                              Math.abs(settings.data.pos[1]-settings.data.pos[3]));

                        var w="", rw="";
                        var rx = 0, ry = 0;
                        if (settings.data.pos[0]<settings.data.pos[2]) { rx = 1; }
                        if (settings.data.pos[0]>settings.data.pos[2]) { rx = -1; }
                        if (settings.data.pos[1]<settings.data.pos[3]) { ry = 1; }
                        if (settings.data.pos[1]>settings.data.pos[3]) { ry = -1; }

                        for (var i = 0; i<nb; i++) {
                            var px = settings.data.pos[0] + rx*i;
                            var py = settings.data.pos[1] + ry*i;
                            w += settings.grid[py][px];
                            rw = settings.grid[py][px]+rw;
                        }
                        for (var i = 0; i<settings.result.length; i++) {
                            if (settings.result[i]==w || settings.result[i]==rw) {
                                if (!$this.find("#values #l"+i).hasClass("s")) {
                                    $this.find("#values #l"+i).addClass("s");
                                    settings.board.line(settings.data.$group, settings.data.pos[0]+0.5, settings.data.pos[1]+0.5,
                                                                          settings.data.pos[2]+0.5, settings.data.pos[3]+0.5, {});
                                }

                            }
                        }

                    }

                    if (settings.data.line) { $(settings.data.line).detach(); }
                    settings.data.line = 0;
                    settings.data.pos = 0;


                    var finish = true;
                    $this.find("#values>div").each(function() {
                        if (!$(this).hasClass("s")) { finish = false; }
                    });
                    if (finish) {
                        settings.interactive = false;
                        settings.score = 5;
                        $this.addClass("done");
                        setTimeout(function() { helpers.end($this); }, 2000);
                    }


                    event.preventDefault();
                }
            });
        }
    };

    // The plugin
    $.fn.wordmix = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    board           : 0,
                    data            : {}
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
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in wordmix plugin!'); }
    };
})(jQuery);

