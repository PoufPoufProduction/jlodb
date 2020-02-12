(function($) {
    // Memory default options
    var defaults = {
        name        : "memory",             // The activity name
        template    : "template.html",      // Memory's html template
        css         : "style.css",          // Mermory's css style sheet
        lang        : "fr-FR",              // Current localization
        delay       : [2000,0],             // Time of display the values
        level       : [3,0],                // The beginning level
		number      : 5,                    // Number of levels
		mapping     : [],
        background  : "",
        debug       : true                 // Debug mode
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
        end: function($this, _args) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this, _args);
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

                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                if(settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		clear: function($this) {
            var settings = helpers.settings($this);
			$this.find("td div").animate({opacity:0},500, function() { $(this).html("").parent().removeClass(); });
			$this.find("#g_effects").removeClass();
			setTimeout(function(){helpers.next($this); }, 800);
		},
		next: function($this) {
            var settings = helpers.settings($this);
			
			if ($.isArray(settings.level)) {
				settings.current.level = settings.level[0] + settings.count*settings.level[1];
			} else { settings.current.level = settings.level; }
			if ($.isArray(settings.delay)) {
				settings.current.delay = settings.delay[0] + settings.count*settings.delay[1];
			} else { settings.current.delay = settings.delay; }
			
			$this.find("#mylid").html(settings.current.level);
			
			$this.find("#mycount").css("width",(100*settings.count/settings.number)+"%");
			
            // build the numbers array
            var a = [];
            for (i=0; i<settings.current.level; i++) { a.push(i); }
			shuffle(a);

            // fill the grid
            var i=0;
			var position = pick(settings.position[settings.current.level]);
            $this.find("td div").each(function(index) {
                if (position&Math.pow(2,index)){
                    $(this).html(settings.mapping.length?settings.mapping[a[i]]:a[i]+1)
						   .css("opacity",0).animate({opacity:1}, settings.current.delay/2 )
					       .parent().addClass("active");
                    settings.soluce[index] = a[i]+1;
                    i++;
                }
            });
			
			$this.find("#mymonkeys").addClass("s");

			$this.find("#mydelay").animate({opacity:0}, settings.current.delay/2, function() {
				$(this).css("width",0).css("opacity",1).animate({width:"100%"},settings.current.delay,function(){helpers.hide($this); });
			});
		},
        hide: function($this) {
            var settings = helpers.settings($this);
            $this.addClass("active").find("td div").each(function(index) { $(this).html(""); });
			$this.find("#mymonkeys").removeClass("s");
            settings.response=0;
			settings.interactive = true;
        },
        // compute the score
        score:function($this) {
            var settings = helpers.settings($this);
            return 2 + settings.life;
        },
        cont: function($this) {
            var settings = helpers.settings($this);
            // Load the template
            $this.addClass("active").find(".false").removeClass("false").addClass("active").children().html("");
            settings.interactive = true;
        }
    };

    // The plugin
    $.fn.memory = function(method) {
/*
GRID VALUES
1		2		4		8		16
32		64		128		256		512
1024	2048	4096	8192	16384
32768	65536	131072	262144	524288
1048576	2097152	4194304	8388608	16777216
*/
	
	
        // public methods
        var methods = {
            init: function(options) {
                // The initial settings
                var settings = {
					interactive : false,
                    response    : 0,        // The number of good found values
                    soluce      : [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
                    position    : [ [0],
									[4096], 
									[10240,131200,262208,65792],
									[21504,16781313,1052688,4198404],
									[328000,141440,17825809],
									[332096,145536,17829905],
                                    [459200,338240],
									[463296,342336],
									[469440],     [473536],     [10824010],
                                    [720544],   [1034208],    [1038304],    [15149518],   [15153614],
                                    [33080895], [33084991],   [33091135],   [33216191],   [33408895],
                                    [33412991], [33419135],   [33544191],   [33550335],   [33554431] ],
					current     : { level: 0, delay: 0 },
                    life        : 3,        // The number of life
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
            next: function() { helpers.next($(this)); },
            // click on a cell for showing the value
            click: function(elt, value) {
               var $this = $(this), settings = helpers.settings($this), $elt=$(elt);
               if ($this.hasClass("active") && $elt.hasClass("active") && settings.interactive ) {
                    $elt.removeClass("active").children().text(settings.soluce[value-1]);
                    if (settings.soluce[value-1]==settings.response+1) {
						settings.response++;
                        $elt.addClass("good");
                        if (settings.response >= settings.current.level) {
                            $this.removeClass("active");
                            settings.count++;
							$this.find("#g_effects").addClass("good");
                            if (settings.current.level>25 || (settings.count>=settings.number)) {
								$this.find("#mycount").css("width", "100%");
                                setTimeout(function() { helpers.end($this, {'status':'success', 'score':helpers.score($this)}); }, 1000);
                            }
                            else {
                                setTimeout(function() { helpers.clear($this); }, 500);
                            }
                        }
                    }
                    else {
						settings.interactive = false;
                        $elt.addClass("false");
                        $this.removeClass("active");
						settings.life--;
						$this.find("#myminus1").css("opacity",1).show()
							.animate({opacity:0},1000, function() { $(this).hide(); });
						for (var i=0; i<3; i++) {
							$this.find("#myh"+(i+1)+" img").attr("src","res/img/icon/heart0"+(settings.life>i?"1":"2")+".svg");
						}
		
                        if (settings.life==0) {
                            setTimeout(function() { helpers.end($this, {'status':'success', 'score':0}); }, 2000);
                        }
                        else { setTimeout(function() { helpers.cont($this); }, 300); }
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory plugin!'); }
    };
})(jQuery);
