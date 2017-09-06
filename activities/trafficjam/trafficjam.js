(function($) {
    // Activity default options
    var defaults = {
        name        : "trafficjam",                             // The activity name
        label       : "Traffic Jam",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        size        : [6,6,1.35],                               // Size of the board + scale
        goal        : [{id:0,targets:[[4,2]]}],                 // Objectives
        anim        : [{id:0,args:{left:"100%"}}],              // End animation
        offelt      : [1.5,4/3],                                // Element offset
        offclic     : [0,0],                                    // Click offset
        elts        : [],                                       // Puzzle pieces
        objective   : 6,                                        // Objectives
        background  : "",                                       // Main background
        board       : "",                                       // Board background
        illustration: "",                                       // Replace the pressure illustration
        fontex      : 1,                                        // Exercice font
        debug       : true                                      // Debug mode
    };
    
    
    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>"
    ];

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

                $this.find("#nbfinal .value>div").html(settings.objective);
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                if (settings.board)      { $this.find("#board").css("background-image","url("+settings.board+")"); }
                if (settings.illustration) { $this.find("#illustration img").attr("src",settings.illustration); }
                
                if (settings.exercice) {
                    $this.find("#exercice>div").css("font-size",settings.fontex+"em").html(helpers.format(settings.exercice));
                }
                
                $this.find("#board").bind("mousedown touchstart", function(event){
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;

                    if (settings.interactive) {
                        settings.width = $this.find("#board").width()*settings.size[2]/12;
                        
                        var ii = Math.floor((vEvent.clientX-$(this).offset().left)/settings.width
                                 - settings.offelt[0] - settings.offclic[0]);
                        var jj = Math.floor((vEvent.clientY-$(this).offset().top)/settings.width
                                 - settings.offelt[1] - settings.offclic[1]);
                        
                        settings.nav.id = -1;
                        for (var i=0; i<settings.elts.length; i++) {
                            var elt=settings.elts[i];
                            for (var j in elt.shape) {
                                if (ii==elt.pos[0]+elt.shape[j][0] && jj==elt.pos[1]+elt.shape[j][1] && elt.size) {
                                    settings.nav.id = i;
                                }
                            }
                        }
                        
                        if (settings.nav.id!=-1) {
                            settings.nav.mouse = [ vEvent.clientX, vEvent.clientY];
                            settings.nav.move  = 0;
                            settings.nav.dir   = -1;
                        }
                        

                    }
                    event.stopPropagation();
                    event.preventDefault();
                });
                    
                                
                $this.find("#board").bind("mouseup mouseleave touchend touchleave", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;

                    if (settings.nav.id!=-1) {

                        settings.nav.move = Math.round(settings.nav.move);
                        if (settings.nav.move!=0) {
                            var snapshot = [];
                            for (var i in settings.elts) { snapshot.push([settings.elts[i].pos[0],settings.elts[i].pos[1]]); }
                            settings.moves.push(snapshot);
                        }

                        var elt = settings.elts[settings.nav.id];
                        if (settings.nav.dir==0) { elt.pos[0]+=settings.nav.move; } else
                        if (settings.nav.dir==1) { elt.pos[1]+=settings.nav.move; }
   
                        
                        helpers.update($this);
                        settings.nav.id = -1;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });


                $this.bind("mousemove touchmove", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;

                    if (settings.nav.id!=-1) {
                        var elt         = settings.elts[settings.nav.id];
                        var threshold   = 10;
                        
                        // GET SIDE OF MOVE: -1 non, 0 horizontal, 1 vertical
                        if (settings.nav.dir==-1) {
                            if (Math.abs(vEvent.clientX - settings.nav.mouse[0])>threshold && elt.horiz) {
                                settings.nav.dir = 0;
                                settings.nav.max = helpers.getlimits($this, settings.nav.id, 0);
                            }
                            else
                            if (Math.abs(vEvent.clientY - settings.nav.mouse[1])>threshold && elt.vert) {
                                settings.nav.dir = 1;
                                settings.nav.max = helpers.getlimits($this, settings.nav.id, 1);
                            }
                        }
                        else if ( settings.nav.move==0 ||
                                 (Math.abs(vEvent.clientX - settings.nav.mouse[0])<threshold &&
                                  Math.abs(vEvent.clientY - settings.nav.mouse[1])<threshold) ) {
                            settings.nav.dir = -1;
                        }
                        
                        // COMPUTE NUMBER OF CASES
                        vMove = settings.nav.move;
                        if (settings.nav.dir != -1) {
                            var vMove = ((settings.nav.dir==0?vEvent.clientX:vEvent.clientY) -
                                          settings.nav.mouse[settings.nav.dir])/settings.width;
                            if (vMove<-settings.nav.max[0]) { vMove = -settings.nav.max[0]; }
                            if (vMove>settings.nav.max[1])  { vMove =  settings.nav.max[1]; }
                        }
                        
                        helpers.pos($this, elt.$elt, elt.pos[0]+(settings.nav.dir==0?vMove:0),
                                                     elt.pos[1]+(settings.nav.dir==1?vMove:0));
                        settings.nav.move = vMove;
                    }

                    event.stopPropagation();
                    event.preventDefault();
                });

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                setTimeout(function(){helpers.build($this);},100);

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
          
                var vBoardSize = $this.find("#board").width();
                                
                $this.find("#board>div").css("font-size",settings.size[2]+"em").html("");

                if (settings.cars) {
                    settings.elts=[];
                    settings.offclic=[0,0.45],
                    
                    $this.find("#board>div").load( "activities/"+settings.name+"/trafficjam.html",
                        function(response, status, xhr) {  

                        for (var i in settings.cars) {
                            var elt={};
                            elt.horiz=false;
                            elt.vert=false;
                            elt.shape=[];
                            if (settings.cars[i][0][0]=="h") {
                                elt.horiz=true;
                                for (var j=0; j<parseInt(settings.cars[i][0][1]); j++) { elt.shape.push([j,0]); }
                            }
                            else {
                                elt.vert=true;
                                for (var j=0; j<parseInt(settings.cars[i][0][1]); j++) { elt.shape.push([0,j]); }
                            }
                            elt.pos=[settings.cars[i][1],settings.cars[i][2]];
                            elt.$elt = $("<div id='"+i+"' class='c "+settings.cars[i][0].substr(0,2)+"'>"+
                                       "<img src='res/img/tileset/ortho/traffic/"+settings.cars[i][0]+".svg'/></div>");
                            settings.cars[i].$car = elt.$elt;
                            settings.elts.push(elt);
                            $this.find("#board>div").append(elt.$elt);
                        }
                        helpers.update($this);  
                    });
                }
                else {
                    for (var i in settings.elts) {
                        var elt=settings.elts[i];
                        elt.$elt = (elt.size?
                            $("<div id='"+i+"' class='c' style='width:"+elt.size[0]+"em;height:"+elt.size[1]+"em;'>"+
                            "<img src='"+elt.url+"'/></div>") : 0);
                        
                        if (elt.background && elt.$elt) { elt.$elt.css("background-image","url("+elt.background+")"); }
                        if (elt.$elt) { $this.find("#board>div").append(elt.$elt); }
                    }
                    helpers.update($this);  
                }
                
        },
        pos:function($this,$elt,_x,_y) {
            var settings = helpers.settings($this);
            if ($elt) { $elt.css("top",(settings.offelt[1]+_y)+"em").css("left",(settings.offelt[0]+_x)+"em")
                            .css("z-index",_y); }
            return $elt;
        },
        update:function($this) {
            var settings = helpers.settings($this);
            for (var i in settings.elts) {
                var elt=settings.elts[i];
                helpers.pos($this, elt.$elt, elt.pos[0], elt.pos[1]);
            }
            var vBoard = helpers.board($this);

            $this.find("#nbmoves .value>div").html(settings.moves.length);
            $this.find("#nbmoves").toggleClass("wrong", settings.moves.length>settings.objective);

            var vOk = true;
            
            for (var i in settings.goal) {
                var vGood = false;
                var elt = settings.elts[settings.goal[i].id];
                for (var j in settings.goal[i].targets) {
                    var t = settings.goal[i].targets[j];
                    if (elt.pos[0] == t[0] && elt.pos[1] == t[1] ) { vGood = true; }
                }
                if (!vGood) { vOk = false; }
            }
            if (vOk) {
                settings.interactive = false;
                settings.score = 5 - Math.ceil((settings.moves.length-settings.objective)/2);
                if (settings.score<2) { settings.score = 2; }
                if (settings.score>5) { settings.score = 5; }
                $this.find("#goal").css("left","110%").show().animate({left:"55%"},500, function() {
                    for (var i in settings.anim) {
                        var a = settings.anim[i];
                        settings.elts[a.id].$elt.animate(a.args,1000);
                    }
                });
                setTimeout(function() { $this.find("#goal").animate({left:"110%"},1000); helpers.end($this); }, 2000);
            }
        },
        board: function($this) {
            var settings = helpers.settings($this);
            var ret = [];
            for (var j=0; j<settings.size[1]; j++) {
                var line = [];
                for (var i=0; i<settings.size[0]; i++) { line.push(-1); }
                ret.push(line);
            }
            for (var id in settings.elts) {
                var elt = settings.elts[id];
                for (var i in elt.shape) { ret[elt.pos[1]+elt.shape[i][1]][elt.pos[0]+elt.shape[i][0]] = id; }
            }
            return ret;
        },
        getlimits:function($this, _id, _dir) {
            var settings = helpers.settings($this);
            var board = helpers.board($this);
            var elt = settings.elts[_id];
            var ret=[0,0];
            var ok;
            
            ok = true;
            do {
                var p=ret[0]+1;
                for (var i in elt.shape) {
                    var x=elt.pos[0]+elt.shape[i][0]-(_dir==0?p:0);
                    var y=elt.pos[1]+elt.shape[i][1]-(_dir==1?p:0);
                    if (x<0 || y<0) { ok = false; }
                    else if (board[y][x]!=-1 && board[y][x]!=_id) { ok=false; }
                }
                if (ok) { ret[0]=p; }
            }while(ok);
            
            ok = true;
            do {
                var p=ret[1]+1;
                for (var i in elt.shape) {
                    var x=elt.pos[0]+elt.shape[i][0]+(_dir==0?p:0);
                    var y=elt.pos[1]+elt.shape[i][1]+(_dir==1?p:0);
                    if (x>=settings.size[0] || y>=settings.size[1]) { ok = false; }
                    else if (board[y][x]!=-1 && board[y][x]!=_id) { ok=false; }
                }
                if (ok) { ret[1]=p; }
            }while(ok);
            
            
            return ret;
        }
    };

    // The plugin
    $.fn.trafficjam = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    width           : 1,
                    nav             : { id:-1, mouse:0, max:[1,1], move:[0,0] },
                    moves           : []
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
                settings.interactive = true;
            },
            back: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#left1").hide();
                setTimeout(function() { $this.find("#left1").show(); }, 300);
                if (settings.moves.length) {
                    var sav = settings.moves.pop();
                    for (var i=0; i<settings.elts.length; i++) {
                        settings.elts[i].pos[0] = sav[i][0];
                        settings.elts[i].pos[1] = sav[i][1];
                    }
                    helpers.update($this);
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in trafficjam plugin!'); }
    };
})(jQuery);

