(function($) {
    // Activity default options
    var defaults = {
        name        : "launch",                            // The activity name
        label       : "Launch",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        wheel       : [260,410],                                // Wheel position
        bubble      : [40,34],
        wall        : [100,20],
        level       : 0,
        pathtip     : true,
        board       : "",                                       // board
        debug       : true                                     // Debug mode
    };


    
    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];
    
    var colors = [ "black","white","blue","green","yellow","purple","red","orange"];
    var touch = { none:0, ball:1, wall:2, top:3 };

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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div></div>").appendTo($this.find("#board"));
                elt.svg();
                settings.svg = elt.svg('get');
                settings.svg.load('res/img/desktop/bubble01.svg' + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", ($this.height()/12)+"px");
                if (settings.pathtip) { $("#pathtip",settings.svg.root()).show(); }
                
                $this.bind("touchstart mousedown", function(_event) {
                    var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                    if (settings.interactive) {
                        if (!settings.ratio) {
                            settings.ratio  = 640/$(this).width();
                            settings.offset = [$(this).offset().left, $(this).offset().top];
                        }
                        var x = (e.clientX - settings.offset[0])*settings.ratio;
                        var y = (e.clientY - settings.offset[1])*settings.ratio;

                        if (x>=100 && x<420) {
                            if (y<380) {
                                settings.action.first  = [ e.clientX, y ];
                                settings.action.last   = [ e.clientX, e.clientY ];
                            }
                            else {
                                
                            }
                        }
                    }
                    _event.preventDefault();
                });
                
                $this.bind("touchend mouseup", function(_event) {
                    if (settings.interactive && settings.action.last ) {
                        settings.angle = settings.action.angle;
                    }
                    settings.action.last = 0;
                    _event.preventDefault();
                });
                
                $this.bind("mousemove touchmove", function(_event) {
                    if (settings.interactive && settings.action.last ) {
                        var e = (_event && _event.originalEvent &&
                             _event.originalEvent.touches && _event.originalEvent.touches.length)?
                             _event.originalEvent.touches[0]:_event;

                        settings.action.angle = settings.angle +
                            (e.clientX - settings.action.first[0])*settings.ratio*settings.action.first[1]/430;
                        
                        if (settings.action.angle>70) { settings.action.angle = 70; } else
                        if (settings.action.angle<-70){ settings.action.angle =-70; }
                        
                        $("#wheel #rotate").attr("transform","rotate("+settings.action.angle+")");
                        
                        settings.action.path = helpers.path($this,settings.wheel, settings.action.angle);
                        var d = "M ";
                        for (var i=0; i<settings.action.path.length; i++) {
                            if (i) { d+=" L "; }
                            d+=settings.action.path[i][0]+","+settings.action.path[i][1];
                        }
                        
                        $("#pathtip",settings.svg.root()).attr("d",d);

                    }
                    _event.preventDefault();
                });
                
                $("#wheel",settings.svg.root()).attr("transform","translate("+settings.wheel[0]+","+settings.wheel[1]+")");
                
                var index = 0;
                for (var j=0; j<10; j++) {
                    var line = [];
                    for (var i=0; i<8; i++) {
                        if (i<7 || j%2==0)
                        {
                            var elt = 0;
                            var val = index<settings.board.length?settings.board[index]:' ';
                            if (val!=' ' && val!='-') { elt = helpers.bubble($this, parseInt(val)); }
                            line.push(elt);
                        
                            index++;
                        }
                    }
                    settings.data.push(line);
                }
                helpers.next($this);
                    
                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        path: function($this, _pos, _angle) {
            var settings = helpers.settings($this);
            var ret=[[_pos[0],_pos[1]]];
            var touch = false;
            
            var ss = [0,0];
            var x1 = settings.wall[0]+settings.bubble[0]/2;
            var x2 = x1 + (8-1)*settings.bubble[0];
            for (var j=0; j<10; j++) for (var i=0; i<8; i++) {
                var e=settings.data[j][i];
                if (e) {
                    var s = e.inter(_pos, _angle);
                    if (s && s[1]>ss[1]) { ss=s; }
                }
            }
            if (ss[1] && ss[0]>=x1 && ss[0]<=x2) { ret.push(ss); touch = true;}
            else {
                $("#output").html("");
                var y = settings.wall[1]+settings.bubble[0]/2+settings.bubble[1]*settings.level-_pos[1];
                if (_angle>0) {
                    
                }
                else {
                    var angletop = Math.atan((x1-_pos[0])/y);
                    var angle = Math.PI*_angle/180;
                    if (Math.abs(angle)<angletop) { ret.push([_pos[0]-Math.tan(angle)*y, _pos[1]+y]); touch = true; } 
                    else {
                    }
                }
            }
            
            return ret;
        },
        bubble: function($this,_val) {
            var settings = helpers.settings($this);
            var ret = {
                val     : _val,
                pos     : [0,0],
                $svg    : 0,
                size    : settings.bubble,
                move    : { begin:0, last:0, speed: 0, to:[], ratio:0 }
            };
            
            ret.moveto = function(_x, _y, _speed) {
                if (_speed) {
                    this.move.begin = Date.now();
                    this.move.speed = _speed;
                    this.move.to    = [_x,_y];
                    settings.moves.elts.push(this);
                    if (settings.moves.timerid==0) { helpers.moves($this); }
                }
                else {
                    this.pos=[_x,_y];
                    this.$svg.attr("transform","translate("+_x+","+_y+")");
                }
            };
            ret.inter = function(_from, _angle) {
                var ret=false, alpha = -Math.tan(Math.PI*_angle/180), N = _from[0]-alpha*_from[1]-this.pos[0];
                var A = 1+alpha*alpha, B = 2*alpha*N-2*this.pos[1], C = this.pos[1]*this.pos[1]+N*N-this.size[0]*this.size[0];
                if (B*B-4*A*C>=0) {
                    var y = -(B-Math.sqrt(B*B-4*A*C))/(2*A);
                    var x = (y-_from[1])*alpha+_from[0];
                    ret = [x,y];
                }
                return ret;

            };
            
            ret.$svg = $("#bubble", settings.svg.root()).clone().attr("id","").attr("class","bubble "+colors[_val])
                        .appendTo($("#area", settings.svg.root()));
            
            return ret;
        },
        moves:function($this) {
            var settings = helpers.settings($this), now = Date.now(), tmp=[];
            settings.moves.timerid = 0;
            for (var i in settings.moves.elts) {
                var elt = settings.moves.elts[i];
                if (elt.move.last!=now) {
                    elt.move.ratio= Math.min(1,(now-elt.move.begin)/elt.move.speed);
                    elt.move.last = now;
                    
                    elt.$svg.attr("transform","translate("+ (elt.pos[0]*(1-elt.move.ratio)+elt.move.to[0]*elt.move.ratio)+","+
                                                            (elt.pos[1]*(1-elt.move.ratio)+elt.move.to[1]*elt.move.ratio)+")");
                    if (elt.move.ratio!=1) { tmp.push(elt); } else { elt.pos = elt.to; }
                }
                else { tmp.push(elt); }
            }
            settings.moves.elts = tmp;
            if (settings.moves.elts.length) {
                settings.moves.timerid = setTimeout(function() { helpers.moves($this);}, 50);
            }
        },
        display: function($this) {
            var settings = helpers.settings($this);
            for (var j=0; j<10; j++) for (var i=0; i<8; i++) {
                var elt = settings.data[j][i];
                if (elt) {
                    elt.moveto(settings.wall[0]+(i+0.5)*settings.bubble[0] + (j%2)*settings.bubble[0]/2,
                               settings.wall[1]+settings.bubble[0]/2+(j+settings.level)*settings.bubble[1]);
                }
            }          
        },
        next: function($this) {
            var settings = helpers.settings($this);
            
            $("#hydro",settings.svg.root()).attr("transform","translate(0,"+settings.level*settings.bubble[1]+")");
            helpers.display($this);
            
            var ishere = [];
            for (var i in colors) { ishere.push(false); }
            for (var j=0; j<10; j++) for (var i=0; i<8; i++) {
                var elt = settings.data[j][i];
                if (elt) { ishere[elt.val] = true; }
            }
            
            var val;
            do { val = Math.floor(Math.random()*colors.length); } while (!ishere[val]);
            
            settings.next = helpers.bubble($this, val);
            settings.next.moveto(142,432);
        },
        run: function($this) {
            var settings = helpers.settings($this);
            settings.next.moveto(settings.wheel[0],settings.wheel[1],200);
            settings.current = settings.next;
            setTimeout(function(){ helpers.next($this); settings.interactive = true; }, 500);
        }
    };

    // The plugin
    $.fn.launch = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    ratio           : 0,
                    action          : { first:0, last:0, angle: 0},
                    data            : [],
                    moves           : { elts:[], timerid:0 },
                    next            : 0,
                    angle           : 0
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
                helpers.run($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in launch plugin!'); }
    };
})(jQuery);

