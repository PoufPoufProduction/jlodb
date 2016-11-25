(function($) {
    // Activity default options
    var defaults = {
        name        : "puzzle",                                 // The activity name
        label       : "classic puzzle",                         // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        constraint  : [0,0],                                    // Grid for pieces
        rotation    : 0,                                        // Rotation step
        boundaries  : [-1,-1,-1,-1],                            // Piece move boundaries
        scale       : 1.2,                                      // The move scale of the pieces
        radius      : 20,                                       // The magnetic radius
        zhandling   : true,                                     // Handle the z-index
        pieces      : "pieces",                                 // The pieces group name
        errratio    : 1,                                        // Error ratio
        number      : 1,                                        // Number of puzzle
        fontex      : 1,                                        // Exercice font
        decoyfx     : true,                                     // No magnetic for decoy
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
                
                if (settings.context.onload) { settings.context.onload($this); }

                // Resize the template
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // COMPUTE RATIO
                var vWidth = $this.find("#board").width();
                if ($(settings.svg.root()).attr("title")) {
                    settings.ratio = vWidth/parseInt($(settings.svg.root()).attr("title"));
                }
                else { settings.ratio = vWidth/640; }
                if (settings.ratio<=0) { settings.ratio=1; }

                // CHECK THE DEPARTURE AREA REGARDING THE BOUNDARIES
                if (settings.boundaries[0]!=-1 && settings.boundaries[0]>settings.area[0]) { settings.area[0] = settings.boundaries[0]; }
                if (settings.boundaries[1]!=-1 && settings.boundaries[1]>settings.area[1]) { settings.area[1] = settings.boundaries[1]; }
                if (settings.boundaries[2]!=-1 && settings.boundaries[2]<settings.area[2]) { settings.area[2] = settings.boundaries[2]; }
                if (settings.boundaries[3]!=-1 && settings.boundaries[3]<settings.area[3]) { settings.area[3] = settings.boundaries[3]; }

                // GENERATE VALUES
                if (settings.init && settings.init.pos) {
                    for (var i=0; i<10; i++) { settings.init.pos.sort(function(a,b){return 0.5-Math.random(); }); }
                }
                if (!settings.gen) {
                    if (settings.id && $.isArray(settings.id[0]))       { settings.number = settings.id.length; }
                    if (settings.values && $.isArray(settings.values))  { settings.number = settings.values.length; }
                    if (settings.txt && $.isArray(settings.txt))        { settings.number = settings.txt.length; }
                }
                
                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                $this.find("#guide").html(settings.locale.guide);
                //$.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });

                if (settings.exercice) {
                    $this.find("#exercice #content").html(helpers.format(settings.exercice)).css("font-size",settings.fontex+"em");
                    if (settings.labelex) { $this.find("#exercice #label").html(settings.labelex).show(); }
                    $this.find("#exercice").show();
                }

                helpers.build($this);

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            },
        },
        isdecoy:function($this, _id) {
            var settings = helpers.settings($this);
            var ret = false;
            if (settings.decoys) {
                var decoys = ($.isArray(settings.decoys[0]))?settings.decoys[settings.puzzleid%settings.decoys.length]:settings.decoys;
                for (var i in decoys) { if (decoys[i]==_id) { ret = true; } }
            }
            return ret;
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
            settings.origin.decoys    = [];
            $this.find("#submit").removeClass();
            $this.find(".t").hide();
            var inituse               = [];
            var ids                   = [];
            var nbpieces              = 0;

            // AUTOMATIC GENERATION
            if (settings.gen) {
                var gen = eval('('+settings.gen+')')(settings.puzzleid);
                if (gen.values) { settings.values = gen.values; }
                if (gen.id)     { settings.id = gen.id; }
                if (gen.txt)    { settings.txt = gen.txt; }
                if (gen.show)   { settings.show = gen.show; }
                if (gen.init)	{ settings.init = $.extend(true,{},settings.init,gen.init);}
            }

            // PREPARE THE SCREEN
            if (settings.svgclass) {
                $(settings.svg.root()).attr("class",$.isArray(settings.svgclass)?settings.svgclass[settings.puzzleid]:settings.svgclass);
            }

            // HANDLE THE TEMPLATE IMAGE AND TEXTS
            $this.find("#ttext").removeClass("legend");
            if (settings.timg) {
                var img = $.isArray(settings.timg)?settings.timg[settings.puzzleid]:settings.timg;
                if (img) { $this.find("#timg").html("<img src='res/img/"+img+"'/>").show();
                           $this.find("#ttext").addClass("legend"); }
            }
            if (settings.ttxt) {
                var txt = $.isArray(settings.ttxt)?settings.ttxt[settings.puzzleid]:settings.ttxt;
                if (txt) { $this.find("#ttxt").html(helpers.format(txt)).parent().show(); }
            }

            // HIDE AND SHOW ELEMENT
            if (settings.show) {
                $(".hide",settings.svg.root()).css("display","none");
                var show = $.isArray(settings.show[0])?settings.show[settings.puzzleid]:settings.show;
                for (var i in show) { $("#"+show[i],settings.svg.root()).css("display","inline"); }
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
            if (settings.values) {
                var values = ($.isArray(settings.values))?settings.values[settings.puzzleid]:settings.values;
                for (var i in values) { ids.push(i); }
                nbpieces = ids.length;
            }
            for (var i=0; i<nbpieces; i++) { inituse.push(false); }

            $("#"+settings.pieces+">g",settings.svg.root()).unbind('touchstart mousedown');

            // PARSE ALL THE PIECES
            var count = 0;
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
                    
                    if (!helpers.isdecoy($this, $(this).attr("id")))
                    {
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
                    }
                    else { settings.origin.decoys.push($(this).attr("id")); }

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

                            if ( settings.decoyfx || !helpers.isdecoy($this, $(this).attr("id"))) {
                                $(this).find(".scale").attr("transform","scale("+settings.scale+")");
                            }

                            if (settings.zhandling) { $(this).detach().appendTo($("#"+settings.pieces,settings.svg.root())); }

                            var now = new Date();
                            settings.elt.tick = now.getTime();
                            settings.rottimerid = setTimeout(function() { helpers.rottimer($this);}, 500);
                        }
                        event.preventDefault();
                    });

                    // INITIALIZE THE PIECE
                    var vX = 100, vY = 100, vZ = 0;
                    var id = $(this).attr("id");
                    if (settings.rotation>0 && $(this).find(".rot")) {
                        vZ = settings.rotation*Math.floor(Math.random()*(360/settings.rotation));
                    }
                    if (settings.init) {
                        if (settings.init.id && settings.init.id[id]) {
                            vX = settings.init.id[id][0];
                            vY = settings.init.id[id][1];
                            if (settings.init.id[id].length>2) { vZ = settings.init.id[id][2]; }
                        }
                        else if (settings.init.pos && count<settings.init.pos.length) {
                            vX = settings.init.pos[count][0];
                            vY = settings.init.pos[count][1];
                            if (settings.init.pos[count].length>2) { vZ = settings.init.pos[count][2]; }
                            count++;
                        }
                        else if (settings.init.area) {
                            vX = settings.init.area[0]+Math.floor(Math.random()*(settings.init.area[2]-settings.init.area[0]));
                            vY = settings.init.area[1]+Math.floor(Math.random()*(settings.init.area[3]-settings.init.area[1]));
                        }
                    }
                    $(this).attr("transform", "translate("+vX+" "+vY+")");
                    $(this).find(".rot").attr("transform","rotate("+vZ+")");
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

            // BUILD THE MAGNETIC ZONES
            settings.magzone = [];
            for (var i in settings.origin.translate) {
                settings.magzone.push([settings.origin.translate[i][1], settings.origin.translate[i][2]]); }
            if (settings.magnetic) { for (var i in settings.magnetic) { settings.magzone.push(settings.magnetic[i]); } }
            
            // MOVE PIECES
            $this.bind('touchmove mousemove', function(event) {
                if (settings.interactive && settings.elt.id) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;
                    
                    if (settings.rottimerid) { clearTimeout(settings.rottimerid); }
                    settings.rottimerid = setTimeout(function() { helpers.rottimer($this);}, 1000);
                    
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
            $this.bind('touchend touchleave mouseup mouseleave', function() {
                if (settings.interactive && settings.elt.id) {
                    
                    $this.removeClass("active");
                    $(settings.elt.id).attr("class","");
                    
                    if (settings.rottimerid) { clearTimeout(settings.rottimerid); }

                    // ROTATION ?
                    
                    var tdist = Math.pow( settings.elt.translate.current[0] - settings.elt.translate.origin[0], 2) +
                                Math.pow( settings.elt.translate.current[1] - settings.elt.translate.origin[1], 2);
                               
                    var now         = new Date();
                    var rotation    = -1;
                    if (tdist<10 && now.getTime()-settings.elt.tick<400) { rotation = helpers.rotate($this, $(settings.elt.id)); }

                    // CHECK MAGNETIC
                    if (settings.decoyfx || !helpers.isdecoy($this, $(settings.elt.id).attr("id")))
                    {
                        var dist=-1;
                        var distid=-1;
                        for (var i in settings.magzone) {
                            var d = ((settings.magzone[i][0]-settings.elt.translate.current[0]) *
                                     (settings.magzone[i][0]-settings.elt.translate.current[0])) +
                                    ((settings.magzone[i][1]-settings.elt.translate.current[1]) *
                                     (settings.magzone[i][1]-settings.elt.translate.current[1]));
                            if (dist<0 || d<dist) { dist = d; distid = i; }
                        }
                        if (dist<settings.radius*settings.radius) {
                            settings.elt.translate.current[0] = settings.magzone[distid][0];
                            settings.elt.translate.current[1] = settings.magzone[distid][1];
                        }
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
            if (settings.interactive) {
                settings.interactive = false;

                $this.addClass("finished");

                for (var i in settings.origin.translate) {
                    var translate = [0,0];
                    // BUILD THE LIST OF PIECES PUZZLE WHICH CAN USE THE CURRENT POSITION
                    var pieces = [ settings.origin.translate[i][0] ];
                    if (settings.same) {
                        var vSame = settings.same;
                        if (typeof(vSame[0][0])!="string") { vSame = settings.same[settings.puzzleid]; }

                        for (var si in vSame) for (var sj in vSame[si]) {
                            if (vSame[si][sj]==settings.origin.translate[i][0]) { pieces = vSame[si]; } }
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

                // check if some decoys are on good places 
                if (settings.decoyfx && settings.decoys) {
                    var decoys = ($.isArray(settings.decoys[0]))?settings.decoys[settings.puzzleid%settings.decoys.length]:settings.decoys;
                    for (var i in decoys) {
                        var $piece = $("#"+settings.pieces+">g#"+decoys[i],settings.svg.root());
                        var isActualDecoy = false;
                        for (var j in settings.origin.decoys) { if (settings.origin.decoys[j]==decoys[i]) { isActualDecoy=true; } }
                        if (isActualDecoy && $piece.attr("transform")) {
                            var reg = new RegExp("[( ),]","g");
                            var vSplit = $piece.attr("transform").split(reg);
                            var translate = [vSplit[1], vSplit[2]];
                            for (var t in settings.origin.translate) {
                                if ((settings.origin.translate[t][1]==translate[0])&&(settings.origin.translate[t][2]==translate[1])) {
                                    wrongs++;
                                    $piece.attr("class","wrong");
                                }
                            }
                        }
                    }
                }

                for (var i in settings.origin.translate) {
                    var $piece = $("#"+settings.pieces+">g#"+settings.origin.translate[i][0],settings.svg.root());
                    if (!$piece.attr("class").length) { $piece.attr("class","wrong"); }
                }

                settings.wrongs+=wrongs;
                settings.puzzleid++;

                if (wrongs) { $this.find("#submit").addClass("wrong"); } else { $this.find("#submit").addClass("good"); }
                
                if ( settings.puzzleid<settings.number ) {
                    setTimeout(function() { helpers.rebuild($this); settings.interactive = true; }, wrongs?2500:1000);
                }
                else {
                    settings.interactive = false;
                    settings.score = 5-Math.ceil(settings.errratio*settings.wrongs);
                    if (settings.score<0) { settings.score = 0; }
                    clearTimeout(settings.timer.id);
                    setTimeout(function() { helpers.end($this); }, wrongs?3000:1000);
                }
            }
        },
        rottimer: function($this) {
            var settings = helpers.settings($this);
            helpers.rotate($this, $(settings.elt.id));
            settings.rottimerid = setTimeout(function() { helpers.rottimer($this);}, 400);  
        },
        rotate:function($this, $elt) {
            var settings = helpers.settings($this);
            var rotation    = -1;
            if (settings.rotation>0 && $elt.find(".rot")) {
                var reg = new RegExp("[( ),]","g");
                var vSplit = $elt.find(".rot").attr("transform").split(reg);
                var rotation = parseInt(vSplit[1]);
                rotation = (rotation+settings.rotation)%360;
                $elt.find(".rot").attr("transform","rotate("+rotation+")");
            }
            return rotation;
        }
    };

    // The plugin
    $.fn.puzzle = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive      : false,
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
                        rotate      : [],
                        decoys      : []
                    },
                    puzzleid        : 0,
                    wrongs          : 0,
                    all             : 0,
                    rottimerid      : 0,
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
            submit: function() { helpers.submit($(this)); },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in puzzle plugin!'); }
    };
})(jQuery);

