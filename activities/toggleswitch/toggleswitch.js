(function($) {
    // Activity default options
    var defaults = {
        name        : "toggleswitch",                           // The activity name
        label       : "Toggle switch"            ,              // The activity label
        templateX   : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        number      : 0,                                        // Pages number
        show        : true,                                     // Show the wrong responses
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
        // Handle the elements sizes and show the activity
        resize: function($this) {
            var settings = $this.data("settings");

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(false); }

            // Resize the template
            $this.css("font-size", Math.floor($this.height()/16)+"px");

            // Locale handling
            $this.find("h1#label").html(settings.label);
            $this.find("#guide").html(settings.guide);
            $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });
        },
        // REFRESH A TOGGLE ELEMENT
        refresh: function($this, elt) {
            var settings = $this.data("settings");
            if (settings.states.css) {
                var o = elt.state;
                if (o<0 && settings.states.css.length>settings.states.nb && settings.show) { o = settings.states.nb; }
                if (o>=0) { for (var i in settings.states.css[o]) { elt.elt.css(i, settings.states.css[o][i]); } }
            }
            if (settings.states.html)
            {
                var o = elt.state;
                if (o<0 && settings.states.html.length>settings.states.nb && settings.show) { o = settings.states.nb; }
                elt.elt.html(settings.states.html[o]);
            }
        },
        // CHANGE A STATUT
        click: function($this, id) {
            var settings = $this.data("settings");
            var elt = settings.current.values[id];

            var isOk = true;
            if (settings.current.elt.check) { isOk = eval('('+settings.current.elt.check+')')(id, settings.current.values); }

            if (isOk) {
                elt.state=(elt.state+1)%((settings.states.nb)?settings.states.nb:2);
                helpers.refresh($this, elt);
            }
        },
        fill: function($this) {
            var settings = $this.data("settings");
            settings.current.values = [];
            $this.find(".t").each(function(index) {
                var elt={ elt:$(this), state:0 };
                settings.current.values.push(elt);
                helpers.refresh($this,elt);
                $(this).bind("click touchstart",function(event){ helpers.click($this,index); event.preventDefault();});
            });

            if (settings.states.css) {
                for (var i=0; i<settings.states.css.length; i++) {
                    for (var j in settings.states.css[i]) {
                        $this.find(".css"+i).css(j, settings.states.css[i][j]);
                    }
                }
            }

            settings.finish = false;
        },
        // Build the question
        build: function($this) {
            var settings = $this.data("settings");
            $this.find("#submit").removeClass("good").removeClass("wrong");

            if (!settings.number)   { settings.number = (settings.values)?settings.values.length:1; }

            // 3 CASES : GEN (FUNCTION), VALUES (ARRAY), DATA (SINGLE)
            settings.current.elt=settings.values?settings.values[settings.it%settings.values.length]:settings;
            if (settings.gen) {
                var gen = eval('('+settings.current.elt.gen+')')();
                settings.current.data = gen.data;
                settings.current.result = gen.result;
            }
            else {
                settings.current.data   = settings.current.elt.data;
                settings.current.result = settings.current.elt.result;
            }

            if (settings.comment)               { $this.find("#exercice").html(settings.comment).show(); } else
            if (settings.current.elt.comment)   { $this.find("#exercice").html(settings.current.elt.comment).show(); } else
                                                { $this.find("#exercice").hide(); }

            if (settings.current.elt.template) {
                var debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var templatepath = "activities/"+settings.name+"/templates/"+settings.current.elt.template+".html"+debug;
                $this.find("#data").load(templatepath, function(response, status, xhr) {
                    if (status=="error") {
                        settings.context.onQuit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                    }
                    else {
                        $this.find("#data .data").each(function(index) {
                            if (settings.current.data && settings.current.data.length>index) {
                                $(this).html(settings.current.data[index]);
                        }});
                        helpers.fill($this);
                    }
                });
            }
            else {
                $this.find("#data").html(data);
                helpers.fill($this);
            }

        },
        // Load the different elements of the activity
        load: function($this) {
            var settings = $this.data("settings");
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(true); }

            // Load the template
            var templatepath = "activities/"+settings.name+"/"+settings.templateX+debug;
            $this.load( templatepath, function(response, status, xhr) {
                if (status=="error") {
                    settings.context.onQuit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                }
                else {
                    var cssAlreadyLoaded = false;
                    $("head").find("link").each(function() {
                        if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css+debug) != -1) { cssAlreadyLoaded = true; }
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
    $.fn.toggleswitch = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    it          : 0,
                    wrongs      : 0,        // number of false response
                    current     : {         // the current page
                        elt     : "",
                        data    : [],
                        result  : "",
                        values  : []
                    }
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
            valid: function() {
                var $this   = $(this) , settings = $this.data("settings");
                if (!settings.finish) {
                    settings.finish = true;
                    var result  = "";
                    var wrongs  = 0;
                    for (var i=0; i<settings.current.values.length; i++) {
                        result+=settings.current.values[i].state;
                        if(settings.current.values[i].state!=settings.current.result[i]) {
                            wrongs++;
                            settings.current.values[i].state = -1;
                            helpers.refresh($this, settings.current.values[i]);
                        }
                    }
                    var value = wrongs?"wrong":"good";
                    $this.find("#submit").addClass(value);
                    settings.wrongs+=wrongs;
                    settings.it++;

                    if (settings.it>=settings.number) {

                        settings.score = 5-settings.wrongs;
                        if (settings.score<0) { settings.score = 0; }
                        $(this).find("#valid").hide();
                        setTimeout(function() { helpers.end($this); }, wrongs?2000:1000);
                    }
                    else {
                        setTimeout(function() { helpers.build($this); }, wrongs?2000:1000);
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = $this.data("settings");
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            next: function() {
                $(this).find("#intro").hide();
                $(this).find("#submit").show();
                // CHECK IF THERE IS AN EVENT BEFORE QUESTION
                helpers.build($(this));
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in toggleswitch plugin!'); }
    };
})(jQuery);

