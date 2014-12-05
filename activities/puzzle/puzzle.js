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
        fullscreen  : false,                                    // Fullscreen
        pieces      : "pieces",                                 // The pieces group name
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
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

                if (settings.rotation==0) { $this.find("#norot").show(); }
                if (settings.fullscreen) { settings.fix = true; $this.find("#submit").hide(); $this.find("#norot").hide(); }

                if (settings.context.onload) { settings.context.onload($this); }

                // Resize the template
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // COMPUTE RATIO
                var vWidth = $this.find("#board").width();
                if ($(settings.svg.root()).attr("title")) {
                    var vReg = new RegExp("[ ]", "g");
                    var vSize = $(settings.svg.root()).attr("title").split(vReg);
                    settings.ratio = vWidth/(vSize[2]-vSize[0]);
                }
                else { settings.ratio = vWidth/640; }
                if (settings.ratio<=0) { settings.ratio=1; }

                // GENERATE VALUES
                if (settings.gen) { settings.values = eval('('+settings.gen+')')(); }

                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                $this.find("#guide").html(settings.locale.guide);
                //$.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });

                if (settings.exercice) { $this.find("#exercice>div").html(settings.exercice).parent().show(); }

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
            settings.nbfixed          = 0;
            $this.find("#submit").removeClass();
            $this.find(".t").hide();
            var inituse               = [];
            var ids                   = [];
            var nbpieces              = 0;

            // PREPARE THE SCREEN
            if (settings.svgclass) {
                $(settings.svg.root()).attr("class",$.isArray(settings.svgclass)?settings.svgclass[settings.puzzleid]:settings.svgclass);
            }

            // HANDLE THE TEMPLATE IMAGE AND TEXTS
            if (settings.timg) {
                var img = $.isArray(settings.timg)?settings.timg[settings.puzzleid]:settings.timg;
                if (img) { $this.find("#timg").html("<img src='res/img/"+img+"'/>").show(); }
            }
            else if (settings.ttxt) {
                var txt = $.isArray(settings.ttxt)?settings.ttxt[settings.puzzleid]:settings.ttxt;
                if (txt) { $this.find("#ttxt").html(txt).parent().show(); }
            }

            // HANDLE TEXT IN SVG
            if (settings.txt) {
                var txt = $.isArray(settings.txt)?settings.txt[settings.puzzleid]:settings.txt;
                for (var i in txt) { $("#"+i,settings.svg.root()).text(txt[i]); }
            }

            // GET PIECES AND NB PIECES
            if (settings.id) {
                ids = ($.isArray(settings.id[0]))?settings.id[settings.puzzleid]:settings.id;
                nbpieces = ids.length;
            }
            else { nbpieces = $("#"+settings.pieces+">g",settings.svg.root()).length; }
            if (!ids.length && settings.values) {
                var values = ($.isArray(settings.values))?settings.values[settings.puzzleid]:settings.values;
                for (var i in values) { ids.push(i); }
                nbpieces = ids.length;
            }
            for (var i=0; i<nbpieces; i++) { inituse.push(false); }

            // PARSE ALL THE PIECES
            $("#"+settings.pieces+">g",settings.svg.root()).each(function(_index) {
                $(this).attr("class","");
                var vOK = true;
                if (ids.length) { vOK = false; for (var i in ids) { vOK = vOK || (ids[i]==$(this).attr("id")); } }

                if (vOK) {
                    // CHECK IF THERE IS A TEXT TO CHANGE
                    if (settings.values) {
                        var values = ($.isArray(settings.values))?settings.values[settings.puzzleid]:settings.values;
                        if (typeof(values[$(this).attr("id")])!="undefined") {$(this).find("text").text(values[$(this).attr("id")]); }
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
                    if (settings.init) {
                        if ($.isArray(settings.init)) {
                            var initid = 0;
                            do { initid = Math.floor(Math.random()*nbpieces); } while(inituse[initid]);
                            inituse[initid]=true;
                            $(this).attr("transform", "translate("+settings.init[initid][0]+" "+settings.init[initid][1]+")");
                            if (settings.init[initid].length>2) {
                                $(this).find(".rot").attr("transform","rotate("+settings.init[initid][2]+")");
                            }
                        }
                        else if (settings.init[$(this).attr("id")]) {
                            $(this).attr("transform", "translate("+settings.init[$(this).attr("id")][0]+
                                                      " "+settings.init[$(this).attr("id")][1]+")");
                            if (settings.init[$(this).attr("id")].length>2) {
                                $(this).find(".rot").attr("transform","rotate("+settings.init[$(this).attr("id")][2]+")");
                            }
                        }
                    }
                    else {
                        var vX = settings.area[0]+Math.floor(Math.random()*(settings.area[2]-settings.area[0]));
                        var vY = settings.area[1]+Math.floor(Math.random()*(settings.area[3]-settings.area[1]));
                        $(this).attr("transform", "translate("+vX+" "+vY+")");

                        // ROTATE THE PIECES
                        if (settings.rotation>0 && $(this).find(".rot")) {
                            $(this).find(".rot").attr("transform","rotate("+
                                (settings.rotation*Math.floor(Math.random()*(360/settings.rotation)))+")");
                        }
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
                    var now         = new Date();
                    var rotation    = -1;
                    if (settings.rotation>0 && $(settings.elt.id).find(".rot")) {
                        var reg = new RegExp("[( ),]","g");
                        var vSplit = $(settings.elt.id).find(".rot").attr("transform").split(reg);
                        var rotation = parseInt(vSplit[1]);

                        if (now.getTime()-settings.elt.tick<settings.tthreshold) {
                            rotation = (rotation+settings.rotation)%360;
                            $(settings.elt.id).find(".rot").attr("transform","rotate("+rotation+")");
                        }
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
                            settings.origin.translate[i][2] == settings.elt.translate.current[1] &&
                            (rotation==-1 || rotation == settings.origin.rotate[settings.origin.translate[i][0]]) );
                    }
                    if (vOK && settings.fix) {
                        $(settings.elt.id).unbind('touchstart mousedown').attr("class","fixed");
                        $this.addClass("fix"+$(settings.elt.id).attr("id"));
                        if (++settings.nbfixed>=settings.origin.translate.length ) {
                            $this.addClass("fixall");
                            if (settings.fullscreen) { helpers.submit($this); }
                        }
                    }

                    // END MOVE
                    $(settings.elt.id).find(".scale").attr("transform","scale(1)");
                    settings.elt.id = 0;
                }
            });
            settings.interactive = true;
        },
        submit: function($this) {
            var settings = helpers.settings($this);
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
                        if (isgood && !settings.fix) { $piece.attr("class","good"); }
                    }
                    if (!findone) { wrongs++;}
                    settings.all++;
                }

                for (var i in settings.origin.translate) {
                    var $piece = $("#"+settings.pieces+">g#"+settings.origin.translate[i][0],settings.svg.root());
                    if (!$piece.attr("class").length) { $piece.attr("class","wrong"); }
                }

                settings.wrongs+=wrongs;
                settings.interactive = false;
                settings.puzzleid++;

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
                    setTimeout(function() { helpers.end($this); }, 1000);
                }
            }
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
                    nbfixed         : 0,
                    puzzleid        : 0,
                    wrongs          : 0,
                    all             : 0,
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
            submit: function() { helpers.submit($(this)); },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
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

