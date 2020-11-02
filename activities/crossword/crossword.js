(function($) {
    // Activity default options
    var defaults = {
        name        : "crossword",                              // The activity name
        label       : "Crossword",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        font        : 1,                                        // The font-size multiplicator
        empty       : ' ',                                      // Empty cell value
        emptyval    : '',                                       // if exist, this cell value has to be empty
        margin      : 0,                                        // Margin value
        horiz       : false,                                    // Only horizontal words
        move        : true,                                     // Move after key
        keypad      : "num",                                    // The keypad
        number      : 1,                                        // Number of exercices
        fontex      : 1,                                        // Exercice fontsize
		fonttitle	: 1,										// Title fontsize
		hex			: 10,										// Exercice height in percent
		htitle		: 10,										// Title height in percent
		hfiller		: 0,										// Filler height in percent
		hdef		: 18,										// Menu definition height in percent
        errratio    : 1,                                        // Error ratio
		highlight	: {},										// Highlight cells
        background  : "",                               		// Background image
		auto		: false,									// Automatic submit
        debug       : true                                      // Debug mode
    };

    var gRegExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
		"\\\[n\\\]([^\\\[]+)\\\[/n\\\]",            "<div class='n'>$1</div>",
		"\\\[n\\\]\\\[/n\\\]",            			"<div class='n'>&nbsp;</div>",
        "\\\[strong\\\]([^\\\[]+)\\\[/strong\\\]",  "<div class='strong'>$1</div>",
        "\\\[a\\\]([^\\\[]+)\\\[/a\\\]",  			"<div class='a'>$1</div>",
        "\\\[ad\\\]([^\\\[]+)\\\[/ad\\\]",  		"<div class='ad'>$1</div>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<span style='font-size:.6em;'>$1</span>",
		"\\\[img\\\]([^\\\[]+)\\\[/img\\\]",    	"<img src='$1' alt=''/>",
		"\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",    	"<div class='icon' style='margin:0 auto;'><img src='$1' alt=''/></div>",
		"\\\[svg\\\]([^\\\[]+)\\\[/svg\\\]",    	"<div class='icon' style='margin:0 auto;'><svg viewBox='0 0 48 48' width='100%' height='100%'>$1</svg></div>",
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
				
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
				
				if (settings.auto) { $this.find("#g_submit").hide(); }

                // Locale handling
                $this.find("#guide").html(settings.guide);
                $this.find("#guide2").html(settings.guide2);
                if (settings.locale)    { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(jtools.format(value)); }); }

                if (settings.data && $.isArray(settings.data[0])) { settings.number = settings.data.length; }

                setTimeout(function() { helpers.build($this);}, 100);
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build:function($this) {
            var settings = helpers.settings($this);
            $this.find("#g_effects").removeClass();
            $this.find("#g_submit").removeClass();
			settings.nbhints = 0;

            $this.find("#cd_"+settings.keypad).show();

            if (settings.data)  { settings.values       = $.isArray(settings.data[0])?settings.data[settings.id]:settings.data; }
            if (settings.def)   { settings.definition   = $.isArray(settings.def[0])?settings.def[settings.id]:settings.def; }
            var fixed = settings.fixed;

            if (settings.gen) {
                var gen = eval('('+settings.gen+')')($this, settings, settings.id);
                if (gen.data) 	{ settings.values     = gen.data; 	}
                if (gen.def)	{ settings.definition = gen.def; 	}
                if (gen.fixed)  { fixed               = gen.fixed;	}
            }
            if (settings.title) {
				$this.find("#cd_title").html(jtools.format(settings.title, gRegExp))
					.css("height",settings.htitle+"%").css("font-size",settings.fonttitle+"em").show();
			}
			else { $this.find("#cd_title").hide(); }

            if (!settings.definition)      { $this.addClass("nodef"); }
			else { $this.find("#cd_def").css("height",settings.hdef+"%"); }
			
            if (!settings.exercice)        { $this.addClass("noex"); }
			$this.find("#cd_ex").css("height",settings.hex+"%");
            $this.find("#cd_ex>div").css("font-size",settings.fontex+"em");
            if (settings.exercice) {
                if ($.isArray(settings.exercice)) { $this.find("#cd_ex>div").html(jtools.format(settings.exercice[settings.id], gRegExp)); }
                else                              { $this.find("#cd_ex>div").html(jtools.format(settings.exercice, gRegExp)); }
            }
			
			$this.find("#cd_ex .a").bind("touchstart mousedown", function(_event) {
				$(this).toggleClass("d"); _event.preventDefault();
			});
            
			if (settings.hfiller) {
				$this.find("#cd_filler").css("height",settings.hfiller+"%").show();
			}

            // BUILD TABLE
            var rbut = 0.9;
            var horiz = (settings.horiz?1.2:1)-(settings.auto?0.1:0);
			var rh=$this.hasClass("topdef")?9:10;
            var size = Math.min((11/(settings.values[0].length+settings.margin)),
                                (rh/(settings.values.length*horiz+settings.margin)));
            
            var mtop= (rh-(size*settings.values.length*horiz))/(2*size);
            var mleft=(11-(size*settings.values[0].length))/(2*size);
            html="<table style='font-size:"+size+"em;margin-top:"+(mtop+0.1)+"em;margin-left:"+(mleft+0.1)+"em;'>";
            for (var row in settings.values) {
                html+="<tr>";
                for (var col in settings.values[row]) {
                    var value=(settings.values[row][col]==settings.empty)?0:Math.floor(Math.random()*2)+1;
                    html+="<td><div class='cd_bg cd_bg"+value+(settings.horiz?" horiz":"")+"' id='"+col+"x"+row+"'>";
                    if (value!=0) {
						html+="<div class='cd_vfx g_anim12 g_anoloop'><div><img src='res/img/asset/anim/bluelight0"+Math.floor(Math.random()*4+1)+".svg' alt=''/></div></div>";
                        html+="<div class='cd_v'";
                        html+=" onclick='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+");'";
                        html+=" ontouchstart='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+");";
                        html+="event.preventDefault();'></div>";
                        html+="<table class='cd_hint'>";
                        for (var i=0; i<9; i++) {
                            if (i%3==0) { html+="<tr>"; }
                            html+="<td><div id='c"+i+"'";
                            html+=" onclick='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+",this);'";
                            html+=" ontouchstart='$(this).closest(\".crossword\").crossword(\"click\","+col+","+row+",this);";
                            html+="event.preventDefault();'></div></td>";
                            if (i%3==2) { html+="</tr>"; }
                        }
                        html+="</table>";
                    }
                    else { html+=">"; }
                    html+="</div></td>";
                }
                html+="</tr>";
            }
            html+="</table>";
			
			// DONE EFFECTS
			if (settings.done) {
				html+="<div style='font-size:"+(4*size)+"em;margin-left:-.5em;' class='g_anim12 g_anoloop cd_fx' id='cd_fx1'><div><img src='res/img/default/anim/star06.svg' alt=''/></div></div>";
				html+="<div style='font-size:"+(4*size)+"em;margin-left:-.2em;' class='g_anim12 g_anoloop cd_fx' id='cd_fx2'><div><img src='res/img/default/anim/star05.svg' alt=''/></div></div>";
			}
            $this.find("#cd_board").html(html);

            // FIXED CELLS
            if (fixed) for (var i in fixed) {
				var val = settings.values[fixed[i][1]][fixed[i][0]];
                $elt = $this.find("#"+fixed[i][0]+"x"+fixed[i][1]);
                $elt.addClass("cd_fixed");
				
				if (val!=settings.emptyval) { $elt.find(".cd_v").html(val); }
            }
			
			for (var c in settings.highlight) for (var z in settings.highlight[c]) {
				var vT = settings.highlight[c][z];
				var vW = Math.max(1,vT.length>3?vT[2]:1);
				var vH = Math.max(1,vT.length>3?vT[3]:1);
				for (var i=0; i<vW; i++) for (var j=0; j<vH; j++) {
					$this.find("#"+(vT[0]+i)+"x"+(vT[1]+j)).css("background-color",c);
				}
			}
        },
        key: function($this, _val) {
            var settings = helpers.settings($this);
			if (_val=="BACK") {
				if (settings.interactive && settings.elt.histo.length) {
					var vLast = settings.elt.histo.pop();
					var vElt = $this.find("#"+vLast[0]+"x"+vLast[1]);
					if (vElt.hasClass("cd_fixed")) {
						settings.elt.histo = [];
					}
					else {
						$this.find(".cd_l2").removeClass("cd_l2");
						$this.find(".cd_l1").removeClass("cd_l1");
						settings.elt.pos=[vLast[0],vLast[1]];
						vElt.find(".cd_v").html("");
						vElt.addClass("cd_l2");
						for (var i in vLast[2]) { vLast[2][i].addClass("cd_l1"); }
					}
				}
			}
			else {
				var vRegexp = 0;
				if (settings.keypad=="num") { vRegexp = new RegExp("[ 1-9]", "g"); } else
				if (settings.keypad=="abc") { _val = _val.toUpperCase(); vRegexp = new RegExp("[ A-Z]", "g"); } else
				if (settings.keypad=="fr")  { _val = _val.toLowerCase(); vRegexp = new RegExp("[ a-zéèêàç]", "g"); }
				var vOk = true;
				if (vRegexp) { vOk = (_val.match(vRegexp)); }
				
				if (settings.interactive && vOk) {
					if (settings.mode) {
						if (settings.elt.pos[0]!=-1 && settings.elt.pos[1]!=-1) {
							var vElt = $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]);
							if (!vElt.hasClass("cd_fixed")) {
								if (vElt.find(".cd_v").html()!=_val[0]) {
									vElt.find(".cd_v").css("opacity",0).html(_val[0]).animate({opacity:1},800);
								}
								vElt.find(".g_anim12>div").addClass("g_arunning").parent().show();
								setTimeout(function() { vElt.find(".g_anim12>div").removeClass("g_arunning").parent().hide(); }, 1000);
								
								var vHl = [];
								$this.find(".cd_l1").each(function(_index) { vHl.push($(this)); });
								settings.elt.histo.push([settings.elt.pos[0], settings.elt.pos[1],vHl]);
								
								// MOVE TO THE NEXT CHARACTER
								if (settings.move) {
									
									// FIND NEXT REGARDING THE FIXED CELLS
									var vCont;
									do {
										vCont = false;
										if (settings.elt.horiz) { settings.elt.pos[0]++; } else { settings.elt.pos[1]++; }
										if (settings.elt.pos[settings.elt.horiz?0:1]<=settings.elt.end) {
											vCont = $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]).hasClass("cd_fixed");
										}
										
									} while (vCont);
									
									
									$this.find(".cd_l2").removeClass("cd_l2").addClass("cd_l1");
									if ( settings.elt.pos[0]>=settings.values[0].length)  { settings.elt.pos[0] = -1; }
									if ( settings.elt.pos[1]>=settings.values.length)     { settings.elt.pos[1] = -1; }
									if ( settings.elt.pos[0]!=-1 && settings.elt.pos[1]!=-1) {
										var $elt = $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]);
										$elt.removeClass("wrong");
										if (!$elt.hasClass("cd_fixed")) { $elt.removeClass("cd_l1").addClass("cd_l2"); }
									}
									else if (settings.done) {
										var vOk = true;
										for (var i=settings.elt.begin; i<=settings.elt.end; i++) {
											if (!(settings.elt.horiz?
												helpers.check($this, i, settings.elt.pos[1]):helpers.check($this, i, settings.elt.pos[0]))) {
												vOk = false; }
										}
										if (vOk) {
											$this.find(".cd_l1").removeClass(".cd_l1").addClass("cd_fixed");
											
											// SHOW FX
											var $begin = $this.find("#"+
												(settings.elt.horiz?settings.elt.begin+"x"+settings.elt.pos[1]:
																	settings.elt.pos[0]+"x"+settings.elt.end));
											$this.find("#cd_fx1").css("top",$begin.offset().top-$this.offset().top)
																 .css("left",$begin.offset().left-$this.offset().left);
											var $end = $this.find("#"+
												(settings.elt.horiz?settings.elt.end+"x"+settings.elt.pos[1]:
																	settings.elt.pos[0]+"x"+settings.elt.end));
											$this.find("#cd_fx2").css("top",$end.offset().top-$this.offset().top)
																 .css("left",$end.offset().left-$this.offset().left);
											$this.find(".cd_fx>div").addClass("g_arunning").parent().show();
											setTimeout(function() { $this.find(".cd_fx>div").removeClass("g_arunning").parent().hide(); }, 1000);
											
											if (settings.done.show) { helpers.hint($this,settings.done.show); }
										}
										
									}
								}
							}
						}
					}
					else {
						if (settings.elt.hint) {
							settings.elt.hint.html(_val[0]);

							if (settings.move) {
								if (settings.elt.horiz) { settings.elt.pos[0]++; } else { settings.elt.pos[1]++; }
								if ( settings.elt.pos[0]>=settings.values[0].length)  { settings.elt.pos[0] = -1; }
								if ( settings.elt.pos[1]>=settings.values.length)     { settings.elt.pos[1] = -1; }
								$this.find(".cd_hint div").removeClass("s");
								$this.find(".cd_l2").removeClass("cd_l2").addClass("cd_l1");
								if ( settings.elt.pos[0]!=-1 && settings.elt.pos[1]!=-1) {
									var $elt = $this.find("#"+settings.elt.pos[0]+"x"+settings.elt.pos[1]);
									if (!$elt.hasClass("cd_fixed")) {
										settings.elt.hint = $elt.find("#"+settings.elt.hint.attr("id"));
										settings.elt.hint.addClass("s");
										$elt.removeClass("cd_l1").addClass("cd_l2");
									}
								}
							}
						}
					}
				}
				if (settings.auto) { helpers.valid($this, false); }
            }
        },
		check: function($this, _col, _row) {
            var settings = helpers.settings($this);
			var value = $this.find("#"+_col+"x"+_row+" .cd_v").text();
			if (value==" "&&settings.emptyval) { value=settings.emptyval; }
			var ret = true;
            if (settings.values[_row][_col]!=settings.empty && settings.values[_row][_col]!=value) {
				ret = !value.length && settings.values[_row][_col]==settings.emptyval;
			}
			return ret;
		},
		valid: function($this, _end, _cb) {
            var settings = helpers.settings($this);
			var error = 0;
			for (var row=0; row<settings.values.length; row++) for (var col=0; col<settings.values[row].length; col++) {
				var vGood = helpers.check($this, col, row);
				if (!vGood) { error++; }
				if (_cb) { _cb(col,row, vGood); }
            }
			if (error==0 || _end) {
				$this.find(".cd_bg").removeClass("cd_l1").removeClass("cd_l2");
				$this.find(".cd_bg .cd_v").show();
				$this.find(".cd_hint div").removeClass("s");
				for (var row=0; row<settings.values.length; row++) for (var col=0; col<settings.values[row].length; col++) {
					if (!helpers.check($this, col, row)) { $this.find("#"+col+"x"+row).addClass("wrong"); }
                }
                settings.score=Math.max(0,settings.score-error*settings.errratio-settings.nbhints);
                $this.find("#g_effects").addClass(error==0?"good":"wrong");
				$this.find("#g_submit").addClass(error==0?"good":"wrong");

                if (++settings.id<settings.number) {
                    setTimeout(function() { helpers.build($this); }, 1000);
                }
                else {
                    settings.interactive = false;
                    setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); }, 1000);
                }
			}
		},
		hint: function($this, _nb) {
            var settings = helpers.settings($this);
			var empty=[];
			for (var row in settings.values) {
				for (var col in settings.values[row]) {
					if (settings.values[row][col]!=settings.empty) {
						var $elt = $this.find("#"+col+"x"+row);
						if (!$elt.hasClass("cd_fixed")) { empty.push([col,row]); }
					}
				}
			}
			shuffle(empty);
                    
			for (var i=0; i<Math.min(empty.length, _nb); i++) {
				var pos=empty[i];
				var $elt = $this.find("#"+pos[0]+"x"+pos[1]);
				$elt.addClass("cd_fixed").removeClass("wrong").find(".cd_v").html(settings.values[pos[1]][pos[0]]);
				$elt.find(".cd_vfx>div").addClass("g_arunning").parent().show();
				setTimeout(function() { $this.find(".cd_vfx>div.g_arunning").removeClass("g_arunning").parent().hide(); }, 1000);
			}
		}
    };

    // The plugin
    $.fn.crossword = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    mode    : true,
					score	: 5,
                    interactive : false,
                    elt     : {
						histo	: [],
                        horiz   : true,
                        pos     : [-1,-1],
                        hint    : 0,
						begin	: 0,
						end		: 0
                    },
					nbhints	: 0,
                    id      : 0
                };


                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
					
					$(document).keydown(function(_e) {
						if (_e.keyCode == $.ui.keyCode.BACKSPACE) { helpers.key($this,"BACK"); _e.preventDefault(); }
					});
                    $(document).keypress(function(_e) { helpers.key($this, String.fromCharCode(_e.which)); });

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
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
				helpers.end($this,{'status':'abort'});
            },
            click: function(_col,_row, _hint) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    _col = parseInt(_col); _row = parseInt(_row);

                    $this.find(".cd_bg").removeClass("cd_l1").removeClass("cd_l2");
                    $this.find(".cd_hint div").removeClass("s");

                    // TOGGLE ORIENTATION
                    if (settings.elt.pos[0]==_col && settings.elt.pos[1]==_row &&
                            (!_hint || !settings.elt.hint || $(_hint).attr("id")==settings.elt.hint.attr("id"))) {
                        settings.elt.horiz = (!settings.elt.horiz);
                    }
                    settings.elt.pos = [_col,_row];
                    if (settings.horiz) { settings.elt.horiz = true; }
					$this.find("#"+_col+"x"+_row).removeClass("wrong");

                    // FIND THE BEST ORIENTATION
                    var begin, end;
                    for (var i=0; i<2; i++) {
                        if (settings.elt.horiz) {
                            var begin=_col; while(begin>=0 && settings.values[_row][begin]!=settings.empty) { begin--; } begin++;
                            var end=begin;  while(end<settings.values[0].length && settings.values[_row][end]!=settings.empty) { end++; } end--;
                        }
                        else {
                            var begin=_row; while(begin>=0 && settings.values[begin][_col]!=settings.empty) { begin--; } begin++;
                            var end=begin;  while(end<settings.values.length && settings.values[end][_col]!=settings.empty) { end++; } end--;
                        }
                        if (begin==end) { settings.elt.horiz = (!settings.elt.horiz); } else break;
                     }

                    // SHOW CURRENT COL OR ROW
                    for (var i=begin; i<=end; i++) {
                        $this.find("#"+(settings.elt.horiz?i+"x"+_row:_col+"x"+i))
                            .addClass((i==(settings.elt.horiz?_col:_row))?"cd_l2":"cd_l1");
                    }
					settings.elt.begin = begin;
					settings.elt.end   = end;

                    // GET THE DEFINITION
                    var ref = settings.elt.horiz?begin+"x"+_row:_col+"x"+begin;
                    var def = "";
                    if (settings.definition && settings.definition[settings.elt.horiz?"horiz":"vert"] &&
                        settings.definition[settings.elt.horiz?"horiz":"vert"][ref]) {
                        def = settings.definition[settings.elt.horiz?"horiz":"vert"][ref];

                        if (settings.regexp) {
                            var vRegexp = new RegExp(settings.regexp.from, "g");
                            def = def.replace(vRegexp, settings.regexp.to);
                        }

                    }

					var $def = $this.find($this.hasClass("topdef")?"#cd_header>div":"#cd_def");
					$def.html("<div style='font-size:"+settings.font+"em;'>"+jtools.format(def.toString(),gRegExp)+"</div>").toggleClass("c",(def.length<5));

                    if (_hint) {
                        if (settings.mode) {
							$(_hint).closest(".cd_hint").hide();
							var vElt = $(_hint).closest(".cd_bg");
							vElt.find(".cd_v").css("opacity",0).show().html($(_hint).html()).animate({opacity:1},800);
							vElt.find(".g_anim12>div").addClass("g_arunning").parent().show();
							setTimeout(function() { vElt.find(".g_anim12>div").removeClass("g_arunning").parent().hide(); }, 1000);
						}
                        else {
                            $(_hint).addClass("s");
                            settings.elt.pos=[_col,_row]; settings.elt.hint = $(_hint);
                        }
                    }
                    else { settings.elt.hint = 0; }
                }
            },
            key: function(_elt) { 
                if (_elt) { $(_elt).addClass("g_ktouch");
                    setTimeout(function() { $(_elt).removeClass("g_ktouch"); }, 50);
                }
                helpers.key($(this), $(_elt).text()); },
            next: function()    { helpers.settings($(this)).interactive = true; },
            valid: function() 	{ helpers.valid($(this), true); },
            mode: function(_elt, _val) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.mode!=_val) {
                    settings.mode = _val;
                    settings.elt.pos = [-1,-1];
                    $this.find("#cd_mode .g_button").removeClass("s");
                    $this.find(".cd_hint div").removeClass("s");
                    $(_elt).addClass("s");
                    $("#cd_board .cd_bg").each( function() {
                        $cell = $(this);
                        if (settings.mode) {
                            var hintempty=true;
                            $cell.find(".cd_hint div").each(function() {
                                var v = $(this).html();
                                if (v && v.length!=0 && v[0]!=' ' && v!="&#xA0;") { hintempty=false; }
                            });
                            if (hintempty) { $cell.find(".cd_v").show(); $cell.find(".cd_hint").hide(); }

                        }
                        else {
                            var $value = $cell.find(".cd_v");
                            if ($value && (!$value.html() || $value.html().length==0 || $value.html()[0]==' ' || $value.html()=="&#xA0;")) {
                                 $value.hide();
								 $cell.find(".cd_hint").show();
                            }
                        }
                    });
                }
            },
            show: function(_value, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
				$this.find("#cd_help .g_button").removeClass("s");
				$(_elt).addClass("s");
				$this.find(".cdhelplabel").hide();
				$this.find("#cd"+_value).show();
				$this.find("#cdhelp").show();
			},
			help: function() {
                var $this = $(this) , settings = helpers.settings($this);
				$this.find("#cdhelp").hide();
				settings.nbhints++;
				if ($this.find("#cd_hcheck").hasClass("s")) {
					helpers.valid($(this), false, function(_col,_row,_ok) {
						if (!_ok) { $this.find("#"+_col+"x"+_row).addClass("wrong");
						}
					});
				}
				else {
					helpers.hint($this, 1); 
					if (settings.auto) { helpers.valid($this, false); }
				}
				$this.find("#cd_help .g_button").removeClass("s");
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in crossword plugin!'); }
    };
})(jQuery);

