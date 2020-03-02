(function($) {
    // Activity default options
    var defaults = {
        name        : "keys",                            // The activity name
        label       : "keys",                            // The activity label
        template    : "template.html",                  // Activity's html template
        css         : "style.css",                      // Activity's css style sheet
        lang        : "en-US",                          // Current localization
        exercice    : [],                               // Exercice
        background  : "",								// Background
		edit		: false,							// Editor mode
		fontex		: 1,								// Font exercice
		errratio    : 1,								// Errratio
		number		: 1,
		margin		: 0,
		order		: false,
        debug       : true                             // Debug mode
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
			settings.interactive = false;
            helpers.unbind($this);
			// if (settings.timerid) { clearTimeout(settings.timerid); }
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

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

				if (settings.edit) { $this.addClass("edit").addClass("nosplash"); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                // Exercice
                $this.find("#g_instructions").html(jtools.instructions(settings.exercice))
				     .css("font-size",(0.5*settings.fontex)+"em");
					 
				if (!settings.gen) { settings.number = settings.data.length; }

                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		build: function($this) {
            var settings = helpers.settings($this);
			var current;

			if (settings.gen) { current = eval('('+settings.gen+')')($this, settings, settings.id); }
			else              { current = settings.data[settings.id]; }
			
			$this.find("#g_submit").removeClass();
			$this.find("#g_effects").removeClass();
			
			$this.find("#kslegend>div").html("");
			$this.find("#kskeys>div").html("");
			$this.find("#kswords>div").html("").css("margin-top",settings.margin+"%");
			
			settings.result=[];
			settings.values=[];
			
			// HANDLE LEGEND
			if (current.legend) { $this.find("#kslegend>div").html(jtools.format(current.legend)); }
			
			// HANDLE WORDS
			if (current.words) {
				var i=0, j=0, m=0.1, max=0, cpt=0;
				settings.keys={};
				var words = current.words.split(' ');
				var jj = current.inter?current.inter:0.2;
				
				for (var w=0; w<words.length; w++) { max=Math.max(max,words[w].length); }
				var s=Math.min(current.size?current.size:1, 8.25/(max*1.2*(1+m)+m));
				
				for (var w=0; w<words.length; w++) {
					if (i!=0 && (i+words[w].length)*1.2*(1+m)*s>8.25) { i=0; j++; }
					for (var l=0; l<words[w].length; l++) {
						var $elt = $("<div class='ksw' id='w"+cpt+"'><div class='kswl'></div><div class='g_anim12 g_anoloop'><div><img src='res/img/asset/anim/bluelight0"+Math.floor(Math.random()*4+1)+".svg' alt=''/></div></div></div>");
						$elt.css("top",(j*(1.2+jj)*(1+m))+"em").css("left",(i*1.2*(1+m))+"em")
						    .css("font-size",s+"em");
						cpt++;
						$this.find("#kswords>div").append($elt);
						i++;
						var k=words[w][l];
						settings.result.push(k);
						settings.values.push(0);
						if (settings.keys[k]) { settings.keys[k][0]++; } else { settings.keys[k]=[1,0]; }
						
						$elt.bind("touchstart mousedown", function(_e) {
							if (settings.interactive) {
								var id = parseInt($(this).attr("id").substr(1));
								
								if ($(this).hasClass("s")) {
									settings.lid = -1;
									$this.find(".ksw").removeClass("s");
								}
								else {
									$this.find(".ksw").removeClass("s");
									$(this).addClass("s");
									settings.lid=id;
								}
								
								helpers.prepare($this, id);
							}
							
							_e.preventDefault();
						});
						
					}
					i++;
				}
			}
			$this.find("#w0.ksw").addClass("s");
			settings.lid=0;

			// HANDLE KEYS
			var ks=[];
			for (var k in settings.keys) {
				ks.push([(settings.convert[k]?settings.convert[k]:k),settings.keys[k][0],k]);
			}
			if (settings.order) { ks.sort(function(_a,_b) { return _a[0].localeCompare(_b[0]); }); } else { shuffle(ks); }
			s = Math.min(1.8,  Math.max(0.9,15/(ks.length*1.2*1.1)));
			for (var k=0; k<ks.length; k++) {
				var $elt = $("<div class='ksk g_bluekey' id='k"+ks[k][0]+"'></div>");
				$elt.append("<div class='ksv'>"+ks[k][2]+"</div>");
				$elt.append("<div class='ksn'>"+ks[k][1]+"</div>");
				$elt.css("font-size",s+"em");
				$this.find("#kskeys>div").append($elt);
				
				$elt.bind("mousedown touchstart", function(_e) {
					helpers.touch($this, $(this)); _e.preventDefault();
				});
			}
			
			settings.interactive = true;
		},
		prepare: function($this, _id) {
            var settings = helpers.settings($this);
			if (settings.values[_id]) {
				var kid = settings.values[_id];
				var key=settings.keys[kid];
				var $key = $this.find("#k"+(settings.convert[kid]?settings.convert[kid]:kid)+".ksk");
				key[1]=Math.max(0, key[1]-1);
				$key.removeClass("d").find(".ksn").html(key[0]-key[1]);
				settings.values[_id]=0;
				$this.find("#w"+_id+".ksw .kswl").html("");
				
				$key.addClass("g_ktouch");
				setTimeout(function() { $key.removeClass("g_ktouch"); }, 50);		
			}
		},
		touch: function($this, $key) {
            var settings = helpers.settings($this);
			if (settings.lid!=-1 && !$key.hasClass("d") && settings.interactive) {
				var id = $key.attr("id").substr(1);
				
				for (var k in settings.convert) {
					if (settings.convert[k]==id) { id=k; }
				}
				
				var key = settings.keys[id];
				if (key[0]>key[1]) {
					settings.values[settings.lid]=id;
					key[1]++;
					var $elt = $this.find("#w"+settings.lid+".ksw");
					$elt.find(".kswl").css("opacity",0).html(id).animate({opacity:1},500);
					$key.find(".ksn").html(key[0]-key[1]);
							
					$elt.find(".g_anim12>div").addClass("g_arunning").parent().show();
					setTimeout(function() { $elt.find(".g_anim12>div").removeClass("g_arunning").parent().hide(); }, 1000);
							
					$key.addClass("g_ktouch");
					setTimeout(function() { $key.removeClass("g_ktouch"); }, 50);
					
					if (key[0]-key[1]==0) { $key.addClass("d"); }
					$this.find(".ksw").removeClass("s");
							
					do {
						settings.lid++;
					} while (settings.lid<settings.values.length && settings.values[settings.lid]!=0);
							
					if ( settings.lid>=settings.values.length) { settings.lid=-1; }
					else { helpers.prepare($this, settings.lid); $this.find("#w"+settings.lid).addClass("s"); }
							
				}
			}
		},
		key: function($this, _k) {
            var settings = helpers.settings($this);
			if (_k=="BACK") {
				if (settings.interactive && settings.lid>0) {
					$this.find(".ksw").removeClass("s");
					settings.lid--;
					helpers.prepare($this, settings.lid);
					$this.find("#w"+settings.lid).addClass("s");
				}
			}
			else
			if ( settings.keys[_k]) {
				var $elt=$this.find("#k"+(settings.convert[_k]?settings.convert[_k]:_k)+".ksk");
				helpers.touch($this, $elt);
			}
		}
    };

    // The plugin
    $.fn.keys = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
					id				: 0,
					result			: [],
					values			: [],
					keys			: {},
					convert			: { "\'":"aa" },
					nberrors		: 0,
					lid				: -1
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
					
					$(document).keydown(function(_e) {
						if (_e.keyCode == $.ui.keyCode.BACKSPACE) { helpers.key($this,"BACK"); _e.preventDefault(); }
					});
                    $(document).keypress(function(_e) {
						helpers.key($this, String.fromCharCode(_e.which)); _e.preventDefault(); });

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
				helpers.build($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            },
			valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
				
				var nberrors = 0;
				
				for (var i=0; i<settings.values.length; i++) {
					if (settings.values[i]!=settings.result[i]) {
						nberrors++;
						$this.find("#w"+i).addClass("w");
					}
				}
				settings.nberrors+=nberrors;
				$this.find("#g_submit").addClass(nberrors==0?"good":"wrong");
				$this.find("#g_effects").addClass(nberrors==0?"good":"wrong");
                settings.interactive = false;
				
				if (++settings.id>=settings.number)
				{
					setTimeout(function() { helpers.end($this, {'status':'success','score':Math.max(0, Math.round(5-settings.errratio*settings.nberrors))}); }, 1000);
				}
				else { setTimeout(function() { helpers.build($this); }, nberrors==0?1000:2000); }
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in keys plugin!'); }
    };
})(jQuery);

