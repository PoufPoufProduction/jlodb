(function($) {
    // Activity default options
    var defaults = {
        name        : "jewel",                            // The activity name
        label       : "Jewel",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        board       : ["aaaa","aaaa","aaaa","aaaa"],		// grid
        pjewels     : [1,1,1,1,1,1,1,0,0,0],                // Jewel probability
        pspecial    : [20,20,20,20,20,20,20,20,20,20],      // Jewel special (horiz or vertical)
        pbomb       : 0,                                    // Bomb
        specials    : [true, true, true],                   // Jewel horizontal, vertical or local
		blocked		: true,									// Do not change jewels
		ref			: 0,									// Reference score
		time		: 0,
		goals		: [{"type":"max","value":10},{"type":"frozen"}],
        debug       : true                                  // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

    var gspeed = 500;
    var ncells = [[-1,0],[0,-1],[1,0],[0,1]];
	
    var s = { normal : 0, success: 1, failure: 2 };

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

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
				helpers.score($this,0);

                // BUILD THE PROBABILITY VECTOR
                for (var i=0; i<settings.pjewels.length; i++) for(var j=0; j<settings.pjewels[i]; j++) { settings.proba.push(i); }

                if (settings.time) { $this.find("#time").show(); $this.find("#withtime").show();}

                // goals handling
                setTimeout(function() { helpers.goals.init($this); }, 100);
				
                // BUILD GRID
                settings.size = [ settings.board[0].length, settings.board.length];
                var max     = Math.max(settings.size[1], settings.size[0])*1.1;
                $this.find("#board>div").css("font-size", (12/max)+"em")
                                        .css("margin-left", ((max-settings.size[0])/2)+"em")
                                        .css("margin-top", ((max-settings.size[1])/2)+"em");
										
				do {		
					$this.find("#board>div").html("");
					settings.tcells=[];
					for (var j=0; j<settings.size[1]; j++) {
						var tmp=[];
						for (var i=0; i<settings.size[0]; i++) { tmp.push(0); }
						settings.tcells.push(tmp);
					}
					for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
						if (helpers.fromboard($this, i, j)!='0') {
							var ok, cell, $bg;
							do {
								ok = true;
								cell=helpers.jewel($this, i, j, helpers.fromboard($this, i, j));
								if (cell.match(helpers.cell($this,i,j-1)) && cell.match(helpers.cell($this,i,j-2))) { ok = false; }
								if (cell.match(helpers.cell($this,i-1,j)) && cell.match(helpers.cell($this,i-2,j))) { ok = false; }
							} while(!ok);
							helpers.cell($this,i,j,cell);
							$this.find("#board>div").append(cell.$html);


							var $bg = $("<div class='bg'></div>");
							var neighboors = ['0','0','0','0'], radius = [];
							for (var n=0; n<4; n++) { neighboors[n] = helpers.fromboard($this, i+ncells[n][0], j+ncells[n][1]); }
							for (var n=0; n<4; n++) { radius.push(neighboors[n]=='0'&&neighboors[(n+1)%4]=='0'?".2em":"0"); }
							$bg.css("border-radius",radius.join(" ")).css("top",j+"em").css("left",i+"em");
							$this.find("#board>div").append($bg);

						}
					}
				} while (helpers.blocked($this));

                $this.bind("touchmove mousemove", function(_event) {
                    if (settings.interactive && settings.action.elt1 ) {
                        var e = (_event && _event.originalEvent &&
                                 _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                 _event.originalEvent.touches[0]:_event;
                        var difx = Math.max(-1,Math.min(1,Math.pow((e.clientX - settings.action.pos[0])/settings.width,3)));
                        var dify = Math.max(-1,Math.min(1,Math.pow((e.clientY - settings.action.pos[1])/settings.width,3)));
                        var elt2 = 0;
                        settings.ok = false;
                        if (Math.abs(difx)>Math.abs(dify) && Math.abs(difx)>0.1) {
                            elt2 = helpers.cell($this, settings.action.elt1.pos[0]+Math.sign(difx), settings.action.elt1.pos[1]);
                            if (elt2 && elt2.canmove() ) {
                                elt2.offset(-difx,0); settings.action.elt1.offset(difx,0);
                                settings.ok = (Math.abs(difx)>0.5);
                             }
                        }
                        else if (Math.abs(dify)>Math.abs(difx) && Math.abs(dify)>0.1) {
                            elt2 = helpers.cell($this, settings.action.elt1.pos[0], settings.action.elt1.pos[1]+Math.sign(dify));
                            if (elt2 && elt2.canmove() ) {
                                elt2.offset(0,-dify); settings.action.elt1.offset(0,dify);
                                settings.ok = (Math.abs(dify)>0.5);
                            }
                        }

                        if (elt2) {
                            if (settings.action.elt2 && settings.action.elt2!=elt2) { settings.action.elt2.offset(0,0); }
                            settings.action.elt2 = elt2;
                        }
                        else {
                            if (settings.action.elt2) { settings.action.elt2.offset(0,0); settings.action.elt2 = 0; }
                            settings.action.elt1.offset(0,0);
                        }
                    }
                    _event.preventDefault();
                });

                $this.bind("touchend touchleave mouseup mouseleave", function(_event) {
                    if (settings.interactive && settings.action.elt1 ) {
                        if (settings.ok && settings.action.elt2) {
                            settings.interactive=false;
                            // SWITCH
                            var tmp = [settings.action.elt1.pos[0], settings.action.elt1.pos[1] ];
                            settings.action.elt1.pos = [settings.action.elt2.pos[0], settings.action.elt2.pos[1] ];
                            settings.action.elt2.pos = [tmp[0],tmp[1]];
                            settings.action.elt2.init();
                            settings.action.elt1.init();
                            helpers.cell($this, settings.action.elt1.pos[0], settings.action.elt1.pos[1], settings.action.elt1);
                            helpers.cell($this, settings.action.elt2.pos[0], settings.action.elt2.pos[1], settings.action.elt2);
                            // CHECK CLEAR
                            settings.action.count = 0;
                            if (!helpers.compute($this)) {
                                // RESTORE IF NOTHING MATCHES
                                settings.action.elt2.pos = [settings.action.elt1.pos[0], settings.action.elt1.pos[1] ];
                                settings.action.elt1.pos = [tmp[0],tmp[1]];
                                settings.action.elt2.reinit(500);
                                settings.action.elt1.reinit(500,function() { settings.interactive = true; });
                                helpers.cell($this, settings.action.elt1.pos[0], settings.action.elt1.pos[1], settings.action.elt1);
                                helpers.cell($this, settings.action.elt2.pos[0], settings.action.elt2.pos[1], settings.action.elt2);
                            }
							else { if (settings.timer.id) { clearTimeout(settings.timer.id); } }
                        }
                        else {
                            if (settings.action.elt2) { settings.action.elt2.init(); }
                            settings.action.elt1.init();
                        }

                        settings.action.elt1 = 0;
                        settings.action.elt2 = 0;
                        $this.find(".cell").css("z-index",2);
                    }
                    _event.preventDefault();
                });

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        goals: {
            init: function($this) {
                var settings = helpers.settings($this);
                for (var i in settings.goals) {
                    var txt = settings.locale.goaltxt[settings.goals[i].type];
                    switch(settings.goals[i].type) {
                        case "survive":
                            $this.find("#counter").html(settings.goals[i].value).show();
                            txt = txt.replace("$1","<span class='l'>"+settings.goals[i].value+"</span>");
                            break;
                        case "max":
                            $this.find("#counter").html(settings.goals[i].value).addClass("s").show();
                            txt = txt.replace("$1","<span class='l'>"+(settings.goals[i].value)+"</span>");
                            break;
                    }
                    $this.find("#splashex ul").append("<li>"+txt+"</li>");
                    $this.find("#splashex #goals").show();
                }
            },
            // return s.normal, s.success or s.failure
            check: function($this, _update) {
                var settings = helpers.settings($this);
                var ret = s.normal, goal = 0;

                if (settings.goals && settings.goals.length) {
                    for (var i in settings.goals) {
                        switch(settings.goals[i].type) {
                            case "survive":
                                var val = parseInt($this.find("#counter").html());
                                if (val>1) { if (_update) { val--; } } else { goal++; }
                                $this.find("#counter").html(val);
                                break;
                            case "max":
                                var val = parseInt($this.find("#counter").html());
                                goal++;
                                if (val>1) { if (_update) { val--; } } else { if (_update) { val=0; } ret = s.failed; }
                                $this.find("#counter").html(val);
                                break;
                            case "frozen":
                                var ok = true;
								for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                                    var cell = helpers.cell($this,i,j);
                                    if (cell) {
                                        if (cell.frozen || cell.locked) { ok = false; }
                                    }
								}
                                if (ok) { goal++; }
                                break;
                        }
                    }
                    if (goal==settings.goals.length) { ret = s.success; } 
                }
                return ret;
            }
        },
		blocked: function($this) {
            var settings  = helpers.settings($this);
			var ret = true;
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
				if (helpers.cell($this,i,j) && helpers.cell($this,i,j).canmove()) {
					if (j>0 && helpers.cell($this,i,j-1) && helpers.cell($this,i,j-1).canmove() ) {
						if (i>1 && helpers.cell($this,i,j-1).match(helpers.cell($this,i-2,j)) && helpers.cell($this,i,j-1).match(helpers.cell($this,i-1,j)) ) { ret =false; }					
						if (i>0 && i<settings.size[0]-1 && helpers.cell($this,i,j-1).match(helpers.cell($this,i-1,j)) && helpers.cell($this,i,j-1).match(helpers.cell($this,i+1,j)) ) { ret =false; }
						if (i<settings.size[0]-2 && helpers.cell($this,i,j-1).match(helpers.cell($this,i+1,j)) && helpers.cell($this,i,j-1).match(helpers.cell($this,i+2,j)) ) { ret =false; }
						if (j<settings.size[1]-2 && helpers.cell($this,i,j-1).match(helpers.cell($this,i,j+1)) && helpers.cell($this,i,j-1).match(helpers.cell($this,i,j+2)) ) { ret =false; }
					}
					if (j<settings.size[1]-1 && helpers.cell($this,i,j+1) && helpers.cell($this,i,j+1).canmove()) {
						if (i>1 && helpers.cell($this,i,j+1).match(helpers.cell($this,i-2,j)) && helpers.cell($this,i,j+1).match(helpers.cell($this,i-1,j)) ) { ret =false; }					
						if (i>0 && i<settings.size[0]-1 && helpers.cell($this,i,j+1).match(helpers.cell($this,i-1,j)) && helpers.cell($this,i,j+1).match(helpers.cell($this,i+1,j)) ) { ret =false; }
						if (i<settings.size[0]-2 && helpers.cell($this,i,j+1).match(helpers.cell($this,i+1,j)) && helpers.cell($this,i,j+1).match(helpers.cell($this,i+2,j)) ) { ret =false; }
						if (j>1 && helpers.cell($this,i,j+1).match(helpers.cell($this,i,j-1)) && helpers.cell($this,i,j+1).match(helpers.cell($this,i,j-2)) ) { ret =false; }	
					}
					if (i>0 && helpers.cell($this,i-1,j) && helpers.cell($this,i-1,j).canmove() ) {
						if (j>1 && helpers.cell($this,i-1,j).match(helpers.cell($this,i,j-2)) && helpers.cell($this,i-1,j).match(helpers.cell($this,i,j-1)) ) { ret =false; }					
						if (j>0 && j<settings.size[1]-1 && helpers.cell($this,i-1,j).match(helpers.cell($this,i,j-1)) && helpers.cell($this,i-1,j).match(helpers.cell($this,i,j+1)) ) { ret =false; }
						if (j<settings.size[1]-2 && helpers.cell($this,i-1,j).match(helpers.cell($this,i,j+1)) && helpers.cell($this,i-1,j).match(helpers.cell($this,i,j+2)) ) { ret =false; }
						if (i<settings.size[0]-2 && helpers.cell($this,i-1,j).match(helpers.cell($this,i+1,j)) && helpers.cell($this,i-1,j).match(helpers.cell($this,i+2,j)) ) { ret =false; }
					}
					if (i<settings.size[0]-1 && helpers.cell($this,i+1,j) && helpers.cell($this,i+1,j).canmove() ) {
						if (j>1 && helpers.cell($this,i+1,j).match(helpers.cell($this,i,j-2)) && helpers.cell($this,i+1,j).match(helpers.cell($this,i,j-1)) ) { ret =false; }					
						if (j>0 && j<settings.size[1]-1 && helpers.cell($this,i+1,j).match(helpers.cell($this,i,j-1)) && helpers.cell($this,i+1,j).match(helpers.cell($this,i,j+1)) ) { ret =false; }
						if (j<settings.size[1]-2 && helpers.cell($this,i+1,j).match(helpers.cell($this,i,j+1)) && helpers.cell($this,i+1,j).match(helpers.cell($this,i,j+2)) ) { ret =false; }
						if (i>1 && helpers.cell($this,i+1,j).match(helpers.cell($this,i-1,j)) && helpers.cell($this,i+1,j).match(helpers.cell($this,i-2,j)) ) { ret =false; }
					}
				}
			}
			return ret;
		},
        compute: function($this) {
            var settings  = helpers.settings($this);
            var remove = false;
            
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                var elt = helpers.cell($this, i, j); if (elt) { elt.tmp = false; }
            }
            
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                var elt = helpers.cell($this, i, j);
                if (elt) {
                    var cpx = 0, cpdelx = 0, cpy = 0, cpdely = 0;

                    do { if (helpers.cell($this,i+cpx,j) && helpers.cell($this,i+cpx,j).tmp) { cpdelx++; } cpx++; }
                    while (helpers.cell($this,i+cpx,j) && elt.match(helpers.cell($this,i+cpx,j)));

                    do { if (helpers.cell($this,i,j+cpy) && helpers.cell($this,i,j+cpy).tmp) { cpdely++; } cpy++; }
                    while (helpers.cell($this,i,j+cpy) && elt.match(helpers.cell($this,i,j+cpy)));

                    if (cpx>2 && cpdelx!=cpx) {
                        for (var k=0; k<cpx; k++) {
                            remove = true;
                            helpers.cell($this,i+k,j).act($this).tmp = true;
                        }
                        var $fx = $("<div class='fx'></div>");
                        $fx.css("top",j+"em").css("left",i+"em").css("width",cpx+"em").css("height","1em")
                           .animate({opacity:0}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($fx);

                        settings.action.count++;
                        var score = Math.floor(10*(cpx-2)*Math.min(3,0.5+settings.action.count/2));
                        var $score = $("<div class='score'><div>"+score+"</div></div>");
                        $score.css("top",j+"em").css("left",i+"em").css("width",cpx+"em").css("height","1em")
                           .animate({opacity:0, "margin-top":"-1em"}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($score);
                        helpers.score($this, score);
                    }
                    if (cpy>2 && cpdely!=cpy) {
                        for (var k=0; k<cpy; k++) {
                            remove = true;
                            helpers.cell($this,i,j+k).act($this).tmp = true;
                        }
                        var $fx = $("<div class='fx'></div>");
                        $fx.css("top",j+"em").css("left",i+"em").css("width","1em").css("height",cpy+"em")
                           .animate({opacity:0}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($fx);

                        settings.action.count++;
                        var score = Math.floor(10*(cpy-2)*Math.min(3,0.5+settings.action.count/2));
                        var $score = $("<div class='score'><div>"+score+"</div></div>");
                        $score.css("top",(j+0.5)+"em").css("left",(i-0.5)+"em").css("width","2em").css("height","1em")
                           .animate({opacity:0, "margin-top":"-1em"}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($score);
                        helpers.score($this, score);
                    }
                }
            }
            if (remove) {
                for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                    var c = helpers.cell($this, i, j);
                    if (c && c.remove) { helpers.cell($this, i, j, 0); }
                }
                setTimeout(function() { helpers.move($this); }, gspeed);
            }
            return (remove);
        },
        local:function($this, _cell) {
            var settings  = helpers.settings($this);
            var x = Math.max(0,_cell.pos[0]-1);
            var y = Math.max(0,_cell.pos[1]-1);
            var w = Math.min(settings.size[0]-1, _cell.pos[0]+1)-x+1;
            var h = Math.min(settings.size[1]-1, _cell.pos[1]+1)-y+1;
            
            var $fx = $("<div class='fx'></div>");
            $fx.css("top",y+"em").css("left",x+"em").css("width",w+"em").css("height",h+"em")
                .animate({opacity:0}, gspeed*1.2, function() { $(this).detach() });
            $this.find("#board>div").append($fx);

            settings.action.count++;
            var score = Math.floor(10*w*h*Math.min(3,0.5+settings.action.count/2));
            var $score = $("<div class='score line'><div>"+score+"</div></div>");
            $score.css("top",_cell.pos[1]+"em").css("left",_cell.pos[0]+"em").css("width","2em").css("height","1em")
                  .animate({opacity:0, "margin-top":"-1em"}, gspeed*1.5, function() { $(this).detach() });
            $this.find("#board>div").append($score);
            helpers.score($this, score);

            for (var j=_cell.pos[1]-1; j<=_cell.pos[1]+1; j++)
            for (var i=_cell.pos[0]-1; i<=_cell.pos[0]+1; i++) { var c = helpers.cell($this, i, j); if (c) { c.act($this); } }
        },
        line: function($this, _cell) {
            var settings  = helpers.settings($this);
            if (_cell.val>10 && _cell.val<20) {
                var $fx = $("<div class='fx'></div>");
                $fx.css("top",_cell.pos[1]+"em").css("left",0).css("width",settings.size[0]+"em").css("height","1em")
                   .animate({opacity:0}, gspeed*1.2, function() { $(this).detach() });
                $this.find("#board>div").append($fx);

                settings.action.count++;
                var score = Math.floor(10*settings.size[0]*Math.min(3,0.5+settings.action.count/2));
                var $score = $("<div class='score line'><div>"+score+"</div></div>");
                $score.css("top",_cell.pos[1]+"em").css("left",(settings.size[0]/2-0.5)+"em").css("width","2em").css("height","1em")
                      .animate({opacity:0, "margin-top":"-1em"}, gspeed*1.5, function() { $(this).detach() });
                $this.find("#board>div").append($score);
                helpers.score($this, score);

                for (var i=0; i<settings.size[0]; i++) { var c = helpers.cell($this, i, _cell.pos[1]); if (c) { c.act($this); } }
            }
            else if (_cell.val>20 && _cell.val<30) {
                var $fx = $("<div class='fx'></div>");
                $fx.css("top",0).css("left",_cell.pos[0]+"em").css("width","1em").css("height",settings.size[1]+"em")
                   .animate({opacity:0}, gspeed*1.2, function() { $(this).detach() });
                $this.find("#board>div").append($fx);

                
                settings.action.count++;
                var score = Math.floor(10*settings.size[0]*Math.min(3,0.5+settings.action.count/2));
                var $score = $("<div class='score line'><div>"+score+"</div></div>");
                $score.css("top",(settings.size[1]/2-0.5)+"em").css("left",(_cell.pos[0]-0.5)+"em").css("width","2em").css("height","1em")
                      .animate({opacity:0, "margin-top":"-1em"}, gspeed*1.5, function() { $(this).detach() });
                $this.find("#board>div").append($score);
                helpers.score($this, score);

                for (var j=0; j<settings.size[1]; j++) { var c = helpers.cell($this, _cell.pos[0],j); if (c) { c.act($this); } }
            }
        },
        score: function($this, _val) {
            var settings  = helpers.settings($this);
            settings.points+=_val;
            $this.find("#scorepanel #points #v").html(settings.points);
			if (settings.ref) {
				$this.find("#scorepanel #slide").width($this.find("#scorepanel #points").width()*Math.min(1,settings.points/settings.ref));
			}
        },
        move: function($this, _force) {
            var settings  = helpers.settings($this);
            var speed = 0, blocked = 9999;
            
            // GET HOLES TO FILL
            var totreat = [];
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
				var cell = helpers.cell($this,i,j);
				if (cell) { cell.tmp = false; }
				if (helpers.fromboard($this, i,j)!='0' && !cell) { totreat.push([i,j]); }
            }
            totreat.sort(function(a,b){ return (b[1]<a[1]); });

            // CREATE FEED FLOW (for moving tiles in the good direction)
            var weight = [], cells=[];
            for (var j=0; j<settings.size[1]; j++) { var tmp=[]; for (var i=0; i<settings.size[0]; i++) { tmp.push(blocked); } weight.push(tmp); }
            for (var i=0; i<settings.size[0]; i++) { cells.push([i,0,1]);}
            while (cells.length) {
                var elt = cells.pop();
                if (helpers.fromboard($this,elt[0],elt[1])!='0' &&
                    elt[0]>=0 && elt[0]<settings.size[0] && elt[1]>=0 && elt[1]<settings.size[1] ) {
                    var cell = helpers.cell($this,elt[0],elt[1]);
                    
                    if ((!cell || cell.canmove()) && weight[elt[1]][elt[0]]>elt[2]){
                        weight[elt[1]][elt[0]] = elt[2];
                        cells.push([elt[0]+1,elt[1],elt[2]+1]);
                        cells.push([elt[0]-1,elt[1],elt[2]+1]);
                        cells.push([elt[0],elt[1]+1,elt[2]+1]);
                    }
                }
            }
            
            var anim = false;
            while(totreat.length) {
                var elt = totreat.pop();
                if (elt[1]>0) {
                    var up  = helpers.cell($this, elt[0], elt[1]-1);
                    var w   = [0,-1];
                    
                    if ( helpers.fromboard($this, elt[0], elt[1]-1)=='0' || (up&&!up.canmove()) || _force) {
						// GET THE BEST NEIGHBOOR THANKS TO THE WEIGHT
						var side1 = [0,0,blocked], side2 = [0,0,blocked];
						
						if (helpers.fromboard($this, elt[0]-1, elt[1])!='0') {
							up = helpers.cell($this, elt[0]-1, elt[1]);
							if (!up || up.canmove()) { side1 = [up, [-1,0], weight[elt[1]][elt[0]-1] ]; }
						}
						
						if (helpers.fromboard($this, elt[0]+1, elt[1])!='0') {
							up = helpers.cell($this, elt[0]+1, elt[1]);
							if (!up || up.canmove()) { side2 = [up, [1,0], weight[elt[1]][elt[0]+1] ]; }
						}
                        
                        //alert(side1+ " - " +side2);
						
                        if (side1[2] < side2[2])    { up = side1[0]; w = side1[1]; } else
                        if (side2[2] < side1[2])    { up = side2[0]; w = side2[1]; } else
                        if (side1[2]!=blocked)      { var a = Math.floor(Math.random()*2); up = a?side1[0]:side2[0]; w = a?side1[1]:side2[1]; }
                        else                        { up = 0; }
                    }
					
                    if (up && up.canmove() && /* !up.islast(elt[0],elt[1]) && */ !up.tmp ) {
                        helpers.cell($this, up.pos[0], up.pos[1], 0);
                        helpers.cell($this, elt[0], elt[1], up);
                        up.setpos(elt[0],elt[1]);
                        up.offset(w[0],w[1]).reinit(speed);
						up.tmp = true;
						totreat.push([elt[0]+w[0],elt[1]+w[1]]);
						totreat.sort(function(a,b){ return (b[1]<a[1]); });
                        anim = true;
                    }
                }
                else {
                    var cell=helpers.jewel($this, elt[0], elt[1], 'a').offset(0,-1);
                    helpers.cell($this, elt[0], elt[1], cell);
                    $this.find("#board>div").append(cell.$html);
                    cell.reinit(speed);
                    anim=true;
                }
            };

            if (anim || !_force)    { setTimeout(function() { helpers.move($this, !anim); }, anim?Math.max(100,speed):0); }
            else                    { if (!helpers.compute($this)) { helpers.next($this); } }
        },
		next: function($this) {
            var settings  = helpers.settings($this);
			var goal = helpers.goals.check($this, true);
			var finish = false;
			
			if (goal==s.success) {
				setTimeout(function() { $this.find("#good").show(); }, 500);
				settings.score = 5;
				finish = true;
			}
			else if (goal==s.failed || (helpers.blocked($this)&&settings.blocked)) {
				setTimeout(function() { $this.find("#wrong").show(); }, 1000);
				setTimeout(function() { helpers.clear($this); }, 2000);
				settings.score = settings.goals?0:5;
				finish = true;
			}
			else if (helpers.blocked($this)&&!settings.blocked) {
				setTimeout(function() { helpers.clear($this); }, 2000);
				// TO DO
			}
			
			if (finish) {
				if (settings.score == 5) {
					if ( settings.ref) {
						if (settings.points<settings.ref * 0.2) { settings.score = 0; } else
						if (settings.points<settings.ref * 0.4) { settings.score = 1; } else
						if (settings.points<settings.ref * 0.6) { settings.score = 2; } else
						if (settings.points<settings.ref * 0.8) { settings.score = 3; } else
						if (settings.points<settings.ref )      { settings.score = 4; } else
																{ settings.score = 5; }
					}
				}
				setTimeout(function() { helpers.end($this);}, 2500);
			}
			else {
				settings.interactive = true; 
				if (settings.time) {
					$this.find("#time>div").width(0);
					settings.timer.val = Date.now();
					settings.timer.id = setTimeout(function() { helpers.time($this); }, 50);
				}
			}
		},
		clear: function($this) {
            var settings  = helpers.settings($this);
			for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
				var cell=helpers.cell($this, i,j);
				if (cell) {
					cell.pos[1]+=settings.size[1]+1;
					cell.reinit(500);
				}
			}
		},
		time: function($this) {
            var settings = helpers.settings($this);
            var val = (Date.now() - settings.timer.val)/1000;
            $this.find("#time>div").width($this.find("#time").width()*Math.min(1,val/settings.time));
            if (val<settings.time) { settings.timer.id = setTimeout(function() { helpers.time($this); }, 50); }
            else                   {
                settings.timer.id = 0;
				settings.score = 0;
				settings.interactive = false;
				setTimeout(function() { $this.find("#wrong").show(); }, 1000);
				setTimeout(function() { helpers.clear($this); }, 2000);
				setTimeout(function() { helpers.end($this);}, 2500);
			}
		},
        cell: function($this, _i, _j, _cell) {
            var settings  = helpers.settings($this);
            var notdefined = (_j<0 || _j>=settings.size[1] || _i<0 || _i>=settings.size[0] );
            if (!notdefined && typeof(_cell)!="undefined") { settings.tcells[_j][_i] = _cell; }
            return notdefined?0:settings.tcells[_j][_i];
        },
        fromboard: function($this, _i, _j) {
            var settings  = helpers.settings($this);
            var notdefined = (_j<0 || _j>=settings.size[1] || _i<0 || _i>=settings.size[0] );
            return notdefined?'0':settings.board[_j][_i];
        },
        jewel: function($this, _i, _j, _val) {
            var settings  = helpers.settings($this);
            var j = [ "",
                      "asset/jewels/red01", "asset/jewels/blue02", "asset/jewels/yellow03", "asset/jewels/purple04", "asset/jewels/green05", 
                      "asset/jewels/white06", "asset/jewels/orange07", "", "", "",
                      "asset/jewels/red01h", "asset/jewels/blue02h", "asset/jewels/yellow03h", "asset/jewels/purple04h", "asset/jewels/green05h", 
                      "asset/jewels/white06h", "asset/jewels/orange07h", "", "", "",
                      "asset/jewels/red01v", "asset/jewels/blue02v", "asset/jewels/yellow03v", "asset/jewels/purple04v", "asset/jewels/green05", 
                      "asset/jewels/white06v", "asset/jewels/orange07v", "", "", "",
                      "asset/jewels/red01c", "asset/jewels/blue02c", "asset/jewels/yellow03c", "asset/jewels/purple04c", "asset/jewels/green05c", 
                      "asset/jewels/white06c", "asset/jewels/orange07c", "", "", "",
                      "icon/skill/life01", "","","",""];

            var ret       = {
                pos         : [_i,_j],
				last		: [-1,-1],
                val         : 0,
				tmp			: false,
                remove      : false,
                locked      : 0,
                frozen      : false,
                $html       : $("<div class='cell'></div>")
            }

			ret.setpos = function(_i,_j) { this.last=[this.pos[0],this.pos[1]]; this.pos=[_i,_j]; }
			ret.islast = function(_i,_j) { return ((this.last[0]==_i) && (this.last[1]==_j)); }
            ret.offset = function(_x,_y) { this.$html.css("left",(this.pos[0]+_x)+"em").css("top",(this.pos[1]+_y)+"em"); return this;}
            ret.init = function() { this.$html.attr("id","c"+this.pos[0]+"x"+this.pos[1]); return this.offset(0,0); };
            ret.reinit = function(_speed, _cbk) {
                if (_speed) {
                    this.$html.attr("id","c"+this.pos[0]+"x"+this.pos[1]);
                    this.$html.animate({left:this.pos[0]+"em", top:this.pos[1]+"em"},_speed, _cbk);
                } else { this.init(); }
                return this;
            }
            ret.act         = function($this) {
                if (this.locked)        { this.unlock(); }
                else if (this.frozen)   { this.unfreeze(); }
                else {
                    if (!this.remove) {
                        this.remove = true;
                        this.$html.animate({opacity:0}, gspeed, function() { $(this).detach() });
                        if (this.val>10 && this.val<30) { helpers.line($this, this); } else
                        if (this.val>30 && this.val<40) { helpers.local($this, this); }
                    }
                }
                return this;
            }
            ret.match       = function(_cell) { return (_cell && this.val<40 && _cell.val<40 && this.val%10==_cell.val%10); }
            ret.canmove     = function() { return !this.locked; }
            ret.unfreeze    = function() { this.frozen = false; this.$html.find(".frozen").detach(); }
            ret.unlock      = function() {
                if (this.locked==2) { this.locked = 1; this.$html.find(".locked img").attr("src", "res/img/icon/locked01.svg"); }
                else                { this.locked = 0; this.$html.find(".locked").detach(); }
            }

            var value = _val;
            switch (_val) {
                case 'F' : ret.frozen = true; value = 'A'; break;
                case 'f' : ret.frozen = true; value = 'a'; break;
                case 'G' : ret.locked = 1; ret.frozen = 1; value = 'A'; break;
                case 'g' : ret.locked = 1; ret.frozen = 1; value = 'a'; break;
                case 'H' : ret.locked = 2; ret.frozen = 1; value = 'A'; break;
                case 'h' : ret.locked = 2; ret.frozen = 1; value = 'a'; break;
                case 'L' : ret.locked = 1; value = 'A'; break;
                case 'l' : ret.locked = 1; value = 'a'; break;
                case 'M' : ret.locked = 2; value = 'A'; break;
                case 'm' : ret.locked = 2; value = 'a'; break;
            }
            
            switch(value) {
                case 'A': ret.val = settings.proba[Math.floor(Math.random()*settings.proba.length)]+1; break;
                case 'a': if (settings.pbomb && Math.floor(Math.random()*settings.pbomb)==0) { ret.val = 41; }
                          else {
                              var value = settings.proba[Math.floor(Math.random()*settings.proba.length)];
                              if (value<10 && (settings.specials[0]||settings.specials[1]||settings.specials[2])) {
                                if (settings.pspecial[value]&&Math.floor(Math.random()*settings.pspecial[value])==0) {
                                    var offset = 0;
                                    do {
                                        var w = Math.floor(Math.random()*settings.specials.length);
                                        if (settings.specials[w]) { offset = 10*(w+1); }
                                    } while (!offset);
                                    value+=offset; 
                                }
                              }
                              ret.val = value+1;
                          }
                          break;
                case 'b': ret.val = 41; break;
                case 'd': ret.val = 11; break;
                case 'D': ret.val = 15; break;
                default : ret.val = parseInt(_val); break;
            }
            ret.$html.append("<div><img src='res/img/"+j[ret.val]+".svg'/></div>");
            if (ret.frozen) { ret.$html.append("<div class='frozen'><img src='res/img/asset/fx/ice01.svg'/></div>"); }
            if (ret.locked) { ret.$html.append("<div class='locked'><img src='res/img/asset/fx/locked0"+ret.locked+".svg'/></div>"); }
            ret.$html.unbind("mousedown touchstart").bind("mousedown touchstart", function(_event) {
                if (settings.interactive) {
                    var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;
                    var id      = $(this).css("z-index",3).attr("id");
                    var m       = id.match(/c([0-9]*)x([0-9]*)/);
                    var cell    = helpers.cell($this, m[1], m[2]);
                    if (cell.canmove()) {
                        settings.action.elt1    = cell;
                        settings.action.pos     = [e.clientX, e.clientY];
                        settings.ok             = false;
                    }
                }
                _event.preventDefault();
            });

            ret.init();
            return ret;
        }
    };

    // The plugin
    $.fn.jewel = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    cells           : {},
                    size            : [1,1],    // size board
                    proba           : [],       // computed probability
                    width           : 0,        // cell width
                    action          : { pos:0, elt1:0, elt2:0, ok:false, count:0 },
					points			: 0,
                    score           : 0,
					timer			: { val:0, id:0 }
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
                settings.width = $this.find("#board .cell").first().width();
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in jewel plugin!'); }
    };
})(jQuery);

