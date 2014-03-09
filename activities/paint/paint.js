(function($) {
    // Activity default options
    var defaults = {
        name        : "paint",                                  // The activity name
        label       : "Paint",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        url         : "",                                       // The svg element
        lang        : "en-US",                                  // Current localization
        nbcolor     : 2,                                        // Number of colors
        font        : 1,                                        // The font-size multiplicator
        result      : "",                                       // The result
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
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onQuit({'status':'success','score':settings.score});
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
                var elt= $("<div id='svg'></div>").appendTo($this.find("#board"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings.class);

                settings.svg.load('res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                $this.children().hide()

                // Send the onLoad callback
                if (settings.context.onLoad) { settings.context.onLoad(false); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                for (var i=0; i<settings.nbcolor; i++) {
                    var $elt = $("#source #"+i, settings.svg.root());
                    $elt.bind('touchstart mousedown', function(event) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;

                        if (settings.interactive) {
                            $("#source>g", settings.svg.root()).attr("class","");
                            $(this).attr("class","s");
                            settings.color = [parseInt($(this).attr("id")),-1];
                        }
                        event.preventDefault();
                    });
                }
                if (settings.selected) {
                    $("#source #0", settings.svg.root()).attr("class","s");
                    settings.color = [0,-1];
                }

                $this.find("#board").bind('touchstart mousedown', function() { settings.down=true; event.preventDefault();})
                                    .bind('touchend mouseup', function() { settings.elt=0; settings.down=false; event.preventDefault();});


                $("#canvas .c", settings.svg.root()).each(function() {
                    $(this).bind('touchmove mousemove', function() {
                        if (settings.interactive && settings.color[0]!=-1 && settings.down && settings.elt!=this) {
                            helpers.paint($this, $(this), false);
                        }
                        settings.elt = this;
                        event.preventDefault();
                    });
                    $(this).bind('touchstart mousedown', function() {
                        if (settings.interactive && settings.color[0]!=-1) { helpers.paint($this, $(this), true); }
                        settings.elt = this;
                        event.preventDefault();
                    });
                });

                if (settings.t) {
                    $("text.t", settings.svg.root()).each(function(_index) {
                        if (_index<settings.t.length) {
                            $(this).text(settings.t[_index].charCodeAt(0)>60?settings.t[_index].charCodeAt(0)-55:settings.t[_index]); }
                    });
                }

                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#exercice").html(settings.exercice);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                $this.children().show()
                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        paint: function($this, $elt, _begin) {
            var settings = helpers.settings($this);
            var ok = true;
            var c = $elt.attr("class").substr(-1);

            if (_begin) {
                settings.color[1] = settings.color[0];
                if (c!=-1 && settings.data && settings.data[c] && settings.data[c].notover && c==settings.color[1])
                    { settings.color[1] = -1; }
            }

            if (settings.data ) {
                if (c=="c") { c = -1; }
                if (c!=-1 && settings.data[c] && settings.data[c].notover && c!=settings.color[0]) { ok = false; }
            }

            if (ok) { $elt.attr("class",settings.color[1]!=-1?"c c"+settings.color[1]:"c"); }
        },
        dev: {
            picross: function($this, _result) {
                var settings = helpers.settings($this);
                var e="";
                // vertical
                for (var i=0; i<settings.dev.data[0]; i++) {
                    var val=false, nb=0, str="";
                    for (var j=0; j<settings.dev.data[1]; j++) {
                        var current = _result[i+j*settings.dev.data[0]];
                        if (current==" "&&val) { str+=nb>9?String.fromCharCode(55+nb):nb; nb=0; val=false;}
                        if (current!=" ") { nb++; val=true; }
                    }
                    if (val) str+=nb>9?String.fromCharCode(55+nb):nb;
                    while(str.length<Math.ceil(settings.dev.data[1]/2)) { str=" "+str; }
                    e+=str;
                }
                // horizontal
                for (var i=0; i<settings.dev.data[1]; i++) {
                    var val=false, nb=0, str="";
                    for (var j=0; j<settings.dev.data[0]; j++) {
                        var current = _result[i*settings.dev.data[0]+j];
                        if (current==" "&&val) { str+=nb>9?String.fromCharCode(55+nb):nb; nb=0; val=false;}
                        if (current!=" ") { nb++; val=true; }
                    }
                    if (val) str+=nb>9?String.fromCharCode(55+nb):nb;
                    while(str.length<Math.ceil(settings.dev.data[0]/2)) { str=" "+str; }
                    e+=str;
                }
                alert("{\"result\":\""+_result+"\",\"t\":\""+e+"\"}");
            }
        }
    };

    // The plugin
    $.fn.paint = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    down            : false,
                    score           : 5,
                    color           : [-1,-1],
                    elt             : 0
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
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $(this).find("#splash").hide();
                settings.interactive = true;
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;

                    var result="";
                    $("#canvas .c", settings.svg.root()).each(function(_index) {
                        var val = $(this).attr("class").substr(-1);

                        if (val=="c") { val=" "; } else
                        if (settings.data&&settings.data[val]&&settings.data[val].skip) { val =" "; }
                        result+=val;

                        if (_index>=settings.result.length || settings.result[_index]!=val) {
                            settings.score--;
                            $(this).attr("class","c wrong");
                        }

                    });

                    // Developper mode
                    if (settings.dev) { helpers.dev[settings.dev.mode]($this,result); }

                    if (settings.score<0) { settings.score = 0; }
                    setTimeout(function() { helpers.end($this); }, 500);
                }
            }
        };
        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in paint plugin!'); }
    };
})(jQuery);

