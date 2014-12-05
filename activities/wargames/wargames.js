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
        debug       : false                                     // Debug mode
    };

    var people = {
        soldier : {  img:"cromagnon01", imgsize:[4,3], look:0,  move:10,
                     speed: { ground:4, road:1, flood:6, wood:3, hill:6, mountain:8, sea:-1 } }
    };
    var tile = {
        // GROUND
        g0   : { pos: [0,0], type:"ground"  },
        g1   : { pos: [0,1], type:"ground"  },
        g2   : { pos: [0,2], type:"ground"  },
        g3   : { pos: [0,3], type:"ground"  },

        // ROAD
        rse  : { pos: [0,5], type:"road"  },
        rso  : { pos: [1,5], type:"road"  },
        rne  : { pos: [0,6], type:"road"  },
        rno  : { pos: [1,6], type:"road"  },
        rv   : { pos: [0,7], type:"road"  },
        rh   : { pos: [1,7], type:"road"  },
        rnse : { pos: [0,8], type:"road"  },
        rseo : { pos: [1,8], type:"road"  },
        rneo : { pos: [0,9], type:"road"  },
        rnso : { pos: [1,9], type:"road"  },

        // FLOOD
        fse  : { pos: [2,5], type:"flood"  },
        fso  : { pos: [3,5], type:"flood"  },
        fne  : { pos: [2,6], type:"flood"  },
        fno  : { pos: [3,6], type:"flood"  },
        fv   : { pos: [2,7], type:"flood"  },
        fh   : { pos: [3,7], type:"flood"  },
        fnse : { pos: [2,8], type:"flood"  },
        fseo : { pos: [3,8], type:"flood"  },
        fneo : { pos: [2,9], type:"flood"  },
        fnso : { pos: [3,9], type:"flood"  },

        // SEA
        sea  : { pos: [3,4], type:"sea"    },
        sse  : { pos: [3,0], type:"sea"    },
        sso  : { pos: [6,0], type:"sea"    },
        sne  : { pos: [3,3], type:"sea"    },
        sno  : { pos: [6,3], type:"sea"    },
        ss1  : { pos: [4,0], type:"sea"    },
        ss2  : { pos: [5,0], type:"sea"    },
        sn1  : { pos: [4,3], type:"sea"    },
        sn2  : { pos: [5,3], type:"sea"    },
        se1  : { pos: [3,1], type:"sea"    },
        se2  : { pos: [3,2], type:"sea"    },
        so1  : { pos: [6,1], type:"sea"    },
        so2  : { pos: [6,2], type:"sea"    },
        scno : { pos: [4,1], type:"sea"    },
        scne : { pos: [5,1], type:"sea"    },
        scso : { pos: [4,2], type:"sea"    },
        scse : { pos: [5,2], type:"sea"    },

        // WOOD
        w0   : { pos: [1,0], type:"wood" },

        // MOUNTAINS
        m0   : { pos: [2,0], type:"hill" },
        m1   : { pos: [2,1], h:2, type:"mountain" }
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
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
                    $("head").append("<link>");
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

                for (var j in settings.board) for (var i in settings.board[j]) {
                    var val = settings.board[j][i];
                    if (tile[val]) {
                        var $elt = $("<div class='t' style='top:"+j+"em;left:"+i+"em;"+
                            "background-position:-"+tile[val].pos[0]+"em -"+tile[val].pos[1]+"em;"+"'><div></div></div>");
                        if (tile[val].h) {
                            $elt.css("height",tile[val].h+"em").css("top",(j-tile[val].h+1)+"em");
                        }
                        $this.find("#board #bg").append($elt);
                    }
                }
                settings.maxtiles = Math.min(settings.board.length, settings.board[0].length);
                settings.nav.size=[ settings.board[0].length, settings.board.length ];
                settings.nav.focus=[settings.maxtiles/2, settings.maxtiles/2 ];

                $this.find("#board #grounds").css("width",settings.board[0].length+"em")
                                             .css("height",settings.board.length+"em");

                helpers.nav($this);
                helpers.zoom($this,1);

                $this.find("#zoom #cursor")
                    .css("width",(22.4*settings.mintiles/settings.maxtiles)+"em").show()
                    .draggable({ axis:"x", containment:"parent",
                        drag:function() {
                            var x= ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                            helpers.zoom($this,1-x);
                    }});

                $this.find("#board").bind("mousedown touchstart", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                     event.originalEvent.touches[0]:event;
                    if (settings.interactive && !settings.action) {
                        settings.nav.mouse = [ vEvent.clientX, vEvent.clientY];
                        settings.action=1;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });

                $this.find("#board").bind("mouseup touchend", function(event) {
                    switch (settings.action) {
                        case 1:
                            // BOARD TRANSLAGE
                            for (var i=0; i<2; i++) { settings.nav.focus[i] -= settings.nav.rt[i]; settings.nav.rt[i] = 0; }
                            helpers.zoom($this, -1);
                        break;
                        case 2:
                            // MOVE SOLDIER
                        break;
                    }
                    $this.find("#fg").html("");
                    settings.nav.mouse   = 0;
                    settings.action= 0;
                    settings.area  = [];

                    event.stopPropagation();
                    event.preventDefault();
                });


                $this.find("#board").bind("mousemove touchmove",function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                     event.originalEvent.touches[0]:event;
                    switch (settings.action) {
                        case 1:
                            var s = $this.find("#board #bg>div").width();
                            settings.nav.rt = [ (vEvent.clientX-settings.nav.mouse[0])/s, (vEvent.clientY-settings.nav.mouse[1])/s ];
                            helpers.nav($this);
                        break;
                        case 2:
                            $this.find("#fg .a").detach();
                            var d = [[-1,0],[0,-1],[1,0],[0,1]];
                            var c = helpers.info.eventToTiles($this,vEvent);
                            var v = c.length?settings.area[c[1]][c[0]].v:-1;
                            var to = -1;
                            while (v>0) {
                                var from = -1;
                                var stmp = 100;
                                for (var i=0; i<4; i++) {
                                    var cnext = [c[0]+d[i][0], c[1]+d[i][1]];
                                    if (cnext[0]>=0 && cnext[1]>=0 && cnext[0]<settings.nav.size[0] && cnext[1]<settings.nav.size[1] &&
                                        settings.area[cnext[1]][cnext[0]] && settings.area[cnext[1]][cnext[0]].v!=-1 &&
                                        settings.area[cnext[1]][cnext[0]].v<v && settings.area[cnext[1]][cnext[0]].s<stmp) {
                                            from = i;
                                            stmp = settings.area[cnext[1]][cnext[0]].s;
                                        }
                                }
                                if (from==-1) { v=-1; }
                                else {
                                    settings.area[c[1]][c[0]].$e.html("<div class='a a"+(from+1)+""+(to+1)+"'></div>");
                                    c  = [c[0]+d[from][0], c[1]+d[from][1]];
                                    v  = settings.area[c[1]][c[0]].v
                                    to = from;
                                }
                            }
                            if (to!=-1) { settings.area[c[1]][c[0]].$e.html("<div class='a a0"+(to+1)+"'></div>"); }

                        break;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });

                for (var i in settings.people) {
                    settings.people[i] = $.extend({}, people[settings.people[i].type], settings.people[i]);
                    var $elt = $("<div id='"+i+"'>"+
                               "<div style='width:"+settings.people[i].imgsize[0]+"em;"+
                                           "height:"+settings.people[i].imgsize[1]+"em;'>"+
                               "<img src='res/img/tileset/ortho/people/"+settings.people[i].img+".svg'/></div></div>");
                    $elt.bind("mousedown touchstart", function(event) {
                        var guy = settings.people[$(this).attr("id")];

                        $this.find("#fg").html("");

                        // MOVE GUY
                        settings.area = helpers.info.moves($this, $(this).attr("id"));
                        for (var jj=0; jj<settings.area.length; jj++) for (var ii=0; ii<settings.area[jj].length; ii++)
                        {
                            if (settings.area[jj][ii].v>=0) {
                                settings.area[jj][ii].$e = $("<div class='m m"+settings.area[jj][ii].v+"' id='m"+ii+"x"+jj+"' "+
                                                             "style='top:"+jj+"em;left:"+ii+"em;'></div>");
                                $this.find("#fg").append(settings.area[jj][ii].$e );
                            }
                        }
                        settings.command= [[guy.pos[0],guy.pos[1]]];
                        settings.action = 2;

                        event.stopPropagation();
                        event.preventDefault();
                    });
                    $this.find("#people").append($elt);
                    helpers.people.update($this, i);
                }


                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#exercice").html(settings.exercice);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        people: {
            update: function($this, _id) {
                var settings = helpers.settings($this);
                var $elt = $this.find("#people #"+_id);
                var guy = settings.people[_id];
                $elt.css("top",guy.pos[1]+"em").css("left",guy.pos[0]+"em");
                var vTop = 0, vLeft = 0;
                if (guy.orientation=="left") { vLeft-=1; }
                if (tile[settings.board[guy.pos[1]][guy.pos[0]]].type=="flood") { vLeft-=2; }
                vTop-=guy.look;
                $elt.children().first().css("left",vLeft+"em").css("top",vTop+"em")
            }
        },
        info: {
            // PROVIDE A BLANK BOARD
            board: function($this, _val) {
                var settings = helpers.settings($this);
                var ret=[];
                for (var j=0; j<settings.board.length; j++) {
                    var line = [];
                    for (var i=0; i<settings.board[0].length; i++) { line.push(_val); }
                    ret.push(line);
                }
                return ret;
            },
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
            },
            // PROVIDE THE POSSIBLE MOVES FOR A PEOPLE
            moves: function($this, _id) {
                var settings = helpers.settings($this);
                board    = helpers.info.board($this, -1);
                if (_id>=0 && _id<settings.people.length) {
                    var guy      = settings.people[_id];
                    var moves    = [];
                    moves.push([guy.pos[0], guy.pos[1], 0]);

                    while (moves.length) {
                        var elt = moves.pop();
                        var ok = true;

                        if (ok && (elt[0]<0 || elt[1]<0 || elt[0]>=board[0].length || elt[1]>=board.length)) { ok = false; }
                        if (ok && board[elt[1]][elt[0]].v!=-1 && board[elt[1]][elt[0]].v<= elt[2])               { ok = false; }

                        if (ok) {
                            // GET THE SPEED
                            var speed = 1;
                            if (settings.board[elt[1]][elt[0]] && tile[settings.board[elt[1]][elt[0]]] &&
                                guy.speed && typeof(guy.speed[tile[settings.board[elt[1]][elt[0]]].type])!='undefined' ) {
                                speed = guy.speed[tile[settings.board[elt[1]][elt[0]]].type];
                            }

                            // IS SOMEONE HERE ?
                            var team = -1;
                            for (var i in settings.people) {
                                if (settings.people[i].pos[0]==elt[0] && settings.people[i].pos[1]==elt[1]) {
                                    team = settings.people[i].team;
                                }
                            }

                            if (speed!=-1 && (team==-1 || team==guy.team)) {
                                board[elt[1]][elt[0]] = {$e:0, v:elt[2], s:speed};

                                if (elt[2]+speed<=guy.move) {
                                    moves.push([elt[0]-1, elt[1], elt[2]+speed]);
                                    moves.push([elt[0]+1, elt[1], elt[2]+speed]);
                                    moves.push([elt[0], elt[1]-1, elt[2]+speed]);
                                    moves.push([elt[0], elt[1]+1, elt[2]+speed]);
                                }
                            }

                        }
                    }
                }
                return board;
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
                    command         : 0,        // THE CURRENT COMMAND (LIST OF MOVES, ...)
                    action          : 0,        // THE CURRENT ACTION (1:translate board, 2:move people)
                    area            : [],       // THE CURRENT ACTION AREA DATA
                    nav             : { mouse: 0, focus:[0,0], rt:[0,0], zoom:0, size:[0,0], xy:[0,0] }
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
                        if ($settings.class) { $this.addClass($settings.class); }
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

