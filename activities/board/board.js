(function($) {
    // Activity default options
    var defaults = {
        name        : "board",                                  // The activity name
        label       : "Board",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        paintmode   : 0,                                        // O:opaque, 1:add, 2:sub, 3:def
        colors      : [[0,0,0],[255,255,255]],
        colorsfont  : 1.7,
        brushes     : [[3,3]],
        brushesfont : 1.7,
        wrong       : { rgb:[0,0,0], content:"res/img/default/white/cancel02.svg"},
        inside      : true,
        exercice    : [],                                        // Exercice
        nbsteps     : 12,
        errratio    : 1,
        background  : "",
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
        // End all timers
        quit: function($this) {
            var settings = helpers.settings($this);
            // if (settings.timerid) { clearTimeout(settings.timerid); }
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

                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                
                // PREPARE MODE + COLORS + BRUSHES
                setTimeout(function() { $this.find("#modes #mmode"+settings.paintmode).show(); }, 100);
                
                for (var i=0; i<settings.colors.length; i++ ) {
                    var c=settings.colors[i];
                    var $elt = $("<div class='icon' id='c"+i+"' "+
                             "style='background-color:rgb("+c.rgb[0]+","+c.rgb[1]+","+c.rgb[2]+")'></div>");
                    if (c.content) {
						if (c.content.indexOf(".svg")!=-1) 	{ $elt.append("<img src='"+c.content+"' alt=''/>"); }
						else 								{ $elt.append(c.content); }
					}
					
                    $elt.bind("touchstart mousedown",function(_event) {
                        if (!$(this).hasClass("d")) {
                            $(this).closest('.board').board('menu','color',$(this).attr("id"));
                        }
						_event.preventDefault();
					});
					
                    if (c.number) { $elt.append("<div class='number'>"+c.number+"</div>"); }
                    c.count=c.number?c.number:-1;
                    $this.find("#colors").append($elt);
                }
                if (settings.colorsfont) { $this.find("#colors").css("font-size",settings.colorsfont+"em"); }
                else { $this.find("#colors").hide(); $this.find("#mcolor").hide(); }
                
                var maxw=0,maxh=0;
                for (var i in settings.brushes) {
                    var brush=settings.brushes[i];
                    var bh=brush.bitmap.length, bw = 0;
                    maxh=Math.max(maxh,bh);
                    for (var j in brush.bitmap) {
                        var bit = 1;
                        for (var b=0; b<8; b++) {
                            if ((brush.bitmap[j]&bit)!=0) { bw=Math.max(b+1,bw); } bit*=2; }   
                    }
                    maxw=Math.max(maxw,bw);
                    var bitmap=[];
                    for (var j=0; j<bh; j++) { var line=[]; for (var i=0; i<bw; i++) { line.push(0); } bitmap.push(line); }
                    settings.brushdata.push({size:[bw,bh], bitmap:bitmap});
                }
                var max=Math.max(maxw,maxh);
                for (var i=0; i<settings.brushes.length; i++) {
                    var brush=settings.brushes[i];
                    var $elt=$("<div class='icon' id='b"+i+"'></div>");
                    var svg="<svg width='100%' height='100%' viewBox='0 0 "+(8+max*8)+" "+(8+max*8)+"'>";
                    for (var j=0; j<brush.bitmap.length; j++) {
                        var bit = 1;
                        var offx = (max-settings.brushdata[i].size[0])/2;
                        var offy = (max-settings.brushdata[i].size[1])/2;
                        for (var b=0; b<max; b++) {
                            if ((brush.bitmap[j]&bit)!=0) {
								settings.brushdata[i].bitmap[j][settings.brushdata[i].size[0]-b-1]=1;
                                svg+="<rect x='"+(4+8*(max-b-1-offx))+"' y='"+(4+8*(j+offy))+"' width='8.5' height='8.5'/>";
                            }
                            bit*=2;
                        }
                    }
                    svg+="</svg>";
                    $elt.bind("touchstart mousedown",function(_event) {
                        if (!$(this).hasClass("d")) {
                            $(this).closest('.board').board('menu','brush',$(this).attr("id"));
                        }
						_event.preventDefault();
					});
                    $elt.html(svg);
                    if (brush.number) {
						$elt.append("<div class='number'>"+brush.number+"</div>");
					}
                    brush.count=brush.number?brush.number:-1;
                    $this.find("#brushes").append($elt);
                }
                if (settings.brushesfont) { $this.find("#brushes").css("font-size",settings.brushesfont+"em");
                } else { $this.find("#brushes").hide(); $this.find("#mbrush").hide(); }
				
                // BUILD CELL
                var createcell=function(_i, _j, _margin, _color) {
                    var cell={
                        $elt:$("<div class='c' id='c"+_i+"x"+_j+"' "+
                            "style='top:"+(1.2*(_j+_margin[1]))+"em;left:"+(1.2*(_i+_margin[0]))+"em;'></div>"),
                            color: $.extend(true,{},_color),
                            update: function() {
                                this.$elt.css("background-color","rgb("+this.color.rgb[0]+","+this.color.rgb[1]+","+this.color.rgb[2]+")");
                                if (this.color.content) {
                                    if (this.color.content.indexOf(".svg")!=-1) {
                                        this.$elt.html("<img src='"+this.color.content+"' alt=''/>");
                                    }
                                    else { this.$elt.html(this.color.content); }
                                }
                                else { this.$elt.html(""); }
                            }
                        };
                    return cell;
                }
                
				// BUILD BOARD
				if (!settings.board.colors) { settings.board.colors=$.extend({},settings.colors); }
				else if (settings.board.colormode=="append") {
					for (var i in settings.colors) { settings.board.colors.unshift(settings.colors[i]); }
				}
				if (settings.board.margin && !$.isArray(settings.board.margin)) {
                    settings.board.margin=[settings.board.margin,settings.board.margin];
				}
				var margin=settings.board.margin;
                settings.brushpos=[margin[0], margin[1], 0];
				max=Math.max(settings.size[0]+2*margin[0], settings.size[1]+2*margin[1]);
                
                if (settings.inside) {
                    settings.boundaries=[ margin[0], margin[1],
                                          margin[0]+settings.size[0], margin[1]+settings.size[1]];
                }
                else { settings.boundaries=[ 0, 0, 2*margin[0]+settings.size[0], 2*margin[1]+settings.size[1]]; }
                
				$this.find("#board>div").css("font-size",(10/max)+"em");
                for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
					var cid=settings.board.content[i+j*settings.size[0]];
					if (cid!='.' && settings.board.colors[cid]) {
                        var elt = createcell(i,j,margin,settings.board.colors[cid]);
                        elt.update();
						$this.find("#board>div").append(elt.$elt);
                        settings.elts["c"+i+"x"+j]=elt;
					}
				}
                
                // BUILD MODEL
                if (!settings.model.colors) { settings.model.colors=$.extend({},settings.colors); }
				else if (settings.model.colormode=="append") {
					for (var i=0; i<settings.colors.length; i++) {
                        settings.model.colors.unshift(settings.colors[settings.colors.length-i-1]); }
				}
                max=Math.max(settings.size[0], settings.size[1]);
                var size=(6/max)/1.2;
                for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
					var cid=settings.model.content[i+j*settings.size[0]];
					if (cid!='.' && settings.model.colors[cid]) {
                        var m = createcell(i,j,[0,0],settings.model.colors[cid]);
                        m.$elt.css("font-size",size+"em");
                        m.update();
                        var elt = settings.elts["c"+i+"x"+j];
                        if (elt) { elt.result=$.extend({},m.color); }
						$this.find("#model").append(m.$elt);
					}
				}
                
                // User interface
                $this.find("#board").bind("touchstart mousedown", function(event) {
                    if (settings.interactive && settings.brushid!=-1) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
                        
                        var now = new Date();
                        settings.action.tick    = now.getTime();
                        settings.action.mouse   = [ vEvent.clientX, vEvent.clientY];
                        settings.action.save    = [ settings.brushpos[0], settings.brushpos[1]];
                        settings.action.size    = $(this).find(".t").width();
                        settings.action.dist    = 0;
                        $this.find("#cursor").addClass("dragging");
                    }
                    event.preventDefault();
                });
                
                $this.find("#board").bind("touchmove mousemove", function(event) {
                    if (settings.interactive && settings.action.mouse) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
                        
                        var vX = (vEvent.clientX - settings.action.mouse[0])
                                +(settings.action.save[0]*settings.action.size);
                        var vY = (vEvent.clientY - settings.action.mouse[1])
                                +(settings.action.save[1]*settings.action.size);
                        
                        settings.action.dist = Math.pow( vEvent.clientX - settings.action.mouse[0], 2) +
                                               Math.pow( vEvent.clientY - settings.action.mouse[1], 2);

                        if (vX<settings.boundaries[0]*settings.action.size) {
                            vX = settings.boundaries[0]*settings.action.size; }
                        else if (vX+settings.action.size*settings.action.brushsize[0] >
                                 settings.boundaries[2]*settings.action.size) {
                            vX = settings.action.size*(settings.boundaries[2]-settings.action.brushsize[0]);
                        }
                        
                        if (vY<settings.boundaries[1]*settings.action.size) {
                            vY = settings.boundaries[1]*settings.action.size; }
                        else if (vY+settings.action.size*settings.action.brushsize[1] >
                                 settings.boundaries[3]*settings.action.size) {
                            vY = settings.action.size*(settings.boundaries[3]-settings.action.brushsize[1]);
                        }
                            
                        settings.brushpos[0] = Math.round(vX/settings.action.size);
                        settings.brushpos[1] = Math.round(vY/settings.action.size);

                        $this.find("#cursor").css("top", vY+"px").css("left",vX+"px");
                    }
                });
                
                $this.find("#board").bind("touchend touchleave mouseup mouseleave", function() {
                    if (settings.interactive && settings.action.mouse) {
                        var now         = new Date();
                        var rotation    = -1;

                        if (now.getTime()-settings.action.tick<400 && settings.action.dist < 10) {
                            settings.brushpos[2]=(settings.brushpos[2]+1)%4;
                        }

                        $this.find("#cursor").removeClass("dragging");
                        helpers.drawbrush($this);
                    }
                    
                    settings.action.mouse   = 0;
                });
                
                helpers.brush($this,0);
                helpers.color($this,0);
                helpers.counter($this);
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        brush: function($this, _id) {
			var settings = helpers.settings($this);
			$this.find("#brushes .icon").removeClass("s");
			if (settings.brushid==_id) { settings.brushid=-1; }
			else {
				$this.find("#brushes #b"+_id).addClass("s");
				settings.brushid=_id;
			}
			helpers.drawbrush($this);
		},
        color: function($this, _id) {
			var settings = helpers.settings($this);
			$this.find("#colors .icon").removeClass("s");
			if (settings.colorid==_id) { settings.colorid=-1; }
			else {
				$this.find("#colors #c"+_id).addClass("s");
				settings.colorid=_id;
			}
		},
		drawbrush: function($this) {
			var settings = helpers.settings($this);
			$this.find("#board #cursor").detach();
			if (settings.brushid!=-1) {
				var ref=settings.brushdata[settings.brushid];
				var rotation = settings.brushpos[2];
				var size=(rotation%2==0)?[ref.size[0],ref.size[1]]:[ref.size[1],ref.size[0]];
                settings.action.brushsize = size;
				settings.bitmap=[];
                
                settings.brushpos[0]=Math.min(settings.brushpos[0],settings.boundaries[2]-size[0]);
                settings.brushpos[1]=Math.min(settings.brushpos[1],settings.boundaries[3]-size[1]);
                
                var $cursor=$("<div id='cursor'></div>");
                $cursor.css("left",1.2*settings.brushpos[0]+"em").css("top",1.2*settings.brushpos[1]+"em");
                
                for (var j=0; j<size[1]; j++) { var line=[]; for (var i=0; i<size[0]; i++) { line.push(0); } settings.bitmap.push(line); }
                for (var j=0; j<ref.size[1]; j++) for (var i=0; i<ref.size[0]; i++) {
					if (ref.bitmap[j][i]) {
						switch(rotation) {
							case 1:	settings.bitmap[i][size[0]-j-1]=1;break;
							case 2: settings.bitmap[size[1]-j-1][size[0]-i-1]=1;break;
							case 3: settings.bitmap[size[1]-i-1][j]=1;break;
							default: settings.bitmap[j][i]=1; break;
						}
					}
				}
				for (var j=0; j<size[1]; j++) for (var i=0; i<size[0]; i++) {
					if (settings.bitmap[j][i]) {
						var $elt=$("<div class='t alphakeypad' style='top:"+j+"em;left:"+i+"em;'/></div>");
						var b=[
							(j==0||!settings.bitmap[j-1][i]),
							(i==size[0]-1||!settings.bitmap[j][i+1]),
							(j==size[1]-1||!settings.bitmap[j+1][i]),
							(i==0||!settings.bitmap[j][i-1]) ];
                        
						$elt.css("border-width",(b[0]?"5px":"0")+" "+(b[1]?"5px":"0")+" "+(b[2]?"5px":"0")+" "+(b[3]?"5px":"0"));
						$elt.css("margin",(b[0]?"-5px":"0")+" "+(b[1]?"-5px":"0")+" "+(b[2]?"-5px":"0")+" "+(b[3]?"-5px":"0"));
                        
						$cursor.append($elt);
						
					}
				}
				$this.find("#board>div").append($cursor);
				
			}
		},
        updatecolor:function($this, _id) {
			var settings = helpers.settings($this);
            var c = settings.colors[_id];
            if (c.number) {
                $this.find("#colors #c"+_id+" .number").html(c.count);
                if (c.count) { $this.find("#colors #c"+_id).removeClass("d"); }
                else {
                    $this.find("#colors #c"+_id).removeClass("s").addClass("d");
                    if (_id==settings.colorid) { settings.colorid=-1; }
                }
            }
        },
        updatebrush:function($this, _id) {
			var settings = helpers.settings($this);
            var b = settings.brushes[_id];
            if (b.number) {
                $this.find("#brushes #b"+_id+" .number").html(b.count);
                if (b.count) { $this.find("#brushes #b"+_id).removeClass("d"); }
                else {
                    $this.find("#brushes #b"+_id).removeClass("s").addClass("d");
                    if (_id==settings.brushid) {
                        settings.brushid=-1;
                        helpers.drawbrush($this);
                    }
                }
            }
        },
        paint: function($this) {
			var settings = helpers.settings($this);
            if (settings.interactive && settings.colorid!=-1 && settings.brushid!=-1) {
                helpers.save($this);
                
                settings.interactive = false;
                $this.find("#board .t").addClass("touch");
               
                for (var j=0; j<settings.bitmap.length; j++) for (var i=0; i<settings.bitmap[j].length; i++) {
                    if (settings.bitmap[j][i]) {
                        helpers.action($this, settings.brushpos[0]+i-settings.board.margin[0],
                                              settings.brushpos[1]+j-settings.board.margin[1],
                                              settings.colors[settings.colorid], settings.paintmode);
                    }
                }
                
                if (settings.colors[settings.colorid].number) {
                    settings.colors[settings.colorid].count--;
                    helpers.updatecolor($this, settings.colorid);
                }
                if (settings.brushes[settings.brushid].number) {
                    settings.brushes[settings.brushid].count--;
                    helpers.updatebrush($this, settings.brushid);
                }
                
                setTimeout(function() {
                    $this.find("#board .t").removeClass("touch");
                    settings.interactive = true;
                },50);
            }
        },
        counter: function($this) {
			var settings = helpers.settings($this);
            var c = settings.stack.length;
            $this.find("#cvalue").html(c+"/"+settings.nbsteps);
            $this.find("#slider").css("width",(100*c/settings.nbsteps)+"%");
            $this.find("#bar").removeClass("w").removeClass("g");
            if (c==settings.nbsteps) { $this.find("#bar").addClass("g"); } else
            if (c>settings.nbsteps)  { $this.find("#bar").addClass("w"); }
        },
        save: function($this) {
			var settings = helpers.settings($this);
            var elt={brushes:[], colors:[]};
            for (var i in settings.elts) { elt[i]=$.extend({},settings.elts[i].color); }
            for (var i in settings.colors) { elt.colors.push(settings.colors[i].count); }
            for (var i in settings.brushes) { elt.brushes.push(settings.brushes[i].count); }
            settings.stack.push(elt);

            helpers.counter($this);
        },
        restore: function($this, _data) {
			var settings = helpers.settings($this);
            for (var i in settings.elts) {
                settings.elts[i].color = _data[i];
                settings.elts[i].update(); }
            for (var i=0; i<_data.colors.length; i++) {
                settings.colors[i].count = _data.colors[i];
                helpers.updatecolor($this, i);
            }
            for (var i=0; i<_data.brushes.length; i++) {
                settings.brushes[i].count = _data.brushes[i];
                helpers.updatebrush($this, i);
            }
            helpers.counter($this);
        },
        action: function($this, _i, _j, _color, _paintmode) {
			var settings = helpers.settings($this);
            var elt = settings.elts["c"+_i+"x"+_j];
            if (elt) {
                switch(_paintmode) {
                    case 1:
                        elt.color.rgb=[ Math.min(elt.color.rgb[0]+_color.rgb[0],255),
                                        Math.min(elt.color.rgb[1]+_color.rgb[1],255),
                                        Math.min(elt.color.rgb[2]+_color.rgb[2],255) ];
                        elt.color.content = _color.content;
                        break;
                    case 2:
                    console.log(JSON.stringify(elt.color.rgb)+" "+JSON.stringify(_color.rgb));
                        elt.color.rgb=[ Math.min(elt.color.rgb[0],_color.rgb[0]),
                                        Math.min(elt.color.rgb[1],_color.rgb[1]),
                                        Math.min(elt.color.rgb[2],_color.rgb[2]) ];
                        elt.color.content = _color.content;
                        break;
                    default:
                        elt.color.rgb=[_color.rgb[0], _color.rgb[1], _color.rgb[2]];
                        elt.color.content = _color.content;
                        break;
                }
                elt.update();
            }
        }
    };

    // The plugin
    $.fn.board = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    brushdata		: [],
                    brushpos		: [0,0,0],
                    brushid			: -1,
                    action          : { tick:0, mouse:0, size:0, save:0, brushsize:[1,1], dist:0 },
                    colorid			: -1,
                    stack           : [],
                    bitmap          : [],
                    elts            : {}
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
            devmode: function() {
                var $this = $(this) , settings = helpers.settings($this);
                var ret="";
                for (var i in settings.elts) {
                    var r='.';
                    var c1 = settings.elts[i].color;
                    for (var j in settings.model.colors) {
                        var c2 = settings.model.colors[j];
                        if (c1.rgb && c2.rgb &&
                            c1.rgb[0]==c2.rgb[0] && c1.rgb[1]==c2.rgb[1] && c1.rgb[2]==c2.rgb[2] ) { r = j; }
                    }
                    ret+=r;
                }
                $this.find("#devoutput textarea").val("\"content\":\""+ret+"\"").parent().show();
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            menu: function(_type, _id) { helpers[_type]($(this), _id.substr(1)); },
            paint: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) { helpers.paint($this); }
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
                    $this.find("#cursor").hide();
                    var nberrors=0;
                    for (var i in settings.elts) {
                        var elt=settings.elts[i];
                        if (elt.color && elt.result) {
                            if (elt.color.rgb[0] != elt.result.rgb[0] ||
                                elt.color.rgb[1] != elt.result.rgb[1] ||
                                elt.color.rgb[2] != elt.result.rgb[2] ||
                                elt.color.content!= elt.result.content )
                            {
                                nberrors++;
                                if (settings.wrong) {
                                    elt.color.rgb = settings.wrong.rgb;
                                    elt.color.content = settings.wrong.content;
                                    elt.update();
                                }
                            }
                        }
                    }
                    $this.find("#subvalid").hide();
                    $this.find(nberrors?"#wrong":"#good").show();
                    $this.find(nberrors?"#subwrong":"#subgood").show();
                    
                    if (settings.stack.length>settings.nbsteps) { nberrors++; }
                    settings.score = Math.max(0, Math.round(5 - nberrors*settings.errratio));
                    
                    setTimeout(function() { helpers.end($this); }, 2000);
                    
                }
            },
            back:function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && settings.stack.length) {
                    settings.interactive = false;
                    $this.find("#left1").hide();
                    var data=settings.stack.pop();
                    helpers.restore($this,data);
                    setTimeout(function() { $this.find("#left1").show();settings.interactive=true; }, 300);
                }
            }
            
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in board plugin!'); }
    };
})(jQuery);

