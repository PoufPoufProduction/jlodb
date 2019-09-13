(function($) {
    // Activity default options
    var defaults = {
        name        : "mahjong",                            // The activity name
        label       : "Mahjong",                            // The activity label
        template    : "template.html",                      // Activity's html template
        css         : "style.css",                          // Activity's css style sheet
        lang        : "en-US",                              // Current localization
        font        : 1,
        offset      : [0,0],
		tiles		: "all",
        mask		: true,									// Mask blocked tile
        shuffle		: true,									// Shuffle remaining tiles when no pair
        debug       : true                                  // Debug mode
    };
	
	var tiles = [];

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

                $this.find("#mgboard>div").css("font-size", settings.font+"em");
				$this.find(".mgfx").css("font-size", (settings.font*3)+"em");
                $this.find(".target").css("font-size",(Math.floor(1.4*settings.font*10)/10)+"em");

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
				
                // BUILD AVAILABLE POSITION
				var pos = [];
                m=function(_x,_y,_z) { pos.push([_x,_y,_z]) };
                if (settings.fill.cols) for (var i in settings.fill.cols) {
                    var c = settings.fill.cols[i];
                    if (typeof c.x == "number") { for (var y=c.top; y<=c.bottom; y++) { m(c.x, y, c.z); } } else
                    if (typeof c.y == "number") { for (var x=c.left; x<=c.right; x++) { m(x, c.y, c.z); } }
                }
                if (settings.fill.blocks) for (var i in settings.fill.blocks) {
                    var c = settings.fill.blocks[i];
                    for (var x=c.left; x<=c.right; x++) for (var y=c.top; y<=c.bottom; y++) { m(x, y, c.z); }
                }
                if (settings.fill.tiles) for (var i in settings.fill.tiles) {
                    var c = settings.fill.tiles[i];
                    m(c.x, c.y, c.z);
                }
				for (var p in pos) for (var i=0; i<3; i++) settings.size[i] = Math.max(settings.size[i], pos[p][i]+1);
				settings.number = pos.length;
				
				// FILL ALL TILES (CAN BE MORE THAN NECESSARY)
				if ($.isArray(settings.tiles)) { for (var i in settings.tiles) { settings.data.push(settings.tiles[i]); } }
				else if (settings.tiles.indexOf("function")!=-1) { settings.data = eval('('+settings.tiles+')')($this,settings,0); }
				else {
					for (var z=0; z<2; z++) {
						settings.data.push({ value:"summer", src:"summer0"+((2*z)+1) });
						settings.data.push({ value:"summer", src:"summer0"+((2*z)+2) });
						settings.data.push({ value:"winter", src:"winter0"+((2*z)+1) });
						settings.data.push({ value:"winter", src:"winter0"+((2*z)+2) });
						settings.data.push({ value:"red", src:"red" });
						settings.data.push({ value:"red", src:"red" });
						settings.data.push({ value:"green", src:"green" });
						settings.data.push({ value:"green", src:"green" });
						settings.data.push({ value:"gears", src:"gears" });
						settings.data.push({ value:"gears", src:"gears" });
						for (var i=1; i<10; i++)  {
							settings.data.push({ value:"bam0"+i, src:"bam0"+i });
							settings.data.push({ value:"bam0"+i, src:"bam0"+i });
							settings.data.push({ value:"dot0"+i, src:"dot0"+i });
							settings.data.push({ value:"dot0"+i, src:"dot0"+i });
							settings.data.push({ value:"num0"+i, src:"num0"+i });
							settings.data.push({ value:"num0"+i, src:"num0"+i });
						}
						
						settings.data.push({ value:"east", src:"east" });
						settings.data.push({ value:"east", src:"east" });
						settings.data.push({ value:"west", src:"west" });
						settings.data.push({ value:"west", src:"west" });
						settings.data.push({ value:"south", src:"south" });
						settings.data.push({ value:"south", src:"south" });
						settings.data.push({ value:"north", src:"north" });
						settings.data.push({ value:"north", src:"north" });
					}
				} 
				
				if (pos.length>settings.data.length) { alert("SIZE ISSUE (elt: "+settings.data.length+") ("+pos.length+")"); }
				for (var i=0; i<pos.length; i++) { settings.elts.push(helpers.tile($this, settings.data[i])); }

				var nb=0;
				do { helpers.setpos($this,pos,true); nb++; } while ( !helpers.simulation($this) && nb<10);
				if (nb==10) { alert("Error on tiles ("+pos.length+")"); }
				else {
					helpers.display($this,true);
					helpers.endturn($this);
				}

                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		// PROVIDE RANDOMLY CHOSEN POSITION TO AVAILABLE TILES
		setpos: function($this, _pos, _random) {
            var settings = helpers.settings($this), tiles=[];
			if (_random) { shuffle(_pos); }
			for (var i in settings.elts) { if (settings.elts[i].active) { tiles.push(settings.elts[i]); } }
			if (_pos.length != tiles.length) { console.log("SIZE ISSUE ("+tiles.length+" / "+_pos.length+")"); }
			else {
				for (var i=0; i<tiles.length; i++) { tiles[i].pos = [ _pos[i][0], _pos[i][1], _pos[i][2] ]; }
			}
		},
		// PROVIDE REMAINING POSITION
		getpos: function($this) {
            var settings = helpers.settings($this);
			var pos=[];
			for (var i in settings.elts) {
				var c = settings.elts[i];
				if (c.active) { pos.push([c.pos[0], c.pos[1], c.pos[2]]); }
			}
			return pos;
		},
		// DISPLAY TILES ACCORDING TO THEIR POSITION
        display: function($this,_clear) {
            var settings = helpers.settings($this);
            if (_clear) { $this.find("#mgboard>div").html(""); }
			settings.elts.sort(function(_a,_b) { return (_a.pos[0]>_b.pos[0]); });
            for (var i in settings.elts)
            {
				var elt=settings.elts[i];
				if (elt.active) {
					elt.zindex = Math.floor(2.1*(settings.size[0]-elt.pos[0])+2*elt.pos[1]+
										    (settings.size[0]+settings.size[1])*4*elt.pos[2] );
					elt.$html.css("top",(elt.pos[1]*2.5-elt.pos[2]*0.25+settings.offset[1])+"em")
							 .css("left",(elt.pos[0]*1.75+elt.pos[2]*0.25+settings.offset[0])+"em")
							 .css("z-index",elt.zindex);
					if (settings.mask) { elt.$html.toggleClass("blocked", !elt.free); }
					if (_clear) {  $this.find("#mgboard>div").append(elt.$html); }
				}
            }
		},
		// GET FREE TILES
		getfree: function($this) {
            var settings = helpers.settings($this);
			var ret = {};
			
            for (var i in settings.elts) {
                var c = settings.elts[i];
				c.update(settings.elts);
                if (c.active && c.free) {
                    if (ret[c.value]) { ret[c.value].push(c); } else { ret[c.value]=[c]; } }
            }
			return ret;
		},
		// VALID AND UPDATE GRID
		simulation: function($this) {
            var settings = helpers.settings($this);
			var ret = false, nbactives = 0, nbtry = 0;
			// SAVE CURRENT STATE
			for (var i in settings.elts) {
				settings.elts[i].tmp = settings.elts[i].active;
				if (settings.elts[i].active) { nbactives++; }
			}
			
			do {
				var frees = helpers.getfree($this);
				nbtry++;
				
				// DISACTIVATE PAIRS
				for (var i in frees) {
					if (frees[i].length>1) {
						frees[i][0].active = false; 	frees[i][1].active = false;
						nbtry = 0;						nbactives-=2;
				} }
				// SHUFFLE REMAINING TILES IF NO PAIR THIS TURN (10 TIMES MAX)
				if (nbtry!=0) {	helpers.setpos($this, helpers.getpos($this), true); }
			} while (nbactives>0 && nbtry<10);
			
			if (nbactives == 0) { ret = true; }
			
			// RESTORE CURRENT STATE
			for (var i in settings.elts) { settings.elts[i].active = settings.elts[i].tmp; }
			helpers.getfree($this);
			
			return ret;
			
		},
        endturn: function($this) {
            var settings = helpers.settings($this);
			settings.interactive=false;
			
            settings.hints=helpers.getfree($this);
            var still=false;
            for (var i in settings.hints) { if (settings.hints[i].length>1) { still=true; } }
			
            if (!still) {
				var gameover = true;
				if (settings.shuffle) {
					var nb = 0;
					do { nb++; helpers.setpos($this, helpers.getpos($this), true); } while ( !helpers.simulation($this) && nb<10);
					if (nb<10) {
						gameover = false;
						$this.find("#mgshuffle").css("opacity",0).show().animate({opacity:1},300, function() {
							$this.find(".mgtile").css("opacity",1).animate({opacity:0},500);
							setTimeout(function() {
								$this.find("#mgshuffle").animate({opacity:0},500, function() {
									$(this).hide();
									helpers.endturn($this);
									$this.find(".mgtile").css("opacity",0).animate({opacity:1},500);
								});
							},800);
						});
					}
				}
				
				if (gameover) {
					settings.score=0;
					$this.find("#g_effects").addClass("wrong");
					setTimeout(function() {helpers.end($this, {'status':'success','score':settings.score});}, 1000);
				}
            }
			else { settings.interactive=true; helpers.display($this,false); }
        },
        tile: function($this,_data) {
            var settings = helpers.settings($this);
            var ret = {
                id          : "t"+(settings.count++),
                value       : _data.value,
                $html       : 0,
                free        : false,
                pos         : [0,0,0],
                zindex      : 0,
                active      : true,
				tmp			: true,
				update: function(_elts) {
					var up=true, right=true, left=true;
					for (var i in _elts) {
						var c = _elts[i];
						if (c.id!=this.id && c.active && c.pos) {
							if (c.pos[2]==this.pos[2] && Math.abs(c.pos[1]-this.pos[1])<0.9 && Math.abs(c.pos[0]-this.pos[0])<1.5) {
								if (c.pos[0]<this.pos[0]) { left=false; } else { right=false; }
							}
							else if (c.pos[2]==this.pos[2]+1 && Math.abs(c.pos[1]-this.pos[1])<0.9 && Math.abs(c.pos[0]-this.pos[0])<0.9) {
								up = false;
							}
						}
					}
					this.free = (up && (left||right));
					return this.free;
				}
            };
            
            ret.$html=$("<div class='mgtile' id='"+ret.id+"'>"+
                            "<img src='res/img/asset/mahjong/"+(_data.src?_data.src:"void")+".svg' alt='' />"+
                            "<div class='img'></div>"+
                            "<div class='txt'><div></div></div>"+
                            "<div class='sub'><div></div></div>"+
                            "<div class='hg'></div>"+
                            "<div class='mask'></div>"+
                        "</div>");
            
            if (_data.img) { ret.$html.find(".img").append("<img src='"+_data.img+"' alt=''/>").show(); }
            if (_data.txt) { ret.$html.find(".txt>div").css("font-size",(_data.txtfont?_data.txtfont:1)+"em")
                                      .append(_data.txt).parent().show(); }
            if (_data.sub) { ret.$html.find(".sub>div").css("font-size",(_data.subfont?_data.subfont:1)+"em")
                                      .append(_data.sub).parent().show(); }
            
            ret.$html.bind("mousedown touchstart", function(_event) {
                if (settings.interactive) {
                    var elt=0;
                    for (var i in settings.elts) { if (settings.elts[i].id == $(this).attr("id")) { elt=settings.elts[i]; }}
                    
                    if (elt && elt.free) {
                        if (settings.selected==0) {
                            settings.selected=elt;
                            elt.$html.addClass("s");
                        }
                        else {
                            if (settings.selected.id!=elt.id) {
                                settings.interactive = false;
                                elt.$html.addClass("s");
                                        
                                if (settings.selected.value==elt.value) {
                                    settings.selected.active = false;
                                    elt.active = false;
									
									$this.find("#mgfx1>div").addClass("g_arunning").parent()
									     .css("top",  settings.selected.$html.offset().top - $this.offset().top)
										 .css("left", settings.selected.$html.offset().left - $this.offset().left)
										 .show();
									$this.find("#mgfx2>div").addClass("g_arunning").parent()
									     .css("top",  elt.$html.offset().top - $this.offset().top)
										 .css("left", elt.$html.offset().left - $this.offset().left)
										 .show();
									setTimeout(function() {
										$this.find(".mgfx>div").removeClass("g_arunning").parent().hide();
									},800);
										 
                                    setTimeout(function() {
                                        
                                        settings.selected.$html.animate({opacity:0}, 200, function() { $(this).detach(); });
                                        elt.$html.animate({opacity:0}, 200, function() { $(this).detach(); });
                                        helpers.clean($this);
                                        
                                        var finish=true;
										for (var i in settings.elts) { if (settings.elts[i].active) { finish=false; } }
										if (finish) {
											settings.interactive = false;
											$this.find("#g_effects").addClass("good");
											setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); }, 1000); }
										else        { helpers.endturn($this); }
                                    
                                        
                                    }, 300);
                                    
                                    
                                }
                                else { setTimeout(function() { helpers.clean($this); }, 300); }
                            }
                            else { helpers.clean($this); }
                        }                        
                    }
                
                }
                _event.preventDefault();
            });
            
            return ret;
        },
        clean : function($this) {
            var settings = helpers.settings($this);
            $this.find(".mgtile.s").removeClass("s");
            settings.selected=0;
			settings.interactive = true;
        }
    };

    // The plugin
    $.fn.mahjong = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    score           : 5,
                    count           : 0,
					data			: [],			// TILE DEFINITION
                    elts            : [],
					size			: [0,0,0],		// GRID SIZE
					number			: 0,			// NUMBER TILES
                    selected        : 0,
                    hints           : {}
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
            clean: function() { helpers.clean($(this)); },
            hint: function() {
                var $this = $(this) , settings = helpers.settings($this);
                for (var i in settings.hints) {
                    if (settings.hints[i].length>1) {
                        settings.hints[i][0].$html.addClass("h");
                        settings.hints[i][1].$html.addClass("h");
                        if (--settings.score<0) { settings.score=0; }
                        break;
                    }
                }
                $this.find("#mgmask").hide();
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mahjong plugin!'); }
    };
})(jQuery);

