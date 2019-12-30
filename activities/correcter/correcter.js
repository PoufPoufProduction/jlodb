(function($) {
    // Activity default options
    var defaults = {
        name        : "correcter",         	// The activity name
        label       : "Correcter",          // The activity label
        template    : "template.html",      // Activity's html template
        css         : "style.css",          // Activity's css style sheet
        lang        : "en-US",              // Current localization
        proba       : 2,                    // Change a word each 'proba' words
        style       : "default",            // Style of the words (default, blank or bold)
        suffix      : "_",                  // The specific occurence separator
        font        : 1,                    // The font-size multiplicator
        first       : false,                // Don't choose randomly the wrong words, use the first one
        background  : "",                   // Background image
		commas		: ".,:;\"",				// Commas
		split		: " ",					// Split
		highlight	: false,				// Highlight words
		errratio	: 1,
		animation   : true,					// Animation
        debug       : true                  // Debug mode
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
        // Clear and quit the activity by calling the context callback
        end: function($this, _args) {
            var settings = helpers.settings($this);
			settings.interactive = false;
			if (settings.anim.timeid) { clearTimeout(settings.anim.timeid); }
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

                $this.children().hide()

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }
				
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                // Build the data the data
                var content ="";
                var reg = new RegExp("[ ]", "g");
                var index = 0;
					
                // PARSE EACH PARAGRAPH
                for (var i=0; i<settings.text.length; i++) {
                    content+="<p>";
                    var text = [];
					var inter = [];
					var word = "";
					for (var j=0; j<settings.text[i].length; j++) {
						if (settings.split.indexOf(settings.text[i][j])==-1) {
							word+=settings.text[i][j];
						}
						else if (word.length) {
							text.push(word); inter.push(settings.text[i][j].toString()); word="";
						}
					}
					if (word.length) { text.push(word); inter.push(""); }
					
                    // BROWSE EACH WORD
                    for (var j=0; j<text.length; j++) {

                        // GET THE WORD
                        var begin = 0, end = text[j].length;
                        for (var k=0; k<end; k++) {
                            if (text[j][k]=='"') { begin=k+1; }
                            else { k=end; }
                        }
                        for (var k=end; k>begin; k--) {
							if (settings.commas.indexOf(text[j][k-1])!=-1)
                                { end=k-1; }
                            else { k=begin; }
                        }
                        var goodWord = text[j].substring(begin, end);
                        var word = goodWord;
                        var classTxt="";

                        // check if the word is in the dictionary
                        if (settings.dictionary[goodWord]) {
                            if (!Math.floor(Math.random()*settings.proba)) {
                                var id = 0;
                                if (!settings.first) { id = Math.floor(Math.random()*settings.dictionary[goodWord].length); }
                                word = settings.dictionary[goodWord][id];

                                if (settings.style=="blank") {
                                    var tmp = settings.dictionary[goodWord][
                                        Math.floor(Math.random()*settings.dictionary[goodWord].length)];
                                    var regTmp = new RegExp("&.+;","g");
                                    var len = tmp.replace(regTmp,"_").length;
                                    word = "";
                                    for (var count=0; count<len*1.5; count++) { word+="&#xA0;"; }
                                }

                                classTxt = settings.style;
                            }
                        }

                        if (word.indexOf(settings.suffix)!=-1)
                            word = word.substring(0,word.search(settings.suffix));

                        if (begin>0) { content+=text[j].substring(0, begin); }
                        content+="<span class='"+classTxt+
                                 "' onmousedown=\"$(this).closest('.correcter').correcter('click', this, "+index+");event.preventDefault();\"";
                        content+=" ontouchstart=\"$(this).closest('.correcter').correcter('click', this, "+
                                 index+");event.preventDefault();\"";
                        content+=">"+word+"</span>";
                        if (end<text[j].length) { content+=text[j].substring(end); }
                        content+=inter[j];

                        // store the good work
                        settings.responses.push(goodWord);
                        index++;
                    }
                    content+="</p>";
                }

                $this.find("#crdata").html(content);
                $this.find("#croptions").css("font-size",settings.font+"em");
                $this.find("#crdata").css("font-size",settings.font+"em");

                $this.bind("mouseup mouseleave touchend touchleave", function(_event) {
                    if (settings.elt) {
                        var t = $this.find("#crpopup div.s").text();
                        if (t&&t.length) { settings.elt.html(t).css("opacity",0).animate({opacity:1},300); }
						$this.find(".g_anim12>div").addClass("g_arunning").parent()
						     .css("top",settings.elt.offset().top-$this.offset().top+settings.elt.height()/2)
							 .css("left",settings.elt.offset().left-$this.offset().left+settings.elt.width()/2).show();
						setTimeout(function(){ $this.find(".g_anim12>div").removeClass("g_arunning").parent().hide(); }, 500);
                    }
                    settings.elt = 0;
                    $this.find("#crpopup").hide();
                    $this.find("#crpopup div").removeClass("s");
					_event.preventDefault();
                });

                $this.bind("mousemove touchmove", function(_event) {
                    var vEvent = (_event && _event.originalEvent && _event.originalEvent.touches && _event.originalEvent.touches.length)?
                                      _event.originalEvent.touches[0]:_event;
                    $this.find("#crpopup div").removeClass("s");

                    if (settings.elt && vEvent.clientX>=settings.popup.offset[0] &&
                        vEvent.clientX<settings.popup.offset[0]+settings.popup.size[0] &&
                        vEvent.clientY>=settings.popup.offset[1]&&
                        vEvent.clientY<settings.popup.offset[1]+settings.popup.size[1] ) {
                        var index = 1+Math.floor(settings.popup.nb*(vEvent.clientY-settings.popup.offset[1])/settings.popup.size[1]);
                        $($this.find("#crpopup div").get(index)).addClass("s");
                    }
					_event.preventDefault();

                });

                if (settings.fig) {
                    if (settings.fig.indexOf("<svg")!=-1)   { $this.find("#crfig").html(settings.fig); }
                    else                                    { $this.find("#crfig").html("<img src='res/img/"+settings.fig+".svg'/>"); }
                    $this.find("#crfig").show();
                    $this.find("#crdata").addClass("fig");
                }

                if (settings.exercice)  { $this.find("#g_instructions").html(jtools.instructions(settings.exercice)); }
                if (settings.locale)    { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                $this.children().show();
				helpers.highlight($this, settings.highlight);
				
                if (!$this.find("#g_splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
		highlight: function($this, _value) {
            var settings = helpers.settings($this);
			settings.highlight=_value;
			$this.find("#crdata span.highlight").removeClass("highlight");
			if (settings.highlight) {
				$this.find("#crdata span").each(function(index, value) {
					var word = settings.responses[index];
					if (settings.dictionary[word]) { $(this).addClass("highlight"); }
				});
			}
		},
		onanim: function($this) {
            var settings = helpers.settings($this);
			var delay = 40;
			var range = 3;
			var max = 30;
			if (settings.anim.elts.length==0) {
				var lineid = Math.floor(Math.random()*$this.find("#crdata>p").length);
				$($this.find("#crdata>p").get(lineid)).find("span").each( function() { settings.anim.elts.push($(this)); });
				settings.anim.index = 0;
				settings.anim.offset = Math.floor(Math.random()*Math.max(0,settings.anim.elts.length-max));
			}
			
			if (settings.anim.index < Math.min(max,settings.anim.elts.length+range) ) {
				var idx = settings.anim.offset + settings.anim.index;
				if (idx<settings.anim.elts.length && settings.anim.index < max-range ) { settings.anim.elts[idx].addClass("light"); }
				if (idx-range>=0) { settings.anim.elts[idx-range].removeClass("light"); }
				settings.anim.index++;
			}
			else {
				settings.anim.elts = [];
				settings.anim.index = 0;
				delay=Math.floor(Math.random()*8000)+3000;
			}
			settings.anim.timeid = setTimeout(function() { helpers.onanim($this); }, delay);
		}
    };

    // The plugin
    $.fn.correcter = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    responses       : [],
                    elt             : 0,
                    popup           : {},
                    offset          : {
                        "default"   : [6,6],
                        "blank"     : [3,5],
                        "bold"      : [6,7]
                    },
					anim			: { timeid:0, elts:[], index: 0, offset: 0 }
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
            click: function(elt, value) {
                var $this = $(this) , settings = helpers.settings($this), $popup = $(this).find("#crpopup");

				var goodWord = settings.responses[value];
                var response = [];

                var word = goodWord;
                if (word.indexOf(settings.suffix)!=-1) {
                    word = word.substring(0,word.search(settings.suffix));
                }
				
				if (settings.edit && settings.context && settings.context.onedit) {
					settings.context.onedit($this, {index:value, real:goodWord, word:word, glossary:settings.dictionary[goodWord]?settings.dictionary[goodWord].join(','):"", words:settings.responses});
				}
				
                if (settings.style=="default" || $(elt).hasClass("blank") || $(elt).hasClass("bold") ) {
                    if (settings.interactive) {
                        var posx = $(elt).offset().left-$this.offset().left;
                        var posy = $(elt).offset().top-$this.offset().top;

                        // Position the popup : 6 = 1 (border width) + 5 (padding)
                        $popup.css("left",(posx-settings.offset[settings.style][0]-20)+"px")
                              .css("top",(posy-settings.offset[settings.style][1])+"px");

                        // Compute the array
                        response.push(word);

                        if (settings.dictionary[goodWord]) {
                            for (var i=0; i<settings.dictionary[goodWord].length; i++) { response.push(settings.dictionary[goodWord][i]); }
                        }
                        shuffle(response);
                        response.sort(function(_a,_b) { return _a.localeCompare(_b); });

                        // Fill the popup
                        var reg=new RegExp("(')" ,"g"), nb = 1;
                        var content =
                            "<div class='current s'>"+
                            (settings.style=="bold"?"<b>"+$(elt).html()+"</b>":$(elt).html())+"</div>";
                        for (var i=0; i<response.length; i++) {
                            if (response[i]!=$(elt).html()) { nb++; content+="<div>"+response[i]+"</div>"; }
                        }
                        $popup.show().find("#croptions").html(content);

                        settings.popup = { offset   : [$(elt).offset().left, $(elt).offset().top],
                                           size     : [$popup.width(), $popup.height()],
                                           nb       : nb };

                        // Save the current element
                        settings.elt = $(elt);
                    }
                }
            },
            quit: function() { helpers.end($(this), {'status':'abort'}); },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
				if (settings.animation) {
					settings.anim.timeid = setTimeout(function() { helpers.onanim($this); } , 2000);
				}
                $(this).find("#crdata").show();
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
                    var nbErrors = 0;
                    $(this).find("#crdata span").each(function(index, value) {
                        var word = settings.responses[index];
                        if (word.indexOf(settings.suffix)!=-1) {
                            word = word.substring(0,word.indexOf(settings.suffix));
                        }
                        var regTmp = new RegExp("&#8201;","g");
                        word = word.replace(regTmp,String.fromCharCode(8201));
                        if ($(value).html()!=word) {
                            nbErrors++;
                            $(value).addClass("wrong");
                        }
                    });
                    
                    $this.find("#g_effects").addClass(nbErrors?"wrong":"good");
                    $this.find("#g_submit").addClass(nbErrors?"wrong":"good");
                    
                    var score = Math.max(0,5-nbErrors*settings.errratio);
                    $(this).find("#valid").hide();
					if (settings.edit) {
						setTimeout(function() {
							$this.find("#crdata span").removeClass("wrong");
							$this.find("#g_effects").removeclass();
							$this.find("#g_submit").removeClass();
							settings.interactive = true;
						}, 1500);
					}
					else { setTimeout(function() { helpers.end($this, {'status':'success','score':score}); }, nbErrors?3000:1000); }
                }
            },
            e_highlight: function(_value) { helpers.highlight($(this), _value); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in correcter plugin!'); }
    };
})(jQuery);

