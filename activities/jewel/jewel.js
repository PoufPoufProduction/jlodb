(function($) {
    // Activity default options
    var defaults = {
        name        : "jewel",                            // The activity name
        label       : "Jewel",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        board       : ["aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa","aaaaaaaa"],
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
                var max     = Math.max(settings.board.length, settings.board[0].length)*1.1;
                $this.find("#board>div").css("font-size", (12/max)+"em")
                                        .css("margin-left", ((max-settings.board[0].length)/2)+"em")
                                        .css("margin-top", ((max-settings.board.length)/2)+"em");
                for (var j=0; j<settings.board.length; j++) for (var i=0; i<settings.board[j].length; i++) {
                    if (helpers.getCell($this, i, j)!='0') {
                        var ok, cell, $bg;
                        do {
                            ok = true;
                            cell=helpers.jewel($this, i, j, helpers.getCell($this, i, j));
                            if (settings.cells["c"+i+"x"+(j-1)]&&settings.cells["c"+i+"x"+(j-2)]&&cell.val<30&&
                                cell.val%10==settings.cells["c"+i+"x"+(j-1)].val%10 &&
                                cell.val%10==settings.cells["c"+i+"x"+(j-2)].val%10) { ok = false; }
                            if (settings.cells["c"+(i-1)+"x"+j]&&settings.cells["c"+(i-2)+"x"+j]&&cell.val<30&&
                                cell.val%10==settings.cells["c"+(i-1)+"x"+j].val%10 &&
                                cell.val%10==settings.cells["c"+(i-2)+"x"+j].val%10) { ok = false; }
                        } while(!ok);                        
                        settings.cells["c"+i+"x"+j]=cell;
                        $this.find("#board>div").append(cell.$html);


                        var $bg = $("<div class='bg'></div>");
                        var radius = [];
                        for (var n=0; n<4; n++) { radius.push(cell.neighboors[n]=='0'&&cell.neighboors[(n+1)%4]=='0'?".2em":"0"); }
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
                            elt2 = settings.cells["c"+(settings.action.elt1.pos[0]+Math.sign(difx))+"x"+settings.action.elt1.pos[1]];
                            if (elt2) { elt2.offset(-difx,0); settings.action.elt1.offset(difx,0); }
                            settings.ok = (Math.abs(difx)>0.5);
                        }
                        else if (Math.abs(dify)>Math.abs(difx) && Math.abs(dify)>0.1) {
                            elt2 = settings.cells["c"+settings.action.elt1.pos[0]+"x"+(settings.action.elt1.pos[1]+Math.sign(dify))];
                            if (elt2) { elt2.offset(0,-dify); settings.action.elt1.offset(0,dify); }
                            settings.ok = (Math.abs(dify)>0.5);
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
                            settings.cells[settings.action.elt1.$html.attr("id")] = settings.action.elt1;
                            settings.cells[settings.action.elt2.$html.attr("id")] = settings.action.elt2;
                            // CHECK CLEAR
                            if (!helpers.compute($this)) {
                                // RESTORE IF NOTHING MATCHES
                                settings.action.elt2.pos = [settings.action.elt1.pos[0], settings.action.elt1.pos[1] ];
                                settings.action.elt1.pos = [tmp[0],tmp[1]];
                                settings.action.elt2.reinit(500);
                                settings.action.elt1.reinit(500,function() { settings.interactive = true; });
                                settings.cells[settings.action.elt1.$html.attr("id")] = settings.action.elt1;
                                settings.cells[settings.action.elt2.$html.attr("id")] = settings.action.elt2;
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
            var speed = 500;
            var remove = false;
            for (var j=0; j<settings.board.length; j++) for (var i=0; i<settings.board[j].length; i++) {
                var elt = settings.cells["c"+i+"x"+j];
                if (elt) {
                    var cpx = 0, cpdelx = 0, cpy = 0, cpdely = 0;

                    do { if (settings.cells["c"+(i+cpx)+"x"+j]&&settings.cells["c"+(i+cpx)+"x"+j].remove) { cpdelx++; } cpx++; }
                    while (settings.cells["c"+(i+cpx)+"x"+j]&&settings.cells["c"+(i+cpx)+"x"+j].val == elt.val);

                    do { if (settings.cells["c"+i+"x"+(j+cpy)]&&settings.cells["c"+i+"x"+(j+cpy)].remove) { cpdely++; } cpy++; }
                    while (settings.cells["c"+i+"x"+(j+cpy)]&&settings.cells["c"+i+"x"+(j+cpy)].val == elt.val);

                    if (cpx>2 && cpdelx!=cpx) {
                        for (var k=0; k<cpx; k++) {
                            remove = true;
                            settings.cells["c"+(i+k)+"x"+j].toremove().$html.animate({opacity:0}, speed, function() { $(this).detach() });
                        }
                        var $fx = $("<div class='fx'></div>");
                        $fx.css("top",j+"em").css("left",i+"em").css("width",cpx+"em").css("height","1em")
                           .animate({opacity:0}, speed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($fx);
                    }
                    if (cpy>2 && cpdely!=cpy) {
                        for (var k=0; k<cpy; k++) {
                            remove = true;
                            settings.cells["c"+i+"x"+(j+k)].toremove().$html.animate({opacity:0}, speed, function() { $(this).detach() });
                        }
                        var $fx = $("<div class='fx'></div>");
                        $fx.css("top",j+"em").css("left",i+"em").css("width","1em").css("height",cpy+"em")
                           .animate({opacity:0}, speed*1.5, function() { $(this).detach() });
                        $this.find("#board>div").append($fx);
                    }
                }
            }
            if (remove) {
                for (var i in settings.cells) { if (settings.cells[i].remove) settings.cells[i]=0; }
                setTimeout(function() { helpers.move($this); }, speed);
            }
            return (remove);
        },
        move: function($this) {
            var settings  = helpers.settings($this);
            var speed = 0;
            var sy = settings.board.length, sx = settings.board[0].length;
            var totreat = [];
            for (var j=0; j<sy; j++) for (var i=0; i<sx; i++) {
                if (settings.board[j][i]!='0' && !settings.cells["c"+i+"x"+j]) { totreat.push([i,j]); }
            }
            totreat.sort(function(a,b){ return (b[1]<a[1]); });

            var anim = false;
            while(totreat.length) {
                var elt = totreat.pop();
                if (elt[1]>0) {
                    if (settings.board[elt[1]-1][elt[0]]=='0') {
                    }
                    else if (settings.cells["c"+elt[0]+"x"+(elt[1]-1)]) {
                        var cell = settings.cells["c"+elt[0]+"x"+(elt[1]-1)];
                        settings.cells["c"+elt[0]+"x"+(elt[1]-1)] = 0;
                        settings.cells["c"+elt[0]+"x"+elt[1]] = cell;
                        cell.pos=[elt[0],elt[1]];
                        cell.offset(0,-1).reinit(speed); anim=true;
                        totreat.push([elt[0],elt[1]-1]);
                    }
                }
                else {
                    var cell=helpers.jewel($this, elt[0], elt[1], 'a').offset(0,-1);
                    settings.cells["c"+elt[0]+"x"+elt[1]]=cell;
                    $this.find("#board>div").append(cell.$html);
                    cell.reinit(speed); anim=true;
                }
            };

            if (anim)   { setTimeout(function() { helpers.move($this); }, Math.max(100,speed)); }
            else        { if (!helpers.compute($this)) { settings.interactive = true; } }
        },
        getCell: function($this, _i, _j) {
            var settings  = helpers.settings($this);
            var notdefined = (_j<0 || _j>=settings.board.length || _i<0 || _i>=settings.board[_j].length );
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
                $html       : $("<div class='cell'></div>"),
                neighboors  : [ '0', '0', '0', '0' ]
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
            ret.toremove = function() { this.remove = true; return this; }

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
            if (ret.frozen) { $html.append("<div class='frozen'><img src='res/img/icon/ice01.svg'/></div>"); }
            ret.$html.unbind("mousedown touchstart").bind("mousedown touchstart", function(_event) {
                if (settings.interactive) {
                    var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;
                    var id = $(this).css("z-index",3).attr("id");
                    settings.action.elt1    = settings.cells[id];
                    settings.action.pos     = [e.clientX, e.clientY];
                    settings.ok             = false;
                }
                _event.preventDefault();
            });

            for (var i=0; i<4; i++) { ret.neighboors[i] = helpers.getCell($this, _i+ncells[i][0], _j+ncells[i][1]); }
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
                    proba           : [],
                    width           : 0,
                    action          : { pos:0, elt1:0, elt2:0, ok:false }
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

