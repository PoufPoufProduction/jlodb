(function($) {
    // Activity default options
    var defaults = {
        name        : "stories",                            // The activity name
        label       : "Stories",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        background  : "",
		maps		: {
			"start":{
					"tileset":"set1",
					"background":"#afc84b",
					"size":[8,16],
					"bg":[121,121,1,1,1,1,2,2,101,1,2,3,11,3,1,1,205,205,208,1,4,4,4,4,2,11,206,1,203,12,11,2,2,3,213,205,212,211,205,205,2,3,206,1,1,204,12,2,2,201,212,202,4,12,11,4,4,3,4,101,101,1,2,2,4,4,1,1,1,1,101,2,4,1,2,3,2,3,1,1,3,4,1,1,4,4,4,4,2,3,3,1,1,1,2,2,2,3,3,2,101,101,2,2,2,3,3,1,101,101,101,2,2,3,3,4,4,1,4,4,4,3,4,4,1,1,2,2]
			}
		},
		mapid		: "start",									// Starting map
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

	var newtile = function(_tileset, _ref, _id, _pos) {
		var ret = {
			c : 1.02, // CORRECTION TO AVOID GAP
			pos:[_pos[0],_pos[1]], size:[1,1], offset:[0,0],
			$html:$("<div id='"+_id+"' class='elt'><img src='res/img/tileset/ortho/"+_tileset+"/"+_ref+".svg' alt=''/></div>")
		};
		ret.$html.css("left",ret.pos[0]+"em").css("top",ret.pos[1]+"em")
				 .css("width",(ret.c*ret.size[0])+"em").css("height",(ret.c*ret.size[1])+"em");
		
		return ret;
	}
	
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
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }

                // BUILD ALL MAPS
				for (var m in settings.maps) {
					
					var map = $.extend(true, {
// DEFAULT MAP CLASS
zoommin		: 0,						// Number of tiles shown when zoom max
zoommax 	: 2,						// Number of tiles shown when zoom min
zoom		: 0,						// Zoom value (from 0/zoommin to 1 zoommax)
$board		: $this.find("#board"),
nav: function(_delta) {
	for (var i=0; i<2; i++) {
		this.focus[i]=Math.max(this.focus[i],this.zoom/2);
		this.focus[i]=Math.min(this.focus[i],this.size[i]-this.zoom/2);
	}
	
	if (!_delta) { _delta=[0,0]; }
    var x = Math.min(this.size[0]-this.zoom, Math.max(0,this.focus[0] - _delta[0] - this.zoom/2));
    var y = Math.min(this.size[1]-this.zoom, Math.max(0,this.focus[1] - _delta[1] - this.zoom/2));
	
	
	console.log(this.focus[0]+" - "+ _delta[0] +" - "+ (this.zoom/2)+" -> "+x);
            
	this.$board.find("#eleft").toggle(x>0.001);
    this.$board.find("#etop").toggle(y>0.001);
    this.$board.find("#eright").toggle(x<this.size[0]-this.zoom-0.001);
    this.$board.find("#ebottom").toggle(y<this.size[1]-this.zoom-0.001);

	this.$board.find(".map").css("left",-x+"em").css("top",-y+"em");
	
},
setzoom: function(_zoom, _cbk) {
	if (_zoom>=0 && _zoom<=1) { this.zoom = this.zoommin + (this.zoommax-this.zoommin)*_zoom; }

	// vSize*vNoZoomSize HAS TO BE INTEGER (ELSE BORDER WILL APPEAR)
	var vSize = 10/this.zoom;
	this.$map.css("font-size",vSize+"em");
	this.nav();
},
show: function(_args) {
	this.$board.find(".map").detach();
	this.$board.prepend(this.$map)
			   .css("background-color",this.background);
    this.setzoom(this.zoom);
					
}
					}, settings.maps[m]);
					
					// INIT MAP
					map.$map = $("<div class='map'><div class='bg'></div></div>");
					map.$map.css("width",map.size[0]+"em").css("height",map.size[1]+"em");
					
					// BUILDS TILES
					map.data = [];
					for (var i=0; i<map.size[0]*map.size[1]; i++) {
						
						ref=map.bg[i].toString();
						if (ref!="0") {
							while (ref.length<3) { ref="0"+ref; }
							var t = newtile(map.tileset, ref, i, [i%map.size[0],Math.floor(i/map.size[0])]);
							
							map.data.push(t);
							map.$map.find(".bg").append(t.$html);
						}
					}
					// HANDLE SIZE
					if (!map.zoomin) { map.zoommin = Math.min(map.size[0],map.size[1]); }
					map.focus = [ map.zoommin/2, map.zoommin/2 ];
					
					
					settings.maps[m] = map;
				}
				
				$this.find("#board").bind("mousedown touchstart", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
                    if (settings.interactive ) {
                        settings.action.start 	= [ vEvent.clientX, vEvent.clientY];
						settings.action.type	= 1;
						
                    }
                    event.stopPropagation();
                    event.preventDefault();
                });
				
				$this.find("#board").bind("mousemove touchmove", function(event) {
					var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?event.originalEvent.touches[0]:event;
                    if (settings.interactive && settings.action.type ) {
						switch(settings.action.type) {
							case 1:
								var s = $this.find("#board .map .elt").width();
								settings.action.data =
									[ (vEvent.clientX-settings.action.start[0])/s,
									  (vEvent.clientY-settings.action.start[1])/s ]
								settings.maps[settings.mapid].nav( settings.action.data );
								break;
						}
							
					}
                    event.stopPropagation();
                    event.preventDefault();
				});
				
				$this.find("#board").bind("mouseup touchend mouseleave touchleave", function(event) {
					if (settings.interactive && settings.action.type ) {
						switch(settings.action.type) {
							case 1:
								settings.maps[settings.mapid].focus =
									[ (settings.maps[settings.mapid].focus[0] - settings.action.data[0]),
									  (settings.maps[settings.mapid].focus[1] - settings.action.data[1]) ];
								settings.maps[settings.mapid].nav();
								break;
						}
						
						settings.action.type = 0;
					}
                    event.preventDefault();
				});

				setTimeout(function() {
                    settings.maps[settings.mapid].show();

					// ZOOM SLIDER HANDLING
                    $this.find("#zoom #cursor")
                        .draggable({ axis:"x", containment:"parent",
                            drag:function() {
                                var x= ($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width());
                                settings.maps[settings.mapid].setzoom(x);
							},
							stop: function() {
								var x= 10*($(this).offset().left-$(this).parent().offset().left)/$(this).parent().width();
								$(this).css("width", "50%").css("left", x+"em");
							}
						});
                }, 1);
				
				
				
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.stories = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
					action : { start:0, type:0, data:0 }
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
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in stories plugin!'); }
    };
})(jQuery);

