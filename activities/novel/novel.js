(function($) {
    // Activity default options
    var defaults = {
        name        : "novel",                            // The activity name
        label       : "Novel",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        keys        : {},                                 // keys mapping
        data        : {},
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
                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                $this.find("#nlboard").bind("mousedown touchstart", function(_event) {
                    var settings = helpers.settings($this);
                    if (settings.interactive) {
                        switch (settings.state) {
                            case "dialog" : settings.state=""; setTimeout(function(){helpers.run($this);}, 10); break;
                        }
                    }
                    _event.preventDefault();
                });
                
                // ADD CONTENT FROM GEN FUNCTION
                if (settings.gen) {
                    var data = eval('('+settings.gen+')')();
                    if (data.def)   { settings.content.def=$.extend(true,{},settings.content.def, data.def); }
                    if (data.data)  { settings.data = $.extend(true,{},settings.data, data.data); }
                }
                
                setTimeout(function() { $this[settings.name]('next'); }, 500);
            }
        },
        text: function($this, _txt) {
            var settings = helpers.settings($this);
            var ret = _txt;
            if ($.isArray(ret)) {
                try { var test = eval(ret[0].replace("$","settings.data.")); ret = ret[test?1:2]; }
                catch (e) { ret = ret[1]; }
            }

            if (settings.glossary && settings.glossary[ret]) { ret = settings.glossary[ret]; }
            return jtools.format(ret);
        },
        init: function($this) {
            var settings = helpers.settings($this);
            var first = false, name = "init";
            settings.state      = "";
            settings.pc         = [];
            settings.running    = false;
            $this.find("#nlboard").html("");
            for (var i in settings.content.story) { if (!first) { first = true; name = i;} }
            settings.pc.push({story:settings.content.story[name], p:0, n:name });
            settings.def = $.extend(true, {}, settings.def, settings.content.def);
            helpers.run($this);
        },
        run: function($this) {
            var settings    = helpers.settings($this);
            var pc          = settings.pc[settings.pc.length-1];
            
            // Some critical animation may last too long, just waiting for a little bit more.
            if (settings.running) { setTimeout(function(){helpers.run($this);}, 100 ); return; }
            
            if (pc.p<pc.story.length) {
                var elt         = pc.story[pc.p];
                var timer       = 0;
                var next        = true;
                var reg         = new RegExp("[$]","g");
                switch(elt.type) {
                    case "callback" :
                        if (settings.callback && settings.callback[elt.value]) {
                            settings.callback[elt.value]($this, elt.attr, settings.data);
                        }
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
                            $this.find("#nlboard").append(html);
                            timer = -1;
                            setTimeout(function(){ settings.state = "dialog"; }, 200);
                        }
                        break;
                    case "dialogg" :
                        $this.find("#nlboard #dialog .content").append(helpers.text($this, elt.text)).parent().show();
                        timer = -1;
                        setTimeout(function(){ settings.state = "dialog"; }, 200);
                        break;
                    case "error" : settings.score -= elt.value?elt.value:1; break;
                    case "hide" :
                        var value = elt.value;
                        if (value.indexOf("$")!=-1) {
                            try { value = eval(value.replace(reg,"settings.data.")+";"); }
                            catch (e) { alert("error with: "+value); }
                        }
                        var e = value.split(" ");
                        var $elt = $this.find("#elt"+e[0]);
                        if ($elt.length) {
                            if (elt.attr && elt.attr.anim) { 
                                var anim = elt.attr.anim.split(" ");
                                timer = parseFloat(anim.length>1?anim[1]:1)*1000;
                                switch(anim[0]) {
                                    case "dissolve" : $elt.animate({opacity:0}, timer, function() { settings.running = false; $(this).detach(); }); break;
                                    case "toright"  : $elt.animate({left:"100%"}, timer, function() { settings.running = false; $(this).detach(); }); break;
                                    case "toleft"   : $elt.animate({left:"-100%"}, timer, function() { settings.running = false; $(this).detach(); }); break;
                                    case "totop"   : $elt.animate({top:"-100%"}, timer, function() { settings.running = false; $(this).detach(); }); break;
                                    case "tobottom"  : $elt.animate({top:"100%"}, timer, function() { settings.running = false; $(this).detach(); }); break;
                                }
                                
                                if (elt.attr.nodelay) { timer = 0; } else { settings.running = true; }
                            }
                            else { $elt.detach(); }
                        }
                        settings.keys[e[0]]=0;
                        break;
                    case "if"   :
                        var rep = true;
                        try { rep = eval(elt.cond.replace(reg,"settings.data.")+";"); }
                        catch (e) { alert("error with: "+elt.cond); }
                        if (rep) { settings.pc.push({story:elt.value[0], p:0, n:"if"}); }
                        else if (elt.value.length>1) { settings.pc.push({story:elt.value[1], p:0, n:"if"}); }
                        break;
                    case "jump" :
                        var dest = elt.value;
                        if (elt.value[0]=='$') {
                            try { dest = eval(dest.replace(reg,"settings.data.")); }
                            catch (e) { alert("error with: "+dest); }
                        }
                        if (settings.content.story[dest]) {
                            settings.pc = [ {story: settings.content.story[dest], p:0 , n:dest } ];
                            next =false;
                        }
                        break;
                    case "menu" :
                        next = false; timer = -1;
                        var $html=$("<div id='menu'></menu>");
                        if (elt.attr&&elt.attr["class"]) {
                            var value = elt.attr["class"];
                            if (value.indexOf("$")!=-1) {
                                try { value = eval(value.replace(reg,"settings.data.")+";"); }
                                catch (e) { alert("error with: "+value); }
                            }
                            $html.addClass(value);
                        }
                        for (var i in elt.value) {
                            var m = "<div class='g_bluekey' id='r"+i+"'";
                            m+=" onclick='$(this).closest(\".novel\").novel(\"menu\",this,"+i+");'";
                            m+=" ontouchstart='$(this).closest(\".novel\").novel(\"menu\",this,"+i+");event.preventDefault();'";
                            m+=">"+helpers.text($this,elt.value[i].text)+"</div>";
                            $html.append(m);
                        }
                        $this.find("#nlboard").append($html);
                        break;
                    case "op" :
                            try { eval(elt.value.replace(reg,"settings.data.")+";"); }
                            catch (e) { alert("error with: "+elt.value); }
                        break;
                    case "pause"  : timer = parseFloat(elt.value)*1000; break;
                    case "stop"   : next = false; timer = -1; break;
                    case "show" :
                        var value = elt.value;
                        if (value.indexOf("$")!=-1) {
                            try { value = eval(value.replace(reg,"settings.data.")+";"); }
                            catch (e) { alert("error with: "+value); }
                        }
                        var e = value.split(" ");
                        var def = settings.def[e[0]];
                        
                        if (def) {

                            var $elt = $this.find("#elt"+e[0]), oldleft = 0, oldtop;
                            var type = def.attr?def.attr.type:"img";

                            var url="";
                            if (e.length>1) { url = def.url[e[1]]; }
                            if (url && url.indexOf("$")!=-1) {
                                try { url = eval(url.replace(reg,"settings.data.")+";"); }
                                catch (e) { alert("error with: "+url); }
                            }
                            
                            if ($elt.length) {
                                oldleft     = $elt.css("left");
                                oldtop      = $elt.css("top");

                                
                                switch(type) {
                                    case "frame":   $elt.replace($(helpers.framefromdef($this, url, e[0], def.attr)));   break;
                                    case "text":    $elt.replace($(helpers.textfromdef($this, e[0], def.attr)));        break;
                                    default:        if (e.length>1) { $elt.find("img").attr("src",url); }     break;
                                }
                            }
                            else {
                                switch(type) {
                                    case "frame":   $elt = $(helpers.framefromdef($this, url, e[0], def.attr));   break;
                                    case "text":    $elt = $(helpers.textfromdef($this, e[0], def.attr));                   break;
                                    default:        $elt = $(helpers.imgfromdef($this, url, e[0], def.attr));     break;
                                }
                                
                                $this.find("#nlboard").append($elt);
                            }

                            // UPDATE POSITION
                            var leftv= (elt.attr && elt.attr.left)? elt.attr.left : ( (def.attr && def.attr.left)?def.attr.left:"" );
                            var topv= (elt.attr && elt.attr.top)? elt.attr.top : ( (def.attr && def.attr.top)?def.attr.top:"" );
                            
                            if (leftv.indexOf("$")!=-1) {
                                try { leftv = eval(leftv.replace(reg,"settings.data.")+";"); }
                                catch (e) { alert("error with: "+leftv); }
                            }
                            if (topv.indexOf("$")!=-1) {
                                try { topv = eval(topv.replace(reg,"settings.data.")+";"); }
                                catch (e) { alert("error with: "+topv); }
                            }

                            if (leftv)  { $elt.css("left", leftv); }
                            if (topv)   { $elt.css("top", topv); }
                            
                            
                            $elt.unbind("mousedown touchstart");
                            settings.keys[e[0]]=0;
                            if (elt.attr&&elt.attr.onclick) {
                                var callback=elt.attr.onclick.split(' ');
                                settings.keys[e[0]]=callback;
                                $elt.find("img").attr("id",callback[0]);
                                $elt.addClass("g_pointer");
                                $elt.bind("mousedown touchstart", function(_event) {
                                    var dest = $(this).find("img").attr("id"), reg = new RegExp("[$]","g");
                                    if (settings.content.story[dest]) {
                                        settings.pc = [ {story: settings.content.story[dest], p:0 , n:dest } ];
                                        helpers.run($this);
                                    }
                                    _event.preventDefault();
                                });
                            }
                            else { $elt.removeClass("g_pointer"); }

                            if (elt.attr&&elt.attr.anim) {
                                var anim = elt.attr.anim.split(" ");
                                timer = parseFloat(anim.length>1?anim[1]:1)*1000;
                                switch(anim[0]) {
                                    case "dissolve"  : $elt.css("opacity",0).animate({opacity:1}, timer); break;
                                    case "fromright" : $elt.css("left","100%").animate({left:leftv}, timer); break;
                                    case "fromleft" : $elt.css("left","-100%").animate({left:leftv}, timer); break;
                                    case "fromtop"  : $elt.css("top","-100%").animate({top:topv}, timer); break;
                                    case "frombottom" : $elt.css("top","100%").animate({top:topv}, timer); break;
                                    case "move":
                                        var aa = { };
                                        if (leftv)  { aa["left"]    = leftv; }
                                        if (topv)   { aa["top"]     = topv; }
                                        $elt.css("left",oldleft).css("top",oldtop).animate(aa, timer); break;
                                }
                                if (elt.attr.nodelay) { timer = 0; }
                            }


                        }
                        break;
                }
                if (next)       { pc.p++; }
                if (timer!=-1)  { if (timer&&!elt.nodelay) setTimeout(function(){helpers.run($this);}, timer ); else helpers.run($this); }
            }
            else {
                if (settings.pc.length>1) {
                    settings.pc.pop();
                    helpers.run($this);
                }
                else {
                    var found = false, name = "";
                    for (var i in settings.content.story) {
                        if (found)   { name = i; found = false; }
                        if (i==pc.n) { found = true;} }

                    if (name) {
                        settings.pc = [{story:settings.content.story[name], p:0, n:name }];
                        helpers.run($this);
                    }
                    else {
                        if (settings.score<0) { settings.score = 0; }
                        setTimeout(function(){helpers.end($this, {'status':'success','score':settings.score,'data':settings.data});}, 500);
                    }
                }
            }
        },
        imgfromdef: function($this, _url, _id, _attr) {
            var settings    = helpers.settings($this);
            var style="";
            var content="";
            if (_attr&&_attr.width)       { style+="width:"+_attr.width+"em;" }
            if (_attr&&_attr.height)      { style+="height:"+_attr.height+"em;" }
            if (_attr&&_attr.opacity)     { style+="opacity:"+_attr.opacity+";" }
            if (_attr&&_attr.index)       { style+="z-index:"+_attr.index+";" }
            if (_attr&&_attr.size)        { style+="font-size:"+_attr.size+"em;" }
            if (_url.indexOf("<svg")!=-1) { content = _url; } 
            else                          { content = "<img src='"+_url+"'/>"; }
            
            elt = "<div "+(_attr&&_attr["class"]?"class='"+_attr["class"]+"' ":"")+"id='elt"+_id+"'"+
                    (style?" style='"+style+"'":"")+">"+content+"</div>";
            return elt;
            
        },
        textfromdef: function($this, _id, _attr) {
            var settings    = helpers.settings($this);
            var style="";
            if (_attr&&_attr.opacity)     { style+="opacity:"+_attr.opacity+";" }
            if (_attr&&_attr.index)       { style+="z-index:"+_attr.index+";" }
            if (_attr&&_attr.size)        { style+="font-size:"+_attr.size+"em;" }
            if (_attr&&_attr.color)       { style+="color:"+_attr.color+";" }
            
            var value = _attr.value;
            if (value.indexOf("$")!=-1) {
                try { value = eval(value.replace(reg,"settings.data.")+";"); }
                catch (e) { alert("error with: "+value); }
            }
                            
            elt = "<div "+(_attr&&_attr["class"]?"class='"+_attr["class"]+"' ":"")+"id='elt"+_id+"'"+
                    (style?" style='"+style+"'":"")+">"+jtools.format(value)+"</div>";
            return elt;
            
        },
        framefromdef: function($this, _url, _id, _attr) {
            var settings    = helpers.settings($this);
            var style="width:8em;height:6em;";
            if (_attr&&_attr.opacity)     { style+="opacity:"+_attr.opacity+";" }
            if (_attr&&_attr.index)       { style+="z-index:"+_attr.index+";" }
            if (_attr&&_attr.size)        { style+="font-size:"+_attr.size+"em;" }
                            
            elt = "<div "+(_attr&&_attr["class"]?"class='"+_attr["class"]+"' ":"")+"id='elt"+_id+"'"+
                    " style='"+style+"'><iframe style='width:8.1em;height:6em;border:0;' src='"+_url+"'></iframe></div>";
            return elt;
            
        },
        key: function($this, _value) {
            var settings    = helpers.settings($this);
            for (var i in settings.keys) {
                if (settings.keys[i] && settings.keys[i][1]==_value && settings.content.story[settings.keys[i][0]]) {
                    settings.pc = [ {story: settings.content.story[settings.keys[i][0]], p:0 , n:settings.keys[i][0] } ];
                    helpers.run($this);
                }
            }
        },
        onmessage: function($this, _e) {
            var settings = helpers.settings($this);
            settings.data.frame = _e.data;
            if (settings.content.story["onmessage"]) {
                settings.pc = [ {story: settings.content.story["onmessage"], p:0 , n:"onmessage" } ];
                helpers.run($this);
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
                    running         : false,
                    def             : { default: { text:"default" } },
                    interactive     : false
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    
                    if (!options.edit) {
                        $(document).keypress(function(_e) {
                            helpers.key($this, _e.keyCode); _e.preventDefault(); }
                        );
                    }
                    
                    // HANDLE FRAME STUFF
                    window.onmessage = function(_e){ helpers.onmessage($this, _e); };

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
                if (settings.interactive) {
                    $(_elt).addClass("g_ktouch"); setTimeout(function() { $(_elt).removeClass("g_ktouch"); }, 50);

                    var pc          = settings.pc[settings.pc.length-1];
                    if (pc.p<pc.story.length) {
                        var elt         = pc.story[pc.p];
                        pc.p++;
                        settings.pc.push({story:elt.value[_index].story, p:0, n:"menu"});
                        setTimeout(function() { $this.find("#menu").detach(); helpers.run($this); }, 100);
                    }
                }
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devpanel").hide();
                settings.interactive = true;
                helpers.init($this);
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.end($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in novel plugin!'); }
    };
})(jQuery);

