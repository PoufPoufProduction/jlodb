(function($) {
    // Activity default options
    var defaults = {
        name        : "puzzle",                                 // The activity name
        label       : "classic puzzle",                         // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        constraint  : [0,0],
        rotation    : 0,
        tthreshold  : 120,
        boundaries  : [-1,-1,-1,-1],
        area        : [0,0,640,480],                            // The departure area of the pieces
        scale       : 1.2,                                      // The move scale of the pieces
        radius      : 20,                                       // The magnetic radius
        zhandling   : true,                                     // Handle the z-index
        fix         : false,                                    // Fix the well-placed pieces (work with no rotation or doubles)
        pieces      : "pieces",                                 // The pieces group name
        debug       : false                                     // Debug mode
    };

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onQuit)  { ret = "mandatory callback onQuit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onQuit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onQuit({'status':'success','score':settings.score});
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                if (settings.context.onload) { settings.context.onload(true); }

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
                $this.load( templatepath, function(response, status, xhr) {
                    if (status=="error") {
                        settings.context.onquit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                    }
                    else { helpers.loader.svg($this); }
                });
            },
            svg:function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div id='svg'></div>").appendTo($this.find("#board"));
                elt.svg();
                settings.svg = elt.svg('get');
                settings.svg.load( 'res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onLoad) { settings.context.onLoad(false); }

                // Resize the template
                $this.css("font-size", Math.floor($this.height()/16)+"px");
                if (settings.rotation==0) { $this.find("#norot").show(); }

                // COMPUTE RATIO
                var vWidth = $this.find("#board").width();
                if ($(settings.svg.root()).attr("title")) {
                    var vReg = new RegExp("[ ]", "g");
                    var vSize = $(settings.svg.root()).attr("title").split(vReg);
                    settings.ratio = vWidth/(vSize[2]-vSize[0]);
                }
                else { settings.ratio = vWidth/640; }
                if (settings.ratio<=0) { settings.ratio=1; }

                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                $this.find("#guide").html(settings.locale.guide);
                //$.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });

                helpers.build($this);

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            },
        },
        // Update the timer
        timer:function($this) {
            var settings = helpers.settings($this);
            settings.timer.value++;
            var vS = settings.timer.value%60;
            var vM = Math.floor(settings.timer.value/60)%60;
            var vH = Math.floor(settings.timer.value/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            $this.find("#time").text((vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS);
            if (settings.context.onSeconds) { settings.context.onSeconds(settings.timer.value); }
            settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000);
        },
        rebuild: function($this) {
            var settings = helpers.settings($this);
            for (var i in settings.origin.translate) {
                $("#"+settings.pieces+">g#"+settings.origin.translate[i][0],settings.svg.root()).attr("transform",
                    "translate("+settings.origin.translate[i][1]+","+settings.origin.translate[i][2]+")");
            }
            helpers.build($this);
        },
        // Build the question
        build: function($this) {
            var settings = helpers.settings($this);
            settings.origin.translate = [];
            settings.origin.rotate    = {};
            $this.find("#submit").removeClass();
            $this.find(".t").hide();

            // PREPARE THE SCREEN
            if (settings.svgclass) {
                $(settings.svg.root()).attr("class",$.isArray(settings.svgclass)?settings.svgclass[settings.puzzleid]:settings.svgclass);
            }

            // HANDLE THE FOREGROUND IMAGE AND TEXTS
            if (settings.img) {
                var img = $.isArray(settings.img)?settings.img[settings.puzzleid]:settings.img;
                if (img) { $this.find("#timg").html("<img src='res/img/"+img+"'/>").show(); }
            }
            else if (settings.txt) {
                var txt = $.isArray(settings.txt)?settings.txt[settings.puzzleid]:settings.txt;
                if (txt) { $this.find("#ttxt").html(txt).parent().show(); }
                if (settings.comment) { $this.find("#tcomment").html(settings.comment); }
            }

            // PARSE ALL THE PIECES
            $("#"+settings.pieces+">g",settings.svg.root()).each(function(_index) {
                $(this).attr("class","");
                var vOK = true;
                if (settings.id) {
                    var ids = ($.isArray(settings.id[0]))?settings.id[settings.puzzleid]:settings.id;
                    vOK = false;
                    for (var i in ids) { vOK = vOK || (ids[i]==$(this).attr("id")); }
                }

                if (vOK) {
                    // CHECK IF THERE IS A TEXT TO CHANGE
                    if (settings.values) {
                        var values = ($.isArray(settings.values))?settings.values[settings.puzzleid]:settings.values;
                        if (values[$(this).attr("id")]) {$(this).find("text").text(values[$(this).attr("id")]); }
                    }

                    // SAVE THE ORIGINALE POSITION AND ROTATION
                    var translate = [$(this).attr("id"),0,0];
                    if ($(this).attr("transform")) {
                        var reg = new RegExp("[( ),]","g");
                        var vSplit = $(this).attr("transform").split(reg);
                        translate = [$(this).attr("id"),vSplit[1], vSplit[2]];
                    }
                    settings.origin.translate.push(translate);
                    var rotate = [$(this).attr("id"),0];
                    if ($(this).find(".rot") && $(this).find(".rot").attr("transform")) {
                        var reg = new RegExp("[( ),]","g");
                        var vSplit = $(this).find(".rot").attr("transform").split(reg);
                        rotate = [ $(this).attr("id"),vSplit[1]];
                    }
                    settings.origin.rotate[rotate[0]]=rotate[1];

                    // CLICK ON PIECES
                    $(this).bind('touchstart mousedown', function(event) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;

                        if (!settings.timer.id) { settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000); }
                        if (settings.interactive) {
                            settings.elt.id = this;
                            settings.elt.translate = [0,0];
                            if ($(this).attr("transform")) {
                                var reg = new RegExp("[( ),]","g");
                                var vSplit = $(this).attr("transform").split(reg);
                                settings.elt.translate.origin = [parseInt(vSplit[1]), parseInt(vSplit[2])];
                                settings.elt.translate.current = [parseInt(vSplit[1]), parseInt(vSplit[2])];
                            }
                            $(this).attr("class","drag");
                            $this.addClass("active");
                            settings.mouse = [ vEvent.clientX, vEvent.clientY];

                            if (settings.scale) { $(this).find(".scale").attr("transform","scale("+settings.scale+")"); }
                            if (settings.zhandling) { $(this).detach().appendTo($("#"+settings.pieces,settings.svg.root())); }

                            var now = new Date();
                            settings.elt.tick = now.getTime();
                        }
                        event.preventDefault();
                    });

                    // MOVE THE PIECE
                    var vX = settings.area[0]+Math.floor(Math.random()*(settings.area[2]-settings.area[0]));
                    var vY = settings.area[1]+Math.floor(Math.random()*(settings.area[3]-settings.area[1]));
                    $(this).attr("transform", "translate("+vX+" "+vY+")");

                    // ROTATE THE PIECES
                    if (settings.rotation>0 && $(this).find(".rot")) {
                        $(this).find(".rot").attr("transform","rotate("+
                            (settings.rotation*Math.floor(Math.random()*(360/settings.rotation)))+")");
                    }
                }
                else {
                    $(this).attr("class","disable");
                }
            });

            // MIX THE PIECES Z-ORDER
            var nb = $("#"+settings.pieces+">g",settings.svg.root()).length;
            for (var i=0; i<nb; i++) {
                var idx = Math.floor(Math.random()*nb);
                $($("#"+settings.pieces+">g",settings.svg.root()).get(idx)).detach().appendTo($("#"+settings.pieces,settings.svg.root()));
            }

            // MOVE PIECES
            $(settings.svg.root()).bind('touchmove mousemove', function(event) {
                var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                              event.originalEvent.touches[0]:event;
                if (settings.interactive && settings.elt.id) {
                    // COMPUTE TRANSLATION_X
                    var vX = settings.elt.translate.origin[0];
                    if (settings.constraint[0]==0) {
                        vX += (vEvent.clientX-settings.mouse[0])/settings.ratio;
                    }
                    else if (settings.constraint[0]>0) {
                        var vValue = ((vEvent.clientX-settings.mouse[0])/settings.ratio)/settings.constraint[0];
                        var vStep = Math.round(vValue);
                        var vOffset = Math.pow((vValue-vStep)*2,5)/2;
                        vX += (vStep+vOffset) * settings.constraint[0];
                    }

                    // COMPUTE TRANSLATION_Y
                    var vY = settings.elt.translate.origin[1];
                    if (settings.constraint[1]==0) {
                        vY += (vEvent.clientY-settings.mouse[1])/settings.ratio;
                    }
                    else if (settings.constraint[1]>0) {
                        var vValue = ((vEvent.clientY-settings.mouse[1])/settings.ratio)/settings.constraint[1]
                        var vStep = Math.round(vValue);
                        var vOffset = Math.pow((vValue-vStep)*2,5)/2;
                        vY += (vStep+vOffset)  * settings.constraint[1];
                    }

                    if (settings.boundaries[0]>=0 && vX<settings.boundaries[0]) { vX = settings.boundaries[0]; }
                    if (settings.boundaries[1]>=0 && vY<settings.boundaries[1]) { vY = settings.boundaries[1]; }
                    if (settings.boundaries[2]>=0 && vX>settings.boundaries[2]) { vX = settings.boundaries[2]; }
                    if (settings.boundaries[3]>=0 && vY>settings.boundaries[3]) { vY = settings.boundaries[3]; }

                    settings.elt.translate.current = [vX,vY];
                    $(settings.elt.id).attr("transform", "translate("+vX+" "+vY+")");
                }
                event.preventDefault();
            });

            // RELEASE PIECES
            $(settings.svg.root()).bind('touchend mouseup', function() {
                $this.removeClass("active");
                if (settings.interactive && settings.elt.id) {
                    $(settings.elt.id).attr("class","");

                    // ROTATION ?
                    var now = new Date();
                    if (now.getTime()-settings.elt.tick<settings.tthreshold&&settings.rotation>0&&$(settings.elt.id).find(".rot")) {
                        var reg = new RegExp("[( ),]","g");
                        var vSplit = $(settings.elt.id).find(".rot").attr("transform").split(reg);
                        $(settings.elt.id).find(".rot").attr("transform","rotate("+((parseInt(vSplit[1])+settings.rotation)%360)+")");
                    }

                    // CHECK MAGNETIC
                    var dist=-1;
                    var distid=-1;
                    for (var i in settings.origin.translate) {
                        var d = ((settings.origin.translate[i][1]-settings.elt.translate.current[0]) *
                                 (settings.origin.translate[i][1]-settings.elt.translate.current[0])) +
                                ((settings.origin.translate[i][2]-settings.elt.translate.current[1]) *
                                 (settings.origin.translate[i][2]-settings.elt.translate.current[1]));
                        if (dist<0 || d<dist) { dist = d; distid = i; }
                    }
                    if (dist<settings.radius*settings.radius) {
                        settings.elt.translate.current[0] = settings.origin.translate[distid][1];
                        settings.elt.translate.current[1] = settings.origin.translate[distid][2];
                    }

                    $(settings.elt.id).attr("transform","translate("+settings.elt.translate.current[0]+" "+
                                                                     settings.elt.translate.current[1]+")");

                    // CHECK THE POSITION
                    var vOK = false;
                    for (var i in settings.origin.translate) {
                        vOK= vOK || (settings.origin.translate[i][0] == $(settings.elt.id).attr("id") &&
                            settings.origin.translate[i][1] == settings.elt.translate.current[0] &&
                            settings.origin.translate[i][2] == settings.elt.translate.current[1] );
                    }
                    if (vOK && settings.fix) { $(settings.elt.id).unbind('touchstart mousedown').attr("class","fixed"); }

                    // END MOVE
                    $(settings.elt.id).find(".scale").attr("transform","scale(1)");
                    settings.elt.id = 0;
                }
            });
            settings.interactive = true;
        }
    };

    // The plugin
    $.fn.puzzle = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    timer: {                // the general timer
                        id      : 0,        // the timer id
                        value   : 0         // the timer value
                    },
                    elt         : {
                        id          : 0,
                        tick        : 0,
                        translate   : { origin: [0,0], current: [0,0] }
                    },
                    interactive : false,
                    origin      : {
                        translate   : [],
                        rotate      : []
                    },
                    puzzleid        : 0,
                    wrongs          : 0,
                    all             : 0,
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
            submit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                var wrongs =0;
                if (!settings.finish) {
                    for (var i in settings.origin.translate) {
                        var translate = [0,0];

                        // BUILD THE LIST OF PIECES PUZZLE WHICH CAN USE THE CURRENT POSITION
                        var pieces = [ settings.origin.translate[i][0] ];
                        if (settings.same) {
                            for (var si in settings.same) for (var sj in settings.same[si]) {
                                if (settings.same[si][sj]==settings.origin.translate[i][0]) { pieces = settings.same[si]; } }
                        }

                        // CHECK IF THE POSITION OF EACH PIECES IN THE LIST IS MATCHING THE CURRENT POSITION
                        var findone = false;
                        for (var p in pieces) {
                            var isgood = false;
                            var $piece = $("#"+settings.pieces+">g#"+pieces[p],settings.svg.root());
                            if ($piece.attr("transform")) {
                                var reg = new RegExp("[( ),]","g");
                                var vSplit = $piece.attr("transform").split(reg);
                                translate = [vSplit[1], vSplit[2]];
                            }
                            if ((settings.origin.translate[i][1]==translate[0])&&(settings.origin.translate[i][2]==translate[1])) {
                                isgood = true;
                                // CHECK THE ROTATION
                                if (settings.rotation && $piece.find(".rot") && $piece.find(".rot").attr("transform")) {
                                    var reg = new RegExp("[( ),]","g");
                                    var vSplit = $piece.find(".rot").attr("transform").split(reg);
                                    var diff = 360+parseInt(settings.origin.rotate[settings.origin.translate[i][0]])-parseInt(vSplit[1]);
                                    var modulo = (settings.sym&&settings.sym[pieces[p]])?settings.sym[pieces[p]]:360;
                                    if (diff%modulo!=0) { isgood = false; }
                                }
                            }
                            findone |= isgood;
                            if (isgood) { $piece.attr("class","good"); }
                        }
                        if (!findone) { wrongs++;}
                        settings.all++;
                    }

                    settings.wrongs+=wrongs;
                    settings.interactive = false;
                    settings.puzzleid++;
                    $(this).find('#valid').hide();

                    if (wrongs) { $this.find("#submit").addClass("wrong"); } else { $this.find("#submit").addClass("good"); }

                    if ( (settings.id && $.isArray(settings.id[0]) && settings.puzzleid<settings.id.length) ||
                         (settings.values && $.isArray(settings.values) && settings.puzzleid<settings.values.length) ) {
                        setTimeout(function() { helpers.rebuild($this); }, 1000);
                    }
                    else {
                        settings.finish = true;
                        var ratio = (settings.all<6)?Math.floor(6/settings.all):1;
                        settings.score = 5-ratio*settings.wrongs;
                        if (settings.score<0) { settings.score = 0; }
                        clearTimeout(settings.timer.id);
                        helpers.end($this);
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#splash").hide();
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in puzzle plugin!'); }
    };
})(jQuery);

