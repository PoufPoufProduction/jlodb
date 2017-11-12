(function($) {
    // Activity default options
    var defaults = {
        name        : "board",                                  // The activity name
        label       : "Board",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        paintmode   : 0,                        // O:opaque, 1:add, 2:sub, 3:def
        colors      : [[0,0,0],[255,255,255]],
        colorsfont  : 1.7,
        brushes     : [[3,3]],
        brushesfont : 1.7,
        exercice    : [],                                       // Exercice
        background  : "",
        debug       : false                                     // Debug mode
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
						$(this).closest('.board').board('menu','color',$(this).attr("id"));
						_event.preventDefault();
					});
					
                    if (c.number) { $elt.append("<div class='number'>"+c.number+"</div>"); }
                    $this.find("#colors").append($elt);
                }
                $this.find("#colors").css("font-size",settings.colorsfont+"em");
                helpers.color($this,0);
                
                var maxw=0,maxh=0;
                for (var i in settings.brushes) {
                    var brush=settings.brushes[i];
                    var bh=brush.bitmap.length, bw = 0;
                    maxh=Math.max(maxh,bh);
                    for (var j in brush.bitmap) {
                        var bit = 1;
                        for (var b=0; b<8; b++) { if ((brush.bitmap[j]&bit)!=0) { bw=b+1; } bit*=2; }
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
						$(this).closest('.board').board('menu','brush',$(this).attr("id"));
						_event.preventDefault();
					});
                    $elt.html(svg);
                    if (brush.number) {
						$elt.append("<div class='number'>"+brush.number+"</div>");
					}
                    $this.find("#brushes").append($elt);
                }
                $this.find("#brushes").css("font-size",settings.brushesfont+"em");
                helpers.brush($this,0);
                
                // BUILD MODEL
                if (!settings.model.colors) { settings.model.colors=$.extend({},settings.colors); }
				else if (settings.model.colormode=="append") {
					for (var i in settings.colors) { settings.model.colors.unshift(settings.colors[i]); }
				}
                max=Math.max(settings.size[0], settings.size[1]);
                var size=(6/max)/1.2;
                for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
					var cid=settings.model.content[i+j*settings.size[0]];
					if (cid!='.') {
						var c=settings.model.colors[cid];
						var $elt = $("<div style='font-size:"+size+"em;top:"+(1.2*j)+"em;left:"+(1.2*i)+"em;"+
										"background-color:rgb("+c.rgb[0]+","+c.rgb[1]+","+c.rgb[2]+")'></div>");
						if (c.content) {
							if (c.content.indexOf(".svg")!=-1) 	{ $elt.append("<img src='"+c.content+"' alt=''/>"); }
							else 								{ $elt.append(c.content); }
						}
						$this.find("#model").append($elt);
					}
				}
				
				// BUILD BOARD
				if (!settings.board.colors) { settings.board.colors=$.extend({},settings.colors); }
				else if (settings.board.colormode=="append") {
					for (var i in settings.colors) { settings.board.colors.unshift(settings.colors[i]); }
				}
				var margin=[0,0];
				if (settings.board.margin) {
					if ($.isArray(settings.board.margin)) { margin=settings.board.margin; }
					else { margin=[settings.board.margin,settings.board.margin]; }
				}
				max=Math.max(settings.size[0]+2*margin[0], settings.size[1]+2*margin[1]);
				$this.find("#board>div").css("font-size",(10/max)+"em");
                for (var j=0; j<settings.size[1]; j++) for (var i=0; i<settings.size[0]; i++) {
					var cid=settings.board.content[i+j*settings.size[0]];
					if (cid!='.') {
						var c=settings.board.colors[cid];
						var $elt = $("<div class='c' id='c"+i+"x"+j+"' "+
								     "style='top:"+(1.2*(j+margin[1]))+"em;left:"+(1.2*(i+margin[0]))+"em;"+
										"background-color:rgb("+c.rgb[0]+","+c.rgb[1]+","+c.rgb[2]+")'></div>");
						if (c.content) {
							if (c.content.indexOf(".svg")!=-1) 	{ $elt.append("<img src='"+c.content+"' alt=''/>"); }
							else 								{ $elt.append(c.content); }
						}
						$this.find("#board>div").append($elt);
					}
				}
                
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
			$this.find("#board .t").detach();
			if (settings.brushid!=-1) {
				var ref=settings.brushdata[settings.brushid];
				var rotation = settings.brushpos[2];
				var size=(rotation%2==0)?[ref.size[0],ref.size[1]]:[ref.size[1],ref.size[0]];
				var bitmap=[];
                for (var j=0; j<size[1]; j++) { var line=[]; for (var i=0; i<size[0]; i++) { line.push(0); } bitmap.push(line); }
                for (var j=0; j<ref.size[1]; j++) for (var i=0; i<ref.size[0]; i++) {
					if (ref.bitmap[j][i]) {
						switch(rotation) {
							case 1:	bitmap[i][size[0]-j-1]=1;break;
							case 2: bitmap[size[1]-j-1][size[0]-i-1]=1;break;
							case 3: bitmap[size[1]-i-1][j]=1;break;
							default: bitmap[j][i]=1; break;
						}
					}
				}
				for (var j=0; j<size[1]; j++) for (var i=0; i<size[0]; i++) {
					if (bitmap[j][i]) {
						var $elt=$("<div class='t' style='top:"+j+"em;left:"+i+"em;'/></div>");
						var b=[
							(j==0||!bitmap[j-1][i]),
							(i==size[0]-1||!bitmap[j][i+1]),
							(j==size[1]-1||!bitmap[j+1][i]),
							(i==0||!bitmap[j][i-1]) ];
						$elt.css("border-width",(b[0]?".1em":"0")+" "+(b[1]?".1em":"0")+" "+(b[2]?".1em":"0")+" "+(b[3]?".1em":"0"));
						$elt.css("margin",(b[0]?"-0.1em":"0")+" "+(b[1]?"-0.1em":"0")+" "+(b[2]?"-0.1em":"0")+" "+(b[3]?"-0.1em":"0"));
						$this.find("#board>div").append($elt);
						
					}
				}
				
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
                    colorid			: -1
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
                $this.find("#devoutput textarea").val("Debug output").parent().show();
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
            menu: function(_type, _id) { helpers[_type]($(this), _id.substr(1)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in board plugin!'); }
    };
})(jQuery);

