(function($) {
    // Activity default options
    var defaults = {
        name        : "impress",                            // The activity name
        label       : "Impress",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
		edit		: false,									// Editor mode
        slides    	: [],                                       // Slides
        background  : "",
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
        end: function($this, _args) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this, _args);
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
					if($.type(value) === "string") { $this.find("#"+id).html(value); }
                }); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

				// BUILD THE PAGES
				helpers.build($this);
				
				$this.find("#isboard").bind("touchstart mousedown", function(_event) {
					if (settings.interactive) {
						settings.interactive = false;
						if ($this.find("#isboard .slide .d").length) {
							// HANDLE DYNAMIC ELEMENTS
							$this.find("#isboard .slide .d").first().animate({opacity:1}, 500, function() { $(this).removeClass("d"); settings.interactive = true; });
						}
						else {
							if (settings.slideid<settings.slides.length) {
								// MOVE TO NEXT SLIDE
								helpers.show($this, settings.slideid+1);
								helpers.hide($this, settings.slideid, function() {
									settings.slideid++;
									settings.interactive = true;
								});
							}
							else {
								if (!settings.edit) { helpers.end($this, {'status':'success','score':9}); }
								else				{ settings.interactive = true; }
							}
						}
					}
				});
				
				$this.find("#isthumbslides").css("margin-left",0)
				helpers.arrow($this);
				
				// SHOW FIRST PAGE
				helpers.show($this, settings.slideid);

                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		build: function($this) {
            var settings = helpers.settings($this);
			$this.find("#isthumbslides").html("").css("width",(settings.slides.length*36)+"em");
			for (var i=0; i<settings.slides.length; i++) {
				$this.find("#isthumbslides").append(
					helpers.slide(settings.slides[i]).attr("id","s"+i)
					.bind("touchstart mousedown", function(_event) {
						if (settings.interactive) {
							helpers.hide($this, settings.slideid, false);
							settings.slideid = parseInt($(this).attr("id").substr(1));
							helpers.show($this, settings.slideid);
						}
						_event.stopPropagation();
						_event.preventDefault();
					})
				);
			}
		},
		slide: function(_data) {
			var $slide=$("<div class='slide'></div>").addClass(_data.type);
			if (_data.title) 	{ $slide.append("<div class='title p'>"+jtools.format(_data.title)+"</div>"); }
			if (_data.subtitle) { $slide.append("<div class='subtitle p'>"+jtools.format(_data.subtitle)+"</div>"); }
			if (_data.content) 	{ $slide.append("<div class='content p'>"+jtools.format(_data.content)+"</div>"); }
					
			switch(_data.type) {
				case 'title': break;
				case 'list':
					var html="<div class='p'>";
					for (var i=0; i<_data.list.length; i++) {
						html+="<div class='li p"+(i&&_data.dynamic?" d":"")+"'>";
						html+=_data.li?_data.li:"<b>"+(i+1)+".</b> ";
						html+=jtools.format(_data.list[i])+"</div>";
					}
					html+="</div>";
					$slide.append(html);
				break;
				case 'img':
					var size = _data.size?_data.size:100;
					$slide.append("<div class='"+(_data.dynamic?" d":"")+"' style='width:"+size+"%;margin:0 auto'><img src='"+_data.src+"' alt=''/></div>");
				break;
				default:
				break;
			}
			
			if (_data.footer) 	{ $slide.append("<div class='content p'>"+jtools.format(_data.footer)+"</div>"); }
			if (_data["class"]) { $slide.addClass(_data["class"]); }
			return $slide;
		},
		clean: function($this) { $this.find("#isboard").html(""); },
		show: function($this, _id) {
            var settings = helpers.settings($this);
			$this.find("#isthumbslides .slide").removeClass("s");
			if (_id<settings.slides.length) {
				var slide = settings.slides[_id];
				var $slide = $this.find("#isthumbslides #s"+_id).clone();
				$this.find("#isthumbslides #s"+_id).addClass("s");
				$this.find("#isboard").prepend($slide);
				
				if (settings.edit && settings.context && settings.context.onedit) {
					settings.context.onedit($this, {id:_id, data:settings.slides[_id]});
				}
			}
			else { $this.find("#isend").show(); $this.find("#control").html(""); }
		},
		hide: function($this, _id, _cbk) {
            var settings = helpers.settings($this);
			console.log(_id+" "+settings.slides.length);
			if (_id<settings.slides.length) {
				var slide = settings.slides[_id];
				if (_cbk && slide.out) {
					switch (slide.out) {
						case "fade" :
							$this.find("#isboard #s"+_id).animate({opacity:0},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "toright" :
							$this.find("#isboard #s"+_id).animate({left:"100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "toleft" :
							$this.find("#isboard #s"+_id).animate({left:"-100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "totop" :
							$this.find("#isboard #s"+_id).animate({top:"-100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "tobottom" :
							$this.find("#isboard #s"+_id).animate({top:"100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						default: $this.find("#isboard #s"+_id).detach(); _cbk(); break;
					}
				}
				else { $this.find("#isboard #s"+_id).detach(); }
			}
		},
		arrow:function($this) {
            var settings = helpers.settings($this);
			if (settings.offset<=0) { $this.find("#thumbleft").hide(); } else { $this.find("#thumbleft").show(); }
			if (settings.offset+5>=settings.slides.length) { $this.find("#thumbright").hide(); } else { $this.find("#thumbright").show(); }
		},
		update:function($this) {
            var settings = helpers.settings($this);
			helpers.build($this);
			helpers.clean($this);
			helpers.show($this, settings.slideid);
			
			var newOffset = 5*Math.floor(settings.slideid/5);
			if (newOffset!=settings.offset) {
				settings.offset=newOffset;
				$this.find("#isthumbslides").animate({"margin-left":(-1*settings.offset*34.5)+"em"}, 800,
					function() { helpers.arrow($this); } );
			}
			else { helpers.arrow($this); }
		}
    };

    // The plugin
    $.fn.impress = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
					slideid			: 0,
					offset			: 0
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
            },
			thumbnail: function() {
                var $this = $(this) , settings = helpers.settings($this);
				if (settings.interactive)
				{
					settings.interactive = false;
					if ($this.find("#isthumbhelper").hasClass("s")) {
						$this.find("#isthumbnails").animate({top:"95.5%"}, 800, function() {
							settings.interactive = true;
							$this.find("#isthumbhelper").removeClass("s");
						});
					}
					else {
						$this.find("#isthumbnails").animate({top:"78%"}, 800, function() {
							settings.interactive = true;
							$this.find("#isthumbhelper").addClass("s");
						});
					}
				}
			},
			arrow: function(_value) {
                var $this = $(this) , settings = helpers.settings($this);
				if (settings.interactive)
				{
					var newoffset = settings.offset + _value*5;
					if (newoffset>=0 && newoffset<settings.slides.length+10) {
						settings.interactive = false;
						settings.offset = newoffset;
						$this.find("#isthumbslides").animate({"margin-left":(-1*settings.offset*34.5)+"em"}, 800,
							function() { helpers.arrow($this); settings.interactive = true; } );
					}
				}
			},
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            },
			e_settings: function() { return helpers.settings($(this)); },
			e_update: function() { helpers.update($(this)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in impress plugin!'); }
    };
})(jQuery);

