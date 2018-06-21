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
		maps		: {
			"start" : {
				"tileset"	: "set1",
				"background": "#afc84b",
				"fog"		: true,
				"size"		: [8,16],
				"bg"		: [401,401,1,1,1,1,2,2,41,1,2,401,11,3,1,1,205,205,208,1,4,4,4,4,2,11,206,1,203,12,11,2,2,3,213,205,212,211,205,205,2,3,206,1,1,204,12,2,2,201,212,202,4,12,11,4,4,3,4,41,41,1,1,2,135,141,135,138,1,1,107,105,4,136,2,136,2,401,106,1,3,121,1,139,123,124,126,135,2,122,3,1,1,1,106,2,2,136,3,107,105,111,110,2,105,125,105,110,41,106,41,2,2,121,3,4,4,109,111,105,4,106,4,4,1,1,106,2],
				"people"	: [
					{"id":"p01","pos":[1,1],"init":"toright", "team":0},
					{"id":"p02","pos":[3,5],"init":"toleft", "team":0},
					{"id":"p03","pos":[5,6],"init":"toright", "team":1},
					{"id":"p04","pos":[4,10],"init":"toleft", "team":0},
					{"id":"p05","pos":[4,7],"init":"toright", "team":1},
					{"id":"p06","pos":[3,1],"init":"toright", "team":0}
				]
			}
		},
		objects: { },
		people		: {		// PEOPLE LIBRARY
			"p01" : { "prefix": "aab", "type":"human", "inventory":"fist" },
			"p02" : { "prefix": "acb", "type":"human", "inventory":"gun" },
			"p03" : { "prefix": "abr", "type":"human", "inventory":"blast" },
			"p04" : { "prefix": "adb", "type":"human", "inventory":"blast" },
			"p05" : { "prefix": "abr", "type":"human" },
			"p06" : { "prefix": "aeb", "type":"human", "inventory":"aid", "transport":2, "pass":[] }
		},
		mapid		: "start",									// Starting map
        debug       : true                                     // Debug mode
    };
	
	var objectdef = {
		"fist": { "range":[1,1], "target":"foe", "value":2	},
		"gun":  { "range":[1.5,3.2], "target":"foe", "value":5 },
		"blast":{ "range":[2.5,3.5], "target":"foe", "value":5, "plus":[[1,0,2],[0,1,2],[-1,0,2],[0,-1,2]] },
		"aid":	{ "range":[1,1], "target":"all", "type":"life", "value":2 }
	};
	
	var peopledef = {
		default: {
            stat    : {
                life:       10,    		munition:   20,    attack:     5,      armor:      0,
                vision:     4,          move:       5,          luck:       3,      speed:      1
            },
			size	: [1,1],
			state 	: { "toright":"01", "toleft":"02" },
			speed	: [ 99,3,1,2,3 ],	// SPEED REGARDING THE HEIGHT
			road	: 0.5				// ROAD BONUS
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
				
				// PREPARE ALL PEOPLE
				for (var p in settings.people) {
					// TODO: move to a function for advancewars people creation
					var pref = peopledef["default"];
					if (settings.people[p].type && peopledef[settings.people[p].type]) {
						pref = peopledef[settings.people[p].type];
					}
					var people = $.extend(true, {
						"$html"		: "",		// GRAPHIC
						"team"  	: 0,		// TEAM ID
						"npc"   	: false,	// IS NPC
						"moves"		: [],		// MOVE GRID
						"actions"	: [],		// ACTION GRID
						"update"	: function(_args) {
							if (_args.pos) { this.$html.css("left",_args.pos[0]+"em").css("top",_args.pos[1]+"em"); }
							if (_args.init){ this.$html.attr("class","elt "+_args.init); }
							return this;
						}
					}, pref,  settings.people[p]);
					
					people.$html = $("<div class='elt' style='width:"+people.size[0]+"em;height:"+people.size[1]+"em;'><div>");
					
					for (var s in people.state) {
						people.$html.append(
							"<img class='state "+s+"' src='res/img/tileset/ortho/people/"+people.prefix+people.state[s]+".svg' alt=''/>");
					}
					
					settings.people[p] = people;
				}
				
				// PREPARE OBJECTS
				settings.objects = $.extend(true, {}, objectdef, settings.objects);

                // BUILD ALL MAPS
				for (var m in settings.maps) {
					
					var map = $.extend(true, {
// DEFAULT MAP CLASS
peopleref	: settings.people,			// People reference
grid		: {
	tiles	: [],						// Tiles
	fog		: [],						// Fog tiles
	moves	: []						// Move tiles
},
zoommin		: 0,						// Number of tiles shown when zoom max
zoommax 	: 2,						// Number of tiles shown when zoom min
zoom		: 0,						// Zoom value (from 0/zoommin to 1 zoommax)
$board		: $this.find("#board"),
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
	var ret = [];
	for (var j=0; j<this.size[1]*this.size[0]; j++) { ret.push(0); }
	return ret;
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
	var pdat = this.peopleref[_people.id];
	ret = this.updgrid(ret, _people.pos[0], _people.pos[1], pdat.stat.move,
		function(_args) {
			var next = [[-1,0],[1,0],[0,-1],[0,1]];
			var vals = [];
			for (var n in next) {
				var val = 99;
				var ii=_args.i+next[n][0];
				var jj=_args.j+next[n][1];
				if (_args.map.inside(ii,jj)) {
					var t = _args.map.grid.tiles[_args.map.getidx(ii,jj)];
					val = pdat.speed[t.move];
					
					for (var p in _args.map.people) {
						var pos = _args.map.people[p].pos;
						if (pos[0]==ii && pos[1]==jj) {
							if (_args.map.people[p].team!=_people.team) {
								if (!_args.map.fog || _args.map.foggrid[_args.map.getidx(ii,jj)]!=0) { val = 99; }
							}
						}
					}
					if (t.road) { val -= pdat.road; }
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
			if (d>=min2 && d<=max2) {
				ret[this.getidx(_people.pos[0]+i, _people.pos[1]+j)] = 1;
			}
		}
	}
	
	return ret;
},
getfog: function(_teamid) {
	var ret = this.getgrid();
	for (var p in this.people) {
		var pref = this.people[p];
		if (pref.team==_teamid) {
			var pdat = this.peopleref[pref.id];
			ret = this.updgrid(ret, pref.pos[0], pref.pos[1], pdat.stat.vision,
					function(_args) {
						var val = _args.level;
						if (_args.tile.hiding) {
							var d = Math.abs(_args.i-pref.pos[0])+Math.abs(_args.j-pref.pos[1]);
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
		var pref = this.people[p];
		if (_pos[0]==pref.pos[0] && _pos[1]==pref.pos[1]) { ret = pref; }
	}
	return ret;
},
updfog: function() {
	this.foggrid = this.getfog(0);
	for (var i=0; i<this.size[0]*this.size[1]; i++) {
		this.$map.find(".fog #f"+i).toggle(this.foggrid[i]==0);
	}
	for (var p in this.people) {
		var pref = this.people[p];
		var pdat = this.peopleref[pref.id];
		if (this.foggrid[this.getidx(pref.pos[0], pref.pos[1])]==0) {
			pdat.$html.hide();
		}
	}
},
updmoves: function( _moves, _actions) {
	for (var i=0; i<this.size[0]*this.size[1]; i++) {
		var m=this.grid.moves[i];
		m.c=["elt"];
		
		if (_moves) {
			if (_moves[i]==0) 				{ m.c.push("s"); }
			if (_actions && _actions[i]==1)	{ m.c.push("c"); }
		}
		
		m.$html.attr("class",m.getClass()).show();
	}
},
drawmoves: function(_from, _to, _moves, _speed, _last) {
	var next	= [[-1,0],[1,0],[0,-1],[0,1]];
	var ret 	= [];
	var ok		= true;
	
	// GET CLOSEST TILE
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
	else
	// FROM ACTION TILE
	if (_moves[this.getidx(_to)]>99) {
		
	}
	
	// CLEAN LAST IF ANY
	if (_last) for (var i in _last) {
		var elt = this.grid.moves[this.getidx(_last[i])];
		elt.$html.attr("class",elt.getClass());
	}
	
	
	// BUILD PATH
	if (_moves[this.getidx(_to)]!=0 && (_to[0]!=_from[0] || _to[1]!=_from[1]) ) {
		
		var people  = this.getpeople(_to);
			
		if (people && (!this.fog || this.foggrid[this.getidx(_to)]!=0) ) {
			ok = false;
			var pdat =  this.peopleref[people.id];
			if (pdat.transport && pdat.pass.length<pdat.transport) { ok = true; }
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
				this.$map.find(".moves #m"+this.getidx(ti,tj)).addClass("a a"+ln+pn);
				ti+=next[pn][0]; tj+=next[pn][1];
				ln = pn;
			}
			ret.push([_from[0],_from[1]]);
			this.$map.find(".moves #m"+this.getidx(_from[0],_from[1])).addClass("a a"+ln+"9");
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
			this.grid.fog.push({$html:$fog});
			this.$map.find(".fog").append($fog);
		}
		
		var $move = $("<div class='elt' id='m"+this.getidx(i,j)+"'></div>");
		$move.css("top",j+"em").css("left",i+"em");
		this.grid.moves.push({$html:$move, c:['elt'], getClass:function() { return this.c.join(" "); } });
		this.$map.find(".moves").append($move);
	}
	if (this.fog) { this.updfog(); }
			   
	this.$map.find(".people").html("");
	for (var p in this.people) {
		var pref = this.people[p];
		var pdat = this.peopleref[pref.id];
		this.$board.find(".people").append(pdat.update(pref).$html);
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
						var people 	= vMap.getpeople(pos);
						
						if (people) {

							var pdat = settings.people[people.id];
							var weaponid = $.isArray(pdat.inventory)?pdat.inventory[pdat.inventoryid]:pdat.inventory;
							people.moves 	= vMap.getmoves(people);
							people.actions 	= vMap.getactions(people, people.moves,
																  weaponid?settings.objects[weaponid]:0);
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
										settings.action.people.moves,
										settings.people[settings.action.people.id].speed, settings.action.path);
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
								settings.maps[settings.mapid].focus =
									[ (vMap.focus[0] - settings.action.data[0]),
									  (vMap.focus[1] - settings.action.data[1]) ];
								vMap.nav();
								break;
							case 2:
							case 3:
								vMap.updmoves(false);
								break;
						}						
					}

					settings.action.type = 0;
                    event.preventDefault();
				});

				setTimeout(function() {
                    settings.maps[settings.mapid].show();

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
					action : { start:0, type:0, data:0 }
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

