(function($) {
    // Activity default options
    var defaults = {
        name        : "countdown",                              // The activity name
        label       : "Countdown",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        number      : 2,                                        // Number of games in case of gen
        fontex      : 1,                                        // exercice font size
        max         : 1000,                                     // max value
		maxlines	: 5,										// Nb max lines
        debug       : true                                      // Debug mode
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

                $this.find("#cnkeypad .k").each(function() { settings.$keys.push($(this)); });

                $this.bind("mousemove touchmove", function(event) {
                    var settings = helpers.settings($this), $keypad = $this.find("#cnkeypad");
                    if (settings.keypad) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                    event.originalEvent.touches.length)? event.originalEvent.touches[0]:event;
                        var vTop = vEvent.clientY;
                        var vLeft = vEvent.clientX;
                        var vSize = settings.$keys[0].width();
                        var vAlready = false;
                        settings.key = -1;
                        for (var i in settings.$keys) {
                            settings.$keys[i].removeClass("s");
                            if (!vAlready) {
                                var vOffset = settings.$keys[i].offset();
                                vAlready = ( vTop>=vOffset.top && vLeft>=vOffset.left &&
                                            vTop<vOffset.top+vSize && vLeft<vOffset.left+vSize );
                                if (vAlready) { settings.key = i; settings.$keys[i].addClass("s"); }
                            }
                        }
                    }
                });

                // GENERATOR
                if (settings.gen) {
                    settings.data = [];
                    for (var i=0;i<settings.number;i++) { settings.data.push(eval('('+settings.gen+')')($this,settings,i)); }
                }

                if (settings.exercice) {
					$this.find("#exercice>div")
						.html(jtools.instructions(settings.exercice))
						.css("font-size",settings.fontex+"em").parent().show();
                }

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        newline: function($this) {
            var settings = helpers.settings($this);
            var $lines= $this.find("#cnboard #cnlines");
            var nb = $lines.children().length;
            if (nb<5) {
                $lines.find(".r").addClass("rr");
                $lines.find(".o").addClass("disabled");
                $lines.find(".dd").droppable({disabled:true});
                var $line = $this.find("#cnboard #cntemplate").clone().css("display","").attr("id","l"+nb);
                if (nb==0) $line.find(".r").addClass("rr");
                if (!settings.op || settings.op.length!=1) {
                    $line.find(".o").bind("touchstart mousedown", function(_event) {
                        if (!$(this).hasClass("disabled")) {
                            var $keypad = $this.find("#cnkeypad");
                            var vLeft = $(this).offset().left;
                            var vTop = $(this).offset().top;
                            $this.find("#cnkeypad").css("top",vTop+"px").css("left",vLeft+"px").show();
                            settings.keypad = $(this);
                        }
                        _event.preventDefault();
                    });
                }
                if (settings.op) {
                    $line.find(".o>div").html($this.find("#cnkeypad #"+settings.op[0]+">div").text());
                }


                $line.find(".dd").droppable({accept:".t",
                    over: function(event, ui) {
                        $(this).addClass("over");
                    },
                    out: function(event, ui) {
                        $(this).removeClass("over");
                    },
                    drop:function(event, ui) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;

                        $(this).removeClass("over").find(".t").each(function() {
                            $this.find(".t#"+$(this).attr("id")).removeClass("tt").draggable({disabled:false});
                        });

                        var $elt = $(ui.draggable).clone().removeClass("ui-draggable").addClass("tt");
                        $(this).html($elt);
                        $this.find(".t#"+$elt.attr("id")).addClass("tt").draggable({disabled:true})
                        helpers.computable($this);

                        $this.find("#cntouch>div").addClass("running").parent()
							.css("left", vEvent.clientX-$this.offset().left)
                            .css("top", vEvent.clientY-$this.offset().top).show();
                        setTimeout(function(){$this.find("#cntouch>div").removeClass("running").parent().hide(); },800);

                    }});

                $lines.append($line);
            }
        },
        computable: function($this) {
            var settings = helpers.settings($this);
            var $line = $this.find("#cnboard #cnlines").children().last();
            var vOk = false;
            if($line.find(".t").length>=2)
            {
                var val = [ parseInt($($line.find(".t").get(0)).text()), parseInt($($line.find(".t").get(1)).text()) ];
                var ret = 0;
                switch($line.find(".o>div").text()[0])
                {
                    case '+': ret = val[0]+val[1]; break;
                    case '-': ret = val[0]-val[1]; break;
                    case '/': ret = val[0]/val[1]; break;
                    default:  ret = val[0]*val[1]; break;
                }
                if (ret>0 && ret<settings.max && ret==Math.floor(ret)) {
                   settings.compute = Math.floor(ret);
                   $line.find(".c").addClass("cc");
                }
                else { $line.find(".c").removeClass("cc"); }
            }
        },
        gett: function(_id, _value) {
            var f = 1, m = 0;
            var l=_value.toString().length;
            if (l>3) { f=1-0.2*Math.sqrt(l-3); m=0.05*Math.sqrt(l-3); }
            return "<div class='t' id='"+_id+"'><div style='font-size:"+f+"em;margin-top:"+m+"em;'>"+_value+"<div></div>"
        },
        build: function($this) {
            var settings = helpers.settings($this);
            $this.find("#effects").removeClass();
            $this.find("#cnboard #cnlines").html("");
            $this.find("#cnheader #cnresult>div").text(settings.data[settings.id].result);
            $this.find("#cnheader #cnvalues").html("");
            for (var i in settings.data[settings.id].values) {
                $this.find("#cnheader #cnvalues").append(helpers.gett(i,settings.data[settings.id].values[i]));
            }
            $this.find(".t").draggable({ containment:$this, helper:"clone", appendTo:$this.find("#cnboard"),
                            start:function() {} });

            $this.bind("touchend touchleave mouseup mouseleave", function(_event) {
                if (settings.key!=-1 && settings.keypad) {
                    var vVal = settings.$keys[settings.key].text();
                    settings.keypad.html("<div"+(vVal=='-'?" class='minus'":"")+">"+vVal+"</div>");
                    helpers.computable($this);
                }

                $this.find("#cnkeypad").hide();
            });
            
            if (settings.legend) {
                var legend = settings.legend;
                if ($.isArray(legend)) { legend = legend[settings.id%legend.length]; }
                $this.find("#cnlegend>div").html(jtools.format(legend)).parent().show();
				settings.maxlines = Math.min(settings.maxlines, 4);
            }

            if (settings.op) {
                $this.find("#cnkeypad .k").hide();
                for (var i in settings.op) { $this.find("#cnkeypad #"+settings.op[i]).show(); }
            }
			settings.interactive = true;
            helpers.newline($this);
        }
    };

    // The plugin
    $.fn.countdown = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    id              : 0,
                    keypad          : 0,
                    $keys           : [],
                    key             : -1,
                    compute         : 0,
                    score           : 5
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
            next: function() {
                helpers.build($(this));
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            },
            del: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
                if (!$(_elt).hasClass("rr") && settings.interactive ) {
					settings.interactive = false;
					
                    $(_elt).parent().find(".t").each(function() {
                        $this.find(".t#"+$(this).attr("id")).removeClass("tt").draggable({disabled:false});
                    });

                    // settings.score=Math.max(settings.score-1,0);
					
					$(_elt).parent().find(">div").hide();
					$(_elt).parent().find(".cnmask").show().animate({opacity:0}, 500,
						function() {
							$(this).parent().detach(); 
							settings.interactive = true;

							var $lines  = $this.find("#cnboard #cnlines");
							var nb      = $lines.children().length;
							if (nb) {
								var $line = $($lines.children().get(nb-1));
								if (nb>1) { $line.find(".r").removeClass("rr"); }
								$line.find(".dd").droppable({disabled:false});
								$line.find(".c .t").detach();
								$line.find(".c").removeClass("s").addClass("cc");
								$line.find(".o").removeClass("disabled");
							}
							else    { helpers.newline($this); }
							helpers.computable($this);
					});
                }
            },
            compute: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
                if ($(_elt).parent().hasClass("cc") && settings.compute!=0) {

                    if ($this.find("#exercice").is(":visible")) {
                        $this.find("#exercice").animate({opacity:0},1000,function() { $this.find("#exercice").hide(); });
                    }

                    $line = $(_elt).closest(".line");
                    var id= 100+parseInt($line.attr("id").substr(1));
                    var $t = $(helpers.gett(id,settings.compute));
                    if (id<104) { $t.draggable({ containment:$this, helper:"clone", appendTo:$this.find("#cnboard") }); }
                    $(_elt).parent().removeClass("cc").addClass("s").append($t);
					
					$this.find("#cnfx>div").addClass("running").parent()
						.css("top", $line.offset().top - $this.offset().top)
						.show();
					setTimeout(function(){ $this.find("#cnfx>div").removeClass("running").parent().hide(); }, 500);

                    if (settings.compute == settings.data[settings.id].result) {
                        $this.find("#effects").addClass("good");
						settings.interactive = false;
                        if (++settings.id < settings.data.length) { setTimeout(function() {helpers.build($this);}, 1000); }
                        else                                      { setTimeout(function() {helpers.end($this, {'status':'success','score':settings.score});}, 2000); }
                    }
                    else {
						if ($this.find("#cnboard #cnlines").children().length<settings.maxlines) {
							helpers.newline($this);
					} }
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in countdown plugin!'); }
    };
})(jQuery);

