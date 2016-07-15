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
        hasfog      : true,                                    // Fog of war
        debug       : true                                     // Debug mode
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
                pos     : [0,0],
                fog     : false,
                id      : 0,
                team    : 0,
                time    : 0,
                res     : { img:"red01", size:[4,6], line:0 },
                stat    : {
                    life:       [10,10],    munition:   [10,10],    attack:     1,      armor:      0,
                    vision:     4,          move:       4,          luck:       3,      speed:      1
                    },
                speed   : { ground:1, road:0.5, flood:4, wood:2, hill:2, mountain:3, sea:99 },
                bonus   : [], // [{type:"attack",add:1},{type:"luck",abs:2},{type:"move",mul:1.2},{type:"vision",mul:1.5}],
                value   : function(_attribute) {
                    var value = this.stat[_attribute], from = value;
                    if ($.isArray(value)) { from = value[1]; value = value[0]; }
                    for (var j in this.bonus) if (this.bonus[j].type==_attribute) {
                        if (this.bonus[j].add) { value += this.bonus[j].add; } else
                        if (this.bonus[j].mul) { value *= this.bonus[j].mul; } else
                        if (this.bonus[j].abs) { value = this.bonus[j].abs; }
                    }
                    return [Math.floor(value), from];
                }
            },
            soldier : { res     : { img:"red01", size:[4,6], line:0 } }
        };

        var type     = "";
        if (typeof(_unit)=="string") { type=_unit; _unit={}; } else { type=_unit.type; }
        if (!type || !def[type]) { type = "default"; }

        var ret = $.extend(true, {}, def.default, def[type], _unit);

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
        m0   : { pos: [2,0], type:"hill" },     m1   : { pos: [2,1], h:2, type:"mountain", fogtype:"stop" },
    }

    var board = function(_board) {
        var w,h,b;
        if ($.isArray(_board))  { w = _board[0].length; h = _board.length; b=_board; }
        else                    { w = _board.width;     h = _board.height; b=_board.board; }
        
        var ret = {
            width:  w,
            height: h,
            board: [],
            moves: function(_people, _id) {
                this.init("move",0);
                var moves    = [];
                moves.push([_people[_id].pos[0], _people[_id].pos[1], _people[_id].value("move")[0]]);

                while (moves.length) {
                    var cell = moves.pop();
                    var ok = (cell[2]>0);

                    if (ok && (cell[0]<0 || cell[1]<0 || cell[0]>=this.width || cell[1]>=this.height))  { ok = false; }

                    if (ok) {
                        for (var i in _people)
                            if (_people[i].team!=_people[_id].team && _people[i].pos[0]==cell[0] && _people[i].pos[1]==cell[1] &&
                                !_people[i].fog) {
                                ok = false;
                        }
                    }

                    if (ok && this.board[cell[1]][cell[0]].move < cell[2]) {
                        var tile = this.board[cell[1]][cell[0]];
                        var speed = _people[_id].speed[tile.type]?_people[_id].speed[tile.type]:1;

                        this.board[cell[1]][cell[0]].move = cell[2];

                        moves.push([cell[0]-1, cell[1], cell[2]-speed]);
                        moves.push([cell[0]+1, cell[1], cell[2]-speed]);
                        moves.push([cell[0], cell[1]-1, cell[2]-speed]);
                        moves.push([cell[0], cell[1]+1, cell[2]-speed]);
                    }

                }
                return this;
            },
            fog : function(_people, _team) {
                this.init("fog",0);
                var tiles = [];
                for (var i in _people) { if (_people[i].team == _team) {
                    tiles.push([_people[i].pos[0], _people[i].pos[1], _people[i].value("vision")[0], 0]); } }
                while (tiles.length) {
                    var t = tiles.shift();
                    var elt = this.board[t[1]][t[0]];
                    if (elt.fog<t[2]) {
                        if (elt.fogtype!="hide" || t[3]<2) { elt.fog = t[2]; }
                        if (t[2]>1 && elt.fogtype!="stop") {
                            if (t[0]>0)             { tiles.push([t[0]-1,t[1],t[2]-1,t[3]+1]); }
                            if (t[1]>0)             { tiles.push([t[0],t[1]-1,t[2]-1,t[3]+1]); }
                            if (t[0]<this.width-1)  { tiles.push([t[0]+1,t[1],t[2]-1,t[3]+1]); }
                            if (t[1]<this.height-1) { tiles.push([t[0],t[1]+1,t[2]-1,t[3]+1]); }
                        }
                    }
                };
                return this;
            },
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
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
                $this.find(".onpopup").bind("mouseup touchend mouseout touchleave", function(event) {
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
                    var val = settings.map.board[j][i];

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
                        case 2:
                            // MOVE SOLDIER
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
                            var d = [[-1,0],[0,-1],[1,0],[0,1]];
                            var c = helpers.info.eventToTiles($this,vEvent);
                            var v = c.length?settings.engine.area[c[1]][c[0]].v:-1;
                            var to = -1;
                            while (v>0) {
                                var from = -1;
                                var stmp = 100;
                                for (var i=0; i<4; i++) {
                                    var cnext = [c[0]+d[i][0], c[1]+d[i][1]];
                                    if (cnext[0]>=0 && cnext[1]>=0 && cnext[0]<settings.nav.size[0] && cnext[1]<settings.nav.size[1] &&
                                        settings.engine.area[cnext[1]][cnext[0]] && settings.engine.area[cnext[1]][cnext[0]].v!=-1 &&
                                        settings.engine.area[cnext[1]][cnext[0]].v<v && settings.engine.area[cnext[1]][cnext[0]].s<stmp) {
                                            from = i;
                                            stmp = settings.engine.area[cnext[1]][cnext[0]].s;
                                        }
                                }
                                if (from==-1) { v=-1; }
                                else {
                                    settings.engine.area[c[1]][c[0]].$e.html("<div class='a a"+(from+1)+""+(to+1)+"'></div>");
                                    c  = [c[0]+d[from][0], c[1]+d[from][1]];
                                    v  = settings.engine.area[c[1]][c[0]].v
                                    to = from;
                                }
                            }
                            if (to!=-1) { settings.engine.area[c[1]][c[0]].$e.html("<div class='a a0"+(to+1)+"'></div>"); }

                        break;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });

                for (var i in settings.units) { helpers.units.add($this, settings.units[i]); }
                helpers.engine.newturn($this);

                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#exercice").html(settings.exercice);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(helpers.format(value)); }); }

                 if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        units: {
            add: function($this, _data) {
                var settings = helpers.settings($this);
                var u        = unit(_data);

                u.overview = function($this) {
                    for (var i in this.stat) {
                        var value = this.value(i);
                        var bonus = (value[0]>value[1]), malus = (value[0]<value[1]);
                        $this.find("#data #"+i+" .label").html(value[0]).toggleClass("bonus",bonus).toggleClass("malus",malus);
                    }
                    $this.find("#stats #portrait").html("<div class='icon'>"+
                        "<div style='width:"+this.res.size[0]+"em;height:"+this.res.size[1]+"em;margin-top:-"+this.res.line+"em;'>"+
                        "<img src='res/img/tileset/ortho/people/"+this.res.img+".svg'/></div></div></div>");
                    return this;
                };


                u.update = function($this, _newpos, _anim) {
                    this.$elt.css("top",this.pos[1]+"em").css("left",this.pos[0]+"em");
                    var vTop = 0, vLeft = 0;
                    //if (tile[settings.board[unit.pos[1]][unit.pos[0]]].type=="flood") { vLeft-=2; }
                    vTop-=this.res.line;
                    this.$elt.children().first().css("left",vLeft+"em").css("top",vTop+"em");
                    return this;
                }

                u.id = settings.people.length;
                u.$elt = $("<div id='"+u.id+"' class=''>"+
                           "<div style='width:"+u.res.size[0]+"em;height:"+u.res.size[1]+"em;'>"+
                           "<img src='res/img/tileset/ortho/people/"+u.res.img+".svg'/></div></div>");

                u.$elt.bind("mousedown touchstart", function(event) {
                    var guyid = $(this).attr("id");
                    $this.find("#people>div").removeClass("s");
                    var guy = settings.people[guyid];
                    if (guy) {
                        guy.$elt.addClass("s");
                        guy.overview($this);
                        if (guy.$elt.hasClass("a") ) {
                            settings.map.moves(settings.people,guyid);
                            settings.action.timer = setTimeout(function(){
                                $this.find("#fg>div").removeClass("s").show();
                                settings.map.foreach(function(_tile) { if (_tile.move) { _tile.$movelt.addClass("s"); } });
                                settings.action.id = MOVE_UNIT;
                            },300);
                        }
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });

                settings.people.push(u.update());
                $this.find("#people").append(u.$elt);
            }
        },
        engine: {
            newturn: function($this) {
                var settings = helpers.settings($this);
                if (settings.hasfog) {
                    settings.map.fog(settings.people,0);
                    settings.map.foreach(function(_tile) {
                        if (!_tile.fog) { _tile.$fogelt.show(); }
                    });

                    for (var i in settings.people) {
                        settings.people[i].fog = false;
                        if (settings.people[i].team!=0 && !settings.map.board[settings.people[i].pos[1]][settings.people[i].pos[0]].fog) {
                            settings.people[i].fog = true;
                            settings.people[i].$elt.hide();
                        }
                    }
                }

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
                    action          : { id: 0, timer: 0 },      // THE CURRENT ACTION (1:translate board, 2:move people)
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
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in wargames plugin!'); }
    };
})(jQuery);

