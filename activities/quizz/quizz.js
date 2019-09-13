(function($) {
    // Activity default options
    var defaults = {
        name        : "quizz",                            		// The activity name
        label       : "Quizz",                            		// The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        tips    	: [],                                      	// Level tips
		glossary	: [],										// Glossary
        background  : "",
		filters		: { people:0, state:0 },					// Tips display filters
		smalltips	: false,									// If no legend, display tips in small size
		withnotes	: true,
		errratio	: 1,
		res			: {
			house: [ 	"res/img/asset/misc/house01.svg",
						"res/img/asset/misc/house05.svg",
						"res/img/asset/misc/house06.svg",
						"res/img/asset/misc/house03.svg",
						"res/img/asset/misc/house04.svg",
						"res/img/asset/misc/house02.svg" ],
			people: [ 	"ext/noto/svg/emoji_u1f468_1f3fc_200d_1f692.svg",	// Fireman
						"ext/noto/svg/emoji_u1f469_1f3fe_200d_1f373.svg",	// Cook
						"ext/noto/svg/emoji_u1f469_1f3fb_200d_1f3a4.svg",	// Musician
						"ext/noto/svg/emoji_u1f468_1f3fe_200d_1f3a8.svg",	// Painter
						"ext/noto/svg/emoji_u1f468_200d_1f680.svg",			// Astronaute
						"ext/noto/svg/emoji_u1f469_200d_1f3ed.svg"	],
			animal: [ 	"ext/noto/svg/emoji_u1f40e.svg",
						"ext/noto/svg/emoji_u1f415.svg",
						"ext/noto/svg/emoji_u1f408.svg",
						"ext/noto/svg/emoji_u1f407.svg",
						"ext/noto/svg/emoji_u1f422.svg",
						"ext/noto/svg/emoji_u1f426.svg"	],
			sport: [ 	"ext/noto/svg/emoji_u1f3b1.svg",
						"ext/noto/svg/emoji_u1f3bf.svg",
						"ext/noto/svg/emoji_u1f3b8.svg",
						"ext/noto/svg/emoji_u1f3be.svg",
						"ext/noto/svg/emoji_u1f3ae.svg",
						"ext/noto/svg/emoji_u1f3a8.svg"	],
			food: [ 	"ext/noto/svg/emoji_u1f354.svg",
						"ext/noto/svg/emoji_u1f355.svg",
						"ext/noto/svg/emoji_u1f363.svg",
						"ext/noto/svg/emoji_u1f32d.svg",
						"ext/noto/svg/emoji_u1f35d.svg",
						"ext/noto/svg/emoji_u1f32e.svg"	]
		},
        debug       : true                                      // Debug mode
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
            settings.context.onquit($this,_args);
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
                    else { $this.find("#"+id).html(jtools.format(value)); }
                }); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                
                // BUILD TIPS
				for (var i=0; i<settings.tips.length; i++) { settings.states[i] = true; }
				helpers.tips($this);
				
				// BUILD BOARD
				$this.find("#qzgrid").html("");
				for (var i=0; i<settings.board[0].value.length; i++) {
					var $col=$("<div class='col'></div>");
					$col.css("left",(i*1.4+0.5)+"em");
					
					for (var j=0; j<settings.board.length; j++) {
						var c = settings.board[j];
						var $elt=$("<div class='elt' id='c"+i+"x"+j+"'></div>");
						
						if (c.fixed) {
							$elt.html("<img src='"+settings.res[c.type][c.value[i]-1]+"' alt=''/>");
						}
						else {
							var $click = $("<div class='result click' id='c"+settings.cells.length+"x0'></div>")
							$elt.append($click);
							var cell = {value:0,i:i,j:j,type:c.type,k:0,$elt:$click,notes:[]};
							if (settings.withnotes) {
								var $notes = $("<div class='notes'></div>");
								for (var k=0; k<9; k++) {
									var $note = $("<div class='click' id='c"+settings.cells.length+"x"+(k+1)+"'></div>")
									$notes.append($note);
									cell.notes.push({type:c.type,value:0,i:i,j:j,k:k,$elt:$note,cell:cell});
								}
								$elt.append($notes);
							}
							
							settings.cells.push(cell);
						}
						
						$col.append($elt);
					}
					
					$this.find("#qzgrid").append($col);
				}
				$this.find(".click").bind("mousedown touchstart", function(_event) {
					var vEvent = (_event && _event.originalEvent &&
                                _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                _event.originalEvent.touches[0]:_event;
												
					if (settings.interactive) {
						var attr = $(this).attr("id").substr(1),po = attr.indexOf("x");
						var id = parseInt(attr.substr(0,po));
						var no = parseInt(attr.substr(po+1));
						settings.key = -1;
						settings.current = settings.cells[id];
						if (no) { settings.current = settings.current.notes[no-1]; }
						
						if (no && $this.find("#fillmode").hasClass("s")) {
							settings.current.cell.value = settings.current.value;
							settings.current.cell.$elt.html("<img src='"+settings.res[settings.current.type][settings.current.value-1]+"' alt=''/>").show().next().hide().closest(".elt").removeClass("wrong");
							$this.find("#qzkeypad").hide(); settings.current = 0; settings.keys = 0;
							
							if (helpers.check($this)==0) {
								settings.interactive = false;
								$this.find("#g_effects").addClass("good");
								setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); }, 1500);
							}
							
						}
						else {
						
							var line 	= settings.board[settings.current.j];
							var values 	= [];
							for (var i in line.value) { values.push(line.value[i]); }
							values.sort(function(_a,_b){ return (_b<_a); });
							var nb = values.length;
							var s = 3/Math.pow(nb,0.5);
							var l = 1.4/s;
							
							$this.find("#qzkeypad .k").detach();
							settings.keys = [];
							for (var i=0; i<nb; i++) {
								var $r = $("<div class='k' id='k"+values[i]+"'></div>");
								$r.css("top",l*(Math.cos(2*Math.PI*(i/nb)))+"em")
								  .css("left",l*(Math.sin(2*Math.PI*(i/nb)))+"em")
								  .css("font-size",s+"em")
								  .html("<img src='"+settings.res[line.type][values[i]-1]+"' alt=''/>");
								  
								settings.keys.push($r);
								$this.find("#qzkeypad").append($r);
							}
							
							
							var vTop = vEvent.clientY - $this.offset().top;
							var vLeft = vEvent.clientX - $this.offset().left;
							$this.find("#qzkeypad").css("top", vTop+"px").css("left", vLeft+"px").show();
						}
						
					}
					
					_event.preventDefault;
				});
				
                $this.bind("mousemove touchmove", function(event) {
                    var settings = helpers.settings($this), $keypad = $this.find("#qzkeypad");
                    if (settings.current) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                    event.originalEvent.touches.length)? event.originalEvent.touches[0]:event;
                        var vTop = vEvent.clientY;
                        var vLeft = vEvent.clientX;
                        var vSize = settings.keys[0].width();
                        var vAlready = false;
                        settings.key = -1;
                        for (var i in settings.keys) {
                            settings.keys[i].removeClass("s");
                            if (!vAlready) {
                                var vOffset = settings.keys[i].offset();
                                vAlready = ( vTop>=vOffset.top && vLeft>=vOffset.left &&
                                            vTop<vOffset.top+vSize && vLeft<vOffset.left+vSize );
                                if (vAlready) { settings.key = i; settings.keys[i].addClass("s"); }
                            }
                        }
                    }
                    event.preventDefault();
                });
				
				$this.bind("mouseup touchend", function(event) {
					if (settings.current && settings.key!=-1 ) {
						var val = parseInt(settings.keys[settings.key].attr("id").substr(1));
						if (settings.current.value != val) {
							settings.current.$elt.html("<img src='"+settings.res[settings.current.type][val-1]+"' alt=''/>").closest(".elt").removeClass("wrong");
							settings.current.value = val;
							
							if (helpers.check($this)==0) {
								settings.interactive = false;
								$this.find("#g_effects").addClass("good");
								setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); }, 1500);
							}
					
							
						}
						else {
							settings.current.$elt.html("");
							settings.current.value = 0;
							var ok = false;
							for (var i in settings.current.notes) {
								if (settings.current.notes[i].value) { ok = true; }
							}
							if (ok) { settings.current.$elt.hide().next().show(); }
							
						}
					}
					$this.find("#qzkeypad").hide(); settings.current = 0; settings.keys = 0;
                    event.preventDefault();
				});
				
				
				$this.bind("mouseleave touchleave", function(event) {
					$this.find("#qzkeypad").hide(); settings.current = 0; settings.keys = 0;
                    event.preventDefault();
				});
				
				
				var sz = Math.round(120/Math.max(settings.board[0].value.length*1.4+1,settings.board.length*1.5))/10;
				$this.find("#qzgrid").css("font-size",sz+"em");
				
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		tippage:function($this, _page) {
			var settings 	= helpers.settings($this);
			settings.tippage = _page;
			
			$this.find("#qzhintlist .page").hide();
			$this.find("#qzhintlist .page#p"+settings.tippage).show();
			
			$this.find("#qzhinttabs .icon").removeClass("s");
			$this.find("#qzhinttabs .icon#t"+settings.tippage).addClass("s");
		},
		tips: function($this) {
			var settings 	= helpers.settings($this);
			var $page		= 0;
			var nbtip 		= 0;
			var nbpage		= 0;
			var nbmax		= 4;
			var legend		= false;
			
			// NO SMALL DISPLAY WHEN LEGEND
			if (settings.glossary && settings.glossary.length) {
				settings.smalltips = false;
				legend = true;
			}
			else { nbmax = settings.smalltips?24:6; }
			
			
			$this.find("#qzhintlist").html("").toggleClass("small",settings.smalltips);
			$this.find("#qzhinttabs").html("");
			
			for (var i=0; i<settings.tips.length; i++) {
				var t = settings.tips[i];
				
				var e = [ [ t[0], t[0].substr(0,t[0].length-1), parseInt(t[0].substr(-1))-1 ],
						  [ t[2], t[2].substr(0,t[2].length-1), parseInt(t[2].substr(-1))-1 ] ];
				
				// HANDLE FILTERS
				var ok = true;
				if (settings.mask && !settings.states[i]) { ok = false; }
				if (settings.filter) {
					if (t[0]!=settings.filter && t[1]!=settings.filter && t[2]!=settings.filter) { ok = false; }
				}
				
				if (ok) {
					// HANDLE PAGE
					if ($page==0) {
						$page = $("<div class='page' id='p"+nbpage+"'></div>");
						var $tab = $("<div class='icon' id='t"+nbpage+"'>"+(nbpage+1)+"</div>");
						$tab.bind("mousedown touchstart", function(_event) {
							helpers.tippage($this,$(this).attr("id").substr(1));
							_event.preventDefault();
						});
						$this.find("#qzhinttabs").append($tab);
						nbpage++;
						$this.find("#qzhintlist").append($page);
					}
					
					
					// BUILD ELEMENT
					var $elt = $(
						"<div class='tip' id='tip"+i+"'><div class='elt'>"+
						"<div class='icon' id='tip0"+i+"'><img src='"+settings.res[e[0][1]][e[0][2]]+"' alt=''/></div>"+
						"<div class='icon' id='tip1"+i+"'><img src='res/img/asset/misc/op"+t[1]+".svg' alt=''/></div>"+
						"<div class='icon' id='tip2"+i+"'><img src='"+settings.res[e[1][1]][e[1][2]]+"' alt=''/></div>"+
						"</div>"+(legend?"<div class='legend'></div>":"")+"<div class='mask'></div></div>");
					
					if (legend && settings.glossary.length>i) {
						$elt.find(".legend").html(jtools.format(settings.glossary[i]));
					}
					if (!settings.states[i]) { $elt.find(".mask").show(); }
					$elt.bind("mousedown touchstart", function(_event) {
							if (settings.interactive && settings.filterstate!=1 ) {
								var id = parseInt($(this).attr("id").substr(3));
								settings.states[id] = !settings.states[id];
								
								if (settings.mask) {
									settings.interactive = false;
									$(this).find(".mask").show();
									$(this).animate({opacity:0}, 500, function() {
										helpers.tips($this);
										settings.interactive = true;
									});
								}
								else {
									if (settings.states[id]) { $(this).find(".mask").hide(); }
									else					 { $(this).find(".mask").show(); }
								}
							}
							_event.preventDefault();
						});
					$elt.find(".icon").bind("mousedown touchstart", function(_event) {
						if (settings.interactive && settings.filterstate==1) {
							
							var tip = parseInt($(this).attr("id").substr(4));
							var idx = parseInt($(this).attr("id").substr(3,1));
							settings.filter = settings.tips[tip][idx];
							settings.filterstate = 0;
							$this.find("#filterimg").attr("src", $(this).find("img").attr("src"));
							helpers.tips($this);
							
							_event.stopPropagation();
						}
						
						_event.preventDefault();
					});
					
					$page.append($elt);
					
					if ((nbtip++) >= nbmax-1) { $page = 0; nbtip = 0; }
				}
				
			}
			
			// SHOW PAGE
			if (nbpage<=1) { $this.find("#qzhinttabs .icon").hide(); } else { $this.find("#qzhinttabs .icon").show(); }
			helpers.tippage($this, Math.min(settings.tippage, Math.max(0,nbpage-1)));
		},
		check: function($this, _color) {
			var settings = helpers.settings($this);
            var wrong = 0;
			
			for (var i in settings.cells) {
				var c = settings.cells[i];
				var res = settings.board[c.j].value[c.i];
				if (res!=c.value) {
					if (_color) { c.$elt.parent().addClass("wrong"); }
					wrong++;
					}
				}
			return wrong;
		}
		
    };

    // The plugin
    $.fn.quizz = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
					tippage			: 0,
					filterstate		: 0,				// 0: default, 1: waiting for filter
					filter			: 0,
					mask			: false,
					cells			: [],
					current			: 0,
					score			: 5,
					keys			: [],
					states			: []				// TIP STATES
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
                helpers.end($this,{'status':'abort'});
            },
			mask: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if (settings.interactive) {
					settings.interactive = false;
					settings.mask = !settings.mask;
					$(_elt).toggleClass("s",settings.mask);
					
					helpers.tips($this);
					settings.interactive = true;
					
				}
			},
			filter: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if (settings.interactive) {
					if (settings.filterstate || settings.filter ) {
						$(_elt).removeClass("s");
						$(_elt).find("img").attr("src", "ext/noto/svg/emoji_u1f50d.svg");
						if (settings.filter) {
							settings.filter = 0;
							helpers.tips($this);
						}
						settings.filterstate = 0;
					}
					else
					{
						$(_elt).addClass("s");
						settings.filterstate = 1;
					}
				}
			},
			fill: function(_elt) {
                var $this   = $(this) , settings = helpers.settings($this);
				$this.find("#qzmenu .icon").removeClass("s");
				$(_elt).addClass("s");
				
				for (var i in settings.cells) {
					var c = settings.cells[i];
					var ok = true;
					for (var j in c.notes) { if (c.notes[j].value) { ok = false; } }
					
					if (ok) { c.$elt.show().next().hide(); }
				}
			},
			hint: function(_elt) {
                var $this   = $(this) , settings = helpers.settings($this);
				$this.find("#qzmenu .icon").removeClass("s");
				$(_elt).addClass("s");
				
				for (var i in settings.cells) {
					var c = settings.cells[i];
					if (c.value==0) { c.$elt.hide().next().show(); }
				}
			},
			help: function() {
                var $this   = $(this) , settings = helpers.settings($this);
				settings.score=Math.max(0,settings.score-1);
				helpers.check($this, true);
				$this.find("#qzmask").hide();
				
			}
					
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in quizz plugin!'); }
    };
})(jQuery);

