(function($) {
    // Activity default options
    var defaults = {
        name        : "novel",                            // The activity name
        label       : "Novel",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
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

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                $this.find("#board").bind("mousedown touchstart", function(_event) {
                    switch (settings.state) {
                        case "dialog" : settings.state=""; setTimeout(function(){helpers.run($this);}, 10); break;
                    }
                    _event.preventDefault();
                });

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        text: function($this, _txt) {
            var settings = helpers.settings($this);
            var ret = _txt;
            if ($.isArray(ret)) {
                try { var test = eval(ret[0].replace("$","settings.data.")); ret = ret[test?1:2]; }
                catch (e) { ret = ret[0]; }
            }

            if (settings.glossary && settings.glossary[ret]) { ret = settings.glossary[ret]; }
            return helpers.format(ret);
        },
        init: function($this) {
            var settings = helpers.settings($this);
            var first = false, name = "init";
            for (var i in settings.content.story) { if (!first) { first = true; name = i;} }
            settings.pc.push({story:settings.content.story[name], p:0, n:name });
            settings.def = $.extend(true, {}, settings.def, settings.content.def);

            helpers.run($this);
        },
        run: function($this) {
            var settings    = helpers.settings($this);
            var pc          = settings.pc[settings.pc.length-1];

            if (pc.p<pc.story.length) {
                var elt         = pc.story[pc.p];
                var timer       = 0;
                var next        = true;
                switch(elt.type) {
                    case "background" : case "bg" :
                        $this.find("#background").html((elt.img!="none"?"<img src='res/img/"+elt.img+"'/>":""));
                        break;
                    case "dialog" :
                        $this.find("#dialog").detach();
                        if (elt.text && elt.text.length) {
                            var html = "<div id='dialog'";
                            var style = "";
                            if (elt.from && settings.def[elt.from])
                            {
                                for (var i in settings.def[elt.from].attr) {
                                    if (i=="class") { html+=" class='"+settings.def[elt.from].attr[i]+"'"; }
                                    else            { style+=i+":"+settings.def[elt.from].attr[i]+";";}
                                }
                            }                        
                            if (style) { html+=" style='"+style+"'"; }
                            html+=">";

                            if (settings.def[elt.from] && settings.def[elt.from].text) {
                                html+="<div class='label'>"+helpers.text($this, settings.def[elt.from].text)+"</div>";
                            }
                            html+="<div class='content'>"+helpers.text($this, elt.text)+"</div>";
                            html+= "</div>";
                            $this.find("#board").append(html);
                            timer = -1;
                            setTimeout(function(){ settings.state = "dialog"}, 200);
                        }
                        break;
                    case "dialogg" :
                        $this.find("#board #dialog .content").append(helpers.text($this, elt.text)).parent().show();
                        timer = -1;
                        setTimeout(function(){ settings.state = "dialog"}, 200);
                        break;
                    case "error" : settings.score -= elt.value?elt.value:1; break;
                    case "hide" :
                        var e = elt.value.split(" ");
                        var $elt = $this.find("#char"+e[0]);
                        if ($elt.length) {
                            if (elt.attr && elt.attr.anim) {
                                var anim = elt.attr.anim.split(" ");
                                timer = parseFloat(anim.length>1?anim[1]:1)*1000;
                                switch(anim[0]) {
                                    case "dissolve"  : $elt.animate({opacity:0}, timer, function() { $(this).detach(); }); break;
                                    case "toright" : $elt.animate({left:"100%"}, timer, function() { $(this).detach(); }); break;
                                    case "toleft" : $elt.animate({left:"-100%"}, timer, function() { $(this).detach(); }); break;
                                }
                            }
                            else { $elt.detach(); }
                        }
                        break;
                    case "jump" : settings.pc = [ {story: settings.content.story[elt.value], p:0 , name:elt.value } ]; next =false; break;
                    case "menu" :
                        next = false; timer = -1;
                        var $html=$("<div id='menu'></menu>");
                        for (var i in elt.value) {
                            var m = "<div class='bluekeypad' id='r"+i+"'";
                            m+=" onclick='$(this).closest(\".novel\").novel(\"menu\",this,"+i+");'";
                            m+=" ontouchstart='$(this).closest(\".novel\").novel(\"menu\",this,"+i+");event.preventDefault();'";
                            m+=">"+helpers.text($this,elt.value[i].text)+"</div>";
                            $html.append(m);
                        }
                        $this.find("#board").append($html);
                        break;
                    case "op" :
                            var reg = new RegExp("[$]","g");
                            try { eval(elt.value.replace(reg,"settings.data.")+";"); }
                            catch (e) { alert("error with: "+elt.value); }
                        break;
                    case "pause"  : timer = parseFloat(elt.value)*1000; break;
                    case "show" :
                        var e = elt.value.split(" ");
                        if (settings.def[e[0]] && settings.def[e[0]].img && settings.def[e[0]].img[e[1]] ) {

                            var $elt = $this.find("#char"+e[0]), old = 0;
                            var leftv= (elt.attr && elt.attr.left)? elt.attr.left : 0;

                            if ($elt.length) {
                                old = $elt.css("left");
                                if (e.length>1) { $elt.find("img").attr("src","res/img/"+settings.def[e[0]].img[e[1]]); }
                            }
                            else {
                                $elt = $("<div class='"+elt.attr.class+"' id='char"+e[0]+"'><img src='res/img/"+settings.def[e[0]].img[e[1]]+"'/></div>");
                                $this.find("#board").append($elt);
                            }

                            if (elt.attr.anim) {
                                var anim = elt.attr.anim.split(" ");
                                timer = parseFloat(anim.length>1?anim[1]:1)*1000;
                                switch(anim[0]) {
                                    case "dissolve"  : $elt.css("opacity",0).animate({opacity:1}, timer); break;
                                    case "fromright" : $elt.css("left","100%").animate({left:leftv}, timer); break;
                                    case "fromleft" : $elt.css("left","-100%").animate({left:leftv}, timer); break;
                                    case "move":      $elt.css("left",old).animate({left:leftv}, timer); break;
                                }
                            }
                            else { $elt.css("left", leftv); }


                        }
                        break;
                }
                if (next)       { pc.p++; }
                if (timer!=-1)  { setTimeout(function(){helpers.run($this);}, timer + 100); }
            }
            else {
                if (settings.pc.length>1) {
                    settings.pc.pop();
                    setTimeout(function(){helpers.run($this);}, 100);
                }
                else {
                    var found = false, name = "";
                    for (var i in settings.content.story) {
                        if (found)   { name = i; found = false; }
                        if (i==pc.n) { found = true;} }
                    if (name) {
                        settings.pc = [{story:settings.content.story[name], p:0, n:name }];
                        setTimeout(function(){helpers.run($this);}, 100);
                    }
                    else {
                        if (settings.score<0) { settings.score = 0; }
                        setTimeout(function(){helpers.end($this);}, 500);
                    }
                }
            }
        }
    };

    // The plugin
    $.fn.novel = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    state           : "",
                    score           : 5,
                    pc              : [],
                    data            : {},
                    def             : { default: { text:"default" } }
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
            menu: function(_elt, _index) {
                var $this = $(this) , settings = helpers.settings($this);
                $(_elt).addClass("touch"); setTimeout(function() { $(_elt).removeClass("touch"); }, 50);

            
                var pc          = settings.pc[settings.pc.length-1];
                if (pc.p<pc.story.length) {
                    var elt         = pc.story[pc.p];
                    pc.p++;
                    settings.pc.push({story:elt.value[_index].story, p:0, n:"menu"});
                    setTimeout(function() { $this.find("#menu").detach(); helpers.run($this); }, 100);
                }

            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.init($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in novel plugin!'); }
    };
})(jQuery);

