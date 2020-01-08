(function($) {
    // Activity default options
    var defaults = {
        name        : "marker",                                 // The activity name
        label       : "Marker",                                 // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        font        : 1,                                        // The font-size multiplicator
        sep         : " .,'-;:\"?!»«",                          // The separators
		endline		: "¤",
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
            settings.context.onquit($this,_args);
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
                
                $this.find("#mrmenu>div").hide();
                for (var i in settings.questions) {
                    $this.find("#mrmenu #c"+(parseInt(i)+1)+" .legend").html(settings.questions[i].label);
                    $this.find("#mrmenu #c"+(parseInt(i)+1)).show();
                }

				var $content = $this.find("#mrdata>div").css("font-size",settings.font+"em").html("");
                var reg = new RegExp("[ ]", "g");
                var t = -1, tnext;
                var word = "";
                var lastLetterIsSep=false;
                var vGroup=-1;
                var vEndGroup = false;
                var vBeginGroup = false;
				
				settings.sep+=settings.endline;

                // PARSE EACH PARAGRAPH
                for (var i=0; i<settings.text.length; i++) {
					var $p=$("<p></p>");
					var line = settings.text[i];
					// ADD A SEPARATOR AT THE END OF THE LINE IF NOT
					if (settings.sep.indexOf(line[line.length-1])==-1) { line+=settings.endline; }
                    for (var j=0; j<line.length; j++) {
						
						// CHECK EXERCICE BRACKET
                        var vIsQuestion = false;
                        for (var k in settings.questions) {
                            if (line[j]==settings.questions[k].s) {
                                vIsQuestion = true;
                                if (vGroup==-1) { vGroup=k; vBeginGroup = true; vEndGroup = false; }
								else 			{ vEndGroup=true; }
                            }
                        }
                        if (vIsQuestion) { continue; } 

						// CURRENT CHAR IS A SEPARATOR
                        if (settings.sep.indexOf(line[j])!=-1){
							// A REAL WORD HAS TO BE PUSHED
                            if (!lastLetterIsSep) {
                                $p.append(helpers.word($this,word, vGroup));
                                word="";
                                if (vEndGroup) { vEndGroup=false; vGroup=-1; }
                            }
							// STORE THE CURRENT CHAR AS SEPARATOR
                            word+=line[j];
                            lastLetterIsSep=true;
                        }
						// CURRENT CHAR IS NOT A SEPARATOR
						else {
							// A SEPARATOR WORD HAS TO BE PUSHED
                            if (lastLetterIsSep) {
                                $p.append(helpers.word($this,word.replace(" ","&#xA0;"), 9));
                                word="";
                                if (vEndGroup) { vEndGroup=false; vGroup=-1; }
                            }
							// STORE THE CURRENT CHAR AS REAL WORD CHARACTER 
                            word+=line[j];
                            lastLetterIsSep=false;
                        }
                        vBeginGroup = false;
                    }
					// PUSH THE LAST WORD
					if (word!=settings.endline) { $p.append(helpers.word($this,word, lastLetterIsSep?9:8)); }
					word="";
					$content.append($p);
					settings.endofline.push(settings.it);
                }
                helpers.color($this,0);
				
				// HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }
                $this.bind("mouseup mouseleave touchend touchleave", function() { helpers.mouseup($this); });
				$this.bind("mousedown touchstart", function(_event) { _event.preventDefault(); });
				
                if (settings.exercice) { $this.find("#exercice>div").html(jtools.format(settings.exercice)); }

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        word: function($this, _word,_t) {
            var settings = helpers.settings($this);

            var $ret = $("<span id='s"+(settings.it++)+"'>"+_word+"</span>");
			$ret.bind("mousedown touchstart",function(event) { helpers.mousedown($this, $(this)); event.preventDefault(); event.stopPropagation(); });
			$ret.bind("mousemove", function(event) { helpers.mousemove($this, $(this)); });
			$ret.bind("touchmove", function(event) {
				var vEvent =
					(event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                    event.originalEvent.touches[0]:event;
                var $e=$(document.elementFromPoint(vEvent.pageX,vEvent.pageY));
                if ($e && $e.attr("id") && $e.attr("id")[0]=='s') { helpers.mousemove($this, $e); }
				event.preventDefault();
			});
			
            settings.words.push([-1,-1,_t]);
            return $ret;
        },
        mouseup: function($this) {
            var settings = helpers.settings($this);
            if (settings.m.id!=-1 && settings.m.id == settings.m.first) {
                if (settings.words[settings.m.id][1]==settings.color) {
                    settings.words[settings.m.id][0]=-1;
                    helpers.update($this);
                }
            }
            settings.m.first = -1;
        },
        mousedown:function($this,$elt) {
                var settings = helpers.settings($this);
                if (settings.interactive) {
                    id = parseInt($elt.attr("id").substr(1));
                    settings.m.first = id;
                    settings.m.mode = 0;
                    settings.m.max = id;
                    settings.m.min = id;
                    settings.m.id = id;
                    if (settings.words[id][0]==settings.color) {
                        var max=id, min=id;
                        while (max<settings.words.length-1 && settings.words[max+1][0]==settings.color) { max++; }
                        while (min>0 && settings.words[min-1][0]==settings.color) { min--; }
                        settings.m.mode = (id-min<max-id)?1:2;
                        if (id-min<max-id) { for (var i=min; i<id; i++) { settings.words[i][0] = -1; }
                        } else { for (var i=id+1; i<=max; i++) { settings.words[i][0] = -1; } }
                    }

                    for (var i in settings.words) { settings.words[i][1] = settings.words[i][0]; }

                    settings.words[settings.m.first][0]=settings.color;
                    helpers.update($this);
                }
            },
            mousemove:function($this,$elt) {
                var settings = helpers.settings($this);


                if (settings.m.first!=-1 && settings.interactive)  {
                    var id= parseInt($elt.attr("id").substr(1));

                    if (settings.m.order==-1) { settings.m.order=(id>settings.m.first?0:1); }

                    if (id>settings.m.first) {
                        if (settings.m.mode==1) {
                            for (var i=settings.m.first; i<=id; i++) {
                                if (settings.words[i][1]==settings.color) { settings.words[i][0]=-1; } else { break; }
                            }
                        }
                        else {
                            for (var i=settings.m.first; i<=id; i++) { settings.words[i][0]=settings.color; }
                        }

                        if (id>=settings.m.max) { settings.m.max = id; }
                        for (var i=id+1; i<=settings.m.max; i++) { settings.words[i][0]=settings.words[i][1]; }

                        if (settings.m.order==false) {
                            for (var i=settings.m.min; i<settings.m.first; i++) {  settings.words[i][0]=settings.words[i][1]; }
                        }
                    }
                    else {
                        if (settings.m.mode==2) {
                            for (var i=id; id<=settings.m.first; i++) {
                                if (settings.words[i][1]==settings.color) { settings.words[i][0]=-1; } else { break; }
                            }
                        }
                        else {for (var i=id; i<=settings.m.first; i++) { settings.words[i][0]=settings.color; }}

                        if (id<=settings.m.min) { settings.m.min = id; }
                        for (var i=settings.m.min; i<id; i++) { settings.words[i][0]=settings.words[i][1]; }

                        if (settings.m.order==true) {
                            for (var i=settings.m.first+1; i<=settings.m.max; i++) {  settings.words[i][0]=settings.words[i][1]; }
                       }

                    }

                    settings.m.order=(id>settings.m.first);
                    settings.m.id = id;
                    helpers.update($this);
                }
            },
        color: function($this, _color) {
            var settings = helpers.settings($this);
            settings.color = _color;
            $this.find("#mrmenu .color").removeClass("s");
            $this.find("#mrmenu #c"+(settings.color+1)+" .color").addClass("s");
        },
        update: function($this) {
            var settings = helpers.settings($this);
            for (var i=0; i<settings.words.length; i++) {
                var $elt = $this.find("#s"+i);
                $elt.removeClass();
                if (settings.words[i][0]!=-1) {
                    $elt.addClass("s"+settings.words[i][0]);
                    // COMPUTE CORNER
                    var corner = 0;
                    if ((typeof $elt.prev().attr("id")=="undefined")||settings.words[i-1][0]!=settings.words[i][0]) { corner+=1; }
                    if ((typeof $elt.next().attr("id")=="undefined")||settings.words[i+1][0]!=settings.words[i][0]) { corner+=2; }

                    if (corner) { $elt.addClass("c"+corner); }
                }
            }
        }
    };

    // The plugin
    $.fn.marker = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    words           : [],
					endofline		: [],
                    it              : 0,
                    color           : 0,
                    m               : {
                        first       : -1,
                        max         : -1,
                        min         : -1,
                        mode        : 0,
                        order       : -1,
                        id          : -1
                    },
                    score           : 0
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
            next: function() { var $this = $(this) , settings = helpers.settings($this); settings.interactive = true; },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
					
					var words = $.extend(true, [], settings.words);
                    var nbErrors = 0;
                    // FIND THE WRONG WORDS
                    for (var i in words) {
                        if (words[i][2]!=9 && words[i][2]!=words[i][0]) {
                            nbErrors++;
                            $(this).find("#s"+i).addClass("wrong");
                            words[i][0]=-2;
                        }
                    }
                    for (var i=1;i<words.length-1;i++) {
                        if (words[i][2]==9) {
							
							// SEPARATOR BETWEEN 2 WRONG WORDS BECOMES WRONG TOO
							if (	(words[i-1][0]==-2 && words[i+1][0]==-2) ||
									(words[i-1][0]==-2 && words[i+1][2]==9) ||
									(words[i-1][2]==9 && words[i+1][0]==-2)) {
										$(this).find("#s"+i).addClass("wrong");
							}
							
							// SELECTED SEPARATOR BETWEEN TWO NOT SELECTED WORD BECOME WRONG
							if (words[i][0]>=0 && words[i-1][0]<0 && words[i+1][0]<0) {
								$(this).find("#s"+i).addClass("wrong");
							}
                        }
						
						
                    }
                    $this.find("#g_effects").addClass(nbErrors?"wrong":"good");
                    $this.find("#g_submit").addClass(nbErrors?"wrong":"good");
					
					if (settings.edit) {
						setTimeout(function() {
							$this.find("#g_effects").removeClass();
							$this.find("#g_submit").removeClass();
							$this.find("#mrdata span").removeClass("wrong");
							settings.interactive = true;
						}, 1500);
					}
					else {
						settings.score = 5 - nbErrors;
						if (settings.score<0) { settings.score = 0; }
						$(this).find("#valid").hide();
						setTimeout(function() { helpers.end($this, {'status':'success','score':settings.score}); }, (settings.score!=5)?3000:500);
					}
                }
            },
            color: function(_val) { helpers.color($(this), _val); },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            },
			e_get: function() {
                var $this = $(this) , settings = helpers.settings($this);
				var ret = [];
				var line = "", nbline = 0;
				var current = -1;
				for (var i=0; i<settings.words.length; i++) {
					if (current!=settings.words[i][0]) {
						if (current!=-1) 				{ line+=settings.questions[current].s; }
						if (settings.words[i][0]!=-1) 	{ line+=settings.questions[settings.words[i][0]].s; }
						current=settings.words[i][0];
					}
					if (i==settings.endofline[nbline]) {
						ret.push(line); nbline++; line="";
					}
					line+=$this.find("#s"+i).html().replace("&nbsp;"," ");
				}
				if (current!=-1) 				{ line+=settings.questions[current].s; }
				ret.push(line);
				return ret;
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in marker plugin!'); }
    };
})(jQuery);

