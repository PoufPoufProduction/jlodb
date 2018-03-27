(function($) {
    // Activity default options
    var defaults = {
        name        : "correcter",                              // The activity name
        label       : "Correcter",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        score       : 1,                                        // The score (from 1 to 5)
        proba       : 2,                                        // Change a word each 'proba' words
        style       : "default",                                // Style of the words (default, blank or bold)
        multiple    : 0,                                        // The multiple occurence separator
        font        : 1,                                        // The font-size multiplicator
        first       : false,                                    // Don't choose randomly the wrong words, use the first one
        background  : "",                               		// Background image
		commas		: ".,:;\"",									// Commas
        debug       : true                                     // Debug mode
    };

    
    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>"
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
                    var text = settings.text[i].split(reg);
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

                        // MULTIPLE OCCURENCE
                        if (settings.multiple && word.search(settings.multiple)>0)
                            word = word.substring(0,word.search(settings.multiple));

                        if (begin>0) { content+=text[j].substring(0, begin); }
                        content+="<span class='"+classTxt+
                                 "' onmousedown=\"$(this).closest('.correcter').correcter('click', this, "+index+");\"";
                        content+=" ontouchstart=\"$(this).closest('.correcter').correcter('click', this, "+
                                 index+");event.preventDefault();\"";
                        content+=">"+word+"</span>";
                        if (end<text[j].length) { content+=text[j].substring(end); }
                        content+=" ";

                        // store the good work
                        settings.responses.push(goodWord);
                        index++;
                    }
                    content+="</p>";
                }

                $this.find("#data").html(content);
                $this.find("#options").css("font-size",settings.font+"em");
                $this.find("#data").css("font-size",settings.font+"em");

                $this.bind("mouseup mouseleave touchend touchleave", function(_event) {
                    if (settings.elt) {
                        var t = $this.find("#popup div.s").text();
                        if (t&&t.length) { settings.elt.html(t); }
                    }
                    settings.elt = 0;
                    $this.find("#popup").hide();
                    $this.find("#popup div").removeClass("s");
                });

                $this.bind("mousemove touchmove", function(event) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                      event.originalEvent.touches[0]:event;
                    $this.find("#popup div").removeClass("s");

                    if (settings.elt && vEvent.clientX>=settings.popup.offset[0] &&
                        vEvent.clientX<settings.popup.offset[0]+settings.popup.size[0] &&
                        vEvent.clientY>=settings.popup.offset[1]&&
                        vEvent.clientY<settings.popup.offset[1]+settings.popup.size[1] ) {
                        var index = 1+Math.floor(settings.popup.nb*(vEvent.clientY-settings.popup.offset[1])/settings.popup.size[1]);
                        $($this.find("#popup div").get(index)).addClass("s");
                    }

                });

                // fig
                if (settings.fig) {
                    if (settings.fig.indexOf("<svg")!=-1)   { $this.find("#illustration").html(settings.fig); }
                    else                                    { $this.find("#illustration").html("<img src='res/img/"+settings.fig+".svg'/>"); }
                    $this.find("#illustration").show();
                    $this.find("#data").addClass("fig");
                }
                    
                // Locale handling

                if (settings.exercice)  { $this.find("#exercice").html(helpers.format(settings.exercice)); }
                if (settings.locale)    { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                $this.children().show()
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        }
    };

    // The plugin
    $.fn.correcter = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    activate        : false,
                    responses       : [],
                    elt             : 0,
                    popup           : {},
                    offset          : {
                        "default"   : [6,6],
                        "blank"     : [3,5],
                        "bold"      : [6,7]
                    }
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
                var $this = $(this) , settings = helpers.settings($this), $popup = $(this).find("#popup");

                if (settings.style=="default" || $(elt).hasClass("blank") || $(elt).hasClass("bold") ) {
                    if (settings.activate) {
                        var posx = $(elt).offset().left-$this.offset().left;
                        var posy = $(elt).offset().top-$this.offset().top;

                        // Position the popup : 6 = 1 (border width) + 5 (padding)
                        $popup.css("left",(posx-settings.offset[settings.style][0])+"px")
                              .css("top",(posy-settings.offset[settings.style][1])+"px");

                        // Compute the array
                        var goodWord = settings.responses[value];
                        var response = [];

                        // MULTIPLE OCCURENCE HANDLING
                        var word = goodWord;
                        if (settings.multiple &&  word.search(settings.multiple)>0) {
                            word = word.substring(0,word.search(settings.multiple));
                        }
                        response.push(word);

                        if (settings.dictionary[goodWord]) {
                            for (var i=0; i<settings.dictionary[goodWord].length; i++) { response.push(settings.dictionary[goodWord][i]); }
                        }
                        response.sort(function() { return (Math.random()<0.5); });
                        response.sort(function(_a,_b) {
                            var r={"à":"a","À":"A"};
                            var a=_a,b=_b;
                            for (var i in r) { a=a.replace(i,r[i]); b=b.replace(i,r[i]); }
                            return (a>b);
                        });

                        // Fill the popup
                        var reg=new RegExp("(')" ,"g"), nb = 1;
                        var content =
                            "<div class='current s'>"+
                            (settings.style=="bold"?"<b>"+$(elt).html()+"</b>":$(elt).html())+"</div>";
                        for (var i=0; i<response.length; i++) {
                            if (response[i]!=$(elt).html()) { nb++; content+="<div>"+response[i]+"</div>"; }
                        }
                        $popup.show().find("#options").html(content);

                        settings.popup = { offset   : [$(elt).offset().left, $(elt).offset().top],
                                           size     : [$popup.width(), $popup.height()],
                                           nb       : nb };

                        // Save the current element
                        settings.elt = $(elt);
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.activate = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.activate = true;
                $(this).find("#data").show();
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.activate) {
                    settings.activate = false;
                    var nbErrors = 0;
                    $(this).find("#data span").each(function(index, value) {
                        var word = settings.responses[index];
                        if (settings.multiple && word.search(settings.multiple)>0) {
                            word = word.substring(0,word.search(settings.multiple));
                        }
                        var regTmp = new RegExp("&#8201;","g");
                        word = word.replace(regTmp,String.fromCharCode(8201));
                        if ($(value).html()!=word) {
                            nbErrors++;
                            $(value).addClass("wrong");
                        }
                    });
                    
                    $this.find("#good").toggle(nbErrors==0);
                    $this.find("#wrong").toggle(nbErrors>0);
                    $this.find("#effects").show();
                    $this.find("#submit").addClass(nbErrors?"wrong":"good");
                    
                    settings.score = 5-nbErrors;
                    if (settings.score<0) { settings.score = 0; }
                    $(this).find("#valid").hide();
                    setTimeout(function() { helpers.end($this); }, nbErrors?3000:1000);
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in correcter plugin!'); }
    };
})(jQuery);

