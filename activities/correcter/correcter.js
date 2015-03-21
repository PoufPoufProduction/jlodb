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
        debug       : false                                     // Debug mode
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
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
                    $("head").append("<link>");
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
                            if ((text[j][k-1]=='.')||(text[j][k-1]==',')||(text[j][k-1]==':')||(text[j][k-1]==';')||(text[j][k-1]=='"'))
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
                                    var len = settings.dictionary[goodWord][
                                        Math.floor(Math.random()*settings.dictionary[goodWord].length)].length;
                                    word = "";
                                    for (var count=0; count<len*1.5; count++) { word+="&nbsp;"; }
                                }

                                classTxt = settings.style;
                            }
                        }

                        // MULTIPLE OCCURENCE
                        if (settings.multiple && word.search(settings.multiple)>0)
                            word = word.substring(0,word.search(settings.multiple));

                        if (begin>0) { content+=text[j].substring(0, begin); }
                        content+="<span class='"+classTxt+
                                 "' onclick=\"$(this).closest('.correcter').correcter('click', this, "+index+");\"";
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
                $this.css("font-size", Math.floor($this.height()/12)+"px");
                $this.find("#options").css("font-size",settings.font+"em");
                $this.find("#data").css("font-size",settings.font+"em");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                $this.find("#exercice").html(settings.exercice);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                $this.children().show()
                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
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
                    finish          : false,
                    responses       : [],
                    keypad          : 0,
                    elt             : 0,
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
                    if (settings.keypad) { clearTimeout(settings.keypad); settings.keypad=0; }
                    if (!settings.finish) {
                        // Position the popup : 6 = 1 (border width) + 5 (padding)
                        $popup.css("left",($(elt).position().left-settings.offset[settings.style][0])+"px")
                              .css("top",($(elt).position().top-settings.offset[settings.style][1])+"px");

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
                        response.sort();

                        // Fill the popup
                        var reg=new RegExp("(')" ,"g");
                        var content =
                            "<div class='current' onclick=\"$(this).closest('.correcter').correcter('key', '"+
                                $(elt).html().replace(reg,"\\'")+"')\">"+
                            (settings.style=="bold"?"<b>"+$(elt).html()+"</b>":$(elt).html())+"</div>";
                        for (var i=0; i<response.length; i++) {
                            if (response[i]!=$(elt).html()) {
                                content+="<div onclick=\"$(this).closest('.correcter').correcter('key', '"+
                                    response[i].replace(reg,"\\'")+"')\">"+response[i]+"</div>";
                            }
                        }
                        $popup.show().find("#options").html(content);

                        // Save the current element
                        settings.elt = $(elt);
                    }
                }
            },
            key: function(value) {
                var $this = $(this) , settings = helpers.settings($this), $popup = $(this).find("#popup");
                if (settings.elt) { settings.elt.html(value); }
                $popup.hide();
                settings.elt = 0;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            },
            popout: function(out) {
                var $this = $(this) , settings = helpers.settings($this), $popup = $(this).find("#popup");
                if (out) {
                    if (!settings.keypad) { settings.keypad = setTimeout(function() { $popup.hide() }, 1000); }
                }
                else {
                    if (settings.keypad) {  clearTimeout(settings.keypad); settings.keypad = 0; }
                }
            },
            next: function() {
                $(this).find("#splash").hide();
                $(this).find("#data").show();
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.finish) {
                    settings.finish = true;
                    var nbErrors = 0;
                    $(this).find("#data span").each(function(index, value) {
                        var word = settings.responses[index];
                        if (settings.multiple && word.search(settings.multiple)>0) {
                            word = word.substring(0,word.search(settings.multiple));
                        }
                        if ($(value).html()!=word) {
                            nbErrors++;
                            $(value).addClass("wrong");
                        }
                    });
                    settings.score = 5-nbErrors;
                    if (settings.score<0) { settings.score = 0; }
                    $(this).find("#valid").hide();
                    setTimeout(function() { helpers.end($this); }, nbErrors?3000:500);
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in correcter plugin!'); }
    };
})(jQuery);

