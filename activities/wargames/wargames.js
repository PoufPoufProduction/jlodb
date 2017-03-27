(function($) {
    // Activity default options
    var defaults = {
        name        : "wargames",                               // The activity name
        label       : "Wargames",                               // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        font        : 1,                                        // The font-size multiplicator
        mintiles    : 5,                                        // The minimum tiles in board
        zoom        : 0,                                        // The current zoom value (0=see all)
        playmode    : 0,                                        // Mode (0:group, 1:single)
        hasfog      : true,                                     // Fog of war
        debug       : true                                      // Debug mode
    };


    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[bb\\\](.+)\\\[/bb\\\]",                "<b>$1</b>",
        "\\\[h1\\\](.+)\\\[/h1\\\]",                "<b><u>$1</u></b><br/>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[svg\\\]([^\\\[]+)\\\[/svg\\\]",        "<div class='svg'><div><svg width='100%' height='100%' viewBox='0 0 32 32'><rect x='0' y='0' width='32' height='32' style='fill:black'/>$1</svg></div></div>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

    var DO_NOTHING = 0;
    var MOVE_BOARD = 1;
    var MOVE_UNIT  = 2;

    // CREATE DATA FOR UNIT
    var unit = function(_unit) {
        var def = {
            default : {
                alive   : true,
                pos     : [0,0],
                fog     : false,
                side    : true,
                id      : 0,
                team    : 0,
                time    : 0,
                res     : { img:"red01", size:[4,6], line:0 },
                fire    : { min:1, max:1, type:"move" },
                freight : { type:"", units:[], id:-1 },
                support : {},
                type    : "human",
                subtype : "",
                stat    : {
                    life:       [10,10],    munition:   [20,20],    attack:     5,      armor:      0,
                    vision:     3,          move:       4,          luck:       3,      speed:      1
                    },
                speed   : { ground:1, road:0.5, flood:3, wood:2, hill:2, mountain:3, sea:99 },
                bonus   : [], // [{type:"attack",add:1},{type:"luck",abs:2},{type:"move",mul:1.2},{type:"vision",mul:1.5}],
                value   : function(_attribute) {
                    var value = this.stat[_attribute], from = value;
                    if ($.isArray(value)) { from = value[1]; value = value[0]; }
                    for (var j in this.bonus) if (this.bonus[j].type==_attribute) {
                        if (this.bonus[j].add) { value += this.bonus[j].add; } else
                        if (this.bonus[j].mul) { value *= this.bonus[j].mul; } else
                        if (this.bonus[j].abs) { value  = this.bonus[j].abs; }
                    }
                    return [Math.floor(value), from];
                },
                canattack: function(_target) {
                    var ret = false;
                    if (this.value("attack")[0]>0 && this.value("munition")[0]>0 && _target.alive && _target.team!=this.team && !_target.fog) {
                        ret = true;
                    }
                    return ret;
                },
                canhelp: function(_target) {
                    var ret = false;
                    if (this.support.type && _target.alive && _target.team==this.team && _target.id!=this.id && _target.type==this.type) {
						ret = true;
                    }
                    return ret;
                },
                offset: function(_tile) {       
                    var vTop = 0, vLeft = 0;
                    vTop    += this.res.line;
                    vLeft   += this.side?0:1;
                    if (_tile) {
                        if (_tile.type=="flood" || _tile.type=="sea") {
                            vLeft = (vLeft+2)%this.res.size[0];
                        }
                    }
                    return {top:vTop, left:vLeft }
                },
                fight: function(_d, _from, _to, _iscounter) {
                    var ret = this.value("attack")[0] - _d.value("armor")[0];
                    return Math.max(0,ret);
                },
                attack: function(_d, _from, _to, _counter) {
                    return [this.fight(_d, _from, _to, true), _counter?_d.fight(this, _to, _from, false):0];
                }
            },
            archer  : { fire : { min:1.6, max:2.5, type:"move" }, stat : { munition:   [5,5], attack: 4, vision: 4, move: 3 } },
            bunny	: { stat : { life: [1,1], munition: [0,0], attack: 0, vision:5, move:5, luck:50, speed:10 }, res : { img:"animal01", line:0 },
						speed : { flood:99, wood:1.5, hill:2, mountain:2.5, sea:99 } },
            bus		: { type:"mecanic", stat : { munition: [0,0], attack: 0, armor:3, vision: 4, move: 5 }, freight : { type: "human", units:[0,0] },
						speed   : { ground:1, road:0.5, flood:99, wood:3, hill:4, mountain:99, sea:99 } },
			croco	: { stat : { munition: [99,99], attack: 5, vision:3, move:3, luck:10, speed:2 }, res : { img:"animal01", line:2 },
						speed : { flood:1, wood:2, hill:99, mountain:99, sea:2, road:1 } },
            doctor  : { stat : { munition: [10,10], attack: 1 }, support : { type:"heal", value:2 } },
            mamouth : { stat : { life: [20,20], armor:2, munition: [99,99], attack:10, vision:3, move:2, luck:0, speed:1 }, res : { img:"animal01", line:1 },
						speed : { flood:2, wood:2, hill:2, mountain:99, sea:99 } },
            soldier : { },
			squire	: { stat : { munition: [10,10], attack: 1 }, support : { type:"ammo", value:10 } },
        };

        var base     = "";
        if (typeof(_unit)=="string") { base=_unit; _unit={}; } else { base=_unit.base; }
        if (!base || !def[base]) { base = "default"; }

        var ret = $.extend(true, {}, def.default, def[base], _unit);

        if (!$.isArray(ret.stat.life))     { ret.stat.life      = [ret.stat.life, ret.stat.life]; }
        if (!$.isArray(ret.stat.munition)) { ret.stat.munition  = [ret.stat.munition, ret.stat.munition]; }

        return ret;
    };


    var tile = {
        default : { fog: 0, move:0 },

        // GROUND
        g0   : { pos: [0,0], type:"ground"  },  g1   : { pos: [0,1], type:"ground"  },
        g2   : { pos: [0,2], type:"ground"  },  g3   : { pos: [0,3], type:"ground"  },

        // ROAD
        rse  : { pos: [0,5], type:"road"  },    rso  : { pos: [1,5], type:"road"  },    rne  : { pos: [0,6], type:"road"  },
        rno  : { pos: [1,6], type:"road"  },    rv   : { pos: [0,7], type:"road"  },    rh   : { pos: [1,7], type:"road"  },
        rnse : { pos: [0,8], type:"road"  },    rseo : { pos: [1,8], type:"road"  },    rneo : { pos: [0,9], type:"road"  },
        rnso : { pos: [1,9], type:"road"  },

        // FLOOD
        fse  : { pos: [2,5], type:"flood"  },   fso  : { pos: [3,5], type:"flood"  },   fne  : { pos: [2,6], type:"flood"  },
        fno  : { pos: [3,6], type:"flood"  },   fv   : { pos: [2,7], type:"flood"  },   fh   : { pos: [3,7], type:"flood"  },
        fnse : { pos: [2,8], type:"flood"  },   fseo : { pos: [3,8], type:"flood"  },   fneo : { pos: [2,9], type:"flood"  },
        fnso : { pos: [3,9], type:"flood"  },

        // SEA
        sea  : { pos: [3,4], type:"sea"    },   sse  : { pos: [3,0], type:"sea"    },   sso  : { pos: [6,0], type:"sea"    },
        sne  : { pos: [3,3], type:"sea"    },   sno  : { pos: [6,3], type:"sea"    },   ss1  : { pos: [4,0], type:"sea"    },
        ss2  : { pos: [5,0], type:"sea"    },   sn1  : { pos: [4,3], type:"sea"    },   sn2  : { pos: [5,3], type:"sea"    },
        se1  : { pos: [3,1], type:"sea"    },   se2  : { pos: [3,2], type:"sea"    },   so1  : { pos: [6,1], type:"sea"    },
        so2  : { pos: [6,2], type:"sea"    },   scno : { pos: [4,1], type:"sea"    },   scne : { pos: [5,1], type:"sea"    },
        scso : { pos: [4,2], type:"sea"    },   scse : { pos: [5,2], type:"sea"    },

        // WOOD
        w0   : { pos: [1,0], type:"wood", fogtype:"hide" },

        // MOUNTAINS
        m0   : { pos: [2,0], type:"hill", fogtype:[1,1] },     m1   : { pos: [2,1], h:2, type:"mountain", fogtype:[99,2] },
    }

    var board = function(_board) {
        var w,h,b;
        if ($.isArray(_board))  { w = _board[0].length; h = _board.length; b=_board; }
        else                    { w = _board.width;     h = _board.height; b=_board.board; }
        
        var ret = {
            width:  w,
            height: h,
            board: [],
            // Place people on the map board
            people: function(_people) {
                this.init("people",0);
                for (var p in _people) { if (_people[p].alive) this.board[_people[p].pos[1]][_people[p].pos[0]].people = _people[p]; }
            },
            drop: function(_guy, _unit) {
                this.init("move",0);
                this.board[_guy.pos[1]][_guy.pos[0]].move = 2;
                var d = [[-1,0],[0,-1],[1,0],[0,1]];
                for (var i in d) {
					var cell = [ _guy.pos[0]+d[i][0], _guy.pos[1]+d[i][1] ];
					if ( cell[0]>=0 && cell[1]>=0 && cell[0]<this.width && cell[1]<this.height) {
						this.board[cell[1]][cell[0]].move = 1;
					}
				}
				return this;
			},
            // Compute possible moves for unit _id
            moves: function(_guy) {
                this.init("move",0);
                var moves   = [];
                moves.push([_guy.pos[0], _guy.pos[1], _guy.value("move")[0]+1]);

                while (moves.length) {
                    var cell = moves.pop();
                    var ok = (cell[2]>0);

                    if (ok && (cell[0]<0 || cell[1]<0 || cell[0]>=this.width || cell[1]>=this.height))  { ok = false; }

                    if (ok) {
                        var p = this.board[cell[1]][cell[0]].people;
                        if (p && p.team!=_guy.team && !p.fog) { ok = false; }
                    }

                    if (ok && this.board[cell[1]][cell[0]].move < cell[2]) {
                        this.board[cell[1]][cell[0]].move = cell[2];

                        var d       = [[-1,0],[0,-1],[1,0],[0,1]];
                        for (var i in d) {
                            if (cell[0]+d[i][0]>=0 && cell[1]+d[i][1]>=0 && cell[0]+d[i][0]<this.width && cell[1]+d[i][1]<this.height) {
                                var tile = this.board[cell[1]+d[i][1]][cell[0]+d[i][0]];
                                var speed = _guy.speed[tile.type]?_guy.speed[tile.type]:1;

                                moves.push([cell[0]+d[i][0], cell[1]+d[i][1], cell[2]-speed]);
                            }
                        }
                    }
                }

                return this;
            },
            // Compute possible targets for unit _id
            targets: function(_people, _id) {
                this.init("target",0);
                var guy = _people[_id];

                if (guy.value("attack")[0])
                for (var i=0; i<this.width; i++) for (var j=0; j<this.height; j++) {
                    var d = (guy.pos[0]-i)*(guy.pos[0]-i)+(guy.pos[1]-j)*(guy.pos[1]-j);
                    if (d<=guy.fire.max*guy.fire.max && d>=guy.fire.min*guy.fire.min) { this.board[j][i].target = 1; }
                }

                if (guy.fire.type=="move")
                for (var p in _people) {
                    var foe = _people[p];
                    // ATTACK THE FOE
                    if (guy.canattack(foe)) {
                        // look for the best place (if any) where the foe can be attack
                        var place = 0;
                        for (var i=Math.ceil(Math.max(0,foe.pos[0]-guy.fire.max)); i<=Math.ceil(Math.min(this.width, foe.pos[0]+guy.fire.max)); i++)
                        for (var j=Math.ceil(Math.max(0,foe.pos[1]-guy.fire.max)); j<=Math.ceil(Math.min(this.height, foe.pos[1]+guy.fire.max)); j++) {
                            if (this.board[j][i].move && ( !this.board[j][i].people || this.board[j][i].people.id==guy.id) ) {
                                var d = (foe.pos[0]-i)*(foe.pos[0]-i)+(foe.pos[1]-j)*(foe.pos[1]-j);
                                if (d<=guy.fire.max*guy.fire.max && d>=guy.fire.min*guy.fire.min) {
                                    if (!place || this.board[place[1]][place[0]].move<this.board[j][i].move) {
                                        place = [ i, j ];
                                    }
                                }
                            }
                        }
                        this.board[foe.pos[1]][foe.pos[0]].target = place;
                    }
                    // HEAL THE ALLY
                    if (guy.canhelp(foe)) {
                        var place = 0;
                        var d     = [[-1,0],[0,-1],[1,0],[0,1]]; 
                        for (var dd in d) {
                            var i = foe.pos[0]+d[dd][0], j = foe.pos[1]+d[dd][1];
                            if (i>=0 && j>=0 && i<this.width && j<this.height && this.board[j][i].move &&
                                ( !this.board[j][i].people || this.board[j][i].people.id==guy.id) ) {
                                if (!place || this.board[place[1]][place[0]].move<this.board[j][i].move) {
                                    place = [ i, j ];
                                }
                            }
                        }
                        this.board[foe.pos[1]][foe.pos[0]].target = place;
                    }
                }

            },
            // Compute the fog visibility for a team ("fog" or "fogia") 
            fog : function(_people, _team, _fog) {
                this.init(_fog,0);
                var tiles = [];
                for (var i in _people) { if (_people[i].team == _team && _people[i].alive) {
                    var elt = this.board[_people[i].pos[1]][_people[i].pos[0]];
                    var bonus = (elt.fogtype&&$.isArray(elt.fogtype))?elt.fogtype[1]:0;
                    tiles.push([_people[i].pos[0], _people[i].pos[1], _people[i].value("vision")[0]+bonus, 0]); } }
                while (tiles.length) {
                    var t = tiles.shift();
                    var elt = this.board[t[1]][t[0]];
                    if (elt[_fog]<t[2]) {
                        if (elt.fogtype!="hide" || t[3]<2) { elt[_fog] = t[2]; }
                        var f = (elt.fogtype&&$.isArray(elt.fogtype)&&t[3])?elt.fogtype[0]:1;
                        if (t[2]>f) {
                            if (t[0]>0)             { tiles.push([t[0]-1,t[1],t[2]-f,t[3]+1]); }
                            if (t[1]>0)             { tiles.push([t[0],t[1]-1,t[2]-f,t[3]+1]); }
                            if (t[0]<this.width-1)  { tiles.push([t[0]+1,t[1],t[2]-f,t[3]+1]); }
                            if (t[1]<this.height-1) { tiles.push([t[0],t[1]+1,t[2]-f,t[3]+1]); }
                        }
                    }
                };
                return this;
            },
            // Compute the path of an unit according to its precalculated moves
            path: function(cell, _cbk) {
                var d       = [[-1,0],[0,-1],[1,0],[0,1]];                              // Possible directions
                var move    = cell.length?this.board[cell[1]][cell[0]].move:-1;         // Move value (from board.moves)
                var to      = -1;                                                       // Next tiles
                var ret     = [];

                while (move>0) {
                    var from         = -1;
                    var tilemove     = move;

                    ret.push([cell[0],cell[1]]);

                    for (var i=0; i<4; i++) {
                        var cnext = [cell[0]+d[i][0], cell[1]+d[i][1]];
                        if (cnext[0]>=0 && cnext[1]>=0 && cnext[0]<this.width && cnext[1]<this.height &&
                            this.board[cnext[1]][cnext[0]] && this.board[cnext[1]][cnext[0]].move!=0 &&
                            this.board[cnext[1]][cnext[0]].move>tilemove ) {
                            from        = i;
                            tilemove    = this.board[cnext[1]][cnext[0]].move;
                        }
                    }
                                    
                    if (from==-1) { move=0; }
                    else {
                        if (_cbk) { _cbk(cell[0],cell[1],from,to); }
                        cell    = [cell[0]+d[from][0], cell[1]+d[from][1]];
                        move    = this.board[cell[1]][cell[0]].move;
                        to      = from;
                    }
                    if (to!=-1) { if (_cbk) { _cbk(cell[0],cell[1],-1,to); } }
                }
                return ret;
            },
            tile : function(_x,_y) { return this.board[$.isArray(_x)?_x[1]:_y][$.isArray(_x)?_x[0]:_x]; },
            init : function(_tag, _value) { this.foreach(function(_elt) { _elt[_tag] = _value; }); return this; },
            foreach: function(_function) {
                for (var j=0; j<this.height; j++) for (var i=0; i<this.width; i++) { _function(this.board[j][i]); }
                return this;
            },
            dump: function() { alert(JSON.stringify(this.board)); return this;}
        };
        for (var j=0; j<h; j++) { var line = []; for (var i=0; i<w; i++) {
                var val = $.isArray(b)?b[j][i]:b;
                if (typeof(val)=="string") { val = tile[val]?tile[val]:tile.default; }
                line.push($.extend(true,{}, tile.default, val));
            }
            ret.board.push(line); }
        return ret;
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
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
        },
        format: function(_text) {
            for (var j=0; j<5; j++) for (var i=0; i<regExp.length/2; i++) {
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

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Mode
                $this.find("#header #playmode").html("<img src='res/img/control/"+
                    (settings.playmode==0?"group01.svg":"single01.svg")+"'/>");
                $this.find("#header #hasfog").html("<img src='res/img/control/"+
                    (settings.hasfog?"fog.svg":"nofog.svg")+"'/>");

                // HELP POPUP
                $this.find(".onpopup").bind("mousedown touchstart", function(event) {
                    var $this = $(this).closest('.wargames'), settings = helpers.settings($this);
                    if (settings.popuptimer) {
                        $this.find(".popup").hide();
                        clearTimeout(settings.popuptimer);
                        settings.popuptimer=0;
                    }
                    switch($(this).attr("id")) {
                        case "playmode":
                            if (settings.playmode==0)   { $this.find("#group.popup").show(); }
                            else                        { $this.find("#single.popup").show(); }
                        break;
                        case "hasfog":
                            if (settings.hasfog)        { $this.find("#fog.popup").show(); }
                            else                        { $this.find("#nofog.popup").show(); }
                        break;
                        default:
                            $this.find("#p"+$(this).attr("id")+".popup").show();
                            break;
                    };
                    event.stopPropagation();
                    event.preventDefault();
                });
                $this.find(".onpopup").bind("mouseup touchend mouseleave touchleave", function(event) {
                    var $this = $(this).closest('.wargames'), settings = helpers.settings($this);
                    settings.popuptimer = setTimeout(function(){
                        if (settings.popuptimer) { $this.find(".popup").hide(); } settings.popuptimer=0; },500);
                    event.stopPropagation();
                    event.preventDefault();
                });

                // BOARD
                $this.find("#board #bg").html("");
                $this.find("#board #fogg").html("");

                settings.map = board(settings.board);

                for (var j in settings.map.board) for (var i in settings.map.board[j]) {
                    var val = settings.map.tile(i,j);

                    // $elt : BACKGROUND TILE
                    val.$elt=$("<div class='t' style='top:"+j+"em;left:"+i+"em;"+
                            "background-position:-"+val.pos[0]+"em -"+val.pos[1]+"em;"+"'><div></div></div>");
                    if (val.h) { val.$elt.css("height",val.h+"em").css("top",(j-val.h+1)+"em"); }
                    $this.find("#board #bg").append(val.$elt);

                    // $fogelt : FOG TILE
                    val.$fogelt = $("<div id='fog"+i+"x"+j+"' class='t' style='top:"+j+"em;left:"+i+"em;'><div></div></div>");
                    $this.find("#board #fogg").append(val.$fogelt);

                    // $movelt : MOVE TILE
                    val.$movelt = $("<div style='top:"+j+"em;left:"+i+"em;'></div>");
                    $this.find("#fg").append(val.$movelt);
                }

                settings.maxtiles = Math.min(settings.board.length, settings.board[0].length);
                settings.nav.size = [ settings.board[0].length, settings.board.length ];
                settings.nav.focus= [ settings.maxtiles/2, settings.maxtiles/2 ];

                $this.find("#board #grounds").css("width",settings.board[0].length+"em")
                                             .css("height",settings.board.length+"em");

                setTimeout(function() {
                    helpers.nav($this);
                    helpers.zoom($this,1);

                    $this.find("#zoom #cursor")
                        .css("width",(22.4*settings.mintiles/settings.maxtiles)+"em")
                        .draggable({ axis:"x", containment:"parent",
                            drag:function() {
                                var x= ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                                helpers.zoom($this,1-x);
                        }})
                        .css("position","absolute")
                        .show();
                }, 1);

                $this.find("#board").bind("mousedown touchstart", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                     event.originalEvent.touches[0]:event;
                    if (settings.interactive && !settings.action.id) {
                        if (settings.action.timer) { clearTimeout(settings.action.timer); settings.action.timer = 0; }
                        settings.nav.mouse = [ vEvent.clientX, vEvent.clientY];
                        settings.action.id = MOVE_BOARD;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });

                $this.find("#board").bind("mouseup touchend", function(event) {
                    if (settings.action.timer) { clearTimeout(settings.action.timer); settings.action.timer = 0; }
                    switch (settings.action.id) {
                        case MOVE_BOARD:
                            for (var i=0; i<2; i++) { settings.nav.focus[i] -= settings.nav.rt[i]; settings.nav.rt[i] = 0; }
                            helpers.zoom($this, -1);
                        break;
                        case MOVE_UNIT:
                            if (settings.action.elt) {
                                // MOVE
                                if (settings.action.path) { settings.action.path.reverse(); }
                                if (settings.action.elt.freight.id!=-1) {
									var unit = settings.action.elt.freight.units[settings.action.elt.freight.id];
									settings.action.elt.freight.units[settings.action.elt.freight.id] = 0;
									settings.action.elt.freight.id = -1;
									unit.alive = true;
									unit.pos = [ settings.action.elt.pos[0], settings.action.elt.pos[1] ];
									unit.$elt.css("top", unit.pos[1]+"em").css("left",unit.pos[0]+"em").show();
									settings.action.elt = unit;
									unit.overview($this);
								}
                                helpers.units.move($this, settings.action.elt, settings.action.path, function(_status) {
                                    if (_status) {
										var who = settings.map.tile(settings.action.elt.pos).people;
										if (who && who.id!=settings.action.elt.id && who.freight.type) {
											settings.action.elt.alive = false;
											settings.action.elt.$elt.hide();
											var place = -1;
											for (var i in who.freight.units) { if (place==-1 && !who.freight.units[i]) { place = i; }}
											who.freight.units[place] = settings.action.elt;
										}
										else if (settings.action.target) {
                                            var foe = settings.map.tile(settings.action.target).people;
                                            if (!foe.fog) {
                                                if (foe.team!=settings.action.elt.team) {
                                                    // ATTACK
                                                    helpers.units.attack($this, settings.action.elt, foe);
                                                }
                                                else {
                                                    // HEAL AND SUPPORT
													if (settings.action.elt.support) helpers.units.support($this, settings.action.elt, foe);
													
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        $this.find("#warning").css("opacity",1)
                                                              .css("top", settings.action.elt.pos[1]+"em")
                                                              .css("left",settings.action.elt.pos[0]+"em").show()
                                                              .delay(500)
                                                              .animate({opacity:0},500,function() { $(this).hide(); });
                                        
                                        settings.action.elt     = -1;
                                    }
                                });
                            }
                        break;
                    }
                    $this.find("#fg>div").removeClass("s").hide();
                    settings.nav.mouse      = 0;
                    settings.action.id      = DO_NOTHING;

                    event.stopPropagation();
                    event.preventDefault();
                });


                $this.find("#board").bind("mousemove touchmove",function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                     event.originalEvent.touches[0]:event;
                    switch (settings.action.id) {
                        case MOVE_BOARD:
                            var s = $this.find("#board #bg>div").width();
                            settings.nav.rt = [ (vEvent.clientX-settings.nav.mouse[0])/s, (vEvent.clientY-settings.nav.mouse[1])/s ];
                            helpers.nav($this);
                        break;
                        case MOVE_UNIT:
                            $this.find("#fg .a").detach();
                            $this.find("#fg .tt").detach();
                            var c           = helpers.info.eventToTiles($this,vEvent);          // Cursor position in grid
                            var letsmove    = true;
                            var target      = settings.map.tile(c).target;
                            settings.action.target = 0;

                            if (target && $.isArray(target) && settings.map.tile(c).people && !settings.map.tile(c).people.fog) {

                                settings.map.tile(c).$movelt.html("<div class='tt'></div>");
                                settings.action.target = [c[0],c[1]];
                                c = [target[0],target[1]];
                            }

                            if ( !settings.action.target && settings.map.tile(c).people && !settings.map.tile(c).people.fog) {
                                letsmove = false;
								var p = settings.map.tile(c).people;
								
								if (p.team==settings.action.elt.team && p.freight.type==settings.action.elt.type) {
									for (var i in p.freight.units) { if (!p.freight.units[i]) letsmove = true; }
								}
                            }

                            if (letsmove) {
                                settings.action.path = settings.map.path(c, function(_i,_j,_from,_to) {
                                    settings.map.tile(_i,_j).$movelt.html("<div class='a a"+(_from+1)+""+(_to+1)+"'></div>");
                                });
                            }
                            else { settings.action.path = 0; }

                        break;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });


                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#exercice").html(settings.exercice);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(helpers.format(value)); }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        units: {
            update: function($this, _elt) {
                var settings = helpers.settings($this);
                var offset = _elt.offset(settings.map.tile(_elt.pos));
                _elt.$elt.children().first().css("left",-offset.left+"em").css("top",-offset.top+"em");
                return _elt;
            },
            damage: function($this, _a, _value, _who, _cbk) {
                var settings = helpers.settings($this);
                $this.find("#bing01"+_who).css("top", _a.pos[1]+"em").css("left",_a.pos[0]+"em").show();

                setTimeout(function() {
                    $this.find("#bing02"+_who).css("opacity",1).css("top", _a.pos[1]+"em").css("left",_a.pos[0]+"em").show().delay(200)
                                              .animate({opacity:0},200,function() { $(this).hide(); });
                    $this.find("#bing01"+_who).hide();
                    setTimeout(function() {
                        $this.find("#point"+_who+">div").html(_value);
                        _a.stat.life[0]-=_value;
                        $this.find("#point"+_who).css("opacity",1).css("top", _a.pos[1]+"em").css("left",_a.pos[0]+"em").show().delay(300)
                                                 .animate({top:(_a.pos[1]-0.5)+"em",opacity:0},500,function() { $(this).hide(); });

                       
                        setTimeout(function() {
                            if (_a.value("life")[0]<=0) {
                                _a.alive = false;
                                _a.$elt.animate({opacity:0},200,function(){$(this).hide();});
								helpers.fog($this);
                            }
                            if (_cbk) { _cbk(); }
                         },300);


                        },100);
                    },200);
            
            },
            // Handle support
            support: function($this, _a, _d, _cbk) {
				if (_a.support) {
					$this.find("#pointb>div").html(_a.support.value);
					switch (_a.support.type) {
						case "heal" : case "fix" : _d.stat.life[0]=Math.min(_d.stat.life[1], _d.stat.life[0]+_a.support.value); break;
						case "ammo" : _d.stat.munition[0]=Math.min(_d.stat.munition[1], _d.stat.munition[0]+_a.support.value); break;
					}
					$this.find("#pointb").css("opacity",1).css("top", _d.pos[1]+"em").css("left",_d.pos[0]+"em").show().delay(300)
										 .animate({top:(_d.pos[1]-0.5)+"em",opacity:0},500,function() { $(this).hide(); });
				}
                       
                setTimeout(function() { if (_cbk) { _cbk(); } },300);

			},
            // Handle attack
            attack: function($this, _a, _d, _cbk) {
                var settings = helpers.settings($this);
                var delay    = 1;
                var counter  = ((Math.abs(_a.pos[0]-_d.pos[0])+Math.abs(_a.pos[1]-_d.pos[1]))==1 && _d.fire.min == 1);
                if (_a.pos[0]!=_d.pos[0]) {
                    if (_a.pos[0]<_d.pos[0])    { _a.side = true; _d.side = false; }
                    else                        { _a.side = false; _d.side = true; }
                    helpers.units.update($this, _a);
                    helpers.units.update($this, _d);
                    delay = 200;
                }
                setTimeout(function() {
                    _a.stat.munition[0]--;
                    var pt = _a.attack(_d,settings.map.tile(_a.pos),settings.map.tile(_d.pos), counter);
                    if (counter) { helpers.units.damage($this, _a, pt[1], "a"); }
                    helpers.units.damage($this, _d, pt[0], "b", function() { _a.overview($this); _cbk(); });
                }, delay);
            },
            // Animate the move
            move: function ($this, _elt, _move, _cbk) {
                var settings = helpers.settings($this);
                if (_move && _move.length>1) {
                    var stopped = false;
                    var from    = _move[0];
                    var to      = _move[1];
                    var cell    = settings.map.tile(to);

                    if (cell.people && cell.people.team!=_elt.team) { _cbk(false); }
                    else {
                        _elt.$elt.animate({top:(from[1]+to[1])/2+"em", left:(from[0]+to[0])/2+"em"},150, function() {
                            if (to[0]!=from[0]) { _elt.side = (to[0]>from[0]); }
                            _elt.pos = [to[0],to[1]];
                            if (_elt.team==0) { helpers.fog($this); }

                            helpers.units.update($this, _elt);

                            _elt.$elt.animate({top:to[1]+"em", left:to[0]+"em"},150, function() {
                                _move.shift();
                                helpers.units.move($this,_elt,_move,_cbk);
                            });
                        });
                    }
                }
                else { _cbk(true); }
            },
            add: function($this, _data) {
                var settings = helpers.settings($this);
                var u        = unit(_data);
                
                u.img = function($this) {
					return "<div class='icon'>"+
                        "<div style='width:"+this.res.size[0]+"em;height:"+this.res.size[1]+"em;margin-top:-"+this.res.line+"em;'>"+
                        "<img src='res/img/tileset/ortho/people/"+this.res.img+".svg'/></div></div></div>";
                };

                u.overview = function($this) {
					$this.find("#stats #portrait>#ptype").hide();
					$this.find("#stats #portrait>#ptransport").hide();
					if (u.alive) {
						for (var i in this.stat) {
							var value = this.value(i);
							var bonus = (value[0]>value[1]), malus = (value[0]<value[1]);
							$this.find("#data #"+i+" .label").html(value[0]).toggleClass("bonus",bonus).toggleClass("malus",malus);
						}
						$this.find("#stats #portrait>#punit").html(this.img($this));
						if (this.support) {
							var img="";
							switch (this.support.type) {
								case "heal" : img="life01"; break;
								case "ammo" : img="munition01"; break;
								case "fix"  : img="support01"; break;
							}
							if (img) { $this.find("#stats #portrait>#ptype").html("<img src='res/img/icon/skill/"+img+".svg'/>").show(); }
						}
						if (this.freight.type) {
							$this.find("#stats #portrait>#ptransport").show();
							$this.find("#stats #portrait .punit").removeClass("s").html("");
							for (var i in this.freight.units) {
								if (this.freight.units[i]) {
									$this.find("#stats #portrait #punit"+i).html(this.freight.units[i].img($this));
								}
							}
							if (this.freight.id!=-1) { $this.find("#stats #portrait #punit"+this.freight.id).addClass("s");	}
						}
					}
					else {
						for (var i in this.stat) { $this.find("#data #"+i+" .label").html(""); }
						$this.find("#stats #portrait>#punit").html("");
					}
                    return this;
                };


                u.id = settings.people.length;
                u.$elt = $("<div id='"+u.id+"' class=''>"+
                           "<div style='width:"+u.res.size[0]+"em;height:"+u.res.size[1]+"em;'>"+
                           "<img src='res/img/tileset/ortho/people/"+u.res.img+".svg'/></div></div>");

                
                u.$elt.css("top",u.pos[1]+"em").css("left",u.pos[0]+"em");
                var offset = u.offset(settings.map.tile(u.pos));
                u.$elt.children().first().css("left",-offset.left+"em").css("top",-offset.top+"em");


                u.$elt.bind("mousedown touchstart", function(event) {
                    var guyid = $(this).attr("id");
                    $this.find("#people>div").removeClass("s").removeClass("t");
                    var guy = settings.people[guyid];
                    if (guy) {
                        if (settings.action.elt!=guy) { guy.freight.id = -1; }
                        settings.action.elt     = guy;
                        settings.action.target  = 0;
                        settings.action.move    = 0;

                        $this.find("#fg .tt").detach();
                        $this.find("#fg .a").detach();
                        guy.$elt.addClass("s");
                        guy.overview($this);
                        if (guy.$elt.hasClass("a") ) {
                            settings.map.people(settings.people);
                            
                            if (guy.freight.id!=-1) {
								settings.map.drop(guy, guy.freight.units[guy.freight.id]);
							}
							else {
								settings.map.moves(guy);
								settings.map.targets(settings.people, guyid);
							}

                            settings.action.timer = setTimeout(function(){
                                $this.find("#fg>div").removeClass("s").removeClass("t").removeClass("c").show();
                                settings.map.foreach(function(_tile) {
                                    if (_tile.move)     { _tile.$movelt.addClass("s"); }
                                    if (_tile.target)   { _tile.$movelt.addClass($.isArray(_tile.target)?"t":"c"); }
                                });
                                settings.action.id = MOVE_UNIT;
                            },300);
                        }
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });

                settings.people.push(u);
                $this.find("#people").append(u.$elt);
            }
        },
        fog : function($this) {
            var settings = helpers.settings($this);
            if (settings.hasfog) {
                settings.map.fog(settings.people,0,"fog");
                settings.map.foreach(function(_tile) { if (!_tile["fog"]) { _tile.$fogelt.show(); } else { _tile.$fogelt.hide(); } });

                for (var i in settings.people) {
                    var guy = settings.people[i];
                    if (guy.alive) {
                        if (guy.team!=0 && !settings.map.tile(guy.pos).fog) { guy.fog = true;  guy.$elt.hide(); }
                        else                                                { guy.fog = false; guy.$elt.show(); }
                    }
                }
            }
        },
        engine: {
            newturn: function($this) {
                var settings = helpers.settings($this);
                helpers.fog($this);


                if (settings.playmode==0) {
                    for (var i in settings.people) { settings.people[i].$elt.toggleClass("a",(settings.people[i].team==0)); }
                } else {
                }
            }
        },
        info: {
            // FROM AN EVENT TO A BOARD COORD
            eventToTiles: function($this, _event) {
                var settings = helpers.settings($this);
                var s = $this.find("#board #bg>div").width();
                var $b= $this.find("#board>div");
                var o = $b.offset();
                var ret=[];
                if ( _event.clientX>=o.left &&_event.clientX<o.left+$b.width() &&
                     _event.clientY>=o.top  &&_event.clientY<o.top+$b.height() ) {
                    ret = [Math.floor(settings.nav.xy[0]+(_event.clientX-o.left)/s),
                           Math.floor(settings.nav.xy[1]+(_event.clientY-o.top)/s)];
                }
                return ret;
            }
        },
        nav: function($this) {
            var settings = helpers.settings($this);
            var x = settings.nav.focus[0] - settings.nav.rt[0] - settings.nav.zoom/2;
            var y = settings.nav.focus[1] - settings.nav.rt[1] - settings.nav.zoom/2;
            if (x<0) { x=0; }
            if (y<0) { y=0; }
            if (x>settings.nav.size[0]-settings.nav.zoom) { x=settings.nav.size[0]-settings.nav.zoom; }
            if (y>settings.nav.size[1]-settings.nav.zoom) { y=settings.nav.size[1]-settings.nav.zoom; }

            settings.nav.xy=[x,y];

            $this.find("#eleft").toggle(x>0.001);
            $this.find("#etop").toggle(y>0.001);
            $this.find("#eright").toggle(x<settings.nav.size[0]-settings.nav.zoom-0.001);
            $this.find("#ebottom").toggle(y<settings.nav.size[1]-settings.nav.zoom-0.001);

            $this.find("#action>#board #grounds").css("left",-x+"em").css("top",-y+"em");
        },
        zoom: function($this, _zoom) {
            var settings = helpers.settings($this);
            if (_zoom>=0 && _zoom<=1) { settings.nav.zoom = settings.mintiles + (settings.maxtiles-settings.mintiles)*_zoom; }

            // vSize*vNoZoomSize HAS TO BE INTEGER (ELSE BORDER WILL APPEAR)
            var vSize = 10/settings.nav.zoom;
            var vNoZoomSize = $this.find("#action>#board>div").width()/10;
            var vActualSize = vSize * vNoZoomSize;
            vSize -= (vActualSize - Math.floor(vActualSize))/vNoZoomSize;

            $this.find("#action>#board #grounds").css("font-size",vSize+"em");
            for (var i=0; i<2; i++) {
                settings.nav.focus[i]=Math.max(settings.nav.focus[i],settings.nav.zoom/2);
                settings.nav.focus[i]=Math.min(settings.nav.focus[i], settings.nav.size[i]-settings.nav.zoom/2);
            }
            helpers.nav($this);
        }
    };

    // The plugin
    $.fn.wargames = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    maxtiles        : 3,
                    action          : { id: 0, timer: 0, elt: -1, target:0, path:0 },
                    nav             : { mouse: 0, focus:[0,0], rt:[0,0], zoom:0, size:[0,0], xy:[0,0] },
                    popuptimer      : 0,
                    people          : [],
                    engine          : { fog:[], move:[] }
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
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $(this).find("#splash").hide();
                settings.interactive = true;

                for (var i in settings.units) { helpers.units.add($this, settings.units[i]); }
                helpers.engine.newturn($this);
            },
            transport: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.action.elt.freight.type && settings.action.elt.freight.units[_id]) {
					settings.action.elt.freight.id=(settings.action.elt.freight.id==_id)?-1:_id;
					settings.action.elt.overview($this);
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in wargames plugin!'); }
    };
})(jQuery);

