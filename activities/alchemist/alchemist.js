(function($) {
    // Alchemist default options
    var defaults = {
        name        : "alchemist",                  // The activity name
        template    : "template.html",              // Alchemist's html template
        css         : "style.css",                  // Alchemist's css style sheet
        lang        : "fr-FR",                      // Current localization
        theme       : 0,                            // Tiles theme
        proba       : [1,1,1,1,1,1,1,1,1,1,1,1],    // Proba weight for tiles
        frozen      : 0,                           // Frozen tile proba
        level       : 2,                            // Tiles level
        score       : 0,                            // The score (from 0 to 5)
        number      : 3,                            // Tile number for transmut
        init        : [],                           // Initial tiles
        goals       : 0,                            // Objective array
        ref         : 0,                            // Reference score
        time        : 0,                            // Time before down (in seconds)
        debug       : true                          // Debug mode
    };

    /* board value offset
        + 0     : normal tiles
        + 20    : frozen tiles
        + 100   : bonus
        + 200   : new tiles (can not be transmutted this turn)
    */

    var tiles = [ [ "potion/green13", "potion/yellow12", "potion/red04",
                    "potion/purple02", "misc/salt01", "mineral/sulphur01",
                    "mineral/copper01", "mineral/silver01", "mineral/gold01",
                    "mineral/white05", "mineral/magic01", "potion/white01" ],
                  [ "vegetable/apple01","vegetable/pear01", "vegetable/cherry02",
                    "vegetable/aubergine01","vegetable/mushroom01","vegetable/banana01",
                    "vegetable/potato01", "vegetable/orange01","vegetable/pepper03",
                    "vegetable/kiwi01", "vegetable/strawberry01","vegetable/leek01"],
                  [ "space/earth01", "space/moon01","space/venus01",
                    "space/jupiter01","space/mercury01","space/neptune01",
                    "space/callisto01", "space/ganymede01", "space/saturn01",
                    "space/saturn01","space/uranus","space/discovery01"]];

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
        end: function($this, _args) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this, _args);
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

                // overview
                $this.find("#atoverview .icon.img").each(function(_id) {
                    $(this).html("<img src='res/img/svginventoryicons/"+tiles[settings.theme][_id]+".svg'/>");
                });

                // update runes proba
                for (var i in settings.runes) for (var j in settings.bonus) {
                    if (i==settings.bonus[j][0]) { settings.bonus[j][2] = settings.runes[i]; }
                }

                if (settings.time) { $this.find("#atboard").addClass("withtime"); $this.find("#withtime").show(); }

                // goals handling
                setTimeout(function() { helpers.goals.init($this); }, 100);

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                var txt = $this.find("#guide").html();
                txt = txt.replace("$1","<span class='l'>"+settings.number+"</span>");
                $this.find("#guide").html(txt);

                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // Display the discovered elements
        overview: function($this, _animid) {
            var settings = helpers.settings($this);
            $this.find("#atoverview .img img").each(function(index) {
                if (index<=settings.level && !$(this).children().length) {
                    $(this).show();
                    if (_animid==index) { $(this).css("opacity",0).animate({opacity:1},800); }
                }
            });
        },
        effect: function($this, _i, _j, _style) {
            $("<div class='ateffect"+(_style?" "+_style:"")+"'></div>").appendTo($this.find("#atboard")).css("left", _i+"em").css("top", _j+"em")
                .animate({opacity:0},500,function(){$(this).detach();});
        },
        img : function($this,_val) {
            var settings = helpers.settings($this);
            _val=parseInt(_val)%200;
            return "res/img/"+((_val<100)?"svginventoryicons/"+tiles[settings.theme][_val%20]:"asset/runes/"+settings.bonus[_val%100][1])+".svg";
        },
        val : function($this,_elt, _val) {
            var settings = helpers.settings($this);
            var ret = -1;
            if (_elt) {
                var $img = _elt.find(".atimg>img");
                if (typeof(_val)!="undefined" ) {
                    _elt.find(".fx").detach();
                    $img.attr("alt",_val).attr("src",helpers.img($this,_val));
                    if (_val%200>=20&&_val%200<40) {_elt.append("<div class='atice01 fx'></div>"); }
                }
                ret = parseInt($img.attr("alt"));
            }
            return ret;
        },
        tile: function($this, _i, _j, _val) {
            var settings = helpers.settings($this);
            var ret = $("<div class='attile'></div>").appendTo($this.find("#atboard")).css("left", ""+_i+"em").css("top", ""+_j+"em")
                .append("<div class='atimg'><img src=''/></div>");
            helpers.val($this,ret,_val);
            return ret;
        },
        // Choose a new preview pair randomly (regarding the current level) and display it
        preview: function($this) {
            var settings = helpers.settings($this);

            var t = [];
            for (var i=0; i<settings.level; i++) for (var j=0; j<settings.proba[i]; j++) { t.push(i); }
            var val = [ t[Math.floor(Math.random()*t.length)], t[Math.floor(Math.random()*t.length)] ];

            for (var i=0; i<2; i++) {
                if (Math.random()*100<settings.frozen) { val[i]+=20; }
                for (var j=0; j<settings.bonus.length; j++) {if (Math.random()*100<settings.bonus[j][2]) { val[i] = 100+j; } }
            }

            $this.find("#atpreview div").each(function(index) { $(this).append(helpers.tile($this,0,0,val[index])); });
        },
        addpoints: function($this, _val) {
            var settings = helpers.settings($this);
            settings.points+=_val;
            var str="";
            for (var i=0; i<8-settings.points.toString().length; i++) { str+="0"; }
            str+=settings.points;
            $this.find("#atpoints #v").html(str);
            if (settings.ref) {
                $this.find("#atpoints #atslide").width($this.find("#atpoints").width()*Math.min(settings.points/settings.ref,1));
                if (settings.points>=settings.ref) { $this.find("#atpoints").addClass("s"); }
            }
        },
        // Detach the preview pair and use it as current tile. Call for a new preview pair
        next: function($this) {
            var settings = helpers.settings($this);
            settings.tile.posx = 2;
            settings.tile.orientation = 0;
            settings.tile.div1 = $this.find("#atpreview1>div").detach().appendTo($this.find("#atboard")).css("left", "2em").css("top", "1em");
            settings.tile.div2 = $this.find("#atpreview2>div").detach().appendTo($this.find("#atboard")).css("left", "3em").css("top", "1em");
            var alt1 = helpers.val($this,settings.tile.div1);
            var alt2 = helpers.val($this,settings.tile.div2);
            helpers.preview($this);
            settings.interactive = true;
            settings.pieces+=2;
            settings.bonusdone = false;
            if (settings.time && settings.pieces>2) {
                $this.find("#attimer>div").height(0);
                settings.timer.val = Date.now();
                settings.timer.id = setTimeout(function() { helpers.time($this); }, 50);
            }
        },
        // Handle timer
        time: function($this) {
            var settings = helpers.settings($this);
            var val = (Date.now() - settings.timer.val)/1000;
            $this.find("#attimer>div").height($this.find("#attimer").height()*Math.min(1,val/settings.time));
            if (val<settings.time) { settings.timer.id = setTimeout(function() { helpers.time($this); }, 50); }
            else                   {
                settings.timer.id = 0;
                
                var top1 = settings.tile.orientation==1?0:1;
                var top2 = settings.tile.orientation==3?0:1;
                var left1= settings.tile.posx+(settings.tile.orientation==2?1:0);
                var left2= settings.tile.posx+(settings.tile.orientation==0?1:0);
                settings.board[top1][left1] = settings.tile.div1;
                settings.board[top2][left2] = settings.tile.div2;
                helpers.drop($this);
            }
        },
        // Handle the interactive inputs
        key:function($this, value) {
            var settings = helpers.settings($this);
            var k = "";
            if (settings.interactive) {
                // Move the current tile in the upper area
                if (value==37 || value=="left") {
                    k = "left";
                    if (settings.tile.posx>0) { settings.tile.posx--; }
                }
                else if (value==38 || value=="up") {
                    k = "up";
                    settings.tile.orientation = (settings.tile.orientation+1)%4;
                    if ((settings.tile.posx==5) && (settings.tile.orientation%2==0)) { settings.tile.posx = 4; }
                }
                else if (value==39 || value=="right"){
                    k = "right";
                    if ( ((settings.tile.posx<4)&&(settings.tile.orientation%2==0)) ||
                         ((settings.tile.posx<5)&&(settings.tile.orientation%2==1)) ) {
                        settings.tile.posx++;
                    }
                }

                // Update the current tile position
                var top1 = settings.tile.orientation==1?0:1;
                var top2 = settings.tile.orientation==3?0:1;
                var left1= settings.tile.posx+(settings.tile.orientation==2?1:0);
                var left2= settings.tile.posx+(settings.tile.orientation==0?1:0);
                $(settings.tile.div1).css("top", ""+top1+"em");
                $(settings.tile.div1).css("left", ""+left1+"em");
                $(settings.tile.div2).css("top", ""+top2+"em");
                $(settings.tile.div2).css("left", ""+left2+"em");

                // If down is pressed, drop the current tile
                if (value==40 || value=="down") {
                    k = "down";
                    settings.board[top1][left1] = settings.tile.div1;
                    settings.board[top2][left2] = settings.tile.div2;
                    helpers.drop($this);
                }
                
                if (k) {
                    $this.find("#atkeypad .s").removeClass("s"); 
                    $this.find("#atkeypad #"+k).addClass("s");
                    if (settings.keytimerid) { clearTimeout(settings.keytimerid); }
                    settings.keytimerid = setTimeout(function() { $this.find("#atkeypad .s").removeClass("s"); }, 300 );
                }
            }
        },
        // Drop the current tile to the top of the stack
        drop:function($this, _first) {
            var settings = helpers.settings($this);
            settings.interactive = false;
            if (settings.timer.id) { clearTimeout(settings.timer.id); }
            var delay = false;
            for (var i=0; i<6; i++) for (var j=7; j>=0; j--) {
                var vElt = settings.board[j][i];
                if (vElt!=0) {
                    var k=j;
                    while ((k<8)&&(settings.board[k+1][i]==0)) { k++; }
                    if (k!=j) {
                        settings.board[k][i] = vElt;
                        settings.board[j][i] = 0;
                        vElt.animate({top: k+"em"}, 250, function() {});
                        delay = true;
                    }
                }
            }
            setTimeout(function() { helpers.power($this, _first); }, delay?300:0);
        },
        // Handle the bonus
        bonus:function($this) {
            var settings = helpers.settings($this);
            var fx = false;

            for (var i=0; i<6; i++) for (var j=0; j<9; j++) {
                switch(helpers.val($this,settings.board[j][i])) {
                    case 101:
                        if (Math.random()<0.5) { 
                            settings.board[j][i].detach();
                            settings.board[j][i] = 0;
                            helpers.effect($this,i,j,"atfstone");
                            fx=true;
                        }
                        break;
                    case 102: if (Math.random()<0.5) { helpers.val($this,settings.board[j][i],101); helpers.effect($this,i,j,"atfstone"); fx=true; } break;
                    case 103: if (Math.random()<0.5) { helpers.val($this,settings.board[j][i],102); helpers.effect($this,i,j,"atfstone"); fx=true; } break;
                    case 104: if (Math.random()<0.5) { helpers.val($this,settings.board[j][i],103); helpers.effect($this,i,j,"atfstone"); fx=true; } break;
                    case 105: if (Math.random()<0.5) { helpers.val($this,settings.board[j][i],104); helpers.effect($this,i,j,"atfstone"); fx=true; } break;
                    case 106:
                        for (var ii=-1;ii<2;ii++)for (var jj=-1;jj<2;jj++) {
                            if (i+ii>=0 && i+ii<=5 && j+jj>=0 && j+jj<=8) {
                                var v = helpers.val($this,settings.board[j+jj][i+ii]);
                                helpers.effect($this,i+ii,j+jj,"atfup");
                                if (v%20>0&&v<100) { helpers.val($this,settings.board[j+jj][i+ii],v-1); }
                            }
                        }
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        fx=true; break;
                    case 107:
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        helpers.effect($this,i,j,"atfup2");
                        if (j<8) for (ii=0;ii<6;ii++) {
                            var v = helpers.val($this,settings.board[j+1][ii]);
                            helpers.effect($this,ii,j+1,"atfup");
                            if (v%20>0&&v<100) { helpers.val($this,settings.board[j+1][ii],v-1); }
                        }
                        fx=true;break;
                    case 108:
                        for (jj=0;jj<9;jj++) {
                            var v = helpers.val($this,settings.board[jj][i]);
                            helpers.effect($this,i,jj,"atfup");
                            if (v%20>0&&v<100) {  helpers.val($this,settings.board[jj][i],v-1); }
                        }
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        fx=true;break;
                    case 109:
                        for (ii=0;ii<6;ii++) {
                            var v = helpers.val($this,settings.board[j][ii]);
                            helpers.effect($this,ii,j,"atfup");
                            if (v%20>0&&v<100) {  helpers.val($this,settings.board[j][ii],v-1); }
                        }
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        fx=true;break;

                    case 110:
                        for (var ii=-1;ii<2;ii++)for (var jj=-1;jj<2;jj++) {
                            if (i+ii>=0 && i+ii<=5 && j+jj>=0 && j+jj<=8) {
                                var v = helpers.val($this,settings.board[j+jj][i+ii]);
                                helpers.effect($this,i+ii,j+jj,"atfice");
                                if (v>=0&&v<20) { helpers.val($this,settings.board[j+jj][i+ii],v+20); }
                            }
                        }
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        fx=true; break;
                    case 111:
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        helpers.effect($this,i,j,"atfice2");
                        if (j<8) for (ii=0;ii<6;ii++) {
                            var v = helpers.val($this,settings.board[j+1][ii]);
                            helpers.effect($this,ii,j+1,"atfice");
                            if (v>=0&&v<20) { helpers.val($this,settings.board[j+1][ii],v+20); }
                        }
                        fx=true;break;
                    case 112:
                        for (jj=0;jj<9;jj++) {
                            var v = helpers.val($this,settings.board[jj][i]);
                            helpers.effect($this,i,jj,"atfice");
                            if (v>=0&&v<20) {  helpers.val($this,settings.board[jj][i],v+20); }
                        }
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        fx=true;break;
                    case 113:
                        for (ii=0;ii<6;ii++) {
                            var v = helpers.val($this,settings.board[j][ii]);
                            helpers.effect($this,ii,j,"atfice");
                            if (v>=0&&v<20) {  helpers.val($this,settings.board[j][ii],v+20); }
                        }
                        settings.board[j][i].detach();
                        settings.board[j][i] = 0;
                        fx=true;break;

                    case 114:
                        for (var ii=-1;ii<2;ii++)for (var jj=-1;jj<2;jj++) {
                            if (i+ii>=0 && i+ii<=5 && j+jj>=0 && j+jj<=8) {
                                helpers.effect($this,i+ii,j+jj,"atfdel");
                                if (settings.board[j+jj][i+ii]) { settings.board[j+jj][i+ii].detach(); settings.board[j+jj][i+ii] = 0; }
                            }
                        }
                        fx=true; break;
                    case 115:
                        settings.board[j][i].detach(); settings.board[j][i] = 0;
                        helpers.effect($this,i,j,"atfdel2");
                        if (j<8) for (ii=0;ii<6;ii++) {
                            helpers.effect($this,ii,j+1,"atfdel");
                            if (settings.board[j+1][ii]) { settings.board[j+1][ii].detach(); settings.board[j+1][ii] = 0; }
                        }
                        fx=true;break;
                    case 116:
                        for (jj=0;jj<9;jj++) {
                            helpers.effect($this,i,jj,"atfdel");
                            if (settings.board[jj][i]) { settings.board[jj][i].detach(); settings.board[jj][i] = 0; }
                        }
                        fx=true;break;
                    case 117:
                        for (ii=0;ii<6;ii++) {
                            helpers.effect($this,ii,j,"atfdel");
                            if (settings.board[j][ii]) { settings.board[j][ii].detach(); settings.board[j][ii] = 0; }
                        }
                        fx=true;break;



                }
            }
            settings.bonusdone = true;
            setTimeout(function() { helpers.drop($this, false); }, fx?500:0 );
        },
        goals: {
            init: function($this) {
                var settings = helpers.settings($this);
                for (var i in settings.goals) {
                    var txt = settings.locale.goaltxt[settings.goals[i].type];
                    switch(settings.goals[i].type) {
                        case "survive":
                            $this.find("#atcounter").html(settings.goals[i].value).show();
                            txt = txt.replace("$1","<span class='l'>"+settings.goals[i].value+"</span>");
                            break;
                        case "level":
                            $($this.find("#atoverview .icon.img").get(settings.goals[i].value)).addClass("s");
                            txt = txt.replace("$1","<span class='l'>"+(settings.goals[i].value+1)+"</span>");
                            break;
                        case "max":
                            $this.find("#atcounter").html(settings.goals[i].value).addClass("s").show();
                            txt = txt.replace("$1","<span class='l'>"+(settings.goals[i].value)+"</span>");
                            break;
                        case "remove":
                            $($this.find("#atoverview .icon.no").get(settings.goals[i].value)).show();
                            txt = txt.replace("$1","<span class='l'>"+(settings.goals[i].value+1)+"</span>");
                            break;
                        case "fill":
                            $($this.find("#atoverview .icon.img").get(settings.goals[i].misc)).addClass("f");
                            txt = txt.replace("$1","<span class='l'>"+(settings.goals[i].misc+1)+"</span>");
                        case "empty":
                            for (var j in settings.goals[i].value) {
                                var v = settings.goals[i].value[j];
                                for (var ii=v[0]; ii<v[0]+(v.length>2?v[2]:1); ii++)
                                for (var jj=v[1]; jj<v[1]+(v.length>3?v[3]:1); jj++) {
                                    $("<div class='"+settings.goals[i].type+"'></div>").prependTo($this.find("#atboard")).
                                        css("left", ii+"em").css("top", (2+jj)+"em");
                                }
                            }
                        break;
                    }
                    $this.find("#g_splash ul").append("<li>"+txt+"</li>");
                    $this.find("#g_splash #goals").show();
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
                                var val = parseInt($this.find("#atcounter").html());
                                if (val>1) { if (_update) { val--; } } else { goal++; }
                                $this.find("#atcounter").html(val);
                                break;
                            case "max":
                                var val = parseInt($this.find("#atcounter").html());
                                goal++;
                                if (val>1) { if (_update) { val--; } } else { if (_update) { val=0; } ret = s.failed; }
                                $this.find("#atcounter").html(val);
                                break;
                            case "level":
                                if (settings.level>=settings.goals[i].value) { goal++; }
                                break;
                            case "fill":
                            case "empty":
                                var ok = true;
                                for (var j in settings.goals[i].value) {
                                    var v = settings.goals[i].value[j];
                                    for (var ii=v[0]; ii<v[0]+(v.length>2?v[2]:1); ii++)
                                    for (var jj=v[1]; jj<v[1]+(v.length>3?v[3]:1); jj++) {
                                        var val = helpers.val($this,settings.board[jj+2][ii]);
                                        if (settings.goals[i].type=="empty"&&val!=-1) { ok = false; }
                                        if (settings.goals[i].type=="fill"&&((val%200>=100)||(val%20<settings.goals[i].misc))) { ok = false; }
                                    }
                                }
                                if (ok) { goal++; }
                                break;
                            case "remove":
                                var ok = true;
                                for (var ii=0; ii<6; ii++) for (var jj=0; jj<9; jj++) {
                                    var val = helpers.val($this,settings.board[jj][ii]);
                                    if (val>=0 && val<40 && val%20==settings.goals[i].value ) { ok = false; }
                                }
                                if (ok) { goal++; }
                                break;
                            case "frozen":
                                var ok = true;
                                for (var ii=0; ii<6; ii++) for (var jj=0; jj<9; jj++) {
                                    var val = helpers.val($this,settings.board[jj][ii]);
                                    if (val>=20 && val<40) { ok = false; }
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
        // Return false if a pair is still in the upper area or if objectives are done
        check: function($this, _first) {
            var settings = helpers.settings($this);
            var vRet = true;

            for (var i=0; i<6; i++) for (var j=0; j<2; j++) { if (settings.board[j][i]!=0) { vRet = false; } }
            if (vRet && settings.bonusdone) { vRet = (helpers.goals.check($this, !_first)==s.normal); }

            return vRet;
        },
        // Check the number of neighbours
        neighbourhood: function($this, n) {
            var settings = helpers.settings($this);
            var vModif = false;
            for (var i=0; i<6; i++) for (var j=0; j<9; j++) {
                if (n[j][i]) {
                    var current = helpers.val($this,settings.board[j][i]);
                    if (current<100) {
                        if ((i>0) && helpers.val($this,settings.board[j][i-1])<100 && (current%20==helpers.val($this,settings.board[j][i-1])%20)) {
                                if (!n[j][i-1]) { n[j][i-1] = 1; vModif = true; }
                        }
                        if ((j>0) && helpers.val($this,settings.board[j-1][i])<100 && (current%20==helpers.val($this,settings.board[j-1][i])%20)) {
                                if (!n[j-1][i]) { n[j-1][i] = 1; vModif = true; }
                        }
                        if ((i<5) && helpers.val($this,settings.board[j][i+1])<100 && (current%20==helpers.val($this,settings.board[j][i+1])%20)) {
                                if (!n[j][i+1]) { n[j][i+1] = 1; vModif = true; }
                        }
                        if ((j<8) && helpers.val($this,settings.board[j+1][i])<100 && (current%20==helpers.val($this,settings.board[j+1][i])%20)) {
                                if (!n[j+1][i]) { n[j+1][i] = 1; vModif = true; }
                        }
                    }
                }
            }
            return vModif?helpers.neighbourhood($this, n):n;
        },
        // Transmut elements if more than 3 are touching themself
        transmut: function($this, y, x) {
            var settings = $this.data("settings"), ret = false , Elt = settings.board[y][x], Value = helpers.val($this,$(Elt));
            if (Elt!=0) {
                var neighbour = [ [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                  [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                  [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ] ];
                neighbour[y][x] = 1;
                neighbour = helpers.neighbourhood($this, neighbour);
                var count = 0;
                for (var i=0; i<6; i++) for (var j=0; j<9; j++) { if (neighbour[j][i]) { count++; } }
                if (count>(settings.number-1) && helpers.val($this,$(settings.board[y][x]))<20) {
                    ret = true;
                    var isfrozen = false;
                    var nb = 0;
                    for (var i=0; i<6; i++) for (var j=0; j<9; j++) { if (neighbour[j][i]) nb++; }
                    nb=nb-settings.number+1;
                    for (var i=0; i<6; i++) for (var j=0; j<9; j++) {
                        if (neighbour[j][i]) {
                            helpers.effect($this,i,j);
                            var val = helpers.val($this,$(settings.board[j][i]));
                            if (val<20) {
                                var point = Math.pow(settings.number,parseInt(val))*nb, tmp = point;
                                helpers.addpoints($this, point);
                                var size = 1;
                                while (tmp>10) { size/=1.2; tmp/=10; }
                                $("<div class='atscore'><div style='font-size:"+size+"em;'>"+point+"</div></div>")
                                    .appendTo($this.find("#atboard")).css("left", i+"em").css("top", j+"em")
                                    .animate({"opacity":0, "margin-top":"-0.5em" },500,function(){$(this).detach();});
                                $(settings.board[j][i]).detach(); settings.board[j][i] = 0;
                            }
                            else if (val<40) { helpers.val($this,$(settings.board[j][i]), val-20); isfrozen = true;}
                        }
                    }
                    if (Value>10) { Value = 10; }
                    if (Value==settings.level && !isfrozen ) {
                        settings.level++;
                        $this.find("#atneweltfx").css("top",(0.05+Math.floor(settings.level/3))+"em")
                                                .css("left",(5.08+settings.level%3)+"em").show();
                        $this.find("#atneweltfx>div>div").addClass("g_arunning");
                        helpers.overview($this,settings.level);
                        helpers.alchemist($this,"happy");
                        setTimeout(function() {
                            $this.find("#atneweltfx").hide();
                            $this.find("#atneweltfx>div>div").removeClass("g_arunning");
                            } , 1000);
                    }

                    if (!isfrozen) { settings.board[y][x] = helpers.tile($this,x,y,(200+Value+1)); }
                }
            }
            return ret;
        },
        alchemist:function($this, _type) {
            var settings = $this.data("settings");
            settings.alchemist = true;
            $this.find("#atnewelt .icon").hide();
            $this.find("#atnewelt .label").hide();
            $this.find("#atnewelt #atdefault").show();
            $this.find("#atnewelt").css("left","-13em").show().animate({left:"-.2em"},400);
            $this.find("#atnewelt #"+_type+"label").show();
            
            setTimeout(function() { $this.find("#atnewelt #default").hide(); $this.find("#atnewelt #at"+_type).show();},1000);
            setTimeout(function() { $this.find("#atnewelt").animate({left:"-13em"},300,function() { $(this).hide(); settings.alchemist = false; }); } , 1800);
            
        },
        // compute the score
        score:function($this,level) {
            var settings = $this.data("settings");
            var l = 0;
			var transmut = false;
            var d = settings.alchemist?2500:0;

            if (settings.goals) {
                l = (helpers.goals.check($this, false)!=s.success?0:5);
                for (var i=0; i<6; i++) for (var j=0; j<2; j++) { if (settings.board[j][i]!=0) { l = 0; } }
                if (d) { settings.waitend=500; }
				if (l==0) {
                    transmut = true;
                    $this.find("#g_effects").addClass("wrong");
                    setTimeout(function(){helpers.alchemist($this,"lost")},d);
                } else {
                    $this.find("#g_effects").addClass("good");
                    setTimeout(function(){helpers.alchemist($this,"win")},d);
                }
                if (l==5 && settings.ref) {
                    if (settings.points<settings.ref*0.5)   { l = 2; } else
                    if (settings.points<settings.ref*0.8)   { l = 3; } else
                    if (settings.points<settings.ref)       { l = 4; }
                }
            }
            else {
				transmut = true;
                l = settings.level-6;
                if (l>5) { l=5; }
                if (l<0) { l=0; }
				
                $this.find("#g_effects").addClass("wrong");
                
                setTimeout(function(){helpers.alchemist($this,"lost")},d);
            }
            
            if (transmut) {
				for (var j=0; j<9; j++) for (var i=0; i<6; i++)  {
					if (settings.board[j][i]) {
						var $elt = $("<div class='atcrap l"+j+"'></div>")
							.appendTo($this.find("#atboard")).css("left", i+"em").css("top", j+"em");
					}
				}
				var l = 0;
				for (var j=0; j<9; j++) { setTimeout(function() { $this.find(".atcrap.l"+(l++)).show(); }, j*50); }
			}
            
            return l;
        },
        power: function($this, _first) {
            var settings = $this.data("settings"), cont = false;
            for (var j=8; j>1; j--) for (i=0; i<6; i++) { cont = cont | helpers.transmut($this, j,i); }
            for (var j=8; j>1; j--) for (i=0; i<6; i++) {
                if (settings.board[j][i]) { helpers.val($this,settings.board[j][i], helpers.val($this,settings.board[j][i])%200); }
            }
            if (cont) { setTimeout(function() { helpers.drop($this,_first); },500); }
            else {
                if (helpers.check($this, _first)) {
                    if (settings.bonusdone || _first) { helpers.next($this); } else { helpers.bonus($this);}
                }
                else {
                    settings.interactive = false;
                    settings.score = helpers.score($this);
                    setTimeout(function() { helpers.end($this, 
						{'status':'success', 'score':settings.score,
						 'points':settings.points, 'pieces':settings.pieces}); }, 3000+settings.waitend);
                }
            }
        }
    };

    // The plugin
    $.fn.alchemist = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    tile            : { posx:0, orientation:0, div1:0, div2:0 },
                    points          : 0,
                    pieces          : 0,
                    bonusdone       : false,
                    alchemist       : false,
                    waitend         : 0,
                    keytimerid      : 0,
                    bonus           : [
 [ "stone","null01",0 ],
 [ "stone1","one01",0 ], ["stone2","two01",0], ["stone3","three01",0], ["stone4","four01",0], ["stone5","five01",0],
 [ "up","up01a",0], [ "updown","up01d",0], [ "upcol","up01c",0],  [ "uprow","up01b",0], 
 [ "frozen","ice01a",0], [ "frozendown","ice01d",0], [ "frozencol","ice01c",0], [ "frozenrow","ice01b",0], 
 [ "del","algiz01",0], [ "deldown","algiz02",0], [ "delcol","algiz03",0], [ "delrow","algiz04",0]
                                      ],
                    board:          [ [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                      [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ],
                                      [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ], [ 0, 0, 0, 0, 0, 0 ] ],
                    timer:          { id:0, val:0 }
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    $(document).keydown(function(_e) { if (_e.which!=116) { helpers.key($this, _e.which); _e.preventDefault(); } });

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
            click: function(elt) {
                $(elt).addClass("g_ktouch");
                helpers.key($(this), $(elt).attr("id"));
            },
            next: function() {
                var $this = $(this) , settings = $(this).data("settings");
                
                // Hide instruction
                $this.find("#splash").hide();

                if (!settings.interactive) {
                    // Initial tiles
                    if (settings.init) {
                        for (var j=0; j<settings.init.length; j++) for (var i=0; i<settings.init[j].length; i++) {
                            if(settings.init[j][i]>=0) { settings.board[j][i]= helpers.tile($this,i,j,settings.init[j][i]); }
                        }
                    }
                    helpers.addpoints($this, 0);
                    helpers.overview($this,-1);
                    helpers.preview($this);
                    setTimeout(function() { helpers.drop($this,true); }, settings.init?500:0);
                }
            },
            quit: function() {
                var $this = $(this) , settings = $this.data("settings");
                helpers.end($this,
                    {'status':'abort', 'score':settings.score, 'points':settings.points, 'pieces':settings.pieces});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in alchemist plugin!'); }
    };
})(jQuery);

