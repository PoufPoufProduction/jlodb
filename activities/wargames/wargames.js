(function($) {
    // Activity default options
    var defaults = {
        name        : "wargames",                               // The activity name
        label       : "Wargames",                               // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        font        : 1,                                        // The font-size multiplicator
        mintiles    : 5,                                        // The minimum tiles in board
        zoom        : 0,                                        // The current zoom value (0=see all)
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
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
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

                for (var j in settings.board) for (var i in settings.board[j]) {
                    var val = settings.board[j][i].toString();
                    while (val.length<3) { val="0"+val; }
                    $this.find("#board #bg").append("<div class='t t"+val+"' style='top:"+j+"em;left:"+i+"em;'><div></div></div>");
                }
                settings.maxtiles = Math.min(settings.board.length, settings.board[0].length);
                settings.nav.size=[ settings.board[0].length, settings.board.length ];
                settings.nav.focus=[settings.maxtiles/2, settings.maxtiles/2 ];

                $this.find("#board #grounds").css("width",settings.board[0].length+"em")
                                             .css("height",settings.board.length+"em");

                helpers.nav($this);
                helpers.zoom($this,1);

                $this.find("#zoom #cursor")
                    .css("width",(22.4*settings.mintiles/settings.maxtiles)+"em").show()
                    .draggable({ axis:"x", containment:"parent",
                        drag:function() {
                            var x= ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                            helpers.zoom($this,1-x);
                    }});

                $this.find("#board").bind("mousedown touchstart", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                     event.originalEvent.touches[0]:event;
                    if (settings.interactive) { settings.nav.mouse = [ vEvent.clientX, vEvent.clientY]; }
                    event.stopPropagation();
                    event.preventDefault();
                });

                $this.find("#board").bind("mouseup touchend mouseout touchleave", function(event) {
                    for (var i=0; i<2; i++) {
                        settings.nav.focus[i] -= settings.nav.rt[i];
                        settings.nav.rt[i] = 0;
                    }
                    settings.nav.mouse   = 0;
                    helpers.zoom($this, -1);
                    event.stopPropagation();
                    event.preventDefault();
                });


                $this.find("#board").bind("mousemove touchmove",function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                     event.originalEvent.touches[0]:event;
                    if (settings.nav.mouse) {
                        var vSize = $this.find("#board #bg>div").width();
                        settings.nav.rt = [ (vEvent.clientX-settings.nav.mouse[0])/vSize, (vEvent.clientY-settings.nav.mouse[1])/vSize ];
                        helpers.nav($this);
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });


                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#exercice").html(settings.exercice);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        nav: function($this) {
            var settings = helpers.settings($this);
            var x = settings.nav.focus[0] - settings.nav.rt[0] - settings.nav.zoom/2;
            var y = settings.nav.focus[1] - settings.nav.rt[1] - settings.nav.zoom/2;
            if (x<0) { x=0; }
            if (y<0) { y=0; }
            if (x>settings.nav.size[0]-settings.nav.zoom) { x=settings.nav.size[0]-settings.nav.zoom; }
            if (y>settings.nav.size[1]-settings.nav.zoom) { y=settings.nav.size[1]-settings.nav.zoom; }

            $this.find("#eleft").toggle(x>0.001);
            $this.find("#etop").toggle(y>0.001);
            $this.find("#eright").toggle(x<settings.nav.size[0]-settings.nav.zoom-0.001);
            $this.find("#ebottom").toggle(y<settings.nav.size[1]-settings.nav.zoom-0.001);

            $this.find("#action>#board #grounds").css("left",-x+"em").css("top",-y+"em");
        },
        zoom: function($this, _zoom) {
            var settings = helpers.settings($this);
            if (_zoom>=0 && _zoom<=1) { settings.nav.zoom = settings.mintiles + (settings.maxtiles-settings.mintiles)*_zoom; }
            $this.find("#action>#board #grounds").css("font-size",(11/settings.nav.zoom)+"em");
            for (var i=0; i<2; i++) {
                settings.nav.focus[i]=Math.max(settings.nav.focus[i],settings.nav.zoom/2);
                settings.nav.focus[i]=Math.min(settings.nav.focus[i], settings.nav.size[i]-settings.nav.zoom/2);
            }
            helpers.nav($this);
        }
    };

    // The plugin
    $.fn.wargames = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    maxtiles        : 3,
                    nav             : { mouse: 0, focus:[0,0], rt:[0,0], zoom:0, size:[0,0] }
                };

                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");

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
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $(this).find("#splash").hide();
                settings.interactive = true;
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in wargames plugin!'); }
    };
})(jQuery);

