(function($) {
    // Activity default options
    var defaults = {
        name        : "jewel",                            // The activity name
        label       : "Jewel",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        board       : ["aaaaaaaa","aaFaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa"],
        pjewels     : [1,1,1,1,1,1],                        // Jewel probability
        pspecial    : [0,0,0,0,0,0],                   // Jewel special (horiz or vertical)
        pbomb       : 0,                                    // Bomb
        specials    : [true, true],                         // Jewel horizontal or vertical
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

                $this.css("font-size", ($this.height()/12)+"px");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                // BUILD THE PROBABILITY VECTOR
                for (var i=0; i<settings.pjewels.length; i++) for(var j=0; j<settings.pjewels[i]; j++) { settings.proba.push(i); }

                // BUILD GRID
                settings.size = [ settings.board[0].length, settings.board.length];
                settings.tcells=[];
                for (var j=0; j<settings.size[1]; j++) {
                    var tmp=[];
                    for (var i=0; i<settings.size[0]; i++) { tmp.push(0); }
                    settings.tcells.push(tmp);
                }

                var max     = Math.max(settings.size[1], settings.size[0])*1.1;
                $this.find("#board>div").css("font-size", (12/max)+"em")
                                        .css("margin-left", ((max-settings.size[0])/2)+"em")
                                        .css("margin-top", ((max-settings.size[1])/2)+"em");
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

                $this.bind("touchend mouseup", function(_event) {
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

                // TOREMOVE
                $this.find("#splashex").hide();

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        compute: function($this) {
            var settings  = helpers.settings($this);
            var remove = false;
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                var elt = helpers.cell($this, i, j);
                if (elt) {
                    var cpx = 0, cpdelx = 0, cpy = 0, cpdely = 0;

                    do { if (helpers.cell($this,i+cpx,j) && helpers.cell($this,i+cpx,j).remove) { cpdelx++; } cpx++; }
                    while (helpers.cell($this,i+cpx,j) && elt.match(helpers.cell($this,i+cpx,j)));

                    do { if (helpers.cell($this,i,j+cpy) && helpers.cell($this,i,j+cpy).remove) { cpdely++; } cpy++; }
                    while (helpers.cell($this,i,j+cpy) && elt.match(helpers.cell($this,i,j+cpy)));

                    if (cpx>2 && cpdelx!=cpx) {
                        for (var k=0; k<cpx; k++) {
                            remove = true;
                            helpers.cell($this,i+k,j).act();
                        }
                        var $fx = $("<div class='fx'></div>");
                        $fx.css("top",j+"em").css("left",i+"em").css("width",cpx+"em").css("height","1em")
                           .animate({opacity:0}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($fx);

                        settings.action.count++;
                        var score = 10*(cpx-2)*settings.action.count;
                        var $score = $("<div class='score'><div>"+score+"</div></div>");
                        $score.css("top",j+"em").css("left",i+"em").css("width",cpx+"em").css("height","1em")
                           .animate({opacity:0, "margin-top":"-1em"}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($score);
                        helpers.score($this, score);
                    }
                    if (cpy>2 && cpdely!=cpy) {
                        for (var k=0; k<cpy; k++) {
                            remove = true;
                            helpers.cell($this,i,j+k).act();
                        }
                        var $fx = $("<div class='fx'></div>");
                        $fx.css("top",j+"em").css("left",i+"em").css("width","1em").css("height",cpy+"em")
                           .animate({opacity:0}, gspeed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($fx);

                        settings.action.count++;
                        var score = 10*(cpy-2)*settings.action.count;
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
        score: function($this, _val) {
            var settings  = helpers.settings($this);
            settings.score+=_val;
            $this.find("#scvalue").html(settings.score).addClass("touch");
            setTimeout(function() { $this.find("#scvalue").removeClass("touch"); }, 100);
        },
        move: function($this) {
            var settings  = helpers.settings($this);
            var speed = 0;
            var totreat = [];
            for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
                if (helpers.fromboard($this, i,j)!='0' && !helpers.cell($this,i,j) ) { totreat.push([i,j]); }
            }
            totreat.sort(function(a,b){ return (b[1]<a[1]); });


            var anim = false;
            while(totreat.length) {
                var elt = totreat.pop();
                if (elt[1]>0) {
                    var up = helpers.cell($this, elt[0], elt[1]-1);
                    if (helpers.fromboard($this,elt[0], elt[1]-1)=='0' ||
                        (up && !up.canmove()) ) {
                    }
                    else if (up) {
                        var cell = helpers.cell($this, elt[0], elt[1]-1);
                        helpers.cell($this, elt[0], elt[1]-1, 0);
                        helpers.cell($this, elt[0], elt[1], cell);
                        cell.pos=[elt[0],elt[1]];
                        cell.offset(0,-1).reinit(speed); anim=true;
                        totreat.push([elt[0],elt[1]-1]);
                    }
                }
                else {
                    var cell=helpers.jewel($this, elt[0], elt[1], 'a').offset(0,-1);
                    helpers.cell($this, elt[0], elt[1], cell);
                    $this.find("#board>div").append(cell.$html);
                    cell.reinit(speed); anim=true;
                }
            };

            if (anim)   { setTimeout(function() { helpers.move($this); }, Math.max(100,speed)); }
            else        { if (!helpers.compute($this)) { settings.interactive = true; } }
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
                      "jewels/red01", "jewels/blue02", "jewels/yellow03", "jewels/purple04", "jewels/green05", 
                      "jewels/white06", "", "", "", "",
                      "jewels/red01h", "jewels/blue02h", "jewels/yellow03h", "jewels/purple04h", "jewels/green05h", 
                      "jewels/white06h", "", "", "", "",
                      "jewels/red01v", "jewels/blue02v", "jewels/yellow03v", "jewels/purple04v", "jewels/green05", 
                      "jewels/white06v", "", "", "", "",
                      "icon/life01", "","","",""];

            var ret       = {
                pos         : [_i,_j],
                val         : 0,
                remove      : false,
                frozen      : false,
                $html       : $("<div class='cell'></div>")
            }

            ret.offset = function(_x,_y) { this.$html.css("left",(this.pos[0]+_x)+"em").css("top",(this.pos[1]+_y)+"em"); return this;}
            ret.init = function() { this.$html.attr("id","c"+this.pos[0]+"x"+this.pos[1]); return this.offset(0,0); };
            ret.reinit = function(_speed, _cbk) {
                if (_speed) {
                    this.$html.attr("id","c"+this.pos[0]+"x"+this.pos[1]);
                    this.$html.animate({left:this.pos[0]+"em", top:this.pos[1]+"em"},_speed, _cbk);
                } else { this.init(); }
                return this;
            }
            ret.act         = function() {
                if (this.frozen) { this.unfreeze(); }
                else {
                    this.remove = true;
                    this.$html.animate({opacity:0}, gspeed, function() { $(this).detach() }); return this;
                }
            }
            ret.match       = function(_cell) { return (_cell && this.val<30 && _cell.val<30 && this.val%10==_cell.val%10); }
            ret.canmove     = function() { return !this.frozen; }
            ret.unfreeze    = function() { this.frozen = false; this.$html.find(".frozen").detach(); }

            switch(_val) {
                case 'F': ret.frozen = true;
                case 'A': ret.val = settings.proba[Math.floor(Math.random()*settings.proba.length)]+1; break;
                case 'a': if (settings.pbomb && Math.floor(Math.random()*settings.pbomb)==0) { ret.val = 31; }
                          else {
                              var value = settings.proba[Math.floor(Math.random()*settings.proba.length)];
                              if (value<10 && (settings.specials[0]||settings.specials[1])) {
                                if (settings.pspecial[value]&&Math.floor(Math.random()*settings.pspecial[value])==0) {
                                    value+=((Math.floor(Math.random()*2)==0&&settings.specials[0]) || !settings.specials[1])?10:20; 
                                }
                              }
                              ret.val = value+1;
                          }
                          break;
                case 'b': ret.val = 31; break;
                default : ret.val = parseInt(_val); break;
            }
            ret.$html.append("<div><img src='res/img/"+j[ret.val]+".svg'/></div>");
            if (ret.frozen) { ret.$html.append("<div class='frozen'><img src='res/img/icon/ice01.svg'/></div>"); }
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
                    score           : 0
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

