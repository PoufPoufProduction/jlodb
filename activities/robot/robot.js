(function($) {
    // Activity default options
    var defaults = {
        name        : "robot",                                  // The activity name
        label       : "Robot",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        padding     : 3,                                        // Padding top
        margin      : 0.5,                                      // Margin
        worst       : [],                                       // The worst scenario (for multi-robots)
        max         : 200,                                      // Maximum operations allowed
        maxbt       : 20,                                       // Maximum bt allowed
        debug       : false                                     // Debug mode
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
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
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
                if (settings.context.onload) { settings.context.onload($this); }
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // compute scale and offset if not given
                var xmin=0, xmax=0, ymin=0, ymax=0;
                for (var j=0; j<settings.board.length; j++) for (var i=0; i<settings.board[j].length; i++) if (settings.board[j][i]) {
                    if (i+j<xmin) { xmin = i+j; }
                    if (i+j>xmax) { xmax = i+j; }
                    if (i-j<ymin) { ymin = i-j; }
                    if (i-j>ymax) { ymax = i-j; }
                }
                ymin+=settings.board.length-1; ymax+=settings.board.length-1;

                // +8 : 4 for the tile thickness, 4 for the robot head in the top of the board
                var vx = ((xmax-xmin)*2)+8+settings.padding, vy = (ymax-ymin+2)*4, vv = Math.max(vx,vy);
                settings.scale=(22/(vv+settings.margin*2));
                var font = Math.floor($this.height()*settings.scale/12);
                $this.find("#tiles").css("font-size", font+"px");
                var around = Math.floor(($this.height() - font*12/settings.scale)/2);

                settings.offset=[-2*ymin+(vv-vy)/4+settings.margin/2 + around/font,
                                 1+settings.padding/2-2*xmin+(vv-vx)/6+settings.margin/2 + around/font];


                // Update the gui
                for (var i=0; i<4; i++) {
                    if (i<settings.robots.length) {
                        for (var j=0; j<3; j++) {
                            $this.find("#tabs #t"+(i+1)+" .f"+j+" div.z").each(function(_index) {
                                $(this).toggle(_index<settings.robots[i].code[j]);
                            });
                        }
                    }
                    else {
                        $this.find("#tab #r"+(i+1)).hide();
                    }
                }

                // Build the board
                settings.tiles.size=[settings.board[0].length,settings.board.length];

                for (var j=0; j<settings.board.length; j++) for (var i=0; i<settings.board[j].length; i++) if (settings.board[j][i]) {
                    // TURN OFF THE LIGHT
                    if (settings.board[j][i]<500 && (settings.board[j][i]%100) == 52) { settings.board[j][i]=51; }

                    // STORE THE NUMBER IF ANY
                    if (settings.board[j][i]>=650 && settings.board[j][i]<660) { settings.numberinit = settings.board[j][i]-650; }

                    // NOT REALLY USEFUL
                    var tile = {
                        top     :   j,
                        left    :   i,
                        value   :   settings.board[j][i],
                        id      :   (i+j*settings.tiles.size[0]),
                        html    :   function() {
                            var ret = "<div style='";
                            ret+="left:"+(settings.offset[0]+((this.left*2)+(settings.tiles.size[1]-this.top-1)*2))+"em;";
                            ret+="top:"+(settings.offset[1]+this.left+this.top)+"em;";
                            ret+="z-index:"+(10+this.left+this.top+(this.value%100>=50?1:0))+";' ";
                            ret+="id='"+(this.left+this.top*settings.tiles.size[0])+"' ";
                            ret+="class='tile t"+(this.value<10?"00":(this.value<100?"0":""))+this.value+" s"+(this.value%100>=50?"1":"0")+"'";
                            ret+="><img src='res/img/tileset/iso/set1/";
                            ret+=(this.value<10?"00":(this.value<100?"0":""))+this.value;
                            ret+=".svg'/></div>";
                            return ret;
                        }
                    };

                    $this.find("#tiles").append(tile.html());
                    settings.tiles.data.push(settings.board[j][i]);
                }
                else { settings.tiles.data.push(0); }

                // Initialize the robots
                for (var i in settings.robots) {
                    var html="<div class='engine' id='robot"+i+"'><div id='img'><img src=''/></div><div id='invert'><img src='res/img/tileset/iso/robot/statinvert.svg'/></div></div>";
                    $this.find("#tiles").append(html);
                    helpers.update($this, i, settings.robots[i].origin);

                    // Initialize the action cards
                    for (var j in settings.robots[i].actions) {
                        var $elt = $($this.find("#tabs #t"+(parseInt(i)+1)+" .code .z").get(parseInt(j)));
                        var $html=$("<div class='a'><img src='res/img/action/"+settings.robots[i].actions[j]+".svg' alt='"+settings.robots[i].actions[j]+"'/></div>");
                        $elt.html($html);
                        $html.draggable({ containment:$this.find("#t"+(parseInt(i)+1)), revert:true, stack:".a"});
                    }

                    // Check the up and down button
                    $this.find(".source .slider>div").toggle((settings.robots[i].actions.length>15));
                    settings.sourceid[i]=0;
                    settings.sourcemax[i]=Math.floor((settings.robots[i].actions.length-1)/5)-2;
                }

                helpers.updatesource($this);

                $this.find(".z").droppable({accept:".a",
                    drop:function(event, ui) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                        var x           = event.clientX-$this.offset().left;
                        var y           = event.clientY-$this.offset().top;
                        var $old        = $this.find("#touch01>div").detach();
                        var $new        = $old.clone();
                        $this.find("#touch01").css("left",Math.floor(x - $this.find("#touch01").width()/2)+"px")
                                              .css("top",Math.floor(y - $this.find("#touch01").height()/2)+"px")
                                              .append($new.addClass("running")).show();
                        setTimeout(function(){$this.find("#touch01>div").removeClass("running").parent().hide(); },800);


                        if ($(this).children().size()) { $(this).children().detach().appendTo(ui.draggable.parent()); }
                        $(ui.draggable).detach().css("top",0).css("left",0);
                        $(this).append(ui.draggable);
                } });

                // Locale handling
                if (settings.exercice) { $this.find("#exercice").html(settings.exercice); }
                $this.find("h1#label").html(settings.label);
                var list=["a","b","c","d","e","f","g"];
                for (var i in settings.locale.legend) {
                    $this.find("#legend ul").append("<li>"+list[i]+" "+settings.locale.legend[i]+"</li>");
                }
                if ($.isArray(settings.locale.guide)) {
                    $this.find("#guide").html("");
                    for (var i in settings.locale.guide) { $this.find("#guide").append("<p>"+settings.locale.guide[i]+"</p>"); }
                }
                else { $this.find("#guide").html(settings.locale.guide); }
                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // GET THE DELAY ACCORDING TO THE SPEED VALUE
        delay: function($this) { var settings = helpers.settings($this); return Math.floor(1000/Math.pow(2,settings.speed)); },
        // GET AN ACTION FROM THE METHODS
        get: function($this, _robot, _fct, _id) {
            var settings = helpers.settings($this);
            var ret = 0;
            settings.lastelt = $($this.find("#tabs #t"+(_robot+1)+" .f"+_fct+" .z").get(_id));
            if (settings.lastelt.children().length) { ret = settings.lastelt.find("img").attr("alt"); }
            return ret;
        },
        // GET THE WORST SCENARIO TODO
        worst: function($this) {
            var settings = helpers.settings($this);
            return [[0]];
        },
        // UPDATE THE SOURCE CODE DISPLAY
        updatesource: function($this) {
            var settings    = helpers.settings($this);
            $this.find(".code tr").each(function(_index) {
                var robotid = Math.floor(_index/9);
                var rowid = _index%9;
                $(this).toggle(rowid>=settings.sourceid[robotid]&&rowid<settings.sourceid[robotid]+3);
            });
        },
        // UPDATE ROBOT POSITION
        update : function($this, _id, _pos, _anim) {
            var settings    = helpers.settings($this);
            if (!settings.synchro) {
                var $robot      = $this.find("#robot"+_id);

                $this.find("#robot"+_id+" #invert").toggle(typeof(settings.robots[_id].invert)!='undefined' &&
                                                           settings.robots[_id].invert);

                if (_pos) {
                    var zindex      = 10+parseInt(_pos[0])+parseInt(_pos[1]);

                    $this.find("#robot"+_id+" #img img").attr("src","res/img/tileset/iso/robot/robot"+_id+(_pos[2]+1)+".svg");
                    if (!_anim || zindex>$robot.css("z-index")) { $robot.css("z-index", zindex); }

                    if (_anim) {
                        $robot.animate({
                            "left":(settings.offset[0]+((_pos[0]*2)+(settings.tiles.size[1]-_pos[1]-1)*2))+"em",
                            "top":(settings.offset[1]+(1.0*_pos[0]+1.0*_pos[1]))+"em"},helpers.delay($this),function(){});
                    }
                    else {
                        $robot.css("left", (settings.offset[0]+((_pos[0]*2)+(settings.tiles.size[1]-_pos[1]-1)*2))+"em")
                            .css("top",  (settings.offset[1]+(1.0*_pos[0]+1.0*_pos[1]))+"em");
                    }
                }
                else {
                    $robot.animate({"top":Math.floor(20/settings.scale)+"em"},helpers.delay($this),function(){});
                }
            }
        },
        // UPDATE THE ZINDEX OF EVERY ROBOTS
        zindex: function($this) {
            var settings    = helpers.settings($this);
            if (!settings.synchro) for (var i in settings.robots) {
                var zindex = 10+parseInt(settings.robots[i].pos[0])+parseInt(settings.robots[i].pos[1]);
                var $robot = $this.find("#robot"+i);
                if ($robot && $robot.css("z-index")!=zindex) { $robot.css("z-index", zindex); }
            }
        },
        // THE ACTIONS
        actions : {
            f01 : {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    var value = _invert?(settings.robots[_id].pos[2]+2)%4:settings.robots[_id].pos[2];
                    switch(value) {
                        case 0: settings.robots[_id].pos[0]++; break;
                        case 1: settings.robots[_id].pos[1]++; break;
                        case 2: settings.robots[_id].pos[0]--; break;
                        case 3: settings.robots[_id].pos[1]--; break;
                    }
                }
            },
            b01 : {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    var value = _invert?(settings.robots[_id].pos[2]+2)%4:settings.robots[_id].pos[2];
                    switch(value) {
                        case 0: settings.robots[_id].pos[0]--; break;
                        case 1: settings.robots[_id].pos[1]--; break;
                        case 2: settings.robots[_id].pos[0]++; break;
                        case 3: settings.robots[_id].pos[1]++; break;
                    }
                }
            },
            turnright: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    settings.robots[_id].pos[2]=(settings.robots[_id].pos[2]+(_invert?3:1))%4;
                }
            },
            turnleft: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    settings.robots[_id].pos[2]=(settings.robots[_id].pos[2]+(_invert?1:3))%4;
                }
            },
            invert: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    settings.robots[_id].invert=!settings.robots[_id].invert;
                }
            },
            nothing: { execute     : function($this, _id, _invert) { } },
            num: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    var val = helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100;
                    if (val>=10&&val<=19) {
                        helpers.settings($this).tiles.number = val-10;
                        if (!settings.synchro) for (var i=0; i<10; i++) {
                            $this.find(".t6"+(i+50)+" img").attr("src","res/img/tileset/iso/set1/6"+(val-10+50)+".svg");
                        }
                    }
                }
            },
            blue: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[0] = true;
                    if (!settings.synchro) {
                        $this.find(".t051 img").attr("src","res/img/tileset/iso/set1/052.svg");
                        $this.find(".t052 img").attr("src","res/img/tileset/iso/set1/052.svg");
                    }
                }
            },
            red: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[1] = true;
                    if (!settings.synchro) {
                        $this.find(".t151 img").attr("src","res/img/tileset/iso/set1/152.svg");
                        $this.find(".t152 img").attr("src","res/img/tileset/iso/set1/152.svg");
                    }
                }
            },
            green: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[2] = true;
                    if (!settings.synchro) {
                        $this.find(".t251 img").attr("src","res/img/tileset/iso/set1/252.svg");
                        $this.find(".t252 img").attr("src","res/img/tileset/iso/set1/252.svg");
                    }
                }
            },
            purple: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[3] = true;
                    if (!settings.synchro) {
                        $this.find(".t351 img").attr("src","res/img/tileset/iso/set1/352.svg");
                        $this.find(".t352 img").attr("src","res/img/tileset/iso/set1/352.svg");
                    }
                }
            },
            notblue: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[0] = false;
                    if (!settings.synchro) {
                        $this.find(".t051 img").attr("src","res/img/tileset/iso/set1/051.svg");
                        $this.find(".t052 img").attr("src","res/img/tileset/iso/set1/051.svg");
                    }
                }
            },
            notred: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[1] = false;
                    if (!settings.synchro) {
                        $this.find(".t151 img").attr("src","res/img/tileset/iso/set1/151.svg");
                        $this.find(".t152 img").attr("src","res/img/tileset/iso/set1/151.svg");
                    }
                }
            },
            notgreen: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[2] = false;
                    if (!settings.synchro) {
                        $this.find(".t251 img").attr("src","res/img/tileset/iso/set1/251.svg");
                        $this.find(".t252 img").attr("src","res/img/tileset/iso/set1/251.svg");
                    }
                }
            },
            notpurple: {
                execute     : function($this, _id, _invert) {
                    var settings = helpers.settings($this);
                    helpers.settings($this).tiles.light[3] = false;
                    if (!settings.synchro) {
                        $this.find(".t351 img").attr("src","res/img/tileset/iso/set1/351.svg");
                        $this.find(".t352 img").attr("src","res/img/tileset/iso/set1/351.svg");
                    }
                }
            },
            ifblue: {
                test        : function($this, _id) {
                    return (Math.floor(helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)/100)==0);
                }
            },
            ifred: {
                test        : function($this, _id) {
                    return (Math.floor(helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)/100)==1);
                }
            },
            ifgreen: {
                test        : function($this, _id) {
                    return (Math.floor(helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)/100)==2);
                }
            },
            ifpurple: {
                test        : function($this, _id) {
                    return (Math.floor(helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)/100)==3);
                }
            },
            ifblueend: {
                test        : function($this, _id) {
                    return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)==2);
                }
            },
            ifredend: {
                test        : function($this, _id) {
                    return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)==102);
                }
            },
            ifgreenend: {
                test        : function($this, _id) {
                    return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)==202);
                }
            },
            ifpurpleend: {
                test        : function($this, _id) {
                    return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)==302);
                }
            },
            iflblue:        { test: function($this, _id) { return helpers.settings($this).tiles.light[0]; } },
            iflred:         { test: function($this, _id) { return helpers.settings($this).tiles.light[1]; } },
            iflgreen:       { test: function($this, _id) { return helpers.settings($this).tiles.light[2]; } },
            iflpurple:      { test: function($this, _id) { return helpers.settings($this).tiles.light[3]; } },
            ifnotblue:      { test: function($this, _id) { return !helpers.actions.ifblue.test($this,_id); } },
            ifnotred:       { test: function($this, _id) { return !helpers.actions.ifred.test($this,_id); } },
            ifnotgreen:     { test: function($this, _id) { return !helpers.actions.ifgreen.test($this,_id); } },
            ifnotpurple:    { test: function($this, _id) { return !helpers.actions.ifpurple.test($this,_id); } },
            ifnotblueend:   { test: function($this, _id) { return !helpers.actions.ifblueend.test($this,_id); } },
            ifnotredend:    { test: function($this, _id) { return !helpers.actions.ifredend.test($this,_id); } },
            ifnotgreenend:  { test: function($this, _id) { return !helpers.actions.ifgreenend.test($this,_id); } },
            ifnotpurpleend: { test: function($this, _id) { return !helpers.actions.ifpurpleend.test($this,_id); } },
            iflnotblue:     { test: function($this, _id) { return !helpers.actions.iflblue.test($this,_id); } },
            iflnotred:      { test: function($this, _id) { return !helpers.actions.iflred.test($this,_id); } },
            iflnotgreen:    { test: function($this, _id) { return !helpers.actions.iflgreen.test($this,_id); } },
            iflnotpurple:   { test: function($this, _id) { return !helpers.actions.iflpurple.test($this,_id); } },
            ifeq0:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==10);
            }},
            ifeq1:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==11);
            }},
            ifeq2:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==12);
            }},
            ifeq3:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==13);
            }},
            ifeq4:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==14);
            }},
            ifeq5:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==15);
            }},
            ifeq6:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==16);
            }},
            ifeq7:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==17);
            }},
            ifeq8:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==18);
            }},
            ifeq9:       { test: function($this, _id) {
                return (helpers.tiles.get($this, helpers.settings($this).robots[_id].pos)%100==19);
            }},
            ifnoteq0:   { test: function($this, _id) { return !helpers.actions.ifeq0.test($this,_id); } },
            ifnoteq1:   { test: function($this, _id) { return !helpers.actions.ifeq1.test($this,_id); } },
            ifnoteq2:   { test: function($this, _id) { return !helpers.actions.ifeq2.test($this,_id); } },
            ifnoteq3:   { test: function($this, _id) { return !helpers.actions.ifeq3.test($this,_id); } },
            ifnoteq4:   { test: function($this, _id) { return !helpers.actions.ifeq4.test($this,_id); } },
            ifnoteq5:   { test: function($this, _id) { return !helpers.actions.ifeq5.test($this,_id); } },
            ifnoteq6:   { test: function($this, _id) { return !helpers.actions.ifeq6.test($this,_id); } },
            ifnoteq7:   { test: function($this, _id) { return !helpers.actions.ifeq7.test($this,_id); } },
            ifnoteq8:   { test: function($this, _id) { return !helpers.actions.ifeq8.test($this,_id); } },
            ifnoteq9:   { test: function($this, _id) { return !helpers.actions.ifeq9.test($this,_id); } },
            ifinvert:   { test: function($this, _id) { return helpers.settings($this).robots[_id].invert; } },
            ifnotinvert:{ test: function($this, _id) { return !helpers.settings($this).robots[_id].invert; } },
            ifnum0:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==0); } },
            ifnum1:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==1); } },
            ifnum2:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==2); } },
            ifnum3:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==3); } },
            ifnum4:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==4); } },
            ifnum5:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==5); } },
            ifnum6:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==6); } },
            ifnum7:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==7); } },
            ifnum8:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==8); } },
            ifnum9:     { test: function($this, _id) { return (helpers.settings($this).tiles.number==9); } },
            x2:         { loop : function($this, _id, _val) { return _val?_val-1:2; }},
            x3:         { loop : function($this, _id, _val) { return _val?_val-1:3; }},
            x4:         { loop : function($this, _id, _val) { return _val?_val-1:4; }},
            x5:         { loop : function($this, _id, _val) { return _val?_val-1:5; }},
            xnum:       { loop : function($this, _id, _val) { return _val?_val-1:helpers.settings($this).tiles.number; }},
            whileblue:  { loop : function($this, _id, _val) { return (helpers.actions.ifblue.test($this,_id)?99:0); } },
            whilered:   { loop : function($this, _id, _val) { return (helpers.actions.ifred.test($this,_id)?99:0); } },
            whilegreen: { loop : function($this, _id, _val) { return (helpers.actions.ifgreen.test($this,_id)?99:0); } },
            whilepurple:{ loop : function($this, _id, _val) { return (helpers.actions.ifpurple.test($this,_id)?99:0); } },
            whilenotblue:  { loop : function($this, _id, _val) { return (helpers.actions.ifnotblue.test($this,_id)?99:0); } },
            whilenotred:   { loop : function($this, _id, _val) { return (helpers.actions.ifnotred.test($this,_id)?99:0); } },
            whilenotgreen: { loop : function($this, _id, _val) { return (helpers.actions.ifnotgreen.test($this,_id)?99:0); } },
            whilenotpurple:{ loop : function($this, _id, _val) { return (helpers.actions.ifnotpurple.test($this,_id)?99:0); } },
            whilenotblueend:  { loop : function($this, _id, _val) { return (helpers.actions.ifnotblueend.test($this,_id)?99:0); } },
            whilenotredend:   { loop : function($this, _id, _val) { return (helpers.actions.ifnotredend.test($this,_id)?99:0); } },
            whilenotgreenend: { loop : function($this, _id, _val) { return (helpers.actions.ifnotgreenend.test($this,_id)?99:0); } },
            whilenotpurpleend:{ loop : function($this, _id, _val) { return (helpers.actions.ifnotpurpleend.test($this,_id)?99:0); } },
            whilelblue:  { loop : function($this, _id, _val) { return (helpers.actions.iflblue.test($this,_id)?99:0); } },
            whilelred:   { loop : function($this, _id, _val) { return (helpers.actions.iflred.test($this,_id)?99:0); } },
            whilelgreen: { loop : function($this, _id, _val) { return (helpers.actions.iflgreen.test($this,_id)?99:0); } },
            whilelpurple:{ loop : function($this, _id, _val) { return (helpers.actions.iflpurple.test($this,_id)?99:0); } },
            whilelnotblue:  { loop : function($this, _id, _val) { return (helpers.actions.iflnotblue.test($this,_id)?99:0); } },
            whilelnotred:   { loop : function($this, _id, _val) { return (helpers.actions.iflnotred.test($this,_id)?99:0); } },
            whilelnotgreen: { loop : function($this, _id, _val) { return (helpers.actions.iflnotgreen.test($this,_id)?99:0); } },
            whilelnotpurple:{ loop : function($this, _id, _val) { return (helpers.actions.iflnotpurple.test($this,_id)?99:0); } },
            fct1: { },
            fct2: { }
        },
        // HANDLE THE TILES AND THEIR BEHAVIOUR
        tiles : {
            get: function($this, _pos) {
                var settings = helpers.settings($this);
                var ret = 0;
                if (_pos[0]>=0 && _pos[0]<settings.tiles.size[0] && _pos[1]>=0 && _pos[1]<settings.tiles.size[1]) {
                    ret = settings.tiles.data[_pos[0]+_pos[1]*settings.tiles.size[0]];
                }
                return ret;
            },
            execute: function($this, _id) {
                var settings = helpers.settings($this);
                var ret = false;
                var alreadydone = ((settings.robots[_id].pos[0]==settings.robots[_id].sav[0]) &&
                                   (settings.robots[_id].pos[1]==settings.robots[_id].sav[1]));
                var tile = parseInt(helpers.tiles.get($this, settings.robots[_id].pos));
                if (!alreadydone && tile) {
                    settings.robots[_id].sav[0]=settings.robots[_id].pos[0];
                    settings.robots[_id].sav[1]=settings.robots[_id].pos[1];
                    if (helpers.tiles["f"+(tile%100)]) {
                        ret = helpers.tiles["f"+(tile%100)]($this, settings.robots[_id], tile);
                    }
                }
                return ret;
            },
            quit: function($this, _id) {
                var settings = helpers.settings($this);
                var tile = parseInt(helpers.tiles.get($this, settings.robots[_id].sav));
                if (tile) {
                    if (helpers.tiles["q"+(tile%100)]) {
                        ret = helpers.tiles["q"+(tile%100)]($this, settings.robots[_id], tile);
                    }
                }
            },
            f3: function($this, _robots, _tile) { _robots.pos[2]=(_robots.pos[2]+3)%4; return true; },
            f4: function($this, _robots, _tile) { _robots.pos[2]=(_robots.pos[2]+1)%4; return true; },
            f5: function($this, _robots, _tile) { _robots.pos[1]--; return true; },
            f6: function($this, _robots, _tile) { _robots.pos[0]++; return true; },
            f7: function($this, _robots, _tile) { _robots.pos[1]++; return true; },
            f8: function($this, _robots, _tile) { _robots.pos[0]--; return true; },
            f20:function($this, _robots, _tile) {
                var c = Math.floor(_tile/100);
                var ret = helpers.settings($this).tiles.tile9[c];
                if (!helpers.settings($this).synchro && !ret) {
                    $this.find(".t"+c+"09 img").attr("src","res/img/tileset/iso/set1/"+c+"01.svg");
                    $this.find(".t"+c+"20 img").attr("src","res/img/tileset/iso/set1/"+c+"21.svg");
                }
                helpers.settings($this).tiles.tile9[c]=true;
                return false;
            },
            f23:function($this, _robots, _tile) { return helpers.tiles.f20($this, _robots, _tile); },
            f22:function($this, _robots, _tile) { _robots.invert = !_robots.invert; return true; },
            q23:function($this, _robots, _tile) { 
                var c = Math.floor(_tile/100);
                if (!helpers.settings($this).synchro) {
                    $this.find(".t"+c+"09 img").attr("src","res/img/tileset/iso/set1/"+c+"09.svg");
                }
                helpers.settings($this).tiles.tile9[c]=false;
            }
        },
        restore: function($this) {
            var settings = helpers.settings($this);
            helpers.execute.init($this);
            for (var i in settings.robots) helpers.update($this, i, settings.robots[i].pos, false);
            for (var c=0; c<4; c++) {
                $this.find(".t"+c+"09 img").attr("src","res/img/tileset/iso/set1/"+c+"09.svg");
                $this.find(".t"+c+"20 img").attr("src","res/img/tileset/iso/set1/"+c+"20.svg");
            }
            for (var c=50; c<60; c++) {
                $this.find(".t6"+c+" img").attr("src","res/img/tileset/iso/set1/6"+c+".svg");
            }
            $this.find(".t051 img").attr("src","res/img/tileset/iso/set1/051.svg");
            $this.find(".t151 img").attr("src","res/img/tileset/iso/set1/151.svg");
            $this.find(".t251 img").attr("src","res/img/tileset/iso/set1/251.svg");
            $this.find(".t351 img").attr("src","res/img/tileset/iso/set1/351.svg");
            $this.find("#cache").hide();
            $this.find(".target").hide();
            $this.find("#play img").attr("src","res/img/control/play.svg");
            settings.wrong++;
        },
        success: function($this, _count) {
            var settings = helpers.settings($this);
            var ret = (_count<settings.max);
            for (var i in settings.robots)
                if (parseInt(helpers.tiles.get($this, settings.robots[i].pos))!=i*100+2) { ret = false; }
            return ret;
        },
        endanimation: function($this, _count) {
            var settings = helpers.settings($this);
            $this.find(".target").hide();
            if (!settings.stop && helpers.success($this, _count)) {
                settings.score = 5-settings.wrong;
                if (settings.score<0) { settings.score = 0; }
                helpers.end($this);
            }
            else {
                helpers.restore($this);
            }
        },
        endtest: function($this, _count) {
            var settings = helpers.settings($this);

            // TAKE CARE: WE TEST THE WORST BUT THE AVERAGE IS SHOWN IF THE WORST IS GOOD
            if (helpers.success($this, _count)) {
                if (++settings.testid<settings.worst.length) {
                    // CAN ANOTHER WORST SCENARIO BE TESTED
                    helpers.execute.launch($this, settings.worst[settings.testid], helpers.endtest, true);
                }
                else {
                    // ALL WORST SCENARIO ARE GOOD SO SHOW THE AVERAGE ONE
                    if (!settings.average) {
                        settings.average = [];
                        for (var i=0; i<settings.robots.length; i++) { settings.average.push(i); }
                    }
                    helpers.execute.launch($this, settings.average, helpers.endanimation, false);
                }
            }
            else { helpers.execute.launch($this, settings.worst[settings.testid], helpers.endanimation, false); }
        },
        // HANDLE THE EXECUTION OF THE PROGRAM
        execute: {
            // LAUNCH THE CURRENT PROGRAM
            launch: function($this, _robotsorder, _fct, _synchro) {
                helpers.settings($this).synchro = _synchro;
                helpers.execute.init($this);
                helpers.execute.run($this, _robotsorder, 0, _fct);
            },
            run: function($this, _robotsorder, _count, _fct) {
                var settings = helpers.settings($this);
                helpers.zindex($this);
                $this.find("#effects>div").hide();
                // ARE THE ROBOTS STILL IN GAME
                helpers.execute.active($this);

                // EXECUTE THE NEXT ORDER
                var stillarobot;
                var perform = false;
                do {
                    var robotid = _robotsorder[_count%_robotsorder.length];
                    if (settings.robots[robotid].active) {
                        perform = helpers.execute.next($this, robotid);
                        if (!perform) { settings.robots[robotid].active = false; }
                    }
                    stillarobot = false;
                    for (var i in settings.robots) { stillarobot = stillarobot | settings.robots[i].active; }
                    _count++;
                } while (_count<settings.max && stillarobot && !perform);


                if (settings.lastcount>=0) {
                    var lastrobotid = _robotsorder[settings.lastcount%_robotsorder.length];
                    if (settings.robots[robotid].sav[0]!=settings.robots[robotid].pos[0] ||
                        settings.robots[robotid].sav[1]!=settings.robots[robotid].pos[1])
                        { helpers.tiles.quit($this, lastrobotid); }
                }
                settings.lastcount = _count;

                if (stillarobot && _count<settings.max && !settings.stop) {
                    if (settings.synchro) {
                        helpers.execute.tiles($this, _robotsorder,_count,_fct);
                    }
                    else {
                        // TODO
                        var rid = _robotsorder[(_count-1)%_robotsorder.length];
                        var $t = $this.find("#target"+(rid+1));
                        if ($this.find("#t"+(rid+1)).is(":visible")) {
                            var o = Math.floor(($this.find("#target"+(rid+1)).width() - settings.lastelt.height())/2);
                            $t.css("top",(settings.lastelt.position().top-o)+"px")
                              .css("left",(settings.lastelt.position().left-o)+"px").show();
                        }
                        else { $t.hide(); }


                        $this.find("#robotfx").show();
                        setTimeout( function() {
                                helpers.execute.tiles($this, _robotsorder,_count,_fct);
                            },
                            helpers.delay($this)); }
                }
                else { setTimeout( function(){_fct($this, _count);},
                                   (settings.synchro)?0:Math.floor(2*helpers.delay($this)));  }
            },
            // INITIALISATION OF THE PROGRAM
            init: function($this) {
                var settings = helpers.settings($this);
                // INITIALIZE THE ROBOTS
                for (var i in settings.robots) {
                    settings.robots[i].pos=[settings.robots[i].origin[0], settings.robots[i].origin[1], settings.robots[i].origin[2]];
                    settings.robots[i].fct      =0;             // 0 for main, 1 f0, 2 f1
                    settings.robots[i].cp       =[0,0,0];       // main id, f0 id, f1 id
                    settings.robots[i].bt       =[];            // Stack of loops and f0/f1 calls
                    settings.robots[i].active   = true;         // not in a hole and with actions
                    settings.robots[i].sav      =[settings.robots[i].origin[0], settings.robots[i].origin[1]]; // last position
                    settings.robots[i].invert   =false;         // invert the commands
                }
                // INITIALIZE THE TILES
                settings.tiles.tile9=[false,false,false,false];
                settings.tiles.light=[false,false,false,false];
                settings.tiles.number=settings.numberinit;
                settings.lastcount = -1;
                settings.lastelt = 0;
            },
            // NEXT OPERATION
            next: function($this, id) {
                var settings = helpers.settings($this);
                var isaction    = false;
                var execute     = false;
                var testval     = true;
                if (settings.robots[id].active) {
                    do {
                        var action = helpers.get($this, id, settings.robots[id].fct, settings.robots[id].cp[settings.robots[id].fct]);
                        if (action) {
                            isaction=true;

                            // AN EXECUTE ACTION
                            if (helpers.actions[action].execute) {
                                if (testval) {
                                    var sav = [settings.robots[id].pos[0], settings.robots[id].pos[1]];
                                    helpers.actions[action].execute($this, id, settings.robots[id].invert);

                                    var tiletmp = parseInt(helpers.tiles.get($this, settings.robots[id].pos));
                                    var meetsomething = (tiletmp%100>=50);
                                    for (var i in settings.robots) {
                                        meetsomething|=( i!=id && settings.robots[i].active &&
                                                         settings.robots[id].pos[0] == settings.robots[i].pos[0] &&
                                                         settings.robots[id].pos[1] == settings.robots[i].pos[1] );
                                    }
                                    if (meetsomething) {
                                        // ROBOT MEETS A WALL OR ANOTHER ROBOT
                                        settings.robots[id].pos[0] = sav[0];
                                        settings.robots[id].pos[1] = sav[1];
                                        // A GRAPHICAL WARNING
                                        $this.find("#warnfx").show();
                                    }
                                    else {
                                        helpers.update($this, id, settings.robots[id].pos, true);
                                    }
                                    execute = true;
                                }
                                testval = true;
                            } else
                            // A TEST ACTION
                            if (helpers.actions[action].test && testval) {
                                testval = helpers.actions[action].test($this, id);
                            } else
                            // A LOOP
                            if (helpers.actions[action].loop && testval) {
                                var running = settings.robots[id].bt.length &&
                                            (settings.robots[id].fct== settings.robots[id].bt[settings.robots[id].bt.length-1].fct) &&
                                            (settings.robots[id].cp[settings.robots[id].fct] ==
                                                settings.robots[id].bt[settings.robots[id].bt.length-1].cp) ;
                                if (!running) {
                                    // NEW LOOP: UPDATE THE BACKTRACE
                                    var loop = { fct:settings.robots[id].fct, cp:settings.robots[id].cp[settings.robots[id].fct],
                                                count:helpers.actions[action].loop($this, id) };
                                    settings.robots[id].bt.push(loop);
                                }
                                else {
                                    // RUNNING LOOP: UPDATE THE COUNTER
                                    settings.robots[id].bt[settings.robots[id].bt.length-1].count =
                                        helpers.actions[action].loop($this, id,
                                                                    settings.robots[id].bt[settings.robots[id].bt.length-1].count);
                                }

                                // END OF THE LOOP?
                                if (settings.robots[id].bt[settings.robots[id].bt.length-1].count<=1) {
                                    if (settings.robots[id].bt[settings.robots[id].bt.length-1].count<=0) { testval=false; }
                                    settings.robots[id].bt.pop();
                                }
                            }

                            // UPDATE CP
                            if (action=="fct1" || action=="fct2") {
                                if (testval) {
                                    var loop = { from: settings.robots[id].fct, cp:settings.robots[id].cp[settings.robots[id].fct],
                                                to: (action=="fct1")?1:2 };
                                    settings.robots[id].bt.push(loop);
                                    settings.robots[id].fct=loop.to;
                                    settings.robots[id].cp[settings.robots[id].fct]=0;

                                    // INFINITE LOOP
                                    if (settings.robots[id].bt.length>settings.maxbt) {
                                        settings.robots[id].active = false;
                                    }
                                } else {
                                    settings.robots[id].cp[settings.robots[id].fct]++;
                                    testval=true;
                                }
                            }
                            else {
                                settings.robots[id].cp[settings.robots[id].fct]++;
                            }
                        }
                        else { isaction = false; }

                        // END OF A FUNCTION
                        if (!isaction && settings.robots[id].bt.length && settings.robots[id].bt[settings.robots[id].bt.length-1].to) {
                            if (settings.robots[id].bt[settings.robots[id].bt.length-1].to == settings.robots[id].fct) {

                                isaction = true;

                                settings.robots[id].fct = settings.robots[id].bt[settings.robots[id].bt.length-1].from;
                                settings.robots[id].cp[settings.robots[id].fct] =
                                    settings.robots[id].bt[settings.robots[id].bt.length-1].cp+1;
                                settings.robots[id].bt.pop();

                                // SPECIAL TRICKY CASE: FUNCTION LOOP
                                if (settings.robots[id].bt.length && settings.robots[id].bt[settings.robots[id].bt.length-1].count) {
                                    settings.robots[id].fct = settings.robots[id].bt[settings.robots[id].bt.length-1].fct;
                                    settings.robots[id].cp[settings.robots[id].fct] =
                                        settings.robots[id].bt[settings.robots[id].bt.length-1].cp;
                                }

                            }
                            else { alert("ERROR backtrace"); }
                        }

                    } while(!execute && isaction && settings.robots[id].active);

                    // HANDLE THE CP REGARDING THE STACK OF LOOPS
                    if (settings.robots[id].bt.length && settings.robots[id].bt[settings.robots[id].bt.length-1].count) {
                        settings.robots[id].fct = settings.robots[id].bt[settings.robots[id].bt.length-1].fct;
                        settings.robots[id].cp[settings.robots[id].fct] = settings.robots[id].bt[settings.robots[id].bt.length-1].cp;
                        isaction = true;
                    }
                }

                return isaction;
            },
            active: function($this) {
                var settings = helpers.settings($this);
                for (var i in settings.robots) if (settings.robots[i].active) {

                    var active = helpers.tiles.get($this,settings.robots[i].pos);

                    if (active) {
                        if (active%100 == 9) { active = settings.tiles.tile9[Math.floor(active/100)]; }
                    }

                    // ROBOT IS ABOVE A HOLE... LIKE COYOT, IT WILL FALL
                    if (!active) {
                        settings.robots[i].active = false;
                        helpers.update($this, i, 0, true);
                    }

                }
            },
            // EXECUTE THE TILES
            tiles: function($this, _robotsorder, _count, _fct) {
                helpers.zindex($this);
                $this.find("#effects>div").hide();
                var settings = helpers.settings($this);
                var toupdate = helpers.execute.active($this);

                for (var i in settings.robots) if (helpers.tiles.execute($this, i)) {
                    toupdate = true;
                    helpers.update($this, i, settings.robots[i].pos, true);
                }

                if (!toupdate) {
                    if (!settings.pause.state) {
                        helpers.execute.run($this, _robotsorder, _count, _fct);
                    } else {
                        settings.pause.order = _robotsorder;
                        settings.pause.count = _count;
                        settings.pause.fct = _fct;
                } }
                else {
                    if (!settings.synchro) {
                        $this.find("#tilefx").show();
                        setTimeout(function() { helpers.execute.tiles($this, _robotsorder,_count,_fct); },helpers.delay($this));
                    }
                    else { helpers.execute.tiles($this, _robotsorder, _count, _fct); }
                }
            }
        }
    };

    // The plugin
    $.fn.robot = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    tiles           : {
                        size        : [0,0],
                        data        : [],
                        tile9       : [],
                        light       : [],
                        number      : 0
                    },
                    wrong           : 0,
                    speed           : 1,
                    synchro         : false,
                    pause           : {
                        state       : false,
                        order       : [],
                        count       : 0,
                        fct         : 0
                    },
                    stop            : false,
                    sourceid        : [0,0,0,0],
                    sourcemax       : [0,0,0,0],
                    testid          : 0,
                    numberinit      : 0,
                    lastcount       : -1,
                    lastelt         : 0,
                    scale           : 1
                };

                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");

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
                $this.find("#splash").hide();
                settings.interactive = true;
            },
            speed: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.speed=(settings.speed+1)%3;
                    $this.find("#speed img").attr("src","res/img/control/x"+(1+settings.speed)+".svg");
                }
            },
            play: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    if (!$this.find("#cache").is(":visible")) {
                        settings.stop = false;
                        $this.find("#cache").show();
                        $this.find("#play img").attr("src","res/img/control/pause.svg");
                        settings.pause.state = false;

                        // TEST THE WORST SCENARIO
                        if (!settings.worst || !settings.worst.length) {settings.worst = helpers.worst($this); }
                        settings.testid = 0;
                        helpers.execute.launch($this, settings.worst[settings.testid], helpers.endtest, true);
                    }
                    else {
                        if (!settings.synchro) {
                            settings.pause.state = !settings.pause.state;
                            if (settings.pause.state) {
                                $this.find("#play img").attr("src","res/img/control/play.svg");
                            }
                            else {
                                $this.find("#play img").attr("src","res/img/control/pause.svg");
                                helpers.execute.run($this, settings.pause.order, settings.pause.count, settings.pause.fct);
                            }
                        }
                    }
                }
            },
            down: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    if (settings.sourceid[_id]<settings.sourcemax[_id]) { settings.sourceid[_id]++; }
                    helpers.updatesource($this);
                }
            },
            up: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    if (settings.sourceid[_id]>0) { settings.sourceid[_id]--; }
                    helpers.updatesource($this);
                }
            },
            stop: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.stop = true;
                if (settings.pause.state) { helpers.restore($this); }
            },
            valid: function() {
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in robot plugin!'); }
    };
})(jQuery);

