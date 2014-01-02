(function($) {
    // Memory default options
    var defaults = {
        name        : "memory2",                // The activity name
        template    : "template.html",          // Memory2's html template
        url         : "desktop/simon01.svg",    // Memory2's svg
        css         : "style.css",              // Mermory2's css style sheet
        lang        : "fr-FR",                  // Current localization
        delay       : 2000,                     // Time of display the values
        good        : [27,4],                   // Sequence length for A score, decreasing score speed
        speed       : [500,20],                 // Tempo for sequence, half tempo
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
        // Handle the elements sizes and show the activity
        resize: function($this) {
            var settings = helpers.settings($this);

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(false); }

            // Resize the template
            $this.css("font-size", Math.floor((Math.min($this.width(),$this.height())-7)/5)+"px");

            // Check the buttons
            for (var i in settings.buttons) {
                var $b = $("#"+settings.buttons[i].id, settings.svg.root());
                $b.bind("click touchstart", function(event) {$this.memory2('key',this.id); event.preventDefault(); })
                  .css("cursor", "pointer");
            }

            // Locale handling
            $this.find("h1#label").html(settings.label);
            if(settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

            // Handle spash panel
            if (settings.nosplash) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            else                   { $this.find("#intro").show(); }
        },
        stop: function($this) {
            var settings = helpers.settings($this);
            for (var i in settings.buttons) { $("#"+settings.buttons[i].id, settings.svg.root()).attr("class",""); }
            jlodb.midi.noteOff(0,0,0);
        },
        play: function($this,_i) {
            var settings = helpers.settings($this);
            for (var i in settings.buttons) { $("#"+settings.buttons[i].id, settings.svg.root()).attr("class",""); }
            $("#"+settings.buttons[_i].id, settings.svg.root()).attr("class","s");
            jlodb.midi.noteOn(0,settings.buttons[_i].note,0,0);
        },
        demo: function($this) {
            var settings = helpers.settings($this);
            if (settings.count<settings.buttons.length) {
                helpers.play($this, settings.count++);
                setTimeout(function() { helpers.demo($this); },250);
            }
            else { helpers.stop($this); setTimeout(function() { helpers.next($this); },500); }
        },
        next: function($this) {
            var settings = helpers.settings($this);
            settings.sequence.push(Math.floor(Math.random()*settings.buttons.length));
            settings.count = 0;
            helpers.sequence($this);
        },
        sequence: function($this) {
            var settings = helpers.settings($this);
            if (settings.count<settings.sequence.length) {
                helpers.play($this, settings.sequence[settings.count++]);
                var delay = Math.floor(settings.speed[0]/(1+settings.sequence.length/settings.speed[1]));
                setTimeout(function() { helpers.stop($this); },delay-20);
                setTimeout(function() { helpers.sequence($this); },delay);
            }
            else {
                $("#count", settings.svg.root()).text(settings.sequence.length);
                helpers.stop($this); settings.count = 0; settings.interactive = true; }
        },
        loadmidi: function($this) {
            jlodb.midi.load('acoustic_grand_piano', function() { helpers.resize($this); });
        },
        loadsvg:function($this) {
            var settings = helpers.settings($this);
            // Load the svg if needed
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
            var elt= $("<div id='svg'></div>").appendTo($this.find("#mem2"));
            elt.svg();
            settings.svg = elt.svg('get');
            $(settings.svg).attr("class",settings.class);
            settings.svg.load(
                'res/img/'+settings.url + debug,
                { addTo: true, changeSize: true, onLoad:function() { helpers.loadmidi($this); }
            });

        },
        load: function($this) {
            var settings = helpers.settings($this);
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
                        helpers.loadsvg($this);
                    }
                    else {
                        // Load the css
                        $("head").append("<link>");
                        var css = $("head").children(":last");
                        var csspath = "activities/"+settings.name+"/"+settings.css+debug;
                        css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(function() {
                            helpers.loadsvg($this);
                        });
                    }
                }
            });
        }
    };

    // The plugin
    $.fn.memory2 = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The initial settings
                var settings = {
                    error       : 0,        // The number of errors
                    interactive : false,
                    count       : 0,
                    sequence    : [],
                    timerid     : 0,
                    score       : 0
                };

                return this.each(function() {
                    // Update the settings
                    var $this = $(this);
                    var $settings = $.extend({}, defaults, options, settings);

                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.load($this);
                    }
                });
            },
            // Next level
            next: function() {
                var $this=$(this),settings = $(this).data("settings");
                // Hide instruction
                $this.find("#intro").hide();
                // Check stuff
                setTimeout(function() { helpers.demo($this); }, 500);

            },
            // click on a cell for showing the value
            key: function(_value) {
                var $this = $(this), settings = $(this).data("settings");
                if (settings.interactive) {
                    if (settings.timerid) { clearTimeout(settings.timerid); settings.timerid=0; }
                    var id = -1;
                    for (var i in settings.buttons) { if (settings.buttons[i].id==_value) { id = i; }}
                    if (id>=0) {
                        helpers.play($this, id);
                        settings.timerid = setTimeout(function(){helpers.stop($this);},500);

                        if (id==settings.sequence[settings.count++]) {
                            if (settings.count>=settings.sequence.length) {
                                settings.interactive = false;
                                setTimeout(function() { helpers.next($this); }, 1500);
                            }
                        }
                        else {
                            settings.error++;
                            settings.interactive = false;
                            if (settings.error==3) {
                                settings.score=5-Math.floor((settings.good[0]-settings.sequence.length)/settings.good[1]);
                                if (settings.score>5) { settings.score = 5; }
                                if (settings.score<0) { settings.score = 0; }
                                setTimeout(function() { helpers.end($this); }, 1500);
                            }
                            else                   { setTimeout(function() { settings.count=0; helpers.sequence($this); }, 1500); }
                        }
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory2 plugin!'); }
    };
})(jQuery);
