(function($) {
    // Activity default options
    var defaults = {
        name        : "ana",                            // The activity name
        label       : "ana",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        background  : "res/img/background/landscape/blueboard01.svg",
		edit		: false,									// Editor mode
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

				if (settings.edit) { $this.addClass("edit").addClass("nosplash"); }
				
				// PREPARE BOARD
				var h = settings.board.length;
				var w = 0;
				for (var i in settings.board) { w = Math.max(w, settings.board[i].length); }
				$this.find("#aa_board>div").css("font-size",Math.min(12/(1+h),11.3/(1+w))+"em");

				for (var i=0; i<settings.board.length; i++) {
					while (settings.board[i].length < w) { settings.board[i]+=" "; }
					for (var j=0; j<settings.board[i].length; j++ ) {
						var l = settings.board[i][j];
						if (l!=' ') {
							var $elt = $("<div id='"+j+"x"+i+"' class='icon'><div></div></div>");
							$elt.css("top", (i+0.5)+"em").css("left", (j+0.5)+"em");
							$this.find("#aa_board>div").append($elt);
						}
					}
				}
				
				// EXTRACT ALL ANAGRAMS TO FIND FROM BOARD
				var fromboard = function(_i, _j) {
					var ret = " ";
					if (_j>=0 && _j<h && _i>=0 && _i<w) { ret = settings.board[_j][_i]; }
					return ret;
				};
				var side=[[0,1],[1,0]];
				for (var i=0; i<settings.board.length; i++) {
					for (var j=0; j<settings.board[i].length; j++) {
						if (settings.board[j][i]!=" ") {
							for (var s=0; s<2; s++) {
								if (fromboard(i-side[s][0], j-side[s][1])==" ") {
									var o=0, r, word="";
									do {
										r = fromboard(i+o*side[s][0], j+o*side[s][1]);
										if (r!=" ") { word+=r; }
										o++;
									}
									while (r!=" ");
									if (word.length>1) {
										settings.words[word]=[i,j,s];
									}
								}
							}
						}
					}
				}
				
				// GET KEYS FROM BOARD
                var elt=$this.find("#aa_keypad svg");
                elt.svg(); settings.svg = elt.svg('get');
				
				for (var i in settings.board) {
					for (var j in settings.board[i]) {
						var l = settings.board[i][j];
						if ( l!=' ' && !settings.keys[l]) {
							var $elt = $(settings.svg.group($("#aa_keys", settings.svg.root()))).attr("id","g_"+l);
							settings.svg.circle($elt, 0, 0, 6);
							$(settings.svg.text($elt, 0, 0, l)).attr("y","3.8");
							settings.keys[l] = {
								pos: [0,0],
								$elt: $elt
							};
						}
					}
				}
				helpers.keys($this, false);
				
				// BOARD BEHAVIOUR
				$("#aa_handler",settings.svg.root()).bind("mousedown touchstart", function(_event) {
					if (settings.interactive) {
						var vEvent = (_event && _event.originalEvent && _event.originalEvent.touches &&
									  _event.originalEvent.touches.length)?_event.originalEvent.touches[0]:_event;
						
						$("#aa_keys>g",settings.svg.root()).attr("class","");
						$("#aa_path line",settings.svg.root()).detach();
						
						var $keypad = $this.find("#aa_keypad");
						
						settings.nav.width = $keypad.width();
						settings.nav.offset = [ $keypad.offset().left, $keypad.offset().top ];
						
						var pos = [ 48 * (vEvent.clientX-settings.nav.offset[0])/settings.nav.width,
									48 * (vEvent.clientY-settings.nav.offset[1])/settings.nav.width ];
						
						settings.nav.current = helpers.get($this, pos);
						settings.nav.word = settings.nav.current.toString();
						$this.find("#aa_word").html(settings.nav.word);
						if (settings.nav.current) {
							var k = settings.keys[settings.nav.current];
							k.$elt.attr("class","s");
							settings.nav.line = settings.svg.line($("#aa_path", settings.svg.root()),
																  k.pos[0], k.pos[1], pos[0], pos[1]);
						}
					}
					
					_event.preventDefault();
					
				});
				
				$("#aa_handler",settings.svg.root()).bind("mousemove touchmove", function(_event) {
					if (settings.interactive && settings.nav.current && settings.nav.line) {
						var vEvent = (_event && _event.originalEvent && _event.originalEvent.touches &&
									  _event.originalEvent.touches.length)?_event.originalEvent.touches[0]:_event;
									  
						var pos = [ 48 * (vEvent.clientX-settings.nav.offset[0])/settings.nav.width,
									48 * (vEvent.clientY-settings.nav.offset[1])/settings.nav.width ];
						
						var newcurrent = helpers.get($this, pos);
						
						if (newcurrent && newcurrent!=settings.nav.current) {
							var k = settings.keys[newcurrent];
							if (k.$elt.attr("class")!="s") {
								k.$elt.attr("class","s");
								settings.nav.current = newcurrent;
								settings.nav.word += newcurrent.toString();
								$this.find("#aa_word").html(settings.nav.word);
								$(settings.nav.line).attr("x2",k.pos[0]).attr("y2",k.pos[1]);
								settings.nav.line = settings.svg.line($("#aa_path", settings.svg.root()),
																	  k.pos[0], k.pos[1], pos[0], pos[1]);
							}
						}
						else { $(settings.nav.line).attr("x2",pos[0]).attr("y2",pos[1]); }
					}
					_event.preventDefault();
				});
				
				$("#aa_handler",settings.svg.root()).bind("mouseout touchleave", function(_event) {
					if (settings.interactive && settings.nav.current && settings.nav.line) {
						$("#aa_keys>g",settings.svg.root()).attr("class","");
						$("#aa_path line",settings.svg.root()).detach();
						settings.nav.current = 0;
						settings.nav.line = 0;
						settings.nav.word = "";
						$this.find("#aa_word").html(settings.nav.word);
						
					}
				});
				
				$("#aa_handler",settings.svg.root()).bind("mouseup touchend", function(_event) {
					if (settings.interactive && settings.nav.current && settings.nav.line) {
						
						var val="";
						if (settings.glossary && settings.glossary[settings.nav.word]) {
							val="<img src='"+settings.glossary[settings.nav.word]+"' alt=''/>";
						}
						$this.find("#aa_snap").html(val);
						
						var ww=settings.words[settings.nav.word];
						if (ww) {
							var side=[[0,1],[1,0]];
							for (var i=0; i<settings.nav.word.length; i++) {
								$this.find("#"+(ww[0]+i*side[ww[2]][0])+"x"+(ww[1]+i*side[ww[2]][1])+">div")
									 .html(settings.nav.word[i]);
							}
						}
						
						$("#aa_keys>g",settings.svg.root()).attr("class","");
						$("#aa_path line",settings.svg.root()).detach();
						settings.nav.current = 0;
						settings.nav.line = 0;
						settings.nav.word = "";
					}
				});
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		get: function($this, _pos) {
            var settings = helpers.settings($this);
			var ret = 0;
			for (var i in settings.keys) {
				var k=settings.keys[i];
				if ( (k.pos[0]-_pos[0])*(k.pos[0]-_pos[0]) + (k.pos[1]-_pos[1])*(k.pos[1]-_pos[1]) < 36 ) {
					ret = i; break;
				}
			}
			return ret;
		},
		keys: function($this, _cbk) {
            var settings = helpers.settings($this);
			var k = [];
			for (var i in settings.keys) { k.push(i); }
			shuffle(k);
			
			var step = 2*Math.PI/k.length;
			for (var i=0; i<k.length; i++) {
				var elt = settings.keys[k[i]];
				elt.pos = [ 24+17*Math.cos(step*i), 24+17*Math.sin(step*i) ];
				if (_cbk) {
					elt.$elt.animate({opacity:0},300, function() {
						var e = settings.keys[$(this).attr("id").substr(2)];
						$(this).attr("transform","translate("+e.pos[0]+","+e.pos[1]+")");
						$(this).animate({opacity:1}, 300);
					});
				}
				else { elt.$elt.attr("transform","translate("+elt.pos[0]+","+elt.pos[1]+")"); }
			}
			if (_cbk) { setTimeout(_cbk, 600); }
		}
    };

    // The plugin
    $.fn.ana = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
					svg				: 0,
					nav				: { width:1, offset:[0,0], word:"", current:0, line:0 },
					keys			: {},
					words			: {}
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
            keys: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if ( settings.interactive ) {
					settings.interactive = false;
					$(_elt).addClass("s");
					helpers.keys($this, function() { $(_elt).removeClass("s"); settings.interactive = true; });
				}
            },
            help: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if ( settings.interactive ) {
					$(_elt).addClass("s");
					$this.find("#aa_mask").show();
				}
            },
			tip: function() {
                var $this = $(this) , settings = helpers.settings($this);
				$this.find("#aa_mask").hide();
				alert("tip");
				
			},
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in ana plugin!'); }
    };
})(jQuery);

