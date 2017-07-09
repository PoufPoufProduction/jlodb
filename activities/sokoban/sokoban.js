(function($) {
    // Activity default options
    var defaults = {
        name        : "sokoban",                                // The activity name
        label       : "Sokoban",                                // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        padding     : 3,                                        // Padding top
        margin      : 0.5,                                      // Margin
        delay       : 150,                                      // Time between two cases
        debug       : true                                      // Debug mode
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
                if (settings.context.onload) { settings.context.onload($this); }
                // Convert from xsb
                if (!settings.board && settings.xsb) { helpers.xsb($this); }

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

                // Build the board
                settings.tiles.size=[settings.board[0].length,settings.board.length];

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
                helpers.build($this);
            }
        },
        tiles : {
            get: function($this, _pos) {
                var settings = helpers.settings($this);
                var ret = 0;
                if (_pos[0]>=0 && _pos[0]<settings.tiles.size[0] && _pos[1]>=0 && _pos[1]<settings.tiles.size[1]) {
                    ret = settings.tiles.data[_pos[0]+_pos[1]*settings.tiles.size[0]];
                }
                return ret;
            },
            execute: function($this, _elt) {
                var settings = helpers.settings($this);
                var tile = this.get($this, _elt.pos);
                if (this["t"+(tile%100)]) {
                    var action = this["t"+(tile%100)]($this, _elt, Math.floor(tile/100));
                    if (action) {
                        if (_elt.isrobot)   { helpers.updrobot($this, _elt.id, false); }
                        else                { helpers.updbox($this, _elt.id, false); }
                    }
                }
            },
            isfalling: function($this, _elt) {
                var settings = helpers.settings($this);
                var tile = this.get($this, _elt.pos);
                var ret = false;
                if (!tile || (tile%100==9 && !settings.tiles.tile9[Math.floor(tile/100)])) {
                    this.t0($this, _elt,0);
                    if (_elt.isrobot)   { helpers.updrobot($this, _elt.id, false); }
                    else                { helpers.updbox($this, _elt.id, false); }
                    ret = true;
                }
                return ret;
            },
            t0 : function($this, _elt, _color) {
                _elt.active = false;
                _elt.speed = 0;
                return true;
            },
            t1 : function($this, _elt, _color) {
                var ret = (!_elt.isrobot && _elt.isclosed);
                if (ret) { _elt.isclosed = false; }
                return ret;
            },
            t2 : function($this, _elt, _color) {
                var ret = false;
                if (!_elt.isrobot && !_elt.isopened) {
                    if (_elt.color==-1 || _elt.color==_color) {
                        ret = (!_elt.isclosed);
                        if  (ret) { _elt.isclosed = true; }
                    }
                    else { ret = this.t1($this, _elt, _color); }
                }
                return ret;
            },
            t9 : function($this, _elt, _color) {
                var settings = helpers.settings($this);
                var ret = !settings.tiles.tile9[_color];
                if (ret) { this.t0($this, _elt, _color); }
                return ret;
            },
            t24: function($this, _elt, _color) {
                var ret = false;
                if (!_elt.isrobot)
                {
                    ret = _elt.isopened;
                    ret&= (_elt.color==-1 || _elt.color==_color);
                    if  (ret) { _elt.isopened = false; }
                }
                return ret;
            }
        },
        // Build board from xsb format
        xsb: function($this) {
            var settings = helpers.settings($this);
            // get size;
            var max = 0;
            for (var i=1; i<settings.xsb.length-1; i++) { if (settings.xsb[i].length>max) { max = settings.xsb[i].length; } }

            // Build board
            settings.board=[];
            settings.boxes=[];
            var r = [];
            var inside = [];
            for (var i=1; i<settings.xsb.length-1; i++) {
                var row = [];
                for (var j=1; j<settings.xsb[i].length-1; j++) {
                    var tile = 0;
                    switch (settings.xsb[i][j]) {
                        case '#': tile = 101; break;
                        case '$': case 'o': tile = 1; settings.boxes.push({value:0,origin:[j-1,i-1]}); break;
                        case '@': tile = 1; r=[i-1,j-1]; break;
                        case '.': tile = 2; break;
                        case '*': tile = 2; settings.boxes.push({value:0,origin:[j-1,i-1]}); break;
                        case '+': tile = 2; r=[i-1,j-1]; break;
                        default: break;
                    }
                    if ((tile==1)||(tile==2)) { inside.push([i-1,j-1]); }
                    row.push(tile);
                }
                for (var j=settings.xsb[i].length; j<max; j++) { row.push(0); }
                settings.board.push(row);
            }
            
            // Fill the inside
            while (inside.length) {
                var elt = inside.pop();
                var pos = [ [elt[0]-1, elt[1]], [elt[0]+1, elt[1]], [elt[0], elt[1]-1], [elt[0], elt[1]+1] ] ;
                for (var i=0; i<4; i++) {
                    if (pos[i][0]>=0 && pos[i][0]<settings.board.length && pos[i][1]>=0 && pos[i][1]<max-2 &&
                        settings.board[pos[i][0]][pos[i][1]] == 0) {

                        settings.board[pos[i][0]][pos[i][1]] = 1;
                        inside.push([pos[i][0], pos[i][1]]);
                    }
                }
            }
            for (var i in settings.board) for (var j in settings.board[i]) {
                if (settings.board[i][j]==101) { settings.board[i][j]=0; }
            }

            // Add the robots
            settings.robots=[{origin:[r[1],r[0],0]}];;
        },
        togglerobot: function($this, _id) {
            var settings = helpers.settings($this);
            settings.robotid = _id%settings.robots.length;
            $this.find("#keypad").attr("class","r"+settings.robotid);
        },
        // UPDATE ROBOT POSITION
        updrobot : function($this, _id, _anim) {
            var settings = helpers.settings($this);
            var $robot      = $this.find("#robot"+_id);
            var pos = settings.robots[_id].active?settings.robots[_id].pos:0;

            if (pos) {
                var zindex      = 10+parseInt(pos[0])+parseInt(pos[1]);

                $this.find("#robot"+_id+" #img img").attr("src","res/img/tileset/iso/robot/robot"+_id+(pos[2]+1)+".svg");
                if (!_anim || zindex>$robot.css("z-index")) { $robot.css("z-index", zindex); }

                if (_anim) {
                    $robot.animate({
                        "left":(settings.offset[0]+((pos[0]*2)+(settings.tiles.size[1]-pos[1]-1)*2))+"em",
                        "top":(settings.offset[1]+(1.0*pos[0]+1.0*pos[1]))+"em",}, settings.delay,function(){
                            helpers.zindex(settings.robots[parseInt($(this).attr("id").substr(5))], $(this)); });
                }
                else {
                    $robot.css("left", (settings.offset[0]+((pos[0]*2)+(settings.tiles.size[1]-pos[1]-1)*2))+"em")
                          .css("top",  (settings.offset[1]+(1.0*pos[0]+1.0*pos[1]))+"em")
                          .css("zindex", zindex);
                }
            }
            else {
                $robot.animate({"top":Math.floor(20/settings.scale)+"em"},4*settings.delay,function(){});
            }

            $this.find("#robot"+_id+" #invert").toggle(settings.robots[_id].isinverted);
        },
        // UPDATE BOX POSITION
        updbox : function($this, _id, _anim) {
            var settings = helpers.settings($this);
            var $box      = $this.find("#b"+_id);
            var pos      = settings.boxes[_id].active?settings.boxes[_id].pos:0;

            if (pos) {
                var zindex      = 10+parseInt(pos[0])+parseInt(pos[1]);

                if (!_anim || zindex>$box.css("z-index")) { $box.css("z-index", zindex); }

                var value = settings.boxes[_id].value*10;
                if (settings.boxes[_id].isopened) { value += 1; } else
                if (settings.boxes[_id].isclosed) { value += 3; } else
                                                  { value += 2; }
                $this.find("#b"+_id+" img").attr("src", "res/img/tileset/iso/object/box"+
                        (value<10?"00":(value<100?"0":""))+value+".svg");

                if (_anim) {
                    $box.animate({
                        "left":(settings.offset[0]+((pos[0]*2)+(settings.tiles.size[1]-pos[1]-1)*2))+"em",
                        "top":(settings.offset[1]+(1.0*pos[0]+1.0*pos[1]-3.2))+"em", }, settings.delay*0.9,function(){
                             helpers.zindex(settings.boxes[parseInt($(this).attr("id").substr(1))], $(this)); });
                }
                else {
                    $box.css("left", (settings.offset[0]+((pos[0]*2)+(settings.tiles.size[1]-pos[1]-1)*2))+"em")
                        .css("top",  (settings.offset[1]+(1.0*pos[0]+1.0*pos[1]-3.2))+"em")
                        .css("zindex", zindex);
                }
            }
            else {
                $box.animate({"top":Math.floor(20/settings.scale)+"em"},4*settings.delay,function(){});
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);

            $this.find("#tiles").html("");

            for (var j=0; j<settings.board.length; j++) for (var i=0; i<settings.board[j].length; i++) if (settings.board[j][i]) {
                // TURN OFF THE LIGHT
                if (settings.board[j][i]<500 && (settings.board[j][i]%100) == 52) { settings.board[j][i]=51; }

                // STORE THE NUMBER IF ANY
                if (settings.board[j][i]>=650 && settings.board[j][i]<660) { settings.numberinit = settings.board[j][i]-650; }

                // TILES
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
                        ret+="class='tile t"+(this.value<10?"00":(this.value<100?"0":""))+this.value+" s"+
                             (this.value%100>=50?"1":"0")+"'";
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
                var html="<div class='engine' id='robot"+i+"'><div id='img'><img src=''/></div><div id='invert'>"+
                         "<img src='res/img/tileset/iso/robot/statinvert.svg'/></div></div>";
                $this.find("#tiles").append(html);
                settings.robots[i].pos = [ settings.robots[i].origin[0], settings.robots[i].origin[1], settings.robots[i].origin[2]];
                settings.robots[i].update       = helpers.updrobot;
                settings.robots[i].isrobot      = true;
                settings.robots[i].active       = true;
                settings.robots[i].isinverted   = (typeof(settings.robots[i].invert)=="undefined")?false:settings.robots[i].invert;
                settings.robots[i].id           = i;
                settings.robots[i].speed        = -1;
                settings.robots[i].weight       = 9;
                settings.robots[i].rolling      = false;
                settings.robots[i].count        = 0;
                settings.robots[i].active       = true;
                settings.robots[i].update($this, i);
            }
            helpers.togglerobot($this, 0);

            // Initialize the boxes
            for (var i in settings.boxes) {
                settings.boxes[i].pos = [settings.boxes[i].origin[0], settings.boxes[i].origin[1]];
                settings.boxes[i].state  = settings.boxes[i].value;
                var html="<div class='box' id='b"+i+"'>";
                html+="<img src=''/></div>";
                $this.find("#tiles").append(html);
                settings.boxes[i].isrobot   = false;
                settings.boxes[i].id        = i;
                settings.boxes[i].speed     = -1;
                settings.boxes[i].weight    = 2*(settings.boxes[i].value==3||settings.boxes[i].value==13?2:1);
                settings.boxes[i].rolling   = (settings.boxes[i].value>=10);
                settings.boxes[i].update    = helpers.updbox;
                settings.boxes[i].count     = 0;
                settings.boxes[i].active    = true;
                settings.boxes[i].isopened  = (typeof(settings.boxes[i].opened)=="undefined")?false:settings.boxes[i].opened;
                settings.boxes[i].isclosed  = (!settings.boxes[i].isopened && helpers.tiles.get($this, settings.boxes[i].origin)%100==2);
                settings.boxes[i].color     = (settings.boxes[i].value>=4 && settings.boxes[i].value<=7)?
                                                settings.boxes[i].value-4:-1;
                settings.boxes[i].update($this, i);
            }

            // INITIALIZE THE TILES
            settings.tiles.tile9=[false,false,false,false];

        },
        // UPDATE THE ZINDEX OF EVERY ROBOTS
        zindex: function(_elt, _dom) {
            var zindex = 10+parseInt(_elt.pos[0])+parseInt(_elt.pos[1]);
            if ($(_dom).css("z-index")!=zindex) { $(_dom).css("z-index", zindex); }
        },
        // FIND ALL THE MOVING OBJECTS AND RUN
        prepare: function($this) {
            var settings    = helpers.settings($this);
            var nbmove = 0;
            settings.interactive = false;

            for (var i in settings.robots) {
                if (settings.robots[i].active) {
                    if (helpers.tiles.isfalling($this, settings.robots[i])) { nbmove += 1; }
                    else if (settings.robots[i].speed>=0)                   { nbmove += helpers.run($this, settings.robots[i], 0); }
                }
            }
            for (var i in settings.boxes) {
                if (settings.boxes[i].active) {
                    if (settings.boxes[i].count<settings.count) {
                        helpers.tiles.execute($this, settings.boxes[i]);
                        if (settings.boxes[i].speed>=0) { nbmove += helpers.run($this, settings.boxes[i], 0); }
                    }
                    else { if (helpers.tiles.isfalling($this, settings.boxes[i])) { nbmove += 1; } }
                }
            }

            // END OF TURN, DID ANYTHING MOVE THIS TIME?
            if (nbmove) { setTimeout(function() { helpers.endturn($this); }, settings.delay); }
            else        {

                // TOGGLE TILES
                var withdelay = false;
                for (var j=0; j<4; j++) {
                    var on23 = false;
                    for (var i in settings.robots) { if (helpers.tiles.get($this, settings.robots[i].pos)==23+j*100) { on23 = true; } }
                    for (var i in settings.boxes) { if (helpers.tiles.get($this, settings.boxes[i].pos)==23+j*100) { on23 = true; } }
                    if (settings.tiles.tile9[j]!=on23) {
                        settings.tiles.tile9[j]=on23;
                        if (on23) {
                            $("#tiles .t"+j+"09 img").attr("src","res/img/tileset/iso/set1/"+j+"01.svg");
                        }
                        else {
                            $("#tiles .t"+j+"09 img").attr("src","res/img/tileset/iso/set1/"+j+"09.svg");
                            // IS A ROBOT OR A BOX ON A DISAPPEARING TILES?
                            // IF YES, ADD DELAY FOR THE FALLING ANIMATION
                            for (var i in settings.robots) {
                                if (helpers.tiles.get($this, settings.robots[i].pos)==9+j*100) {
                                    settings.robots[i].active = false;
                                    helpers.updrobot($this, i, true);
                                    withdelay = true;
                                }
                            }
                            for (var i in settings.boxes) {
                                if (helpers.tiles.get($this, settings.boxes[i].pos)==9+j*100) {
                                    settings.boxes[i].active = false;
                                    helpers.updbox($this, i, true);
                                    withdelay = true;
                                }
                            }
                        }
                    }
                }

                // IS IT THE END?
                var isend = true;
                for (var i in settings.boxes) {
                    isend&=(settings.boxes[i].active&settings.boxes[i].isclosed); }
                if (isend)  {
                    settings.score = 5-settings.nbgames;
                    if (settings.mp) {
                        // PUSHES COUNT TWICE
                        settings.score-= Math.floor((settings.nbmoves-settings.mp[0])/settings.mp[0] +
                                                    2*(settings.nbpushes-settings.mp[1])/settings.mp[1]);
                    }
                    if (settings.score>5) { settings.score = 5; }
                    if (settings.score<0) { settings.score = 0; }
                    setTimeout(function() { helpers.end($this); }, 6*settings.delay);
                }
                else {
                    // WAIT FOR USER INPUT
                    if (withdelay)  { setTimeout(function() { settings.interactive = true; }, settings.delay); }
                    else            { settings.interactive = true; }
                }
            }
            return nbmove;
        },
        // END OF TURN
        endturn: function($this) {
            var settings    = helpers.settings($this);
            settings.count++;
            helpers.prepare($this);
        },
        // SOLVE THE MOVE
        run: function($this, _elt, _level) {
            var settings    = helpers.settings($this);
            var nbmove      = 1;
            var isstopped   = false;

            // COMPUTE THE MOVE
            var pos = [_elt.pos[0], _elt.pos[1]];
            switch(_elt.speed) { case 0:pos[0]++;break; case 1:pos[1]++;break; case 2:pos[0]--;break; case 3:pos[1]--;break; }

            // CHECK THE WALL
            var tile = helpers.tiles.get($this, pos);
            if (tile%100>50 || tile==0 || (tile%100==9 && !settings.tiles.tile9[Math.floor(tile/100)])) {
                nbmove = 0;
                if ((!_elt.isrobot) && (_elt.value==12) && _level==0 && helpers.tiles.get($this, pos)!=482) {
                    _elt.isopened = true;
                    _elt.isclosed = false;
                    _elt.update($this, _elt.id, nbmove);
                }
            }

            // CHECK THE OTHER OBJECTS (BOXES AND ROBOTS)
            if (nbmove) {
                for (var i in settings.robots) {
                    if (settings.robots[i].active && settings.robots[i].pos[0] == pos[0] && settings.robots[i].pos[1] == pos[1] ) {
                        nbmove = 0;

                        // IF A FRAGILE ROLLING BOX MET A ROBOT, IT OPENS
                        if ((!_elt.isrobot) && (_elt.value==12) && _level==0) {
                            _elt.isopened = true;
                            _elt.isclosed = false;
                            _elt.update($this, _elt.id, nbmove);
                        }
                    }
                }
                for (var i in settings.boxes) {
                    if (settings.boxes[i].active && settings.boxes[i].pos[0] == pos[0] && settings.boxes[i].pos[1] == pos[1] ) {

                        // IF A BOX TRY TO PUSH A FRAGILE ONE, IT OPENS
                        if (!_elt.isrobot && settings.boxes[i].value%10==2 ) {
                            settings.boxes[i].isopened = true; settings.boxes[i].isclosed = false;
                            settings.boxes[i].update($this, settings.boxes[i].id, false);}

                        if ( (_elt.isrobot) ||
                             (!_elt.isrobot && settings.boxes[i].weight<_elt.weight)) {


                            settings.boxes[i].speed = _elt.speed;
                            nbmove = helpers.run($this, settings.boxes[i], _level+1);

                            // THE ROLLING BOX FORWARD ITS ENERGY
                            if (!_elt.isrobot && _elt.rolling) { isstopped = true; _elt.speed = -1; }
                        }
                        else {
                            nbmove = 0;

                            // IF A FRAGILE ROLLING BOX MET A ROBOT, IT OPENS
                            if ((!_elt.isrobot) && (_elt.value==12) && _level==0) {
                                _elt.isopened = true;
                                _elt.isclosed = false;
                                _elt.update($this, _elt.id, nbmove);
                            }
                        }
                    }
                }
            }

            // UPDATE THE ROLLING OBJECT
            if (!_elt.rolling || (nbmove==0)) { _elt.speed = -1; }

            if (nbmove) {
                if (!isstopped) {
                    _elt.pos[0] = pos[0]; _elt.pos[1] = pos[1];
                    _elt.count = settings.count;
                    _elt.update($this, _elt.id, nbmove);
                }

                if (_level>0 && !settings.countpush) {
                    settings.countpush=true;
                    $this.find("#nbpushes .value").html(++settings.nbpushes);
                }
            }
            return nbmove;
        },
        // KEY HANDLER
        key: function($this, _value) {
            var settings = helpers.settings($this);
            if (settings.interactive) {
                if (_value==37 || _value=="left") {
                    var v = settings.robots[settings.robotid].isinverted?1:3;
                    settings.robots[settings.robotid].pos[2] = (settings.robots[settings.robotid].pos[2]+v)%4;
                    helpers.updrobot($this, settings.robotid);
                }
                else if (_value==39 || _value=="right"){
                    var v = settings.robots[settings.robotid].isinverted?3:1;
                    settings.robots[settings.robotid].pos[2] = (settings.robots[settings.robotid].pos[2]+v)%4;
                    helpers.updrobot($this, settings.robotid);
                }
                else if ((_value==38 || _value=="up") && settings.robots[settings.robotid].active) {
                    var v = settings.robots[settings.robotid].isinverted?2:0;
                    settings.robots[settings.robotid].speed = (settings.robots[settings.robotid].pos[2]+v)%4;
                    settings.countpush = false;
                    settings.nbmoves+=helpers.prepare($this);
                    $this.find("#nbmoves .value").html(settings.nbmoves);
                }
                else if (_value==40 || _value=="down") { helpers.togglerobot($this, settings.robotid+1); }

            }
            else if ($this.find("#intro").is(":visible")) { $this.sokoban('next'); }
        }
    };

    // The plugin
    $.fn.sokoban = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    interactive     : false,
                    tiles           : {
                        size        : [0,0],
                        data        : [],
                        tile9       : []
                    },
                    wrong           : 0,
                    scale           : 1,
                    robotid         : 0,
                    count           : 1,
                    nbgames         : 0,
                    nbmoves         : 0,
                    nbpushes        : 0,
                    countpush       : false
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    $(document).keydown(function(_e) { helpers.key($this, _e.which);  if (_e.which!=116) { _e.preventDefault(); } });

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
            click: function(value) {
                helpers.key($(this), value);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            reset: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                settings.nbgames++;
                settings.nbmoves=0;     $this.find("#nbmoves .value").html(settings.nbmoves);
                settings.nbpushes=0;    $this.find("#nbpushes .value").html(settings.nbpushes);
                helpers.build($this);
                settings.interactive = true;
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in sokoban plugin!'); }
    };
})(jQuery);

