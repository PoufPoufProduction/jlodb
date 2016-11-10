(function($) {
    // Activity default options
    var defaults = {
        name        : "trafficjam",                             // The activity name
        label       : "Traffic Jam",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        size        : [6,6],                                    // Size of the board
        goal        : [5,2],
        cars        : [],                                       // List of cars
        objective   : 6,                                        // Objectives
        debug       : true                                     // Debug mode
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

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                $this.find("#nbfinal .value>div").html(settings.objective);
                
                
                var vBoardSize = $this.find("#board").width();
                var vSize = Math.floor(Math.min(vBoardSize/(settings.size[0]+2), vBoardSize/(settings.size[1]+3) ));
                var vOffset = [ Math.floor((vBoardSize-(settings.size[0]+2)*vSize)/2),
                                Math.floor((vBoardSize-(settings.size[1]+3)*vSize)/2) ];

                $this.find("#board").bind("mousedown touchstart", function(event){
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;

                    if (settings.interactive) {
                        
                        var ii = Math.floor((vEvent.clientX-$(this).offset().left-settings.nav.offset[0])/settings.nav.size-1);
                        var jj = Math.floor((vEvent.clientY-$(this).offset().top-settings.nav.offset[1])/settings.nav.size-1.8);
                        settings.nav.id = -1;
                        for (var i=0; i<settings.cars.length; i++) {
                            var c = settings.cars[i];
                            for (var j=0; j<parseInt(c[0][1]); j++) {
                                if ( c[1]+(c[0][0]=='h'?j:0) == ii && c[2]+(c[0][0]=='v'?j:0) == jj) { settings.nav.id = i; }
                            }
                        } 
                
                        if (settings.nav.id!=-1) {
                            settings.nav.mouse = [ vEvent.clientX, vEvent.clientY];
                            settings.nav.move = [0,0];

                            var x,y;
                            var vCar    = settings.cars[settings.nav.id];
                            var vOffset = (vCar[0][0]=='h')?[parseInt(vCar[0][1]),0]:[0,parseInt(vCar[0][1])];

                            if (vCar[0][0]=='h')
                            {
                                x = vCar[1]-1;
                                while (x>=0 && settings.board[vCar[2]][x]==-1) { x--; }
                                y = vCar[1]+parseInt(vCar[0][1]);
                                while (y<settings.size[0] && settings.board[vCar[2]][y]==-1) { y++; }
                                settings.nav.max=[x-vCar[1]+1,y-vCar[1]-parseInt(vCar[0][1])];
                            }
                            else
                            {
                                x = vCar[2]-1;
                                while (x>=0 && settings.board[x][vCar[1]]==-1) { x--; }
                                y = vCar[2]+parseInt(vCar[0][1]);
                                while (y<settings.size[1] && settings.board[y][vCar[1]]==-1) { y++; }
                                settings.nav.max=[x-vCar[2]+1,y-vCar[2]-parseInt(vCar[0][1])];
                            }
                        }

                    }
                    event.stopPropagation();
                    event.preventDefault();
                });
                    
                                
                $this.find("#board").bind("mouseup mouseleave touchend touchleave", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;

                    if (settings.nav.id!=-1) {

                        if (settings.nav.move[0]!=0 || settings.nav.move[1]!=0) {
                            var snapshot = [];
                            for (var i in settings.cars) { snapshot.push([settings.cars[i][1],settings.cars[i][2]]); }
                            settings.moves.push(snapshot);
                        }

                        var vCar = settings.cars[settings.nav.id];
                        vCar[1]+=settings.nav.move[0];
                        vCar[2]+=settings.nav.move[1];
                        helpers.update($this);
                        settings.nav.id = -1;
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });


                $this.bind("mousemove touchmove", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;

                    if (settings.nav.id!=-1) {
                        var vCar = settings.cars[settings.nav.id];
                        var vTop  = (2+vCar[2]-2/3)*vSize+vOffset[1];
                        var vLeft = (1+vCar[1])*vSize+vOffset[0];
                        if (vCar[0][0]=='h') {
                            var vMove = (vEvent.clientX - settings.nav.mouse[0])/settings.nav.size;
                            if (vMove<settings.nav.max[0]) { vMove = settings.nav.max[0]; }
                            if (vMove>settings.nav.max[1]) { vMove = settings.nav.max[1]; }
                            settings.nav.move=[Math.round(vMove),0];
                            vLeft += vMove*settings.nav.size;
                        }
                        else {
                            var vMove = (vEvent.clientY - settings.nav.mouse[1])/settings.nav.size;
                            if (vMove<settings.nav.max[0]) { vMove = settings.nav.max[0]; }
                            if (vMove>settings.nav.max[1]) { vMove = settings.nav.max[1]; }
                            settings.nav.move=[0,Math.round(vMove)];
                            vTop += vMove*settings.nav.size;
                        }
                        vCar.$car.css("top",vTop+"px").css("left",vLeft+"px");
                    }

                    event.stopPropagation();
                    event.preventDefault();
                });

                // Locale handling
                $this.find("h1#label").html(settings.label);
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
                var vSize = Math.floor(Math.min(vBoardSize/(settings.size[0]+2), vBoardSize/(settings.size[1]+3) ));
                var vOffset = [ Math.floor((vBoardSize-(settings.size[0]+2)*vSize)/2),
                                Math.floor((vBoardSize-(settings.size[1]+3)*vSize)/2) ];
                $this.find("#board>div").html("").css("font-size",vSize);
                settings.nav.size = vSize;
                settings.nav.offset = vOffset;

                $this.find("#board>div").append("<div class='b nw' style='top:"+((1-0.66)*vSize+vOffset[1])+"px;"+
                                                 "left:"+(vOffset[0])+"px;z-index:0'></div>");
                $this.find("#board>div").append("<div class='b ne' style='top:"+((1-0.66)*vSize+vOffset[1])+"px;"+
                                                 "left:"+(((settings.size[0]+1)*vSize)+vOffset[0])+"px;z-index:0'></div>");
                $this.find("#board>div").append("<div class='n n1' style='top:"+(vOffset[1])+"px;"+
                                                 "left:"+((1*vSize)+vOffset[0])+"px;z-index:0'></div>");
                $this.find("#board>div").append("<div class='n n1' style='top:"+(vOffset[1])+"px;"+
                                                 "left:"+((3*vSize)+vOffset[0])+"px;z-index:0'></div>");
                $this.find("#board>div").append("<div class='n n1' style='top:"+(vOffset[1])+"px;"+
                                                 "left:"+((5*vSize)+vOffset[0])+"px;z-index:0'></div>");

                for (var i=0; i<settings.size[0]; i++) for (var j=0; j<settings.size[1]; j++) {
                    $this.find("#board>div").append("<div class='r' style='top:"+((2+j)*vSize+vOffset[1])+"px;"+
                                                                          "left:"+((1+i)*vSize+vOffset[0])+"px;'></div>");
                }
                for (var i=-1; i<settings.size[0]+1; i++) {
                    var c = "s";
                    if (i==-1) { c="sw"; } else if (i==settings.size[0]) { c="se"; }
                    $this.find("#board>div").append("<div class='b "+c+"' style='top:"+((2-0.66+settings.size[1])*vSize+vOffset[1])+"px;"+
                                                    "left:"+((1+i)*vSize+vOffset[0])+"px;z-index:"+settings.size[1]+"'></div>");
                }
                for (var j=0; j<settings.size[1]; j++) {
                    var c= "e";
                    if (j==settings.goal[1]-1) { c="se2"; } else if (j==settings.goal[1]) { c="e3"; } else
                    if (j==settings.goal[1]+1) { c="e2"; }
                    $this.find("#board>div").append("<div class='b "+c+"' style='top:"+((2-0.66+j)*vSize+vOffset[1])+"px;"+
                                                    "left:"+((settings.size[0]+1)*vSize+vOffset[0])+"px;z-index:"+j+"'></div>");
                    $this.find("#board>div").append("<div class='b w' style='top:"+((2-0.66+j)*vSize+vOffset[1])+"px;"+
                                                    "left:"+vOffset[0]+"px;z-index:"+j+"'></div>");
                }

                for (var i in settings.cars) {
                    settings.cars[i].$car = $("<div id='"+i+"' class='c "+settings.cars[i][0].substr(0,2)+"'>"+
                                                "<img src='res/img/tileset/ortho/traffic/"+settings.cars[i][0]+".svg'/></div>");
                    $this.find("#board>div").append(settings.cars[i].$car);
                }
                helpers.update($this);  
        },
        update:function($this) {
            var settings = helpers.settings($this);
            for (var i in settings.cars) {
                settings.cars[i].$car.css("top",((2+settings.cars[i][2]-2/3)*settings.nav.size+settings.nav.offset[1])+"px")
                                     .css("left",((1+settings.cars[i][1])*settings.nav.size+settings.nav.offset[0])+"px")
                                     .css("z-index",settings.cars[i][2]);
            }
            settings.board = helpers.board($this);

            $this.find("#nbmoves .value>div").html(settings.moves.length);
            $this.find("#nbmoves").toggleClass("wrong", settings.moves.length>settings.objective);

            if (settings.board[settings.goal[1]][settings.goal[0]]==0) {
                settings.interactive = false;
                settings.score = 5 - Math.ceil((settings.moves.length-settings.objective)/2);
                if (settings.score<2) { settings.score = 2; }
                if (settings.score>5) { settings.score = 5; }
                $this.find("#good").show();
                setTimeout(function() { helpers.end($this); }, 1500);
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
            for (var i in settings.cars) {
                var vCar = settings.cars[i];
                var vMove = (vCar[0][0]=='h')?[1,0]:[0,1];
                for (var j=0; j<parseInt(vCar[0][1]);j++) {
                    ret[vCar[2]+j*vMove[1]][vCar[1]+j*vMove[0]]=i;
                }
            }
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
                    board           : [],
                    nav             : { offset:[0,0], size:1, id:-1, mouse:0, max:[1,1], move:[0,0] },
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
                if (settings.moves.length) {
                    var sav = settings.moves.pop();
                    for (var i=0; i<settings.cars.length; i++) {
                        settings.cars[i][1] = sav[i][0];
                        settings.cars[i][2] = sav[i][1];
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

