(function($) {
    // Activity default options
    var defaults = {
        name        : "puzzle",                                 // The activity name
        label       : "classic puzzle",                         // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        constraint  : [0,0],                                    // Grid for pgroup
        rotation    : 0,                                        // Rotation step
        boundaries  : [-1,-1,-1,-1],                            // Piece move boundaries
        delay       : [1000,3000],                              // Delay before end [good, wrong]
        scale       : 1.2,                                      // The move scale of the pgroup
        radius      : 20,                                       // The magnetic radius
        zhandling   : true,                                     // Handle the z-index
        withrottimer: true,
        pieces      : "pieces",                                 // The pgroup group name
        errratio    : 1,                                        // Error ratio
        number      : 1,                                        // Number of puzzle
        fontex      : 1,                                        // Exercice font
        decoyfx     : true,                                     // No magnetic for decoy
        width       : 640,
        background  : "",
        cumul       : [],
        debug       : true                                      // Debug mode
    };


    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",      "<div class='icon' style='float:left'><img src='$1'/></div>",
        "\\\[icon2\\\]([^\\\[]+)\\\[/icon2\\\]",    "<div class='icon' style='float:left;font-size:2em;'><img src='$1'/></div>",
        "\\\[icon3\\\]([^\\\[]+)\\\[/icon3\\\]",    "<div class='icon' style='float:left;font-size:3em;'><img src='$1'/></div>",
        "\\\[icon4\\\]([^\\\[]+)\\\[/icon4\\\]",    "<div class='icon' style='float:left;font-size:4em;'><img src='$1'/></div>",
        "\\\[code](.+)\\\[/code]",                  "<div class='code'>$1</div>"
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

                // COMPUTE RATIO
                if ($(settings.svg.root()).attr("title")) { settings.width = parseInt($(settings.svg.root()).attr("title")); }

                // CHECK THE DEPARTURE AREA REGARDING THE BOUNDARIES
                if (settings.boundaries[0]!=-1 && settings.boundaries[0]>settings.area[0]) { settings.area[0] = settings.boundaries[0]; }
                if (settings.boundaries[1]!=-1 && settings.boundaries[1]>settings.area[1]) { settings.area[1] = settings.boundaries[1]; }
                if (settings.boundaries[2]!=-1 && settings.boundaries[2]<settings.area[2]) { settings.area[2] = settings.boundaries[2]; }
                if (settings.boundaries[3]!=-1 && settings.boundaries[3]<settings.area[3]) { settings.area[3] = settings.boundaries[3]; }

                // GENERATE VALUES
                if (settings.init && settings.init.pos) {
                    for (var i=0; i<settings.init.pos.length; i++) { settings.init.pos.sort(function(a,b){return 0.5-Math.random(); }); }
                }
                if (!settings.gen) {
                    if (settings.id && $.isArray(settings.id[0]))       { settings.number = settings.id.length; }
                    if (settings.values && $.isArray(settings.values))  { settings.number = settings.values.length; }
                    if (settings.txt && $.isArray(settings.txt))        { settings.number = settings.txt.length; }
                }
                
                // LOCALE HANDLING

                $this.find("#guide").html(settings.locale.guide);
                //$.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); });

                if (settings.exercice) {
                    $this.find("#exercice #content").html(helpers.format(settings.exercice)).css("font-size",settings.fontex+"em");
                    if (settings.labelex) { $this.find("#exercice #label").html(settings.labelex).show(); }
                    $this.find("#exercice").show();
                }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

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
            for (var i in settings.elts) {
                helpers.update($this, i, settings.elts[i].origin.translate, settings.elts[i].origin.rotate).hide();
            }
            helpers.build($this);
        },
        // Build the question
        build: function($this) {
            var settings = helpers.settings($this);
            settings.elts             = {};
            $this.find("#submit").removeClass();
            $this.find(".t").hide();
            var inituse               = [];
            var ids                   = [];
            var nbpgroup              = 0;
            var pgroup                = $.isArray(settings.pieces)?settings.pieces[settings.puzzleid]:settings.pieces;
            
            // AUTOMATIC GENERATION
            if (settings.gen) {
                var gen = eval('('+settings.gen+')')($this,settings,settings.puzzleid);
                if (gen.values) { settings.values = gen.values; }
                if (gen.id)     { settings.id = gen.id; }
                if (gen.txt)    { settings.txt = gen.txt; }
                if (gen.ttxt)   { settings.ttxt = gen.ttxt; }
                if (gen.show)   { settings.show = gen.show; }
                if (gen.decoys) { settings.decoys = gen.decoys; }
                if (gen.add)    { settings.add = gen.add; }
                if (gen.svgclass)    { settings.svgclass = gen.svgclass; }
                if (gen.same)    { settings.same = gen.same; }
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
                if (img) {
					if (img.indexOf(".svg")!=-1) 	{ $this.find("#timg").html("<img src='"+img+"'/>").show(); }
					else							{ $this.find("#timg").html(img).show(); }
                    $this.find("#ttext").addClass("legend"); }
            }
            if (settings.ttxt) {
                var txt = $.isArray(settings.ttxt)?settings.ttxt[settings.puzzleid]:settings.ttxt;
                if (txt) { $this.find("#ttxt").html(helpers.format(txt.toString())).parent().show(); }
            }

            // HIDE AND SHOW ELEMENT
            $("#"+pgroup+">g").css("display","none");
            $("#"+pgroup).show();
            $(".hide",settings.svg.root()).css("display","none");
            if (settings.show) {
                var show = $.isArray(settings.show[0])?settings.show[settings.puzzleid]:settings.show;
                for (var i in show) { $("#"+show[i],settings.svg.root()).css("display","inline"); }
            }

            // HANDLE STATIC TEXT OR IMAGE IN SVG
            if (settings.txt) {
                var txt = $.isArray(settings.txt)?settings.txt[settings.puzzleid]:settings.txt;
                for (var i in txt) {
                    if (txt[i].toString().indexOf(".svg")!=-1)  { $("#"+i,settings.svg.root()).attr("xlink:href",txt[i]).show(); }
					else 							            { $("#"+i,settings.svg.root()).text(txt[i]).show(); }
                }
            }
            
            // HANDLE STATIC SVG ELEMENT
            $(".puzzleadd",settings.svg.root()).detach();
            if (settings.add) {
                var add = $.isArray(settings.add)?settings.add[settings.puzzleid]:settings.add;
                for (var i in add) {
                    switch(add[i][0]) {
                        case "rect" :
                            settings.svg.rect($("#"+i,settings.svg.root()), add[i][1], add[i][2], add[i][3], add[i][4],
                                              {'class':'puzzleadd'});
                            break;
                        case "circle" :
                            settings.svg.circle($("#"+i,settings.svg.root()), add[i][1], add[i][2], add[i][3], {'class':'add'});
                            break;
                    }
                }
            }
            
            // FIX THE ROTATION OF PIECES
            if (settings.rot) {
                var rot = $.isArray(settings.rot)?settings.rot[settings.puzzleid]:settings.rot;
                for (var i in rot) {$("#"+i+" .rot",settings.svg.root()).attr("transform","rotate("+rot[i]+")"); }
				
            }
            
            // FIX THE TRANSLATION OF PIECES
            if (settings.mov) {
                var mov = $.isArray(settings.mov)?settings.mov[settings.puzzleid]:settings.mov;
                for (var i in mov) {$("#"+i,settings.svg.root()).attr("transform","translate("+rot[i][0]+","+rot[i][1]+")"); }
            }

            // GET PIECES AND NB PIECES
            if (settings.id) {
                ids = ($.isArray(settings.id[0]))?settings.id[settings.puzzleid]:settings.id;
                nbpgroup = ids.length;
            }
            else { nbpgroup = $("#"+pgroup+">g",settings.svg.root()).length; }
            if (settings.values) {
                var values = ($.isArray(settings.values))?settings.values[settings.puzzleid]:settings.values;
                for (var i in values) { ids.push(i); }
                nbpgroup = ids.length;
            }
            for (var i=0; i<nbpgroup; i++) { inituse.push(false); }

            $("#"+pgroup+">g",settings.svg.root()).unbind('touchstart mousedown');

            // PARSE ALL THE PIECES
            var count = 0, idcount = 0;
            
            $("#"+pgroup+">g",settings.svg.root()).each(function(_index) {
                $(this).attr("class","");
                var vOK = true;
                
                if (!$(this).attr("id")) { $(this).attr("id","ipp"+(idcount++)); }
                
                if (ids.length) { vOK = false; for (var i in ids) { vOK = vOK || (ids[i]==$(this).attr("id")); } }

                if (vOK) {
                    // DYNAMIC TEXT/IMAGE TO CHANGE
                    if (settings.values) {
                        var values = ($.isArray(settings.values))?settings.values[settings.puzzleid]:settings.values;
                        var txt    = values[$(this).attr("id")];
                        if (typeof(txt)!="undefined") {
                            txt = txt.toString();
							if (!$.isArray(txt)) { txt = [txt]; }
							for (var i in txt) {
								if (txt[i].toString().indexOf(".svg")!=-1)  { $(this).find("image").attr("xlink:href",txt[i]).show(); }
								else 							            { $(this).find("text").text(txt[i]).show(); }
							}
						}
                    }

                    // GET THE ORIGINALE POSITION AND ROTATION FROM SVG ATTRIBUTES
                    var translate = [0,0];
                    if ($(this).attr("transform")) {
                        var reg = new RegExp("[( ),]","g");
                        var vSplit = $(this).attr("transform").split(reg);
                        translate = [parseFloat(vSplit[1]), parseFloat(vSplit[2])];
                    }
                    var rotate = 0;
                    if ($(this).find(".rot") && $(this).find(".rot").last().attr("transform")) {
                        var reg = new RegExp("[( ),]","g");
                        var vSplit = $(this).find(".rot").last().attr("transform").split(reg);
                        rotate = parseFloat(vSplit[1]);
                    }
                    var elt = { $elt   : $(this),
                                good   : false,
                                origin : { translate:translate, rotate:rotate },
                                decoy  : (helpers.isdecoy($this, $(this).attr("id"))) };
                    settings.elts[$(this).attr("id")] = elt;
                    
                    // CLICK ON PIECES
                    $(this).bind('touchstart mousedown', function(event) {

                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;
                                
                        settings.ratio = $this.find("#board").width()/settings.width;

                        if (!settings.timer.id) { settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000); }
                        if (settings.interactive) {
                            $(this).attr("class","drag");
                            $this.addClass("active");
                            
                            settings.action.id      = $(this).attr("id");
                            settings.action.mouse   = [ vEvent.clientX, vEvent.clientY];
                            
                            // GET THE ELEMENT
                            var elt = settings.elts[settings.action.id];
                            elt.begin               = [ elt.current.translate[0], elt.current.translate[1] ];

                            if ( settings.decoyfx || !elt.decoy) {
                                $(this).find(".scale").attr("transform","scale("+settings.scale+")");
                            }

                            if (settings.zhandling) { $(this).detach().appendTo($("#"+pgroup,settings.svg.root())); }

                            var now = new Date();
                            settings.action.tick  = now.getTime();
                            settings.rottimerid   = setTimeout(function() { helpers.rottimer($this);}, 500);
                        }
                        event.preventDefault();
                    });

                    // INITIALIZE THE PIECE
                    var vX = translate[0], vY = translate[1], vZ = rotate;
                    var id = $(this).attr("id");
                    if (settings.rotation>0 && $(this).find(".rot") && $(this).find(".rot").length) {
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
                    helpers.update($this, id, [vX,vY], vZ).show();
                }
                else { $(this).attr("class","disable"); }
            });

            // MIX THE PIECES Z-ORDER
            var nb = $("#"+pgroup+">g",settings.svg.root()).length;
            for (var i=0; i<nb; i++) {
                var idx = Math.floor(Math.random()*nb);
                $($("#"+pgroup+">g",settings.svg.root()).get(idx)).detach().appendTo($("#"+pgroup,settings.svg.root()));
            }

            // BUILD THE MAGNETIC ZONES
            settings.magzone = [];
            for (var i in settings.elts) {
                settings.magzone.push([settings.elts[i].origin.translate[0], settings.elts[i].origin.translate[1]]); }
            if (settings.magnetic) { for (var i in settings.magnetic) {
				var m = settings.magnetic[i];
				if (m.length==6) {
					for (var ii=0; ii<m[4]; ii++) for (var jj=0; jj<m[5]; jj++) {
						settings.magzone.push([m[0]+m[2]*ii,m[1]+m[3]*jj]);
					}
				}
				else { settings.magzone.push(m); }
			} }
            
            // MOVE PIECES
            $this.bind('touchmove mousemove', function(event) {
                if (settings.interactive && settings.action.id) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;
                    
                    if (settings.rottimerid) { clearTimeout(settings.rottimerid); }
                    settings.rottimerid = setTimeout(function() { helpers.rottimer($this);}, 1000);
                    
                    // GET THE ELEMENT
                    var elt = settings.elts[settings.action.id];
                    
                    // COMPUTE TRANSLATION_X
                    var vX = elt.begin[0];
                    if (settings.constraint[0]==0) {
                        vX += (vEvent.clientX-settings.action.mouse[0])/settings.ratio;
                    }
                    else if (settings.constraint[0]>0) {
                        var vValue = ((vEvent.clientX-settings.action.mouse[0])/settings.ratio)/settings.constraint[0];
                        var vStep = Math.round(vValue);
                        var vOffset = Math.pow((vValue-vStep)*2,5)/2;
                        vX += (vStep+vOffset) * settings.constraint[0];
                    }

                    // COMPUTE TRANSLATION_Y
                    var vY = elt.begin[1];
                    if (settings.constraint[1]==0) {
                        vY += (vEvent.clientY-settings.action.mouse[1])/settings.ratio;
                    }
                    else if (settings.constraint[1]>0) {
                        var vValue = ((vEvent.clientY-settings.action.mouse[1])/settings.ratio)/settings.constraint[1]
                        var vStep = Math.round(vValue);
                        var vOffset = Math.pow((vValue-vStep)*2,5)/2;
                        vY += (vStep+vOffset)  * settings.constraint[1];
                    }

                    if (settings.boundaries[0]>=0 && vX<settings.boundaries[0]) { vX = settings.boundaries[0]; }
                    if (settings.boundaries[1]>=0 && vY<settings.boundaries[1]) { vY = settings.boundaries[1]; }
                    if (settings.boundaries[2]>=0 && vX>settings.boundaries[2]) { vX = settings.boundaries[2]; }
                    if (settings.boundaries[3]>=0 && vY>settings.boundaries[3]) { vY = settings.boundaries[3]; }

                    helpers.update($this, settings.action.id, [vX, vY], elt.current.rotate);
                }
                event.preventDefault();
            });

            // RELEASE PIECES
            $this.bind('touchend touchleave mouseup mouseleave', function() {
                if (settings.interactive && settings.action.id) {
                    
                    // GET THE ELEMENT
                    var elt = settings.elts[settings.action.id];
                    
                    $this.removeClass("active");
                    elt.$elt.attr("class","");
                    
                    if (settings.rottimerid) { clearTimeout(settings.rottimerid); }

                    // HANDLE ROTATION
                    var tdist = Math.pow( elt.current.translate[0] - elt.begin[0], 2) +
                                Math.pow( elt.current.translate[1] - elt.begin[1], 2);
                    var now         = new Date();
                    var rotation    = -1;
                    if (tdist<10 && now.getTime()-settings.action.tick<400) {
                        elt.current.rotate = (elt.current.rotate+settings.rotation)%360;
                    }
					
					// STAY IN DESKTOP
					if (elt.current.translate[0]<0) 					{ elt.current.translate[0] = 0; }
					if (elt.current.translate[1]<0) 					{ elt.current.translate[1] = 0; }
					if (elt.current.translate[0]>settings.width) 		{ elt.current.translate[0] = settings.width; }
					
					var footer = $this.hasClass("exup")?0.8:1;
					if (elt.current.translate[1]>3*footer*settings.width/4) 	{ elt.current.translate[1] = 3*footer*settings.width/4; }

                    // CHECK MAGNETIC
                    if (settings.decoyfx || !elt.decoy)
                    {
                        var dist=-1;
                        var distid=-1;
                        for (var i in settings.magzone) {
                            var d = ((settings.magzone[i][0]-elt.current.translate[0]) *
                                     (settings.magzone[i][0]-elt.current.translate[0])) +
                                    ((settings.magzone[i][1]-elt.current.translate[1]) *
                                     (settings.magzone[i][1]-elt.current.translate[1]));
                            if (dist<0 || d<dist) { dist = d; distid = i; }
                        }
                        if (distid!=-1 && dist<settings.radius*settings.radius) {
                            elt.current.translate[0] = settings.magzone[distid][0];
                            elt.current.translate[1] = settings.magzone[distid][1];
                        }
                        
                        // CHECK IF CUMUL IS AUTHORIZED HERE
                        var cumul = (typeof(settings.cumul)=="boolean")?settings.cumul:false;
                        if (typeof(settings.cumul)=="object") for (var c in settings.cumul) {
                            if (settings.cumul[c][0] == elt.current.translate[0] &&
                                settings.cumul[c][1] == elt.current.translate[1] ) { cumul = true; }
                        }
                        
                        // AVOID STACK BY DEPLACING PIECE AT SAME PLACE
                        if (!cumul) for (var i in settings.elts) {
                            
                            if (settings.action.id != i &&
                                elt.current.translate[0] == settings.elts[i].current.translate[0] &&
                                elt.current.translate[1] == settings.elts[i].current.translate[1] )
                            {
                                var a=Math.random()*2*Math.PI;
                                helpers.update($this, i,
                                    [ settings.elts[i].current.translate[0] +settings.radius*1.2*Math.cos(a) ,
                                      settings.elts[i].current.translate[1] +settings.radius*1.2*Math.sin(a) ],
                                      settings.elts[i].current.rotate);
                            }
                        }
                    }

                    helpers.update($this, settings.action.id, elt.current.translate,elt.current.rotate)
                           .find(".scale").attr("transform","scale(1)");
                    settings.action.id = 0;
                }
            });
            settings.interactive = true;
        },
        update: function($this, _id, _pos, _rot) {
            var settings = helpers.settings($this);
            var elt = settings.elts[_id];
            var ret = 0;
            if (elt) {
                ret = elt.$elt;
                elt.$elt.find(".rot").attr("transform","rotate("+_rot+")");
                elt.$elt.attr("transform", "translate("+_pos[0]+" "+_pos[1]+")");
                elt.current = { translate: _pos, rotate: _rot };
            }
            return ret;
        },
        submit: function($this) {
            var settings = helpers.settings($this);
            var wrongs =0;
            if (settings.interactive) {
                settings.interactive = false;

                $this.addClass("finished");

                for (var i in settings.elts) {
                    // BUILD THE LIST OF PIECES PUZZLE WHICH CAN USE THE CURRENT POSITION
                    var elt    = settings.elts[i];
                    if (!elt.decoy) {
                        var pieces = [ i ];
                        if (settings.same) {
                            var vSame = settings.same;
                            if (vSame=="all") { pieces=Object.keys(settings.elts); }
                            else {
                                if (typeof(vSame[0][0])!="string") { vSame = settings.same[settings.puzzleid]; }
                                for (var si in vSame) for (var sj in vSame[si]) { if (vSame[si][sj]==i) { pieces = vSame[si]; } }
                            }
                        }
                        
                        // CHECK IF THE POSITION OF EACH PIECES IN THE LIST IS MATCHING THE CURRENT POSITION
                        for (var p in pieces) {
                            var isgood = false;
                            var target = settings.elts[pieces[p]];
                            
                            if ( target &&
								(target.current.translate[0]==elt.origin.translate[0])&&
                                (target.current.translate[1]==elt.origin.translate[1])) {
                                isgood = true;
                                // CHECK THE ROTATION
                                if (settings.rotation) {
                                    var diff = 360+target.current.rotate-elt.origin.rotate;
                                    var modulo = 360;
                                    if (settings.sym) {
                                        if (settings.sym["all"])    { modulo = settings.sym["all"]; }
                                        if (settings.sym[pieces[p]]){ modulo = settings.sym[pieces[p]]; }
                                    }
                                    if (diff%modulo!=0) { isgood = false; }
                                }
                            }
                            if (isgood) {
                                target.$elt.attr("class","good");
                                target.good = true;
                            }
                        }
                    }
                }

                for (var i in settings.elts) {
                    var elt = settings.elts[i];
                    var wrong = false;
                    if (elt.decoy) {
                        // CHECK IF DECOY IS IN A GOOD PLACE
                        for (var j in settings.elts) {
                            var piece = settings.elts[j];
                            if (!piece.decoy && piece.origin.translate[0]==elt.current.translate[0]
                                             && piece.origin.translate[1]==elt.current.translate[1] ) { wrong = true; }
                        }
                    }
                        // DISPLAY PIECES AT WRONG PLACE
                    else if (!elt.good) { wrong = true; }
                    
                    if (wrong) { wrongs++; elt.$elt.attr("class","wrong"); }
                }

                
                
                
                settings.wrongs+=wrongs;
                settings.puzzleid++;

                if (wrongs) { $this.find("#submit").addClass("wrong"); } else { $this.find("#submit").addClass("good"); }
                
                if ( settings.puzzleid<settings.number ) {
                    setTimeout(function() { helpers.rebuild($this); settings.interactive = true; },
                        wrongs?settings.delay[1]:settings.delay[0]);
                }
                else {
                    settings.interactive = false;
                    settings.score = 5-Math.ceil(settings.errratio*settings.wrongs);
                    if (settings.score<0) { settings.score = 0; }
                    clearTimeout(settings.timer.id);
                    setTimeout(function() { helpers.end($this); }, wrongs?settings.delay[1]:settings.delay[0]);
                }
            }
        },
        rotate: function($this, _id) {
            var settings = helpers.settings($this);
            var elt = settings.elts[_id];
            if (elt) {
                elt.current.rotate = (elt.current.rotate+settings.rotation)%360;
                helpers.update($this, _id, elt.current.translate, elt.current.rotate);
            }
        },
        rottimer: function($this) {
            var settings = helpers.settings($this);
            if (settings.withrottimer) {
                helpers.rotate($this, settings.action.id);
                settings.rottimerid = setTimeout(function() { helpers.rottimer($this);}, 400);
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
                    action          : { id:0, mouse:[] },
                    elts            : {},
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

