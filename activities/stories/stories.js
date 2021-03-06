(function($) {
    // Activity default options
    var defaults = {
        name        : "stories",                            // The activity name
        label       : "Stories",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        background  : "",
		settings	: {										// GAME PARAMETERS
			solo	: true,									// BY TEAM OR UNIT BY UNIT
			team	: 0										// FIRST TEAM IN TEAM MODE
		},
		intro		: [],									// INTRODUCTION
		objectives	: [],									// OBJECTIVES
		maps		: {},
		objects		: { },
		mapid		: "start",									// Starting map
        debug       : true                                     // Debug mode
    };

    var regExp = [
        "\\\[vr\\\]([^\\\[]+)\\\[/vr\\\]",          "<div class='vr'><img src='$1' alt=''/></div>",
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>",
		"\\\[l\\\]([^\\\[]+)\\\[/l\\\]",            "<div class='first'>$1</div>",
    ];
	
	// TARGET VALUE: 0:friend, 1:foe, 2:all 
	var objectdef = {
		fist: 	{ type:"weapon", range:[1,1], 		target:1, value:2, move: true },
		gun:  	{ type:"weapon", range:[1.5,3.2], 	target:1, value:5, move: true },
		blast:	{ type:"weapon", range:[2.5,3.5], 	target:1, value:5, move: false },
		aid:	{ type:"support",range:[1,1], 		target:2, value:2, move: true }
	};
	
	var peopledef = {
		default: {
            stat    : {
                life:       10,    		munition:   20,    		attack:     5,      armor:      0,
                vision:     4,          move:       5,          luck:       3,      speed:      5
            },
			bonus   : {
                life:       {},    		munition:   {},    		attack:     {},     armor:      {},
                vision:     {},         move:       {},         luck:       {},     speed:      {}
            },
			
			action		: "",
			
			state		: "left",
			inventory	: "",
			team		: 0,
			type		: "human", 

			size		: [1,1],
			imgs    	: { "right":"01", "left":"02", "uright":"03", "uleft":"04" },
			speed		: [ 99,3,1,2,3,99 ],	// SPEED REGARDING THE HEIGHT
			road		: 0.5,					// ROAD BONUS
			gambits		: ["moverandomly"]
		}
	};
	
	var gambitlist = {
	};
	
	var gambitdefs = {
		donothing: 		{ type:"none" },
		moverandomly:	{ type:"move", value:"random" }
	};

	var newtile = function(_tileset, _ref, _id, _pos) {
		
		var id = parseInt(_ref);
		var m=[2,2,1,0,3,4,5,5,5,5,5,5,5];
		var size=[1,1];
		var offset = [0,0];
		if (id>600) {
			size[1] = Math.floor(1+((id-1)%100)/30);
			size[0] = Math.floor(1+(id-601)/100);
			offset[1] = size[1]-1;
			if (id>800) { offset[0] = 1; }
		}
		
		var ret = {
			move	: m[Math.floor(id/100)],	// TILE HEIGHT : 0 SEA, 1 RIVER, 2 GROUND, 3 HILL, 4 MOUNTAIN
			road	: false,					// IS TILE A ROAD
			hiding	: false,					// IS A HIDING PLACE
			c 		: 1.01, 					// GRAPHIC CORRECTION TO AVOID GAP
			pos		:[_pos[0],_pos[1]], size:[size[0],size[1]], offset:[offset[0],offset[1]],
			$html	:$("<div id='"+_id+"' class='elt'><img src='res/img/tileset/ortho/"+_tileset+"/"+_ref+".svg' alt=''/></div>")
		};
		
		// APPLY GENERIC RULES
		if (id==41) { ret.hiding = true; }
		if (id>100 && id<200) { ret.road = true; }
		
		
		ret.$html.css("left",(ret.pos[0]-ret.offset[0])+"em").css("top",(ret.pos[1]-ret.offset[1])+"em")
				 .css("width",(ret.c*ret.size[0])+"em").css("height",(ret.c*ret.size[1])+"em")
				 .css("z-index",(ret.size[0]!=1 || ret.size[1]!=1)?ret.pos[1]+1:0);
		
		return ret;
	}
	
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
		endmove: function($this, _args, _finished) {
			var settings = helpers.settings($this);
			var people = _args.people;
			if (_args && _args.move) { people.pos = [ _args.move[0], _args.move[1] ]; }
			
			
			
			var weaponid  		= people.weaponid();
			var canstillattack 	= weaponid?settings.objects[weaponid].move:false;
			people.endmove(canstillattack);
			
			
			// MOVER HAS BEEN STOPPED
			if (!_finished) {
				$this.find("#stop").css("opacity",1).show();
				setTimeout(function(){$this.find("#stop").animate({opacity:0},300,function(){$(this).hide(); })},500);
				people.endattack(false);
			}
			
			if (people.canattack()) {
				if( settings.maps[settings.mapid].getactions(people, 0, weaponid?settings.objects[weaponid]:0, true)==0) {
					people.endattack(false);
				}
				else {
					var target = settings.maps[settings.mapid].getpeople(settings.action.pos);
					if (target.id!=people.id) { settings.interactive = false; helpers.action($this,people,target); }
				}
			}

			console.log("+ endmove "+people.canattack());
			
			if (people.team==0) {
				settings.interactive = true;
				if (!people.canattack() && settings.settings.solo ) { helpers.turn($this); }
			}
			else { helpers.ai.play($this); }						
		},
		action: function($this, _people, _target) {
			var settings = helpers.settings($this);
			var weaponid = _people.weaponid();
			var action   = "default";
			if (weaponid)		{ action = settings.objects[weaponid].type; }
			if (_target.action) { action = _target.action; }
			
			switch (action) {
				case "weapon":
					break;
				case "support":
					break;
				case "dialog":
					break;
				default:
					break;
			}
			
			helpers.endaction($this,_people, _target);
		},
		endaction: function($this, _people, _target) {
			var settings = helpers.settings($this);
			
			var weaponid  		= _people.weaponid();
			var canstillmove 	= weaponid?settings.objects[weaponid].move:false;
			_people.endattack(canstillmove);

			
			console.log("+ endattack "+_people.canmove());
			
			if (!_people.canmove()  && settings.settings.solo ) { helpers.turn($this); }
			
			settings.interactive = true;
			
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
                    if (!$.isArray(value)) { $this.find("#"+id).html(value); }
                }); }
				$this.find("#endtxt").html(settings.locale.endtxts[
					Math.floor(Math.random()*settings.locale.endtxts.length)]);
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
				
				// PREPARE OBJECTS
				settings.objects = $.extend(true, {}, objectdef, settings.objects);

                // BUILD ALL MAPS
				var pidx = 0;
				for (var m in settings.maps) {
					
					// PREPARE ALL PEOPLE
					for (var p in settings.maps[m].people) {
						// TODO: move to a function for advancewars people creation
						var pref = peopledef["default"];
						if (settings.maps[m].people[p].type && peopledef[settings.maps[m].people[p].type]) {
							pref = peopledef[settings.maps[m].people[p].type];
						}
						var people = $.extend(true, {
							id			: pidx++,	// PEOPLE ID
							$html		: "",		// GRAPHIC
							team  		: 0,		// TEAM ID
							npc   		: false,	// IS NPC
							moves		: [],		// MOVE GRID
							actions		: [],		// ACTION GRID
							state		: "",		// CURRENT STATE
							damages 	: 0,		// DAMAGES
							actions		: 0,		// ONE MUNITION EACH TIME
							time		: {
								last	: 0			// LAST TIME ACTION
							},
							data	: {				// GAME DATA
								move   : false,
								action : false,
								endturn: true
							},
							prepare : function() {
								this.data.move    = false;
								this.data.action  = false;
								this.data.endturn = false;
								this.$html.addClass("active");
							},
							canmove	  : function() { return (!this.data.move && !this.data.endturn); },
							canattack : function() { return (!this.data.action && !this.data.endturn); },
							cando	  : function() { return (!this.data.endturn); },
							endattack: function(_stillmove) {
								this.data.action = true;
								if (!_stillmove || this.data.move ) { this.endturn(); }
							},
							endmove : function(_stillattack) {
								this.data.move = true;
								if (!_stillattack || this.data.action ) { this.endturn(); }
							},
							getnexttime : function() { return this.value("speed") + this.time.last; },
							endturn : function() {
								if (this.$html.hasClass("active")) {
									this.data.endturn 	= true;
									this.time.last 		= this.getnexttime();
									this.$html.removeClass("active");
								}
							},
							
							// GET STAT VALUE WITH BONUS OR MALUS
							value	: function(_stat) {
								var ret = this.stat[_stat];
								for (var b in this.bonus[_stat]) {
									if (this.bonus[_stat][b]) {
										var bb		= this.bonus[_stat][b].toString();
										var bonus 	= (bb.substr(0,1)=="+");
										var percent	= (bb.indexOf("%")!=-1);
										var value	= parseInt(bb.substr(1,bb.length-percent?2:1));
										if (percent) { value = value*this.stat[_stat]/100; }
										if (bonus) { ret+=value; } else { ret-=value; }
									}
								}
								return ret;
							},
							addbonus	: function(_stat, _id, _value) 	{ this.bonus[_stat][_id] = _value; },
							delbonus	: function(_stat, _id)			{ this.bonus[_stat][_id] = 0; },
							
							dump	: function() {
								var ret="";
								ret+="["+this.team+"] ("+this.pos+")\n";
								for (var s in this.stat) {
									ret+=" + "+s+" : ("+this.stat[s]+" -> "+this.value(s);
									if (s=="life") 		{ ret+=" - "+this.damages; } else
									if (s=="munition")	{ ret+=" - "+this.actions; }
									ret+=") ";
									for (var b in this.bonus[s]) {
										var bb=this.bonus[s][b];
										ret+="["+bb+"] ";
									}
									ret+="\n";
								}
								return ret;
							},
							
							update		: function(_args, _map) {
								_args.people = this;
								// GET THE TILE
								var tile = _args.tile;
								if (!tile && _map) { tile = _map.grid.tiles[_map.getidx(_args.pos)]; }
								
								if (_args.pos) { this.$html.css("left",_args.pos[0]+"em").css("top",_args.pos[1]+"em").css("z-index",_args.pos[1]+1); }
								
								if (_args.state){
									if (this.state) { 
										this.$html.removeClass(this.state);
										this.$html.removeClass("u"+this.state);
									}
									this.state = _args.state;
									var state = this.state;
									if (tile && tile.move<2 && this.imgs["u"+_args.state]) { state = "u"+state; }
									this.$html.addClass(state);
								}
								
								if (_args.move){
									this.$html.css("z-index",_args.move[1]+1);
									this.$html.animate({left:_args.move[0]+"em", top:_args.move[1]+"em"}, 100,
										function() { setTimeout(function() { _args.people.animate(_args)}, 0); });
								}
								return this;
							},
							animate		: function(_args) {
								_args.people = this;
								if (_args.id>=_args.path.length) {
									helpers.endmove(_args.$this, _args, true);
								}
								else {
									var p1 = _args.path[_args.id-1];
									var p2 = _args.path[_args.id];
									var p3 = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
										
									if (_args.first) {
										var people	= _args.map.getpeople(p2);
										if (people && people.team!=this.team ) {
											helpers.endmove(_args.$this, _args, false);
										}
										else {
											_args.tile  = _args.map.grid.tiles[_args.map.getidx(p1)];
											_args.move	= p3;
											_args.first = false;
											if (p1[0]>p2[0]) { _args.state = "left"; } else
											if (p1[0]<p2[0]) { _args.state = "right"; }
											this.update(_args, _args.map);
										}
									}
									else {
										this.pos=[p2[0], p2[1]];
										_args.id++;
										_args.move	= p2;
										_args.first = true;
										_args.tile  = _args.map.grid.tiles[_args.map.getidx(p2)];
										_args.map.updfog();
										this.update(_args, _args.map);
									}
								}
							},
							weaponid: function() {
								var ret = 0;
								if (this.inventory) {
									ret = $.isArray(this.inventory)?this.inventory[this.inventoryid]:this.inventory;
								}
								return ret;
							},
							init : function() {
								this.$html = $("<div class='elt' style='width:"+people.size[0]+"em;height:"+people.size[1]+"em;'><div>");
								
								for (var s in this.imgs) {
									this.$html.append(
										"<img class='state "+s+"' src='res/img/tileset/ortho/people/"+this.prefix+this.imgs[s]+".svg' alt=''/>");
								}
								
								this.time.last = Math.random()*this.stat.speed;
								
								return this;
								
							}
						}, pref,  settings.maps[m].people[p]);
						
						settings.maps[m].people[p] = people.init();
					}
					
					
					// PREPARE MAP
					var map = $.extend(true, {
// DEFAULT MAP CLASS
grid		: {
	tiles	: [],						// Tiles
	fog		: [],						// Fog tiles
	moves	: []						// Move tiles
},
zoommin		: 0,						// Number of tiles shown when zoom max
zoommax 	: 2,						// Number of tiles shown when zoom min
zoom		: 0,						// Zoom value (from 0/zoommin to 1 zoommax)
$board		: $this.find("#board"),
dump		: function() {
	var ret = "";
	for (var p in this.people) {
		var people = this.people[p];
		ret+= people.dump()+"\n";
	}
	return ret;
},
inside	: function(_i, _j) {
	var ii=_i, jj=_j;
	if ($.isArray(_i)) { ii=_i[0]; jj=_i[1]; }
	return (jj>=0 && jj<this.size[1] && ii>=0 && ii<this.size[0]);
},
getidx		: function(_i, _j) {
	var ret = 0;
	if ($.isArray(_i)) { ret = _i[0]+_i[1]*this.size[0]; } else { ret = _i+_j*this.size[0]; }
	return ret },
getgrid		: function(){
	var ret = []; for (var j=0; j<this.size[1]*this.size[0]; j++) { ret.push(0); } return ret;
},
reachable	: function(_attacker, _defender, _weapon) {
	return 	( _attacker.id != _defender.id) &&
			( !this.fog || this.grid.fog[this.getidx(_defender.pos)].visible ) &&
			( ( _attacker.team==_defender.team && _weapon.target%2==0) ||
			  ( _attacker.team!=_defender.team && _weapon.target!=0 ) );
},
updgrid		: function(_grid, _i, _j, _lvl, _fct) {
	var next = [[-1,0],[1,0],[0,-1],[0,1]];
	if ( _lvl>0 &&  this.inside(_i, _j) ) {
		var idx = this.getidx(_i,_j);
		if (_grid[idx]<_lvl) {
			var val = _lvl, dec = 1;
			if (_fct) {
				var f = _fct({ i:_i, j:_j, tile:this.grid.tiles[idx], level:_lvl, map:this} );
				val = f[0]; dec = f[1];
			}
			_grid[idx] = val;
			for (var i=0; i<next.length; i++) {
				var ddec = dec;
				if ($.isArray(ddec)) { ddec = ddec[i]; }
				_grid = this.updgrid(_grid, _i+next[i][0], _j+next[i][1], _lvl-ddec, _fct);
			}
		}
	}
	return _grid;
},
nav: function(_delta) {
	for (var i=0; i<2; i++) {
		this.focus[i]=Math.max(this.focus[i],this.zoom/2);
		this.focus[i]=Math.min(this.focus[i],this.size[i]-this.zoom/2);
	}
	
	if (!_delta) { _delta=[0,0]; }
    var x = Math.min(this.size[0]-this.zoom, Math.max(0,this.focus[0] - _delta[0] - this.zoom/2));
    var y = Math.min(this.size[1]-this.zoom, Math.max(0,this.focus[1] - _delta[1] - this.zoom/2));
            
	this.$board.find("#eleft").toggle(x>0.001);
    this.$board.find("#etop").toggle(y>0.001);
    this.$board.find("#eright").toggle(x<this.size[0]-this.zoom-0.001);
    this.$board.find("#ebottom").toggle(y<this.size[1]-this.zoom-0.001);

	this.$board.find(".map").css("left",-x+"em").css("top",-y+"em");
	
},
setzoom: function(_zoom, _cbk) {
	if (_zoom>=0 && _zoom<=1) { this.zoom = this.zoommin + (this.zoommax-this.zoommin)*_zoom; }
	this.$map.css("font-size",(10/this.zoom)+"em");
	this.nav();
},
getmoves: function(_people) {
	var ret = this.getgrid();
	ret = this.updgrid(ret, _people.pos[0], _people.pos[1], _people.value("move"),
		function(_args) {
			var next = [[-1,0],[1,0],[0,-1],[0,1]];
			var vals = [];
			for (var n in next) {
				var val = 99;
				var ii=_args.i+next[n][0];
				var jj=_args.j+next[n][1];
				if (_args.map.inside(ii,jj)) {
					var t = _args.map.grid.tiles[_args.map.getidx(ii,jj)];
					val = _people.speed[t.move];
					
					for (var p in _args.map.people) {
						var pos = _args.map.people[p].pos;
						if (pos[0]==ii && pos[1]==jj) {
							if (_args.map.people[p].team!=_people.team) {
								if (!_args.map.fog || _args.map.grid.fog[_args.map.getidx(ii,jj)].visible) { val = 99; }
							}
						}
					}
					if (t.road) { val -= _people.road; }
				}
				
				vals.push(val);
			}
			return [_args.level, vals];
		}
	
	);
	return ret;
},
getactions: function(_people, _moves, _weapon, _nb) {
	var grid = _nb?0:this.getgrid(), nb=0;
	if (_weapon && _people.canattack()) {
	
		// SHOW TARGET FROM CURRENT POSITION
		var min2 = _weapon.range[0]*_weapon.range[0];
		var max2 = _weapon.range[1]*_weapon.range[1];
		for (var j=-Math.ceil(_weapon.range[1]); j<=Math.ceil(_weapon.range[1]); j++)
		for (var i=-Math.ceil(_weapon.range[1]); i<=Math.ceil(_weapon.range[1]); i++) {
			var d = i*i + j*j;
			if (d!=0 && d>=min2 && d<=max2 && this.inside(_people.pos[0]+i, _people.pos[1]+j) ) {
				var val = -1;
				var people = this.getpeople([_people.pos[0]+i, _people.pos[1]+j]);
				if (people && this.reachable(_people, people, _weapon) ) {
					nb++;
					val = 1+this.getidx(_people.pos[0],_people.pos[1]);
				}
				if (grid) { grid[this.getidx(_people.pos[0]+i, _people.pos[1]+j)] = val; }
			}
		}
		
		// FIND TARGET FROM BEST POSITION
		if ((_people.team==0) && _weapon.move && _people.canmove() && _moves)
		{
			for (var p in this.people) {
				var people = this.people[p];
				if ( this.reachable(_people, people, _weapon) ) {
					var idx = -1, dd = 0, dh=0;
					for (var j=-Math.ceil(_weapon.range[1]); j<=Math.ceil(_weapon.range[1]); j++)
					for (var i=-Math.ceil(_weapon.range[1]); i<=Math.ceil(_weapon.range[1]); i++) {
						var d = i*i + j*j;
						if (d!=0 && d>=min2 && d<=max2 &&
							this.inside(people.pos[0]+i, people.pos[1]+j) ) {
							var tidx = this.getidx(people.pos[0]+i, people.pos[1]+j);
							var ispeople = this.getpeople([people.pos[0]+i, people.pos[1]+j]);
							// TODO: ADD TILE ACTION BONUS IN CHOICE
							if (!ispeople && _moves[tidx]>dd) { dd = _moves[tidx]; idx = tidx; }
						}
					}
					if (dd>0) {
						nb++;
						if (grid && grid[this.getidx(people.pos[0], people.pos[1])] == 0) {
							grid[this.getidx(people.pos[0], people.pos[1])] = 1+idx;
						}
					}
				}
			}
		}
	}
	
	return grid?grid:nb;
},
getfog: function(_teamid) {
	var ret = this.getgrid();
	for (var p in this.people) {
		var people = this.people[p];
		if (people.team==_teamid) {
			ret = this.updgrid(ret, people.pos[0], people.pos[1], people.value("vision"),
					function(_args) {
						var val = _args.level;
						if (_args.tile.hiding) {
							var d = Math.abs(_args.i-people.pos[0])+Math.abs(_args.j-people.pos[1]);
							if (d>1) { val=0; }
						}
						return [val,1];
					});
		}
	}
	return ret;
},
getpos: function(_coord) {
	var tilesize = this.$map.find(".bg .elt").width();
	return [ Math.floor((_coord[0] - this.$map.offset().left)/tilesize),
			 Math.floor((_coord[1] - this.$map.offset().top)/tilesize) ];
},
getpeople: function(_pos) {
	var ret = 0;
	for (var p in this.people) {
		var people = this.people[p];
		if (_pos[0]==people.pos[0] && _pos[1]==people.pos[1]) { ret = people; }
	}
	return ret;
},
eachpeople: function(_args, _cbk) {
	for (var p in this.people) {
		var people  = this.people[p];
		var ok		= true;
		if (_args) { for (var a in _args) { if (people[a]!=_args[a]) { ok = false; } } }
		if (ok) { _cbk(people); }
	}
},
getnextpeople: function() {
	var ret = 0;
	var currenttime = -1;
	for (var p in this.people) {
		var people  = this.people[p];
		var time	= people.getnexttime();
		if (currenttime==-1 || time < currenttime) {
			ret 		= people;
			currenttime	= time;
		}
	}
	return ret;
},
updfog: function() {
	if (this.fog) {
		var fog = this.getfog(0);
		for (var i=0; i<this.size[0]*this.size[1]; i++) {
			this.grid.fog[i].visible = (fog[i]!=0);
			this.grid.fog[i].$html.toggle(fog[i]==0);
		}
		for (var p in this.people) {
			var people = this.people[p];
			people.$html.toggle( this.grid.fog[this.getidx(people.pos[0], people.pos[1])].visible );
		}
	}
},
updmoves: function( _moves, _actions) {
	for (var i=0; i<this.size[0]*this.size[1]; i++) {
		var m=this.grid.moves[i];
		m.c=["elt"];
		
		if (_moves) {
			if (_moves[i]==0) 					{ m.c.push("s"); }
			if (_actions && _actions[i]==-1)	{ m.c.push("c"); }
			if (_actions && _actions[i]>0)		{ m.c.push("d"); }
		}
		
		m.$html.attr("class",m.getClass()).show();
	}
},
drawmoves: function(_from, _to, _moves, _actions, _last, _team) {
	var next	= [[-1,0],[1,0],[0,-1],[0,1]];
	var ret 	= [];
	var ok		= true;
	
	// GET CLOSEST TILE
	// FROM ACTION TILE
	if (_actions && _actions[this.getidx(_to)]>0) {
		this.grid.moves[this.getidx(_to)].$html.addClass("e");
		var idx=_actions[this.getidx(_to)]-1;
		_to=[idx%this.size[0], Math.floor(idx/this.size[0])];
	}
	else
	{
		this.$map.find(".moves .e").removeClass("e");
		
		// FROM OUTSIDE AVAILABLE MOVES
		if (_moves && _moves[this.getidx(_to)]==0) {
			var d=99, ii=_to[0], jj=_to[1];
			for (var j=0; j<this.size[1]; j++)
			for (var i=0; i<this.size[0]; i++) {
				if (_moves[this.getidx(i,j)]!=0) {
					var dd=Math.abs(_to[0]-i)+Math.abs(_to[1]-j);
					if (dd<d) { d=dd; ii=i; jj=j; }
				}
			}
			_to = [ii,jj];
		}
	}
	
	// CLEAN LAST IF ANY
	if (_last) for (var i in _last) {
		var elt = this.grid.moves[this.getidx(_last[i])];
		elt.$html.attr("class",elt.getClass());
	}
	
	// BUILD PATH
	if (_moves && _moves[this.getidx(_to)]!=0 && (_to[0]!=_from[0] || _to[1]!=_from[1]) ) {
		
		var people  = this.getpeople(_to);
			
		if (people && (!this.fog || this.grid.fog[this.getidx(_to)].visible) ) {
			ok = false;
			if (people.transport && people.pass.length<people.transport) { ok = true; }
		}
		
		if (ok) {
			var ti=_to[0], tj=_to[1], cpt=0; ln=9;
			while (cpt++<100 && (ti!=_from[0] || tj!=_from[1])) {
				ret.push([ti,tj]);
				var pn = -1, vald = 0, pi, pj;
				for (var n in next) {
					pi=ti+next[n][0]; pj=tj+next[n][1];
					if (this.inside(pi, pj)) {
						var td = _moves[this.getidx(pi, pj)];
						if (td>vald) { pn = n; vald=td; }
					}
				}
				if (!this.fog || _team==0 || this.grid.fog[this.getidx(ti,tj)].visible) {
					this.grid.moves[this.getidx(ti,tj)].$html.addClass("a a"+ln+pn);
				}
				ti+=next[pn][0]; tj+=next[pn][1];
				ln = pn;
			}
			ret.push([_from[0],_from[1]]);
			
			if (!this.fog || _team==0 || this.grid.fog[this.getidx(_from)].visible) {
				this.grid.moves[this.getidx(_from[0],_from[1])].$html.addClass("a a"+ln+"9");
			}
		}
	}
	
	return ret;
},
show: function() {
	// BUILDS AND ADD TILES
	this.grid.tiles = [];
	this.$map.find(".bg").html("");
	for (var j=0; j<this.size[1]; j++)
	for (var i=0; i<this.size[0]; i++) {
		ref=this.bg[this.getidx(i,j)].toString();
		if (ref!="0") {
			while (ref.length<3) { ref="0"+ref; }
			var t = newtile(this.tileset, ref, this.getidx(i,j), [i,j]);
							
			this.grid.tiles.push(t);
			this.$map.find(".bg").append(t.$html);
		}
	}
	
	this.$board.find(".map").detach();
	this.$board.prepend(this.$map)
			   .css("background-color",this.background);

	// BUILDS FOG AND MOVES
	this.$map.find(".fog").html("");
	this.$map.find(".moves").html("");
	this.grid.moves = [];
	this.grid.fog = [];
	for (var j=0; j<this.size[1]; j++)
	for (var i=0; i<this.size[0]; i++) {
		
		if (this.fog) {
			var $fog = $("<div class='elt' id='f"+this.getidx(i,j)+"'></div>");
			$fog.css("top",j+"em").css("left",i+"em");
			this.grid.fog.push({$html:$fog, visible:false });
			this.$map.find(".fog").append($fog);
		}
		
		var $move = $("<div class='elt' id='m"+this.getidx(i,j)+"'></div>");
		$move.css("top",j+"em").css("left",i+"em");
		this.grid.moves.push({$html:$move, c:['elt'], getClass:function() { return this.c.join(" "); } });
		this.$map.find(".moves").append($move);
	}
	this.updfog();

	this.$map.find(".people").html("");
	for (var p in this.people) {
		var people = this.people[p];
		this.$board.find(".people").append(people.update(people, this).$html);
	}
    this.setzoom(this.zoom);
}
					}, settings.maps[m]);
					
					// INIT MAP
					map.$map = $("<div class='map'><div class='bg'></div><div class='people'></div><div class='moves'></div><div class='fog'></div></div>");
					map.$map.css("width",map.size[0]+"em").css("height",map.size[1]+"em");
	
					if (!map.zoomin) { map.zoommin = Math.min(map.size[0],map.size[1]); }
					map.focus = [ map.zoommin/2, map.zoommin/2 ];
					
					
					settings.maps[m] = map;
				}
				
				$this.find("#board").bind("mousedown touchstart", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
					
					settings.action.data = [0,0];
						
                    if (settings.interactive ) {
						var vMap = settings.maps[settings.mapid];
						
                        settings.action.start 	= [ vEvent.clientX, vEvent.clientY];
						
						var pos 	= vMap.getpos(settings.action.start);
						var idx		= vMap.getidx(pos);
						var people 	= vMap.getpeople(pos);
						
						if (people && (!vMap.fog || vMap.grid.fog[idx].visible) ) {

							var weaponid = people.weaponid();
							people.moves 	= vMap.getmoves(people);
							people.actions 	= vMap.getactions(people, people.moves,
								weaponid?settings.objects[weaponid]:0, false );
							vMap.updmoves(people.moves, people.actions);

							settings.action.type 	= (people.team==0)?2:3;
							settings.action.people 	= people;
							settings.action.pos		= pos;
							settings.action.path	= [];
						}
						else { settings.action.type	= 1; }
						
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });
				
				$this.find("#board").bind("mousemove touchmove", function(event) {
					var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
                    if (settings.interactive && settings.action.type ) {
						var vMap = settings.maps[settings.mapid];
						switch(settings.action.type) {
							case 1:
								var s = $this.find("#board .map .elt").width();
								settings.action.data =
									[ (vEvent.clientX-settings.action.start[0])/s,
									  (vEvent.clientY-settings.action.start[1])/s ]
								vMap.nav( settings.action.data );
								break;
							case 2:
								var pos 	= vMap.getpos([ vEvent.clientX, vEvent.clientY]);
								if (pos[0]!=settings.action.pos[0] || pos[1]!=settings.action.pos[1]) {
									settings.action.pos = [ pos[0], pos[1] ];
									
									settings.action.path = vMap.drawmoves(settings.action.people.pos, pos,
											settings.action.people.canmove()?settings.action.people.moves:0,
											settings.action.people.canattack()?settings.action.people.actions:0,
											settings.action.path, settings.action.people.team);
								}
								break;
						}
							
					}
                    event.stopPropagation();
                    event.preventDefault();
				});
				
				$this.find("#board").bind("mouseup touchend mouseleave touchleave", function(event) {
					if (settings.interactive && settings.action.type ) {
						var vMap = settings.maps[settings.mapid];
						switch(settings.action.type) {
							case 1:
								vMap.focus = [ (vMap.focus[0] - settings.action.data[0]),
											   (vMap.focus[1] - settings.action.data[1]) ];
								vMap.nav();
								break;
							case 2:
							case 3:
								vMap.updmoves(false);
								
								// MOVE PEOPLE AND MAY ATTACK
								if (settings.action.path.length && settings.action.path.length>1) {
									settings.interactive = false;
									settings.action.people.animate({
										$this:$this,
										state:settings.action.people.state,
										path:settings.action.path.reverse(),
										id:1, first:true, map:vMap});
								}
								// NO MOVE BUT ATTACK
								else {
									var target = settings.maps[settings.mapid].getpeople(settings.action.pos);
									if (target.id!=settings.action.people.id) {
										settings.interactive = false;
										helpers.action($this,settings.action.people,target);
										}
									}
								break;
						}						
					}

					settings.action.type = 0;
                    event.preventDefault();
				});
				
				// BUILD INTRODUCTION
				if (!$.isArray(settings.intro)) { settings.intro=[settings.intro]; }
				if (settings.intro.length) {
					$this.find("#stotab").html("");
					$this.find("#stopages>div").html("");
					for (var i in settings.intro) {
						$this.find("#stotab").append("<div id='p"+i+"'>"+helpers.format(settings.intro[i])+"</div>");
						
						var $tab=$("<div id='t"+i+"' class='page'></div>");
						$tab.bind("mousedown touchstart", function(event) {
							settings.pageid = parseInt($(this).attr("id").substr(1));
							helpers.story($this);
							event.preventDefault();
						});
						$this.find("#stopages>div").append($tab);
					}
					if (settings.intro.length == 1) { $this.find("#stonav").hide(); }
					helpers.story($this);
				}
				
				// HANDLE OBJECTIVES
				var iconbytype = {
					reach : "ext/noto/svg/emoji_u1f3af.svg"
				};
				if (!$.isArray(settings.objectives)) { settings.objectives=[settings.objectives]; }
				if (settings.objectives.length) {
					$this.find("#objelts").html("");
					for (var i in settings.objectives) {
						var o 	= settings.objectives[i];
						var txt = (settings.glossary&&settings.glossary[o.label])?
										settings.glossary[o.label]:o.label;
						var html="<div class='elt' id='o"+i+"'><div>";
						html+="<div class='icon'><img src='"+iconbytype[o.type]+"' alt=''/></div>";
						html+="<div class='label'>"+txt+"</div>";
						html+="<div class='icon ok'><img src='res/img/default/icon/valid02.svg' alt='V'/></div>";
						html+="</div></div>";
						$this.find("#objelts").append(html);
					}
					helpers.objectives($this);
				}
		

				setTimeout(function() {

					// ZOOM SLIDER HANDLING
                    $this.find("#zoom #cursor")
                        .draggable({ axis:"x", containment:"parent",
                            drag:function() {
                                var x= Math.max(0,($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width()));
                                settings.maps[settings.mapid].setzoom(x);
							},
							stop: function() {
								var x=Math.max(0,($(this).offset().left-$(this).parent().offset().left)/$(this).parent().width());
								var y = 10*x;
								console.log(x);
								$(this).css("width", "50%").css("left", y+"em");
							}
						});
                }, 1);
				
				
				
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		story: function($this) {
			var settings = helpers.settings($this);
			$this.find("#stotab>div").hide();
			$this.find("#stotab #p"+settings.pageid).show();
			$this.find("#stonav .up").show();
			$this.find("#stonav #stoleft").toggleClass("d", settings.pageid==0);
			$this.find("#stonav #storight").toggleClass("d", settings.pageid==settings.intro.length-1);
			
			$this.find("#stonav .page").removeClass("s");
			$this.find("#stonav #t"+settings.pageid).addClass("s");
		},
		objectives: function($this) {
			var settings = helpers.settings($this);
			var ret		 = (settings.objectives.length!=0);
			
			for (var i in settings.objectives) {
				var isok = false;
				var o = settings.objectives[i];
				switch(o.type) {
					case "reach":
						var people = settings.maps[o.map]?settings.maps[o.map].getpeople(o.pos):0;
						isok = (people && people.id == o.people);
					break;
				}

				var $icon = $this.find("#objelts #o"+i+" .icon.ok");
				if (isok) { $icon.show(); } else { $icon.hide(); }
				
				if (!isok) { ret = false; }
			}
			
			
			return ret;
		},
		prepare: function($this) {
			var settings = helpers.settings($this);
            settings.maps[settings.mapid].show();
			
			settings.game.team = settings.settings.team - 1;
			helpers.turn($this);
			
		},
		turn: function($this) {
			var settings = helpers.settings($this);
			
			settings.game.turnid++;
			$this.find("#turnid").html(settings.game.turnid);
			
			
			console.log("+ turn: "+settings.game.turnid);
			
			var goal = helpers.objectives($this);
			if (goal) {
				settings.interactive = false;
				$this.find("#end").css("left","150%").show()
					 .animate({left:"25%"},800, function(){$this.find("#endtxt").show();});
				setTimeout(function(){helpers.end($this);}, 2500 );
			}
			else {

				// CLEAR PREVIOUS TURN
				settings.maps[settings.mapid].eachpeople({}, function(_people) { _people.endturn(); });
			
				settings.game.gambitid 	= 0;
				settings.game.people 	= 0;
				settings.interactive 	= true;
					
				// SOLO NEW TURN
				if (settings.settings.solo) {
					settings.game.people = settings.maps[settings.mapid].getnextpeople();
					settings.game.people.prepare();
					
					if (settings.game.people.team!=0) { helpers.ai.play($this); }
				}
				// TEAM NEW TURN
				else {
					settings.game.team++;
					var nbs = [0,0,0,0,0];
					settings.maps[settings.mapid].eachpeople({}, function(_people) { nbs[_people.team]++; } );
					while ( nbs[settings.game.team] == 0 ) {
						settings.game.team = (settings.game.team+1)%nbs.length;
					}
					
					settings.maps[settings.mapid].eachpeople({team:settings.game.team}, function(_people) { _people.prepare(); } );
					
					if (settings.game.team!=0) { helpers.ai.play($this); }
				}
			}
		},
		// PLAY AI
		ai: {
			play: function($this) {
				var settings 	= helpers.settings($this);
				var endplay		= false;
				var map			= settings.maps[settings.mapid];
				settings.interactive = false;
				
				map.updmoves(false);
				
				
				console.log("+ ai.play");
				console.log("  . begin");
				
				while (!endplay) {
					// GET ACTIVE PEOPLE FROM TEAM
					if (!settings.game.people && !settings.settings.solo) {
						map.eachpeople({team:settings.game.team}, function(_people) {
							if (!settings.game.people && _people.cando()) { settings.game.people = _people; } });
						settings.game.gambitid = 0;
					}
					
					
					console.log("  . people");
				
					// NO MORE PEOPLE TO PLAY -> ENDTURN
					if (!settings.game.people) {
						endplay = true;
						setTimeout(function() { settings.interactive = true; helpers.turn($this); }, 500);
					}
					else {
						// GET THE CURRENT GAMBIT
						var people  = settings.game.people;
						var gambits = people.gambits;
						if (gambits && typeof(gambits)=="string") {	gambits = gambitlist[gambits]; }
					
						var gambit 	= 0;
						if (gambits && settings.game.gambitid < gambits.length ) {
							gambit = gambits[settings.game.gambitid++];
						}
						if (gambit && typeof(gambit)=="string") { gambit = gambitdefs[gambit]; }
					
						if (!gambit) {
							// NO GAMBIT ANYMORE : CLEAR CURRENT PEOPLE TO GET A NEW ONE ON NEXT LOOP
							settings.game.people.endturn();
							settings.game.people = 0;
						}
						else {
							// HANDLE GAMBIT CONDITION
							var isok 			= true;
							if (gambit.cond) { }
						
							if (isok) {
								
								console.log("  . gambit "+gambit.type);
								
								switch(gambit.type) {
									case "move":
										isok = people.canmove();
										if (isok) {
											// MOVE UNIT
											var moves 	= map.getmoves(people);
											var poss 	= [];
											var to		= 0;
											for (var m in moves) { if (moves[m]!=0) { poss.push(m); } }
											
											switch(gambit.value) {
												default: to = poss[Math.floor(Math.random()*poss.length)]; break;
											}
											
											
											if (to) {
												isok = false;
												to=[to%map.size[0], Math.floor(to/map.size[0])];
												map.updmoves(moves);
												var path = map.drawmoves(people.pos, to, moves, 0, 0, people.team);
												
												endplay = true;
												// CALL THIS ONCE AGAIN FROM ENDMOVE
												people.animate({
													$this:$this, state:people.state, path:path.reverse(),
													id:1, first:true, map:map});
												
											}
											else { isok = false; }
										}
									
									break;
									case "attack":
									break;
									default: break;
								}
							}
		
						}
					}
					
				}
				
				console.log("  . end");
			}
			
		}
    };

    // The plugin
    $.fn.stories = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
					game 			: {
						turnid		: 0,		// TURN ID
						time		: 0,		// CURRENT TIME FOR SOLO MODE
						people		: 0,		// CURRENT PEOPLE IN SOLO MODE
						next		: 0,		// ONPEOPLE COUNTER
						team		: 0,		// CURRENT TEAM
						gambitid	: 0			// CURRENT PEOPLE GAMBIT INDEX
					},
					score			: 5,
					pageid			: 0,
					action 			: { start:0, type:0, data:0 }
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);

                    var $settings = $.extend(true, {}, defaults, options, settings);
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
                var $this = $(this), settings = helpers.settings($this);
                settings.interactive = true;
				if (settings.intro.length) { $this.find("#story").show(); }
				helpers.prepare($this);
            },
            quit: function() {
                var $this = $(this), settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            },
			onpeople: function() {
                var $this = $(this), settings = helpers.settings($this);
				var f = 0;
				if (settings.interactive) {
					$this.find("#onpeople").addClass("s");
					settings.interactive = false;
					setTimeout(function() {
						$this.find("#onpeople").removeClass("s");
						settings.interactive = true; }, 300);
					if (settings.settings.solo) { f = settings.game.people; }
					else {
						var peoples = [];
						settings.maps[settings.mapid].eachpeople({team:0}, function(_people) {
							if (_people.cando()) { peoples.push(_people); }
						} );
						if (peoples.length) { f = peoples[(settings.game.next++)%peoples.length]; }
					}
					if (f) {
						settings.maps[settings.mapid].focus = [f.pos[0]+0.5, f.pos[1]+0.5];
						settings.maps[settings.mapid].setzoom(1);
						$this.find("#zoom #cursor").css("width", "50%").css("left", 5+"em");
						
						settings.maps[settings.mapid].nav();
					}
				}
			},
			endturn: function() {
                var $this = $(this), settings = helpers.settings($this);
				if (settings.interactive) {
					settings.interactive = false;
					$this.find("#endturn").addClass("s");
					setTimeout(function() {
						$this.find("#endturn").removeClass("s");
						helpers.turn($this); }, 500);
				}
			},
			onstory: function(_elt, _back) {
                var $this = $(this), settings = helpers.settings($this);
				if (!$(_elt).hasClass("d") && settings.interactive) {
					if (_back)  { settings.pageid = Math.max(0, settings.pageid-1); }
					else		{ settings.pageid = Math.min(settings.intro.length-1, settings.pageid+1); }
					
					$(_elt).find(".up").hide();
					settings.interactive = false;
					setTimeout(function() { helpers.story($this); settings.interactive = true; }, 200 );
				}
			},
			story: function() {
                var $this = $(this), settings = helpers.settings($this);
				var f = 0;
				if (settings.interactive) {
					$this.find("#onstory").addClass("s");
					settings.interactive = false;
					if (settings.intro && settings.intro.length) {
						setTimeout(function() {
							settings.pageid = 0;
							helpers.story($this);
							$this.find("#story").show(); }, 100);
					}
					setTimeout(function() { 
						$this.find("#onstory").removeClass("s");
						settings.interactive = true; }, 300);
				}
			},
			objectives: function() {
                var $this = $(this), settings = helpers.settings($this);
				var f = 0;
				if (settings.interactive) {
					$this.find("#onobj").addClass("s");
					settings.interactive = false;
					if (settings.objectives && settings.objectives.length) {
						setTimeout(function() { $this.find("#objectives").show(); }, 100);
					}
					setTimeout(function() { 
						$this.find("#onobj").removeClass("s");
						settings.interactive = true; }, 300);
				}
			},
			help: function() {
                var $this = $(this), settings = helpers.settings($this);
				var f = 0;
				if (settings.interactive) {
					$this.find("#onhelp").addClass("s");
					settings.interactive = false;
					setTimeout(function() { $this.find("#help").show(); }, 100);
					setTimeout(function() { 
						$this.find("#onhelp").removeClass("s");
						settings.interactive = true; }, 300);
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in stories plugin!'); }
    };
})(jQuery);

