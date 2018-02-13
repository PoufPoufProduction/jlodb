(function($) {
    // Activity default options
    var defaults = {
        name        : "geometry",               // The activity name
        template    : "template.html",          // Activity's html template
        filename    : "desktop/geometry/default.svg",   // The initial svg filename
        css         : "style.css",              // Activity's css style sheet
        lang        : "fr",                     // Current localization
        score       : 1,                        // The score (from 1 to 5)
        radius      : 10,                       // The initial default radius
        radiusrange : [10,20],                  // The random radius range
        circle      : "any",                    // The circle mode ("1point","2points" or "any")
        number      : 1,                        // Minimal number of elements for getting the best score
        zone        : 16,                       // The distance of catching area
        strokewidth : 1.5,                      // The stroke size
        sizepoint   : 8,                        // The point stroke size
        hlcolor     : "blue",                   // The highlight color
        goodcolor   : "#004488",                // The matching color
        color       : "black",                  // The current color
        color2      : 0,                        // The color used after init
        translate   : [0,0],                    // The translation values
        timerend    : 2000,                     // Timer before display the score panel
        style       : false,                    // The style changing is disable
        withcancel  : false,                    // Show cancel2 button (for "large" class usage)
        withzoom    : false,                    // Show id zoom for small dots
        active      : false,                      // Activate all data by default
        background  : "",                       // Add a background
        debug       : true                      // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[bb\\\](.+)\\\[/bb\\\]",                "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>",
        "\\\[small\\\](.+)\\\[/small\\\]",          "<div class='small'>$1</div>"
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

                // SEND THE ONLOAD CALLBACK
                if (settings.context.onload) { settings.context.onload($this); }

                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                // HANDLE THE BUTTONS
                if (settings.available) {
                    $this.find(".action").addClass("disable");
                    for (var i in settings.available) { $this.find("#"+settings.available[i]).removeClass("disable"); }
                }
                if (!settings.style) { $this.find(".simple").addClass("disable"); }
                if (settings.selected) {
					$this.find("#"+settings.selected).addClass("s");
                    settings.controls.action = settings.selected;
                    settings.controls.mask = settings.mask[settings.controls.action][0];
                }
                

                // MANAGE THE OBJECTIVES
                if (settings.statement) {
                    if ($.isArray(settings.statement)) {
                        var html=""; for (var i in settings.statement) { html+="<div>"+helpers.format(settings.statement[i])+"</div>"; }
                        $this.find("#statement").html(html);
                    }
                    else { $this.find("#statement").html(helpers.format(settings.statement)); }
                }
                for (var i in settings.labels) {
                    $this.find("#objectives").append("<tr><td><div class='icon' style='cursor:default;'>"+
                        "<img src='res/img/default/icon/check_unchecked01.svg' alt='x'/></div></td><td>&#xA0;"+
                        helpers.format(settings.labels[i])+"</td></tr>");
                }
                for (var i in settings.objectives) for (var j in settings.objectives[i]) {
                    settings.objectives[i][j].done = false;
                }
                $this.find("#gnote").html(settings.number);
				
				// INITIAL RADIUS
				if (settings.radiusrange && $.isArray(settings.radiusrange)) {
                     settings.radius = settings.radiusrange[0] +
                                    Math.random()*(settings.radiusrange[1]-settings.radiusrange[0]);
                }

                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                // LOAD SVG
                var debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                $this.find("#board").svg();
                settings.svg = $this.find("#board").svg('get');
                settings.svg.load(
                    'res/img/'+settings.filename + debug, { addTo: true, changeSize: true, onLoad:function() { helpers.build($this); }
                });

                helpers.update($this, false);
                
                // CANCEL2 BUTTON
                if (settings.withcancel) { $this.find("#cancel2").show(); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        update: function($this, _anim) {
            var settings = helpers.settings($this);
            $this.find("#nbelts").html(settings.histo.length+"/"+settings.number);
            $this.find("#info").toggleClass("wrong",settings.histo.length>settings.number);
            if (_anim) {
                $this.find("#info").addClass("touch");
                setTimeout(function() { $this.find("#info").removeClass("touch"); }, 50);
            }
        },
        // Check if a new element matches an objective
        check: function($this, elt, _anim) {
            var settings = helpers.settings($this);
            var ret = false;
            helpers.update($this, _anim);
            // Remove objectives with matches the new elements
            for (var i in settings.objectives) {
                for (var j in settings.objectives[i]) {
                    var e = settings.objectives[i][j];
                    if ( e.type == "segment" && elt.name=="segment") {
                        for (var k = 0; k<2; k++) {
                            if ( helpers.utility.equal(e.values[(0+k*2)%4], elt.coord[0]) &&
                                 helpers.utility.equal(e.values[(1+k*2)%4], elt.coord[1]) &&
                                 helpers.utility.equal(e.values[(2+k*2)%4], elt.coord[2]) &&
                                 helpers.utility.equal(e.values[(3+k*2)%4], elt.coord[3]) )
                                     { e.done=true; ret = true;}
                        }
                    }
                    else
                    if ( e.type == "point" && elt.name=="point") {
                        if ( helpers.utility.equal(e.values[0], elt.coord[0]) &&
                             helpers.utility.equal(e.values[1], elt.coord[1]) )
                                     { e.done=true; ret = true;}
                    }
                    else
                    if ( e.type == "circle" && elt.name=="circle") {
                        if ( helpers.utility.equal(e.values[0], elt.coord[0]) &&
                             helpers.utility.equal(e.values[1], elt.coord[1]) &&
                             helpers.utility.equal(e.values[2], elt.coord[2]) )
                                     { e.done=true; ret = true;}
                    }
                    else
                    if ( e.type == "line" && elt.name=="line") {
                        var pos = helpers.utility.line.topairex(elt.coord[0], elt.coord[1], elt.coord[2], elt.coord[3]);
                        if ( helpers.utility.equal(e.values[0], pos[0]) && helpers.utility.equal(e.values[1], pos[1]))
                                     { e.done=true; ret = true;}
                    }
                }
            }

            // Update the objectives panel
            settings.finish = true;
            for (var i in settings.objectives) {
                var complete = true;
                for (var j in settings.objectives[i]) {
                    if (!settings.objectives[i][j].done) { complete = false; settings.finish = false; }
                }
                if (complete) {
                    $($this.find("#objectives .icon img")[i]).attr("src", "res/img/default/icon/check_checked01.svg");
                }
            }
            if (settings.finish) {
                settings.score = helpers.score(settings.histo.length, settings.number);
                $this.find("#zoom").hide();
                $this.find("#cancel2").hide();
                $(settings.svg.root()).attr("class",$(settings.svg.root()).attr("class")+" done");

                setTimeout(function() { helpers.end($this); }, settings.timerend);
            }

            return ret;
        },
        closer: function($this, i, j) {
            var settings    = helpers.settings($this);
            var o           = 0;                                // THE CLOSER OBJECT
            var dist        = -1;                               // THE DISTANCE*DISTANCE FROM THE CLOSER OBJECT

            // DISTANCE FROM CIRCLES
            if (settings.controls.mask==0 || settings.controls.mask=="path" || settings.controls.mask=="circle") {
                for (var it=0; it<settings.circles.length; it++) {
                    var d = Math.sqrt((i-settings.circles[it].coord[0])*(i-settings.circles[it].coord[0]) +
                            (j-settings.circles[it].coord[1])*(j-settings.circles[it].coord[1]));
                    var r = settings.circles[it].coord[2];
                    if (d<r) { d = r-d; } else { d = d-r; }
                    if (d<settings.zone && (dist<0 || d*d<dist)) { o = settings.circles[it]; dist = d*d;}
                }
            }

            // DISTANCE FROM LINES
            if (settings.controls.mask==0 || settings.controls.mask=="path" || settings.controls.mask=="line") {
                for (var it=0; it<settings.lines.length; it++) {
                    var i1 = settings.lines[it].coord[0];
                    var j1 = settings.lines[it].coord[1];
                    var i2 = settings.lines[it].coord[2];
                    var j2 = settings.lines[it].coord[3];

                    var d=((j2-j1)*i+(i1-i2)*j+(j1*i2-i1*j2))/Math.sqrt((j2-j1)*(j2-j1)+(i1-i2)*(i1-i2));
                    var scal1 = (i2-i1)*(i-i1)+(j2-j1)*(j-j1);
                    var scal2 = (i2-i1)*(i2-i1)+(j2-j1)*(j2-j1);
                    if (d<0) { d=-d; }
                    if (d<settings.zone && (scal1>0) && (scal1<scal2) && (dist<0 || d*d<dist)) {
                        o = settings.lines[it]; dist = d;
                    }
                }
            }

            // DISTANCE FROM POINTS
            dist = -1;
            if (settings.controls.mask==0 || settings.controls.mask=="point") {
                for (var it=0; it<settings.points.length; it++) {
                    var d = (i-settings.points[it].coord[0])*(i-settings.points[it].coord[0]) +
                            (j-settings.points[it].coord[1])*(j-settings.points[it].coord[1]);
                    if (d<settings.zone*settings.zone && (dist<0 || d<dist)) { o = settings.points[it]; dist = d; }
                }
            }
            return o;
        },
        mousemove: function($this, event) {
            var settings    = helpers.settings($this); if (settings.finish) { return; }
            var x           = event.clientX-$this.find("#board").offset().left;     // THE X AXIS MOUSE PIXEL COORDINATE
            var y           = event.clientY-$this.find("#board").offset().top;      // THE Y AXIS MOUSE PIXEL COORDINATE
            var i           = helpers.utility.XtoI($this, x);                       // THE I AXIS MOUSE COORDINATE
            var j           = helpers.utility.YtoJ($this, y);                       // THE J AXIS MOUSE COORDINATE
            var o           = helpers.closer($this, i, j );
            
            settings.board.pixelWidth = $this.find("#board").width();
            settings.board.pixelHeight = $this.find("#board").height();
            
            if (settings.withzoom)
            {
                if (o && o.id) { $this.find("#zoom").html(o.id).show(); } else { $this.find("#zoom").hide(); }
            }
            
            if (settings.controls.first) {
                helpers.preview[settings.controls.action]($this, i, j, o);
            }
            if (settings.controls.current) {
                if (settings.controls.current==o) {
                    o = 0;
                }
                else {
                    $(settings.controls.current.highlight).attr("display","none");
                    settings.controls.current = 0;
                }
            }
            if (o) { $(o.highlight).attr("display","inline"); settings.controls.current = o; }
        },
        mousedown: function($this) {
            var settings    = helpers.settings($this); if (settings.finish) { return; }
            
            if (settings.controls.preview) {
                settings.svg.remove(settings.controls.preview);
                settings.controls.preview = 0;
            }

            if (settings.controls.current && settings.controls.action) {
                settings.controls.first = settings.controls.current;
                settings.controls.current = 0;
                settings.controls.mask = settings.mask[settings.controls.action][1];
            }
        },
        mouseup: function($this) {
            var settings    = helpers.settings($this); if (settings.finish) { return; }

            // BUILD THE NEW ELEMENT
            // SPECIAL CASE OF THE CIRCLE WITH ONLY ITS CENTER
            if (settings.controls.first && (!settings.controls.current || settings.controls.first==settings.controls.current) &&
                settings.controls.action=="circle" && settings.circle!="2points") {
                if (!settings.controls.preview || $(settings.controls.preview).attr("r")<settings.board.dist)
                {
                    var object = helpers.factory.build($this, "circle",
                                [settings.controls.first.coord[0],settings.controls.first.coord[1], settings.radius] );
                    settings.circles.push(object);
                    settings.histo.push("circles");
                    helpers.check($this, object, true);
                }
            }
            else
            if (settings.controls.first && settings.controls.current && settings.controls.first!=settings.controls.current) {
                switch(settings.controls.action) {
                case "segment":
                    var object = helpers.factory.build($this, "segment",
                        [ settings.controls.first.coord[0],settings.controls.first.coord[1],
                          settings.controls.current.coord[0], settings.controls.current.coord[1] ] );
                    settings.lines.push(object);
                    settings.histo.push("lines");
                    helpers.check($this, object, true);
                    break;
                case "line":
                    pos = helpers.utility.line.convert4($this,
                            settings.controls.first.coord[0], settings.controls.first.coord[1],
                            settings.controls.current.coord[0], settings.controls.current.coord[1]);
                    var object = helpers.factory.build($this, "line", [pos.i1, pos.j1, pos.i2, pos.j2] );
                    settings.lines.push(object);
                    settings.histo.push("lines");
                    helpers.check($this, object, true);
                    break;
                case "circle":
                    if (settings.circle!="1point") {
                        settings.radius = $(settings.controls.preview).attr("r");
                        var object = helpers.factory.build($this, "circle",
                                    [settings.controls.first.coord[0],settings.controls.first.coord[1], settings.radius] );
                        settings.circles.push(object);
                        settings.histo.push("circles");
                        helpers.check($this, object, true);
                    }
                    break;
                case "perpendicular":
                case "parallel":
                    pos = helpers.utility.line.convert3($this,
                            settings.controls.current.coord[0], settings.controls.current.coord[1], settings.controls.misc);
                    var object = helpers.factory.build($this, "line", [pos.i1, pos.j1, pos.i2, pos.j2] );
                    settings.lines.push(object);
                    settings.histo.push("lines");
                    helpers.check($this, object, true);
                    break;
                case "midpoint":
                    var object = helpers.factory.build($this, "point",
                        [ (settings.controls.first.coord[0]+settings.controls.current.coord[0])/2,
                          (settings.controls.first.coord[1]+settings.controls.current.coord[1])/2 ] );
                    settings.points.push(object);
                    settings.histo.push("points");
                    helpers.check($this, object, true);
                    break;
                case "intersection":
                    var nbCircles = 0;
                    if (settings.controls.first.name=="circle") { nbCircles+=1; }
                    if (settings.controls.current.name=="circle") { nbCircles+=2; }
                    var inter = 0;
                    if (nbCircles==3) {
                        inter = helpers.utility.intercircles(settings.controls.first, settings.controls.current);
                    } else
                    if (nbCircles==2) {
                        inter = helpers.utility.intercircleline(settings.controls.current, settings.controls.first);
                    } else
                    if (nbCircles==1) {
                        inter = helpers.utility.intercircleline(settings.controls.first, settings.controls.current);
                    } else
                    if (nbCircles==0) {
                        inter = helpers.utility.interlines(settings.controls.first, settings.controls.current);
                    }
                    if (inter) {
                        var count = 0;
                        settings.histo.push("inter"+inter.length);
                        while (count<inter.length) {
                            var object = helpers.factory.build($this, "point", [ inter[count],inter[count+1] ] );
                            settings.points.push(object);
                            count+=2;
                            helpers.check($this, object, true);
                        }
                    }
                    break;
                case "bisector":
                    var inter = helpers.utility.interlines(settings.controls.first, settings.controls.current);
                    if (inter) {
                        var p1 = (helpers.utility.line.topair(settings.controls.first)[1])%180;
                        var p2 = (helpers.utility.line.topair(settings.controls.current)[1])%180;
                        var angle = (p1+p2)/2;
                        if (p1>p2) { angle += 90; }
                        var pos = helpers.utility.line.convert3($this, inter[0], inter[1], angle);
                        var object = helpers.factory.build($this, "line", [pos.i1, pos.j1, pos.i2, pos.j2] );
                        settings.lines.push(object);
                        settings.histo.push("lines");
                        helpers.check($this, object, true);
                    }
                    break;
                }
            }

            helpers.restore($this);
        },
        mouseleave: function($this, event) {
            var settings    = helpers.settings($this); if (settings.finish) { return; }
            var x           = event.clientX-$this.find("#board").offset().left;
            var y           = event.clientY-$this.find("#board").offset().top;
            if (x<0 || y<0 || x>$this.find("#board").width() || y>$this.find("#board").height()) { helpers.restore($this); }
        },
        restore: function($this) {
            var settings    = helpers.settings($this);
            // HIDE ELEMENTS
            if (settings.controls.first)    { $(settings.controls.first.highlight).attr("display", "none"); }
            if (settings.controls.current)  { $(settings.controls.current.highlight).attr("display", "none"); }
            settings.controls.first = 0;
            settings.controls.current = 0;

            // HIDE PREVIEW
            if (settings.controls.preview) {
                settings.svg.remove(settings.controls.preview);
                settings.controls.preview = 0;
            }

            // RESTORE STUFF
            if (settings.controls.action) { settings.controls.mask = settings.mask[settings.controls.action][0]; }
        },
        preview : {
            segment: function($this, i, j, o) {
                var settings    = helpers.settings($this);
                if (o && o!=settings.controls.first && settings.controls.preview) {
                    $(settings.controls.preview).attr("x2", o.coord[0]);
                    $(settings.controls.preview).attr("y2", o.coord[1]);
                    $(settings.controls.preview).css("stroke", settings.goodcolor);
                }
                else {
                    if (settings.controls.preview) {
                        $(settings.controls.preview).attr("x2", i);
                        $(settings.controls.preview).attr("y2", j);
                    }
                    else {
                        settings.controls.preview = helpers.factory.segment($this,
                            settings.layers.highlight,
                            [ settings.controls.first.coord[0], settings.controls.first.coord[1],
                              settings.controls.first.coord[0], settings.controls.first.coord[1] ]);
                    }
                    $(settings.controls.preview).css("stroke", settings.hlcolor);
                }
            },
            line : function($this, i, j, o) { helpers.preview.segment($this, i, j, o); },
            midpoint: function($this, i, j, o) { helpers.preview.segment($this, i, j, o); },
            circle: function($this, i, j, o) {
                var settings    = helpers.settings($this);
                var ci = settings.controls.first.coord[0];
                var cj = settings.controls.first.coord[1];
                if (o && o!=settings.controls.first && settings.controls.preview && settings.circle!="1point") {
                    i = o.coord[0]; j = o.coord[1];
                    var d = Math.sqrt((ci-i)*(ci-i)+(cj-j)*(cj-j));
                    $(settings.controls.preview).attr("r", d );
                    $(settings.controls.preview).css("stroke", settings.goodcolor);
                }
                else {
                    var d = Math.sqrt((ci-i)*(ci-i)+(cj-j)*(cj-j));
                    if (settings.controls.preview) { $(settings.controls.preview).attr("r", d ); }
                    else {
                        settings.controls.preview = helpers.factory.circle($this, 
                            settings.layers.highlight,
                                [ settings.controls.first.coord[0], settings.controls.first.coord[1], d ]);
                    }
                    $(settings.controls.preview).css("stroke", settings.hlcolor);
                }
            },
            perpendicular: function($this, i, j, o) { this.paraperp($this, i, j, o , 90); },
            parallel: function($this, i, j, o)      { this.paraperp($this, i, j, o, 0); },
            paraperp: function($this, i, j, o, angle) {
                var settings    = helpers.settings($this);
                if (o) {
                    var pos = helpers.utility.line.convert3($this, o.coord[0], o.coord[1], settings.controls.misc);
                    helpers.utility.line.update(settings.controls.preview, pos.i1, pos.j1, pos.i2, pos.j2);
                    $(settings.controls.preview).css("stroke", settings.goodcolor);
                }
                else {
                    if (settings.controls.preview) {
                        var pos = helpers.utility.line.convert3($this, i, j, settings.controls.misc);
                        helpers.utility.line.update(settings.controls.preview, pos.i1, pos.j1, pos.i2, pos.j2);
                    }
                    else {
                        settings.controls.misc = helpers.utility.line.topair(settings.controls.first)[1];
                        settings.controls.misc = (settings.controls.misc+angle)%180;
                        var pos = helpers.utility.line.convert3($this, i, j, settings.controls.misc);
                        settings.controls.preview = helpers.factory.segment($this, settings.layers.highlight,
                                                                            [pos.i1, pos.j1, pos.i2, pos.j2]);
                    }
                    $(settings.controls.preview).css("stroke", settings.hlcolor);
                }
            },
            intersection: function($this, x, y, o) {
                var settings    = helpers.settings($this);
                if (!settings.controls.preview) {
                    settings.controls.preview = $(settings.controls.first.highlight).clone().appendTo(settings.layers.highlight);
                }
            },
            bisector: function($this, x, y, o) { this.intersection($this, x,y,o); }
        },
        factory : {
            build : function($this, name, coord, attr) {
                var settings = helpers.settings($this);
                var ret = {
                    highlight   : helpers.factory[name]($this, settings.layers.highlight, coord, { display:'none' }),
                    svg         : helpers.factory[name]($this, settings.layers.active, coord, attr),
                    coord       : coord,
                    name        : name
                };
                if (! (attr && attr.style && attr.style.indexOf("stroke")!=-1)) { $(ret.svg).css("stroke",settings.color); }
                if (settings.small) { $(ret.svg).attr("class","small "+$(ret.svg).attr("class")); }
                return ret;
            },
            point : function($this, group, coord, attr) {
                var settings = helpers.settings($this);
                var path = settings.svg.createPath();
                var ret=settings.svg.path(group, path.move(coord[0], coord[1]).line(coord[0]+0.001, coord[1]),attr);
                $(ret).attr("class","point");
                $this.find("#log").html("P("+helpers.utility.round(coord[0])+","+helpers.utility.round(coord[1])+")");
                return ret;
            },
            circle : function($this, group, coord, attr) {
                var settings = helpers.settings($this);
                $this.find("#log").html("C("+helpers.utility.round(coord[0])+","+helpers.utility.round(coord[1])
                                        +","+helpers.utility.round(coord[2])+")");
                return settings.svg.circle(group, coord[0], coord[1], coord[2], attr);
            },
            segment : function($this, group, coord, attr) {
                var settings = helpers.settings($this);
                var ret = settings.svg.line(group, coord[0], coord[1], coord[2], coord[3], attr);
                var pos = helpers.utility.line.topairex(coord[0], coord[1], coord[2], coord[3]);
                $this.find("#log").html("L("+helpers.utility.round(pos[0])+","+helpers.utility.round(pos[1])+")");
                return ret;
            },
            line : function($this, group, coord, attr) { return helpers.factory.segment($this, group, coord, attr); }
        },
        utility : {
            // (X,Y) ARE THE PIXEL COORDINATES, (I,J) ARE THE MATHEMATIQUES COORDINATES
            ItoX: function($this, i) { var s = helpers.settings($this);
                                       return ((i+s.translate[0])/s.board.svgWidth)*s.board.pixelWidth; },
            JtoY: function($this, j) { var s = helpers.settings($this);
                                       return ((j+s.translate[1])/s.board.svgHeight)*s.board.pixelHeight; },
            XtoI: function($this, x) { var s = helpers.settings($this);
                                       return (x/s.board.pixelWidth)*s.board.svgWidth-s.translate[0]; },
            YtoJ: function($this, y) { var s = helpers.settings($this);
                                       return (y/s.board.pixelHeight)*s.board.svgHeight-s.translate[1]; },
            line : {
                topairex: function(x1, y1, x2, y2) {
                    var ret = [0,0];
                    if (helpers.utility.equal(x1,x2)) { ret = [x1, 90]; } else {
                        ret = [ (x1*y2-x2*y1)/(x1-x2), Math.atan((y1-y2)/(x1-x2))*180/Math.PI];
                    }
                    return ret;
                },
                topair: function(l) {
                    return helpers.utility.line.topairex(l.coord[0],l.coord[1],l.coord[2],l.coord[3]);
                },
                update: function(l, i1, j1, i2, j2) {
                    $(l).attr("x1", i1); $(l).attr("y1", j1); $(l).attr("x2", i2); $(l).attr("y2", j2);
                },
                convert4: function($this,i1,j1,i2,j2) {
                    var settings = helpers.settings($this);
                    var ret = { i1:i1,j1:j1,i2:i2,j2:j2 };
                    if ((i1==i2)&&(j1==j2)) { ret = 0; }
                    else {
                        do {
                            ret.i1+=settings.board.svgWidth/100*(i2-i1);
                            ret.j1+=settings.board.svgWidth/100*(j2-j1);
                            ret.i2-=settings.board.svgWidth/100*(i2-i1);
                            ret.j2-=settings.board.svgWidth/100*(j2-j1);
                        } while ( (ret.i1*ret.i1+ret.j1*ret.j1)<2*settings.board.svgWidth*settings.board.svgWidth &&
                                  (ret.i2*ret.i2+ret.j2*ret.j2)<2*settings.board.svgWidth*settings.board.svgWidth);
                    }
                    return ret;
                },
                convert3: function($this, i1,j1,dir) {
                    return this.convert4($this,i1,j1,i1+Math.cos(dir*Math.PI/180),j1+Math.sin(dir*Math.PI/180));
                },
                convert2: function($this, i1,dir) {
                    return this.convert3($this, (dir==90?i1:0),(dir==90?0:i1),dir);
                }
            },
            round: function(x) { return Math.round(x*10)/10; },
            equal: function(x,y) { return (this.round(x)==this.round(y)); },
            samepoint: function(p1, p2) { return this.equal($(p1).attr("cx"), $(p2).attr("cx")) &&
                                                 this.equal($(p1).attr("cy"), $(p2).attr("cy")); },
            samesegment: function(s1,s2) {
                return ((( this.equal($(s1).attr("x1"), $(s2).attr("x1")) &&  this.equal($(s1).attr("y1"), $(s2).attr("y1")) &&
                         ( this.equal($(s1).attr("x2"), $(s2).attr("x2")) &&  this.equal($(s1).attr("y2"), $(s2).attr("y2"))))) ||
                        (( this.equal($(s1).attr("x1"), $(s2).attr("x2")) &&  this.equal($(s1).attr("y1"), $(s2).attr("y2")) &&
                         ( this.equal($(s1).attr("x2"), $(s2).attr("x1")) &&  this.equal($(s1).attr("y2"), $(s2).attr("y1"))))))
            },
            samecircle: function(c1,c2) { return (this.samepoint(c1,c2)&&this.equal($(c1).attr("r"),$(c2).attr("r"))); },
            sameline: function($this, l1,l2) {
                var p1 = this.line.topair(l1), p2 = this.line.topair(l2);
                return ((l1[0]==l2[0]) && (l1[1]==l2[1]));
            },
            interlines: function(l1,l2) {
                var ret= 0, p1 = this.line.topair(l1) ,p2 = this.line.topair(l2);
                if (!this.equal(p1[1], p2[1])) {
                    var Ax = l1.coord[0], Ay = l1.coord[1];
                    var Cx = l2.coord[0], Cy = l2.coord[1];
                    var Ix = l1.coord[2]-l1.coord[0], Iy = l1.coord[3]-l1.coord[1];
                    var Jx = l2.coord[2]-l2.coord[0], Jy = l2.coord[3]-l2.coord[1];

                    var m = -(-Ix*Ay+Ix*Cy+Iy*Ax-Iy*Cx)/(Ix*Jy-Iy*Jx);
                    var k = -(Ax*Jy-Cx*Jy-Jx*Ay+Jx*Cy)/(Ix*Jy-Iy*Jx);

                    if (m>=0 && m<=1 && k>=0 && k<=1) { ret = [ Ax+k*Ix, Ay+k*Iy]; }

                }
                return ret;
            },
            intercircles: function(c1,c2) {
                var ret = 0;
                var x0 =  c1.coord[0], y0 = c1.coord[1], R0 = c1.coord[2];
                var x1 =  c2.coord[0], y1 = c2.coord[1], R1 = c2.coord[2];

                if (!this.equal(y0,y1)) {
                    var N = (R1*R1-R0*R0-x1*x1+x0*x0-y1*y1+y0*y0)/(2*(y0-y1));
                    var A = ((x0-x1)/(y0-y1))*((x0-x1)/(y0-y1))+1;
                    var B = 2*y0*((x0-x1)/(y0-y1))-2*N*((x0-x1)/(y0-y1))-2*x0;
                    var C = x0*x0+y0*y0+N*N-R0*R0-2*y0*N;
                    if (B*B-4*A*C==0) {
                        var x = -B/(2*A);
                        var y = N-x*((x0-x1)/(y0-y1));
                        ret = [x,y];
                    } else
                    if (B*B-4*A*C>0) {
                        var xa = -(B-Math.sqrt(B*B-4*A*C))/(2*A);
                        var ya = N-xa*((x0-x1)/(y0-y1));
                        var xb = -(B+Math.sqrt(B*B-4*A*C))/(2*A);
                        var yb = N-xb*((x0-x1)/(y0-y1));
                        ret = [xa,ya,xb,yb];
                    }
                }
                else {
                    var x = (R1*R1-R0*R0-x1*x1+x0*x0)/(2*(x0-x1));
                    var A = 1;
                    var B = -2*y1;
                    var C = x1*x1+x*x-2*x1*x+y1*y1-R1*R1;
                    if (B*B-4*A*C==0) {
                        var y = -B/(2*A);
                        ret = [x,y];
                    } else
                    if (B*B-4*A*C>0) {
                        var ya = -(B-Math.sqrt(B*B-4*A*C))/(2*A);
                        var yb = -(B+Math.sqrt(B*B-4*A*C))/(2*A);
                        ret = [x,ya,x,yb];
                    }
                }
                return ret;
            },
            intercircleline: function(c, l) {
                var ret = 0;
                var cx = c.coord[0], cy = c.coord[1], R = c.coord[2];
                var x1 = l.coord[0], y1 = l.coord[1], x2 = l.coord[2], y2 = l.coord[3];

                if (!this.equal(y1,y2)) {
                    var alpha = (x2-x1)/(y2-y1), N = x1-alpha*y1-cx, A = 1+alpha*alpha, B = 2*alpha*N-2*cy, C = cy*cy+N*N-R*R;
                    if (B*B-4*A*C==0) {
                        var y = -B/(2*A);
                        var x = (y-y1)*alpha+x1;
                        ret = [x,y];
                    } else
                    if (B*B-4*A*C>0) {
                        var ya = -(B-Math.sqrt(B*B-4*A*C))/(2*A);
                        var xa = (ya-y1)*alpha+x1;
                        var yb = -(B+Math.sqrt(B*B-4*A*C))/(2*A);
                        var xb = (yb-y1)*alpha+x1;
                        ret = [xa,ya,xb,yb];
                    }
                }
                else {
                    var y = y1, A = 1, B = -2*cx, C = cx*cx+(y-cy)*(y-cy)-R*R;
                    if (B*B-4*A*C==0) {
                        var x = -B/(2*A);
                        ret = [x,y];
                    } else
                    if (B*B-4*A*C>0) {
                        var xa = -(B-Math.sqrt(B*B-4*A*C))/(2*A);
                        var xb = -(B+Math.sqrt(B*B-4*A*C))/(2*A);
                        ret = [xa,y,xb,y];
                    }
                }
                return ret;
            }
        },
        build: function($this){
            var settings = helpers.settings($this);

            // ADD THE CLASSES
            settings.svg.style(
'text { stroke:none; fill:'+settings.color+'; } ' +
'.point { stroke-width:'+settings.sizepoint+';  stroke:'+settings.color+'; stroke-linecap:round; fill:none; } '+
'line { stroke-width:'+settings.strokewidth+'; stroke:'+settings.color+'; stroke-linecap:round; fill:none; } '+
'circle { stroke-width:'+settings.strokewidth+'; stroke:'+settings.color+'; stroke-linecap:round; fill:none; } '+
'.point.small { stroke-width:'+(settings.sizepoint/2)+'; } '+
'line.small { stroke-width:'+(settings.strokewidth/2)+'; } '+
'circle.small { stroke-width:'+(settings.strokewidth/2)+'; } '+
'#highlight {opacity:.5; } '+
'#highlight .point { stroke:'+settings.hlcolor+'; stroke-width:'+2*settings.zone+'; stroke-linecap:round; } ' +
'#highlight line { stroke:'+settings.hlcolor+'; stroke-width:'+2*settings.zone+'; stroke-linecap:round; } ' +
'#highlight circle { stroke:'+settings.hlcolor+'; stroke-width:'+2*settings.zone+'; stroke-linecap:round; } '
            );

            // COLOR BY DEFAULT
            settings.colors[0] = settings.color;
            $this.find("#color div").css("background-color", settings.color);

            // GET THE DIMENSION OF THE BOARD (SVG.TITLE IS USED TO GET THE WIDTH)
            var $main = $("#main", settings.svg.root());
            if ($(settings.svg.root()).attr("title")) { settings.board.svgWidth = parseInt($(settings.svg.root()).attr("title")); }
            settings.board.svgHeight = 3*settings.board.svgWidth/4;
            $main.attr("transform", "translate("+settings.translate[0]+","+settings.translate[1]+")");

            // ADD THE CLASS
            if (settings.svgclass) { $(settings.svg.root()).attr("class",settings.svgclass); }

            // BUILD THE LAYERS
            settings.layers.background  = settings.svg.group($main);
            settings.layers.highlight   = settings.svg.group($main);
            settings.layers.active      = settings.svg.group($main);
            $(settings.layers.background).attr("id","background");
            $(settings.layers.highlight).attr("id","highlight");
            $(settings.layers.active).attr("id","active");

            for (var i=0; i<settings.data.length; i++) {
                var elt = settings.data[i];
                if (typeof(elt.active)=="undefined") { elt.active = settings.active; }
                // ----------------------- POINT ----------------------------
                if (elt.type=="point") {
                    var object = helpers.factory.build($this, "point", elt.value, elt.attr);
                    if (elt.active==true) { settings.points.push(object); }
                    // POINT NAME
                    if (elt.id) {
                        object.id = elt.id;
                        var angle = (typeof(elt.idpos)!="undefined")?elt.idpos:45;
                        var newPosX = elt.value[0] - settings.sizepoint/1.5  + Math.cos(angle*Math.PI/180)*settings.sizepoint*1.5;
                        var newPosY = elt.value[1] + settings.sizepoint/1.5 + Math.sin(-angle*Math.PI/180)*settings.sizepoint*2;
                        if (angle>135 && angle<225 && elt.id.length>1) { newPosX-=settings.sizepoint/1.5; }
                        settings.svg.text(settings.layers.active,
                            newPosX, newPosY,
                            elt.id, { fontSize:settings.sizepoint*2, fontWeight:"bold" });
                    }
                }
                else if (elt.type=="grid") {
                    for (var gi=0; gi<elt.value[2]; gi++) for (var gj=0; gj<elt.value[3]; gj++) {
                        var object = helpers.factory.build($this, "point",
                            [elt.value[0]+gi*elt.value[4], elt.value[1]+gj*elt.value[5]], elt.attr);
                        if (elt.active==true) { settings.points.push(object); }
                    }
                }
                // ----------------------- CIRCLE ----------------------------
                else if (elt.type=="circle") {
                    var object = helpers.factory.build($this, "circle", elt.value, elt.attr);
                    if (elt.active==true) { settings.circles.push(object); }
                }
                // ----------------------- SEGMENT ----------------------------
                else if (elt.type=="segment") {
                    var object = helpers.factory.build($this, "segment", elt.value, elt.attr);
                    if (elt.active==true) { settings.lines.push(object); }
                }
                else if (elt.type=="path" || elt.type=="path+") {
                    if (elt.type=="path+") {
                        for (var gi=0; gi<Math.floor((elt.value.length)/2); gi++) {
                            var object = helpers.factory.build($this, "point", [elt.value[gi*2], elt.value[gi*2+1]], elt.attr);
                            if (elt.active==true) { settings.points.push(object); }
                        }
                    }
                    for (var gi=0; gi<Math.floor((elt.value.length-2)/2); gi++) {
                        var object = helpers.factory.build($this, "segment",
                            [elt.value[gi*2], elt.value[gi*2+1], elt.value[gi*2+2], elt.value[gi*2+3]], elt.attr);
                        if (elt.active==true) { settings.lines.push(object); }
                    }
                }
                // ----------------------- LINE ----------------------------
                else if (elt.type=="line") {
                    var pos = 0;
                    if (elt.value.length==4) {
                        pos = helpers.utility.line.convert4($this, elt.value[0], elt.value[1], elt.value[2], elt.value[3]);
                    }
                    else if (elt.value.length==3) {
                        pos = helpers.utility.line.convert3($this, elt.value[0], elt.value[1], elt.value[2]);
                    }
                    else if (elt.value.length==2) {
                        pos = helpers.utility.line.convert2($this, elt.value[0], elt.value[1]);
                    }
                    if (pos) {
                        var object = helpers.factory.build($this, "line", [pos.i1, pos.j1, pos.i2, pos.j2], elt.attr);
                        if (elt.active==true) { settings.lines.push(object); }
                    }
                }
            }

            // SHOW SVG ELEMENTS
            if (settings.show) {
                if ($.isArray(settings.show)) {
                    for (var i in settings.show) { $("#"+settings.show[i], settings.svg.root()).css("display","inline"); }
                }
                else { $("#"+settings.show, settings.svg.root()).css("display","inline"); }
            }

            // UPDATE SVG TEXT
            if (settings.text) {
                if ($.isArray(settings.text)) {
                    for (var i in settings.text) { $("#text"+i, settings.svg.root()).text(settings.text[i]); }
                }
                else { $("#text", settings.svg.root()).text(settings.text); }
            }

            // UPDATE WORKING COLOR
            if (settings.color2)        { settings.color = settings.color2; }

        },
        // compute the score
        score:function(number, reference) {
            var ret = 5 - Math.floor(.5+(number-reference)/2);
            if (ret>5)  { ret = 5; }
            if (ret<=0) { ret = 0; }
            return ret;
        }
    };

    // The plugin
    $.fn.geometry = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
                    interactive     : false,
                    small           : false,
                    controls        : {
                        action      : 0,
                        mask        : 0,
                        current     : 0,
                        first       : 0,
                        preview     : 0,
                        misc        : 0
                    },
                    mask            : {
                        "line"          : [ "point", "point" ],
                        "segment"       : [ "point", "point" ],
                        "circle"        : [ "point", "point" ],
                        "midpoint"      : [ "point", "point" ],
                        "intersection"  : [ "path", "path" ],
                        "parallel"      : [ "line", "point" ],
                        "perpendicular" : [ "line", "point" ],
                        "bisector"      : [ "line", "line" ]
                    },
                    board           : {
                        pixelWidth  : 100,
                        pixelHeight : 100,
                        svgWidth    : 640,
                        svgHeight   : 480
                    },
                    layers      : {
                        background  : 0,
                        highlight   : 0,
                        active      : 0
                    },
                    colorid         : 0,
                    colors          : [ "black", "blue", "red", "green"],
                    svg             : 0,
                    histo           : [],
                    points          : [],
                    lines           : [],
                    circles         : []
                };


                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    this.onselectstart = function() { return false; }

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
            stroke: function(elt) {
                var $this = $(this) , settings = helpers.settings($this);
                if (!$(elt).hasClass("disable") && !settings.finish) {
                    settings.small = !settings.small;
                    if (settings.small)    { $this.find("#stroke img").attr("src", "res/img/numbers/dice/dice01.svg") }
                    else                    {$this.find("#stroke img").attr("src", "res/img/numbers/dice/dice01big.svg") }
                }
            },
            color: function(elt) {
                var $this = $(this) , settings = helpers.settings($this);
                if (!$(elt).hasClass("disable") && !settings.finish) {
                    settings.colorid = (settings.colorid+1)%settings.colors.length;
                    settings.color = settings.colors[settings.colorid];
                    $this.find("#color div").css("background-color", settings.color);
                }
            },
            click: function(elt) {
                var $this = $(this) , settings = helpers.settings($this);
                if (!$(elt).hasClass("disable") && !settings.finish) {
                     $this.find(".action").removeClass("s");
                    if (settings.controls.action != $(elt).attr("id")) {
                        $(elt).addClass("s");
                        settings.controls.action = $(elt).attr("id");
                        settings.controls.mask = settings.mask[settings.controls.action][0];

                        // HANDLE THE DEFAULT RADIUS
                        if (settings.controls.action=="circle") {
                            if (settings.radiusrange && $.isArray(settings.radiusrange)) {
                                settings.radius = settings.radiusrange[0] +
                                    Math.random()*(settings.radiusrange[1]-settings.radiusrange[0]);
                            }
                        }
                    }
                    else {
                        settings.controls.action = 0;
                        settings.controls.mask = 0;
                    }
                }
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);

                $(this).find("#board").bind("mousemove", function(e) { helpers.mousemove($this, e); });
                $(this).find("#board").bind("mousedown", function() { helpers.mousedown($this); });
                $(this).find("#board").bind("mouseup", function(e) { helpers.mouseup($this); helpers.mousemove($this, e); });
                $(this).find("#board").mouseleave(function(e) { helpers.mouseleave($this, e); });

                $(this).find("#board").bind("touchmove", function(e) {
                    helpers.mousemove($this, e.originalEvent.touches[0]); e.preventDefault(); });
                $(this).find("#board").bind("touchstart", function(e) {
                    helpers.mousemove($this, e.originalEvent.touches[0]); helpers.mousedown($this); e.preventDefault(); });
                $(this).find("#board").bind("touchend", function() { helpers.mouseup($this); });

            },
            cancel: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.histo.length && !settings.finish) {
                    var vElt = settings.histo.pop();
                    switch(vElt)
                    {
                        case "points": case "lines": case "circles":
                            var vObject = settings[vElt].pop();
                            $(vObject.svg).detach(); $(vObject.highlight).detach();
                            break;
                        case "inter2":
                            var vObject = settings.points.pop();
                            $(vObject.svg).detach(); $(vObject.highlight).detach();
                        break;
                        case "inter4":
                            for (var i=0; i<2; i++) {
                                var vObject = settings.points.pop();
                                $(vObject.svg).detach(); $(vObject.highlight).detach();
                            }
                        break;
                    }
                    for (var i in settings.objectives) {
                        for (var j in settings.objectives[i]) { settings.objectives[i][j].done = false; }
                        $($this.find("#objectives .icon img")[i]).attr("src", "res/img/default/icon/check_unchecked01.svg");
                    }
                    for (var i in settings.points) { helpers.check($this, settings.points[i], false); }
                    for (var i in settings.lines) { helpers.check($this, settings.lines[i], false); }
                    for (var i in settings.circles) { helpers.check($this, settings.circles[i], false); }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in geometry plugin!'); }
    };
})(jQuery);

