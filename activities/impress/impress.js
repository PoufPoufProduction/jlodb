(function($) {
    // Activity default options
    var defaults = {
        name        : "impress",                            // The activity name
        label       : "Impress",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
		edit		: true,										// Editor mode
        slides    	: [{type:"title",title:"TITRE",subtitle:"[red]SOUSTITRE[/red]","content":"cool cool cool cool cool cool cool cool cool cool cool cool [b]cool[/b] cool cool cool cool cool",out:"tobottom"},{type:"list",subtitle:"Ma liste de [i]courses[/i]",list:["Je me lève et je te bouscule, tu ne te réveilles pas, comme d'habitude. Ma main carresse tes cheveux, presque malgrè moi comme d'habitude.","Puce 2","Puce 3"],footer:"C'est très intéressant",out:"tobottom",dynamic:true},{type:"img",title:"illustration",src:"res/img/characters/imp_r01.svg",footer:"yop",out:"fade",size:50,dynamic:true},{type:"title",title:"TITRE2",subtitle:"SOUS-TITRE2",out:"fade"},{type:"title",title:"TITRE",subtitle:"[red]SOUSTITRE[/red]","content":"cool cool cool cool cool cool cool cool cool cool cool cool [b]cool[/b] cool cool cool cool cool",out:"tobottom"},{type:"list",subtitle:"Ma liste de [i]courses[/i]",list:["Je me lève et je te bouscule, tu ne te réveilles pas, comme d'habitude. Ma main carresse tes cheveux, presque malgrè moi comme d'habitude.","Puce 2","Puce 3"],footer:"C'est très intéressant",out:"tobottom",dynamic:true},{type:"img",title:"illustration",src:"res/img/characters/imp_r01.svg",footer:"yop",out:"fade",size:50,dynamic:true},{type:"title",title:"TITRE2",subtitle:"SOUS-TITRE2",out:"fade"}],                                       // Slides
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
            settings.context.onquit($this,{'status':'success','score':9});
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

				// BUILD THE PAGES
				helpers.build($this);
				
				$this.find("#board").bind("touchstart mousedown", function(_event) {
					if (settings.interactive) {
						settings.interactive = false;
						if ($this.find("#board .slide .d").length) {
							// HANDLE DYNAMIC ELEMENTS
							$this.find("#board .slide .d").first().animate({opacity:1}, 500, function() { $(this).removeClass("d"); settings.interactive = true; });
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
								if (!settings.edit) { helpers.end($this); }
								else				  { settings.interactive = true; }
							}
						}
					}
				});
				
				helpers.arrow($this);
				
				if (settings.edit) { $this.addClass("edit").addClass("nosplash"); }
				
				// SHOW FIRST PAGE
				helpers.show($this, settings.slideid);

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		build: function($this) {
            var settings = helpers.settings($this);
			$this.find("#thumbslides").html("").css("width",(settings.slides.length*36)+"em").css("margin-left",0);
			for (var i=0; i<settings.slides.length; i++) {
				$this.find("#thumbslides").append(
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
			if (_data.title) 	{ $slide.append("<div class='title p'>"+helpers.format(_data.title)+"</div>"); }
			if (_data.subtitle) { $slide.append("<div class='subtitle p'>"+helpers.format(_data.subtitle)+"</div>"); }
			if (_data.content) 	{ $slide.append("<div class='content p'>"+helpers.format(_data.content)+"</div>"); }
					
			switch(_data.type) {
				case 'title': break;
				case 'list':
					var html="<div class='p'>";
					for (var i=0; i<_data.list.length; i++) {
						html+="<div class='li p"+(i&&_data.dynamic?" d":"")+"'>";
						html+=_data.li?_data.li:"<b>"+i+".</b> ";
						html+=helpers.format(_data.list[i])+"</div>";
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
			
			if (_data.footer) 	{ $slide.append("<div class='content p'>"+helpers.format(_data.footer)+"</div>"); }
			if (_data["class"]) { $slide.addClass(_data["class"]); }
			return $slide;
		},
		clean: function($this) { $this.find("#board").html(""); },
		show: function($this, _id) {
            var settings = helpers.settings($this);
			$this.find("#thumbslides .slide").removeClass("s");
			if (_id<settings.slides.length) {
				var slide = settings.slides[_id];
				var $slide = $this.find("#thumbslides #s"+_id).clone();
				$this.find("#thumbslides #s"+_id).addClass("s");
				
				// SHOW SLIDE
				$this.find("#board").prepend($slide);
			}
			else { $this.find("#end").show(); }
		},
		hide: function($this, _id, _cbk) {
            var settings = helpers.settings($this);
			console.log(_id+" "+settings.slides.length);
			if (_id<settings.slides.length) {
				var slide = settings.slides[_id];
				if (_cbk && slide.out) {
					switch (slide.out) {
						case "fade" :
							$this.find("#board #s"+_id).animate({opacity:0},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "toright" :
							$this.find("#board #s"+_id).animate({left:"100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "toleft" :
							$this.find("#board #s"+_id).animate({left:"-100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "totop" :
							$this.find("#board #s"+_id).animate({top:"-100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						case "tobottom" :
							$this.find("#board #s"+_id).animate({top:"100%"},1000, function() {
								$(this).detach(); _cbk();
							});
						break;
						default: $this.find("#board #s"+_id).detach(); break;
					}
				}
				else { $this.find("#board #s"+_id).detach(); }
			}
		},
		arrow:function($this) {
            var settings = helpers.settings($this);
			if (settings.offset<=0) { $this.find("#thumbleft").hide(); } else { $this.find("#thumbleft").show(); }
			if (settings.offset+5>=settings.slides.length) { $this.find("#thumbright").hide(); } else { $this.find("#thumbright").show(); }
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
					if ($this.find("#thumbhelper").hasClass("s")) {
						$this.find("#thumbnails").animate({top:"95.5%"}, 800, function() {
							settings.interactive = true;
							$this.find("#thumbhelper").removeClass("s");
						});
					}
					else {
						$this.find("#thumbnails").animate({top:"78%"}, 800, function() {
							settings.interactive = true;
							$this.find("#thumbhelper").addClass("s");
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
						$this.find("#thumbslides").animate({"margin-left":(-1*settings.offset*34.5)+"em"}, 800,
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
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            },
			edit: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					
					switch($(_elt).attr("id")) {
						case 'edel' :
							if (settings.slideid>=0 && settings.slideid<settings.slides.length) {
								settings.slides.splice(settings.slideid,1);
								if (settings.slides.length && settings.slideid>=settings.slides.length) {
									settings.slideid=settings.slides.length-1; }
								
								helpers.build($this);
								helpers.clean($this);
								helpers.show($this, settings.slideid);
								
								if (settings.offset>0 && settings.offset>=settings.slides.length) {
									settings.offset-=5;
									$this.find("#thumbslides").animate({"margin-left":(-1*settings.offset*34.5)+"em"}, 800,
									function() { helpers.arrow($this); } );
								}
								else { helpers.arrow($this); }
							}
						break;
						case 'eleft':
							if (settings.slideid>0 && settings.slideid<settings.slides.length) {
								var elt = settings.slides.splice(settings.slideid,1);
								settings.slideid--;
								settings.slides.splice(settings.slideid,0,elt[0]);
								
								helpers.build($this);
								helpers.clean($this);
								helpers.show($this, settings.slideid);
							}
						break;
						case 'eright':
							if (settings.slideid>=0 && settings.slideid<settings.slides.length-1) {
								var elt = settings.slides.splice(settings.slideid,1);
								settings.slideid++;
								settings.slides.splice(settings.slideid,0,elt[0]);
								
								helpers.build($this);
								helpers.clean($this);
								helpers.show($this, settings.slideid);
							}
						break;
						case 'eexport':
							var $export = $("<textarea id='texport' class='export'></textarea>");
							var $button = $("<div class='l bluekeypad'>OK</div>");
							$export.val(JSON.stringify(settings.slides));
							$this.find("#control").html($export).append($button);
							$button.bind("touchstart mousedown", function(_event) {
								try {
									settings.slideid = 0;
									settings.offset = 0;
									settings.slides  = jQuery.parseJSON($this.find("#texport").val());
									
									helpers.build($this);
									helpers.clean($this);
									helpers.show($this, settings.slideid);
									helpers.arrow($this);
								}
								catch (e) { alert(e.message); return; }
						
								_event.preventDefault();
							});
						break;
					}
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in impress plugin!'); }
    };
})(jQuery);

