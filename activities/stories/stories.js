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
			solo	: true									// BY TEAM OR UNIT BY UNIT
		},
		maps		: {
			"start" : {
				"tileset"	: "set1",
				"background": "#afc84b",
				"fog"		: true,
				"size"		: [8,16],
				"bg"		: [401,401,1,1,1,1,2,2,41,1,2,401,11,3,1,1,205,205,208,1,4,4,4,4,2,11,206,1,203,12,11,2,2,3,213,205,212,211,205,205,2,3,206,1,1,204,12,2,2,201,212,202,4,12,11,4,4,3,4,41,41,1,1,2,135,141,135,138,1,1,107,105,4,136,2,136,2,401,106,1,3,121,1,139,123,124,126,135,2,122,3,1,1,1,106,2,2,136,3,107,105,111,110,2,105,125,105,110,41,106,41,2,2,121,3,4,4,109,111,105,4,106,4,4,1,1,106,2],
				"people"	: [
{"prefix": "aab", "type":"human", "inventory":"gun","pos":[1,2],"state":"right", "team":0},
{"prefix": "acb", "type":"human", "inventory":"fist","stat":{"move":8},"pos":[3,5],"state":"left", "team":0},
{"prefix": "abr", "type":"human", "inventory":"blast","pos":[5,6],"state":"right", "team":1},
{"prefix": "adb", "type":"human", "inventory":"blast","pos":[4,6],"state":"left", "team":0},
{"prefix": "abr", "type":"human","pos":[4,7],"state":"right", "team":1},
{"prefix": "aeb", "type":"human", "inventory":"aid", /* "transport":2, "pass":[], */ "pos":[3,1],"state":"right", "team":0}
				]
			}
		},
		objects: { },
		mapid		: "start",									// Starting map
        debug       : true                                     // Debug mode
    };
	
	// TARGET VALUE: 0:friend, 1:foe, 2:all 
	var objectdef = {
		fist: 	{ range:[1,1], 		target:1, value:2, move: true },
		gun:  	{ range:[1.5,3.2], 	target:1, value:5, move: true },
		blast:	{ range:[2.5,3.5], 	target:1, value:5, plus:[[1,0,2],[0,1,2],[-1,0,2],[0,-1,2]], move: false },
		aid:	{ range:[1,1], 		target:2, type:"life", value:2, move: true }
	};
	
	var peopledef = {
		default: {
            stat    : {
                life:       10,    		munition:   20,    		attack:     5,      armor:      0,
                vision:     4,          move:       5,          luck:       3,      speed:      1
            },
			bonus   : {
                life:       {},    		munition:   {},    		attack:     {},     armor:      {},
                vision:     {},         move:       {},         luck:       {},     speed:      {}
            },
			damages : 0,				// DAMAGES
			actions	: 0,				// ONE MUNITION EACH TIME
			
			data	: {},				// GAME DATA
			size	: [1,1],
			imgs    : { "right":"01", "left":"02", "uright":"03", "uleft":"04" },
			speed	: [ 99,3,1,2,3 ],	// SPEED REGARDING THE HEIGHT
			road	: 0.5,				// ROAD BONUS
			
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
			}
			

			
			
		}
	};

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

	var newtile = function(_tileset, _ref, _id, _pos) {
		
		var id = parseInt(_ref);
		var m=[2,2,1,0,3,4];
		
		var ret = {
			move	: m[Math.floor(id/100)],	// TILE HEIGHT : 0 SEA, 1 RIVER, 2 GROUND, 3 HILL, 4 MOUNTAIN
			road	: false,					// IS TILE A ROAD
			hiding	: false,					// IS A HIDING PLACE
			c 		: 1.01, 					// GRAPHIC CORRECTION TO AVOID GAP
			pos		:[_pos[0],_pos[1]], size:[1,1], offset:[0,0],
			$html	:$("<div id='"+_id+"' class='elt'><img src='res/img/tileset/ortho/"+_tileset+"/"+_ref+".svg' alt=''/></div>")
		};
		
		// APPLY GENERIC RULES
		if (id==41) { ret.hiding = true; }
		if (id>100 && id<200) { ret.road = true; }
		
		
		ret.$html.css("left",ret.pos[0]+"em").css("top",ret.pos[1]+"em")
				 .css("width",(ret.c*ret.size[0])+"em").css("height",(ret.c*ret.size[1])+"em");
		
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
			var people = settings.action.people;
			if (_args.move)		{ people.pos = [ _args.move[0], _args.move[1] ]; }
			if (_args.state) 	{ people.state = _args.state; }
			
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
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }
				
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
							update		: function(_args, _map) {
								// GET THE TILE
								var tile = _args.tile;
								if (!tile && _map) { tile = _map.grid.tiles[_map.getidx(_args.pos)]; }
								
								if (_args.pos) { this.$html.css("left",_args.pos[0]+"em").css("top",_args.pos[1]+"em"); }
								
								if (_args.state){
									var state = _args.state;
									if (tile && tile.move<2 && this.imgs["u"+_args.state]) { state = "u"+_args.state; }
									this.$html.attr("class","elt "+state);
								}
								
								if (_args.move){
									this.$html.animate({left:_args.move[0]+"em", top:_args.move[1]+"em"}, 100,
										function() { setTimeout(function() { _args.people.animate(_args)}, 0); });
								}
								return this;
							},
							animate		: function(_args) {
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
										_args.tile	= 0;
										_args.move	= p2;
										_args.first = true;
										_args.tile  = _args.map.grid.tiles[_args.map.getidx(p2)];
										_args.map.updfog();
										this.update(_args, _args.map);
									}
								}
							}
						}, pref,  settings.maps[m].people[p]);
						
						people.$html = $("<div class='elt' style='width:"+people.size[0]+"em;height:"+people.size[1]+"em;'><div>");
						
						for (var s in people.imgs) {
							people.$html.append(
								"<img class='state "+s+"' src='res/img/tileset/ortho/people/"+people.prefix+people.imgs[s]+".svg' alt=''/>");
						}
						
						settings.maps[m].people[p] = people;
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
getactions: function(_people, _moves, _weapon) {
	var ret = this.getgrid();
	if (_weapon) {
	
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
					val = 1+this.getidx(_people.pos[0],_people.pos[1]);
				}
				ret[this.getidx(_people.pos[0]+i, _people.pos[1]+j)] = val;
			}
		}
		
		// FIND TARGET FROM BEST POSITION
		if ((_people.team==0) && _weapon.move )
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
					if (dd>0) { console.log(idx); ret[this.getidx(people.pos[0], people.pos[1])] = 1+idx; }
				}
			}
		}
	}
	
	return ret;
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
drawmoves: function(_from, _to, _moves, _actions, _speed, _last) {
	var next	= [[-1,0],[1,0],[0,-1],[0,1]];
	var ret 	= [];
	var ok		= true;
	
	// GET CLOSEST TILE
	// FROM ACTION TILE
	if (_actions[this.getidx(_to)]>0) {
		this.grid.moves[this.getidx(_to)].$html.addClass("e");
		var idx=_actions[this.getidx(_to)]-1;
		_to=[idx%this.size[0], Math.floor(idx/this.size[0])];
	}
	else
	{
		this.$map.find(".moves .e").removeClass("e");
		
		// FROM OUTSIDE AVAILABLE MOVES
		if (_moves[this.getidx(_to)]==0) {
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
	if (_moves[this.getidx(_to)]!=0 && (_to[0]!=_from[0] || _to[1]!=_from[1]) ) {
		
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
				this.grid.moves[this.getidx(ti,tj)].$html.addClass("a a"+ln+pn);
				ti+=next[pn][0]; tj+=next[pn][1];
				ln = pn;
			}
			ret.push([_from[0],_from[1]]);
			this.grid.moves[this.getidx(_from[0],_from[1])].$html.addClass("a a"+ln+"9");
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

							var weaponid = $.isArray(people.inventory)?people.inventory[people.inventoryid]:people.inventory;
							people.moves 	= vMap.getmoves(people);
							people.actions 	= vMap.getactions(people, people.moves,
								weaponid?settings.objects[weaponid]:0, (people.team==0) );
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
										settings.action.people.moves, settings.action.people.actions,
										vMap.people[settings.action.people.id].speed, settings.action.path);
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
								
								// MOVE PEOPLE
								if (settings.action.path.length && settings.action.path.length>1) {
									settings.interactive = false;
									settings.action.people.animate({
										$this:$this, people:settings.action.people,
										state:settings.action.people.state,
										path:settings.action.path.reverse(),
										id:1, first:true, map:vMap});
								}
								else {
									// HANDLE ATTACK
								}
								break;
						}						
					}

					settings.action.type = 0;
                    event.preventDefault();
				});

				setTimeout(function() {

					// ZOOM SLIDER HANDLING
                    $this.find("#zoom #cursor")
                        .draggable({ axis:"x", containment:"parent",
                            drag:function() {
                                var x= ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                                settings.maps[settings.mapid].setzoom(x);
							},
							stop: function() {
								var x= 10*($(this).offset().left-$(this).parent().offset().left)/$(this).parent().width();
								$(this).css("width", "50%").css("left", x+"em");
							}
						});
                }, 1);
				
				
				
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		prepare: function($this) {
			var settings = helpers.settings($this);
            settings.maps[settings.mapid].show();
			
			console.log(settings.maps[settings.mapid].dump());
			
		},
		turn: function($this) {
		},
		game: {
		},
		ai: {
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
					game 			: { },
					action 			: { start:0, type:0, data:0 }
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
            devmode: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devoutput textarea").val("Debug output").parent().show();
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
				helpers.prepare($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in stories plugin!'); }
    };
})(jQuery);

