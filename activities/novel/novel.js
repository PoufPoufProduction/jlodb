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
            settings.context.onquit($this,{'status':'success','score':settings.score,'data':settings.data});
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
                
                if (settings.dev) { $this.find("#devmode").show(); }
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
            return helpers.format(ret);
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
                            var m = "<div class='bluekeypad' id='r"+i+"'";
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
                                $elt.addClass("pointer");
                                $elt.bind("mousedown touchstart", function(_event) {
                                    var dest = $(this).find("img").attr("id"), reg = new RegExp("[$]","g");
                                    if (settings.content.story[dest]) {
                                        settings.pc = [ {story: settings.content.story[dest], p:0 , n:dest } ];
                                        helpers.run($this);
                                    }
                                    _event.preventDefault();
                                });
                            }
                            else { $elt.removeClass("pointer"); }

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
                        if (!settings.dev)
                        {
                            if (settings.score<0) { settings.score = 0; }
                            setTimeout(function(){helpers.end($this);}, 500);
                        }
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
                    (style?" style='"+style+"'":"")+">"+helpers.format(value)+"</div>";
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
        devmode: {
            devvar: {
                update: function($this) {
                    var settings    = helpers.settings($this);
                    var html="";
                    html+="<div class='elt'><div class='label'>score</div><div class='type tnumber'>number</div>"+
                          "<div class='value'>"+settings.score+"</div></div>";
                    for (var i in settings.data) {
                        var t = typeof(settings.data[i]);
                        html+="<div class='elt' id='"+i+"'>";
                        html+="<div class='label'>"+i+"</div>";
                        html+="<div class='type t"+t+"'>"+t+"</div>";
                        switch (t) {
                            case "boolean":
                                html+="<select class='value'><option>true</option>"+
                                      "<option "+(settings.data[i]?"":"selected='selected'")+">false</option></select>";
                            break;
                            default:
                                html+="<input class='value' value=\""+settings.data[i]+"\"/>";
                            break;
                        }
                        html+="</div>";
                    }
                    $this.find("#devvarpanel").html(html).show();
                    $this.find("#devvarpanel .value").change(function() { helpers.devmode.devvar.save($this); });
                },
                save: function($this) {
                    var settings    = helpers.settings($this);
                    for (var i in settings.data) {
                        var t = typeof(settings.data[i]);
                        var v = $this.find("#devvarpanel #"+i+" .value").val();
                        switch(t) {
                            case "boolean": settings.data[i] = (v=='true');    break;
                            case "number" : settings.data[i] = parseInt(v);    break;
                            case "string" : settings.data[i] = v;              break;
                            case "object" : settings.data[i] = v.split(',');   break;
                        }
                    }
                }
            },
            devdef: {
                elt: function(_id, _elt) {
                    var html="";
                    html+="<div class='elt' id='"+_id+"'>";
                    html+="<input class='label eltdata' value=\""+_id+"\"/>";
                    html+="<input class='value eltdata' value=\""+(_elt.text?_elt.text:"")+"\"/>";
                    html+="<div class='icon' id='addimg'><img src='res/img/default/white/add.svg'/></div>";
                    html+="<div class='icon' id='addattr'><img src='res/img/default/white/add.svg'/></div>";
                    html+="<div class='icon' id='removeelt'><img src='res/img/default/white/delete.svg'/></div>";
                    html+="</div>";
                    var $html=$(html);
                    $html.children("input").change(function() { $(this).closest("#devdefpanel").find("#savedef").addClass("s"); });
                    
                    for (var j in _elt.url)  { $html.append(helpers.devmode.devdef.url (j, _elt.url[j]));  }
                    for (var j in _elt.attr) { $html.append(helpers.devmode.devdef.attr(j, _elt.attr[j])); }
                    
                    $html.children("#addimg").bind("mousedown touchstart", function(event) {
                        $(this).closest("#devdefpanel").find("#savedef").addClass("s");
                        $(this).closest(".elt").addClass("s").append(helpers.devmode.devdef.url("name", "url"));
                        event.preventDefault();
                    });
                    $html.children("#addattr").bind("mousedown touchstart", function(event) {
                        $(this).closest("#devdefpanel").find("#savedef").addClass("s");
                        $(this).closest(".elt").addClass("s").append(helpers.devmode.devdef.attr("name", "value"));
                        event.preventDefault();
                    });
                    $html.children("#removeelt").bind("mousedown touchstart", function(event) {
                        $(this).closest("#devdefpanel").find("#savedef").addClass("s");
                        $(this).closest(".elt").detach();
                        event.preventDefault();
                    });
                    
                    $html.children().first().bind("mousedown touchstart", function(event) {
                        $(this).parent().toggleClass("s");
                    });
                    
                    return $html;
                },
                url: function(_name, _value) {
                    var html="<div class='eltimg toggle'>"
                    html+="<input class='label' value=\""+_name+"\"/>";
                    html+="<input class='value' value=\""+_value+"\"/>";
                    html+="<div class='icon snapshot'><img src='res/img/default/white/snapshot.svg'/></div>";
                    html+="<div class='icon' id='removeimg'><img src='res/img/default/white/delete.svg'/></div>";
                    html+="</div>";
                    var $html = $(html);
                    
                    $html.children("input").change(function() { $(this).closest("#devdefpanel").find("#savedef").addClass("s"); });
                    
                    $html.children("#removeimg").bind("mousedown touchstart", function(event) {
                        $(this).closest("#devdefpanel").find("#savedef").addClass("s");
                        $(this).closest(".eltimg").detach();
                        event.preventDefault();
                    });
                    
                    $html.children(".snapshot").bind("mousedown touchstart", function(event) {
                        var def = {};
                        $(this).closest(".elt").find(".eltattr").each(function() {
                            def[$(this).find('.label').val()] = $(this).find(".value").val();
                        });
                        $(this).closest("#devpanel").find("#devexport").html(helpers.imgfromdef($(this).closest(".novel"),$(this).prev().val(), "x", def));
                        event.preventDefault();
                    });
                    
                    return $html;
                },
                attr: function(_name, _value) {
                    var html="<div class='eltattr toggle'>"
                    html+="<input class='label' value=\""+_name+"\"/>";
                    html+="<input class='value' value=\""+_value+"\"/>";
                    html+="<div class='icon' id='removeattr'><img src='res/img/default/white/delete.svg'/></div>";
                    html+="</div>";
                    var $html = $(html);
                    
                    $html.children("input").change(function() { $(this).closest("#devdefpanel").find("#savedef").addClass("s"); });
                    
                    $html.children("#removeattr").bind("mousedown touchstart", function(event) {
                        $(this).closest("#devdefpanel").find("#savedef").addClass("s");
                        $(this).closest(".eltattr").detach();
                        event.preventDefault();
                    });
                    
                    return $html;
                },
                update: function($this) {
                    var settings    = helpers.settings($this);
                    var html="<div id='devdefmenu' class='menu'>"
                    html+="<div id='adddef' class='icon'><img src='res/img/default/white/add.svg'/></div>"
                    html+="<div id='savedef' class='icon'><img src='res/img/default/white/import.svg'/></div>"
                    html+="</div>";
                    html+="<div class='content'></div>";
                    $this.find("#devdefpanel").html(html);
                    for (var i in settings.content.def) {
                        $this.find("#devdefpanel>.content").append(helpers.devmode.devdef.elt(i, settings.content.def[i]));
                    }
                    $this.find("#devdefmenu #adddef").bind("mousedown touchstart", function(event) {
                        $(this).next().addClass("s");
                        $this.find("#devdefpanel>.content").append(helpers.devmode.devdef.elt("new", {text:"name"}));
                        event.preventDefault();
                    });
                    $this.find("#devdefmenu #savedef").bind("mousedown touchstart", function(event) {
                        $(this).removeClass("s");
                        helpers.devmode.devdef.save($this);
                        event.preventDefault();
                    });
                    
                    $this.find("#devdefpanel").show();
                },
                save: function($this) {
                    var settings    = helpers.settings($this);
                    var def={};
                    $this.find("#devdefpanel>.content .elt").each(function() {
                        var elt     = {};
                        var url     = {};
                        var attr    = {};
                        var id      = $(this).find(".label.eltdata").val();
                        var text    = $(this).find(".value.eltdata").val();
                        if (text) { elt.text = text; }
                        $(this).find(".eltimg").each(function() { url[$(this).find(".label").val()] = $(this).find(".value").val(); });
                        $(this).find(".eltattr").each(function() { attr[$(this).find(".label").val()] = $(this).find(".value").val(); });
                        
                        if (url)  { elt.url = url; }
                        if (attr) { elt.attr = attr; }
                        def[id]=elt;
                    });
                    settings.content.def = def;
                    settings.def = def;
                }
            },
            devsto: {
                bind: {
                    story:function($this, $html) {
                        var settings    = helpers.settings($this);
                        
                        $html.children("#removeelt").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            $(this).closest(".elt").detach();
                            event.preventDefault();
                        });
                        
                        $html.children("#addop").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            $(this).closest(".elt").addClass("s").append(
                                helpers.devmode.devsto.op($this, {type: $(this).closest(".elt").find(".operation").val() }));
                            event.preventDefault();
                        });
                        
                        $html.children("#dupop").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            var $story=$(this).parent();
                            var $clone=$story.clone();
                            helpers.devmode.devsto.bind.story($this,$clone);
                            $clone.children("#storyname").val("story_"+(Math.floor(Math.random()*9000)+1000));
                            $clone.children(".elt").each(function() { helpers.devmode.devsto.bind.op($this, $(this));});
                            $clone.insertAfter($story);
                            event.preventDefault();
                        });
                        
                        $html.children("#up").bind("mousedown touchstart", function(event) {
                            var elt = $(this).parent(), prev = elt.prev();
                            if (prev.hasClass("elt")) {
                                $(this).closest("#devstopanel").find("#savesto").addClass("s");
                                elt.detach().insertBefore(prev);
                            }
                            event.preventDefault();
                        });
                        
                        $html.children("#down").bind("mousedown touchstart", function(event) {
                            var elt = $(this).parent(), next = elt.next();
                            if (next.hasClass("elt")) {
                                $(this).closest("#devstopanel").find("#savesto").addClass("s");
                                elt.detach().insertAfter(next);
                            }
                            event.preventDefault();
                        });
                        
                        $html.children(".label").first().bind("mousedown touchstart", function(event) {
                            $(this).parent().toggleClass("s");
                        });
                    },
                    attr:function($this, $html) {
                        var settings    = helpers.settings($this);
                        
                        $html.children("input").change(function() { $(this).closest("#devstopanel").find("#savesto").addClass("s"); });
                        
                        $html.children("#removeattr").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            $(this).closest(".eltattr").detach();
                            event.preventDefault();
                        });
                    },
                    op:function($this, $html) {
                        var settings    = helpers.settings($this);
                        
                        $html.children(".eltattr").each(function() { helpers.devmode.devsto.bind.attr($this, $(this)); });
                        $html.children(".substory").children(".elt").each(function() { helpers.devmode.devsto.bind.story($this, $(this)); });
                        
                        $html.children("#up").bind("mousedown touchstart", function(event) {
                            var elt = $(this).parent(), prev = elt.prev();
                            if (prev.hasClass("eltaction")) {
                                $(this).closest("#devstopanel").find("#savesto").addClass("s");
                                elt.detach().insertBefore(prev);
                            }
                            event.preventDefault();
                        });
                        
                        $html.children("#down").bind("mousedown touchstart", function(event) {
                            var elt = $(this).parent(), next = elt.next();
                            if (next.hasClass("eltaction")) {
                                $(this).closest("#devstopanel").find("#savesto").addClass("s");
                                elt.detach().insertAfter(next);
                            }
                            event.preventDefault();
                        });
                        
                        $html.children("#removeop").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            $(this).closest(".eltaction").detach();
                            event.preventDefault();
                        });
                        
                        $html.children("#addattr").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            $(this).closest(".eltaction").append( helpers.devmode.devsto.attr($this, "new", ""));
                            event.preventDefault();
                        });
                        
                        $html.children("#addstory").bind("mousedown touchstart", function(event) {
                            $(this).closest("#devstopanel").find("#savesto").addClass("s");
                            $(this).parent().children(".substory").append(helpers.devmode.devsto.story($this, "choice",{}));
                            
                            event.preventDefault();
                        });
                    }
                    
                },
                story: function($this, _id, _def) {
                    var settings    = helpers.settings($this);
                    var html="";
                    html+="<div class='elt'>";
                    html+="<div class='move' id='up'>↑</div>";
                    html+="<div class='move' id='down'>↓</div>";
                    var name = _id;
                    if ($.isArray(_id)) {
                        var id1 = _id[1], id2 = _id[2];
                        if (id1 && settings.glossary[id1]) { id1 = settings.glossary[id1]; }
                        if (id2 && settings.glossary[id2]) { id2 = settings.glossary[id2]; }
                        name="["+_id[0]+","+id1+","+id2+"]";
                    }
                    else if (name && settings.glossary[name]) { name = settings.glossary[name]; }
                    
                    
                    html+="<input class='label' id='storyname' value=\""+name+"\"/>";
                    html+="<select class='operation'>";
                    html+="<option>callback</option>";
                    html+="<option selected='selected'>dialog</option><option>dialogg</option><option>error</option>";
                    html+="<option>hide</option><option>if</option>";
                    html+="<option>jump</option><option>menu</option><option>op</option><option>pause</option><option>show</option>";
                    html+="<option>stop</option>";
                    html+="</select>";
                    html+="<div class='icon' id='addop'><img src='res/img/default/white/add.svg'/></div>";
                    html+="<div class='icon' id='dupop'><img src='res/img/default/white/add.svg'/></div>";
                    html+="<div class='icon' id='removeelt'><img src='res/img/default/white/delete.svg'/></div>";
                    html+="</div>";
                    var $html=$(html);
                    
                    helpers.devmode.devsto.bind.story($this, $html);
                    
                    for (var j in _def)  { $html.append(helpers.devmode.devsto.op ($this, _def[j]));  }
                    
                    
                    return $html;
                },
                attr: function($this, _name, _value) {
                    var html="<div class='elt eltattr'>"
                    html+="<input class='label' value=\""+_name+"\"/>";
                    html+="<input class='value' value=\""+_value+"\"/>";
                    html+="<div class='icon' id='removeattr'><img src='res/img/default/white/delete.svg'/></div>";
                    html+="</div>";
                    var $html = $(html);
                    
                    helpers.devmode.devsto.bind.attr($this, $html);
                    
                    return $html;
                },
                op: function($this, _def) {
                    var settings    = helpers.settings($this);
                    var html="<div class='elt eltaction toggle'>"
                    html+="<div class='move' id='up'>↑</div>";
                    html+="<div class='move' id='down'>↓</div>";
                    html+="<div class='label'>"+_def.type+"</div>";
                    switch(_def.type) {
                        case "callback" : case "show": case "hide":
                            html+="<input class='value' value=\""+(_def.value?_def.value:"")+"\"/>";
                            html+="<div class='icon' id='addattr'><img src='res/img/default/white/add.svg'/></div>";
                            html+="<div class='icon' id='removeop'><img src='res/img/default/white/delete.svg'/></div>";
                        break;
                        case "dialog" : case "dialogg" :
                            html+="<input class='value' id='dialogvalue' value=\""+(_def.from?_def.from:"")+"\"/>";
                            var test="", d1=_def.text, d2="";
                            if ($.isArray(_def.text)) { test = _def.text[0]; d1 = _def.text[1], d2  = _def.text[2]; }
                            html+="<input id='dialogtest' class='value' value=\""+(test?test:"")+"\"/>";
                            if (d1 && settings.glossary[d1]) { d1 = settings.glossary[d1]; }
                            if (d2 && settings.glossary[d2]) { d2 = settings.glossary[d2]; }
                            
                            html+="<div class='icon' id='removeop'><img src='res/img/default/white/delete.svg'/></div>";
                            
                            html+="<textarea id='dialogd1' class='value'>"+(d1?d1:"")+"</textarea>";
                            html+="<textarea id='dialogd2' class='value'>"+(d2?d2:"")+"</textarea>";
                        break;
                        case "if" :
                            html+="<input class='value' value=\""+(_def.cond?_def.cond:"")+"\"/>";
                            html+="<div class='icon' id='removeop'><img src='res/img/default/white/delete.svg'/></div>";
                            html+="<div class='substory'></div>";
                        break;
                        case "menu" :
                            html+="<div class='icon' id='addstory'><img src='res/img/default/white/add.svg'/></div>";
                            html+="<div class='icon' id='removeop'><img src='res/img/default/white/delete.svg'/></div>";
                            html+="<div class='substory'></div>"; break;
                        default :
                            html+="<input class='value' value=\""+(_def.value?_def.value:"")+"\"/>";
                            html+="<div class='icon' id='removeop'><img src='res/img/default/white/delete.svg'/></div>";
                        break;
                    }
                    html+="</div>";
                    var $html = $(html);
                    
                    helpers.devmode.devsto.bind.op($this, $html);
                    
                    for (var j in _def.attr) { $html.append(helpers.devmode.devsto.attr($this, j, _def.attr[j])); }
                    
                    if (_def.type=="menu") {
                        for (var i in _def.value) {
                            $html.children(".substory").append(helpers.devmode.devsto.story($this, _def.value[i].text, _def.value[i].story));
                        }
                    }
                    else if (_def.type=="if") {
                        $html.children(".substory").append(helpers.devmode.devsto.story($this, "then", _def.value?_def.value[0]:{}));
                        $html.children(".substory").append(helpers.devmode.devsto.story($this, "else", _def.value?_def.value[1]:{}));
                    }
                    
                    return $html;
                },
                update: function($this) {
                    var settings    = helpers.settings($this);
                    
                    var html="<div id='devstomenu' class='menu'>"
                    html+="<div id='addsto' class='icon'><img src='res/img/default/white/add.svg'/></div>"
                    html+="<div id='savesto' class='icon'><img src='res/img/default/white/import.svg'/></div>"
                    html+="</div>";
                    html+="<div class='content'></div>";
                    $this.find("#devstopanel").html(html);
                    for (var i in settings.content.story) {
                        $this.find("#devstopanel>.content").append(helpers.devmode.devsto.story($this, i, settings.content.story[i]));
                    }
                    
                    $this.find("#devstomenu #addsto").bind("mousedown touchstart", function(event) {
                        $(this).next().addClass("s");
                        $this.find("#devstopanel>.content").append(helpers.devmode.devsto.story($this, "new", []));
                        event.preventDefault();
                    });
                    $this.find("#devstomenu #savesto").bind("mousedown touchstart", function(event) {
                        $(this).removeClass("s");
                        helpers.devmode.devsto.save.all($this);
                        event.preventDefault();
                    });
                    
                    $this.find("#devstopanel").show();
                    
                },
                save: {
                    action: function(_actions, _glossary, $action) {
                        var t=$action.children(".label").text();
                        var v=$action.children(".value").val();
                        var ret={type:t};
                        switch(t) {
                            case "callback" : case "show" : case "hide" :
                                if (v) { ret.value = v; }
                                var attr={}, empty=true;
                                $action.find(".eltattr").each(function() {
                                    var t=$(this).find(".label").val();
                                    var v=$(this).find(".value").val();
                                    if (t&&v) { empty=false; attr[t]=v; }
                                });
                                if (!empty) { ret.attr = attr; }
                            break;
                            case "if":
                                ret.cond=v;
                                var stories=[];
                                $action.children(".substory").children().each(function() {
                                    var actions=[];
                                    $(this).children(".eltaction").each(function() {
                                        helpers.devmode.devsto.save.action(actions, _glossary, $(this));
                                    });
                                    stories.push(actions);
                                });
                                ret.value=stories;
                                break;
                            case "menu" :
                                var menu=[];
                                $action.children(".substory").children().each(function() {
                                    var n = Object.keys(_glossary).length;
                                    var label = $(this).children("#storyname").val();
                                    if (label&&label[0]=='[') {
                                        label=label.substr(1,label.length-2);
                                        label=label.split(",");
                                        
                                        _glossary["d"+n]    =label[1]; label[1] = "d"+n;
                                        _glossary["d"+(n+1)]=label[2]; label[2] = "d"+(n+1);
                                    }
                                    else { _glossary["d"+n] =label ;   label = "d"+n; }
                                    var actions=[];
                                    $(this).children(".eltaction").each(function() {
                                        helpers.devmode.devsto.save.action(actions, _glossary, $(this));
                                    });
                                    menu.push({text:label, story:actions});
                                });
                                ret.value=menu;
                            break;
                            case "dialog" : case "dialogg" :
                                if (v) { ret.from = v; }
                                var test = $action.find("#dialogtest").val();
                                var d1 = $action.find("#dialogd1").val();
                                var d2 = $action.find("#dialogd2").val();
                                if (d1) {
                                    var n=Object.keys(_glossary).length;
                                    _glossary["d"+n]=d1;
                                    if (test&&d2) {
                                        ret.text=[test,"d"+n,"d"+(n+1)];
                                        _glossary["d"+(n+1)]=d2;
                                    }
                                    else { ret.text = "d"+n; }
                                }
                            break;
                            default: if (v) { ret.value = v; } break;
                        }
                        _actions.push(ret);
                    },
                    story: function(_story, _glossary, $elt) {
                        var label = $elt.children("#storyname").val();
                        var actions=[];
                        $elt.children(".eltaction").each(function() {
                            helpers.devmode.devsto.save.action(actions, _glossary, $(this));
                        });
                        _story[label]=actions;
                    },
                    all: function($this) {
                        var settings    = helpers.settings($this);
                        $this.find("#devcon").hide();
                        var story    = {};
                        var glossary = {};
                        $this.find("#devstopanel>.content>.elt").each(function() {
                            helpers.devmode.devsto.save.story(story, glossary, $(this)); }
                        );
                        settings.content.story = story;
                        settings.glossary = glossary;
                    }
                }
            }
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
                    
                    if (!options.dev) {
                        $(document).keypress(function(_e) {
                            if (_e.keyCode!=116) { helpers.key($this, _e.keyCode); _e.preventDefault(); }
                        });
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
                    $(_elt).addClass("touch"); setTimeout(function() { $(_elt).removeClass("touch"); }, 50);

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
                helpers.unbind($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            devcon: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devpanel").hide();
                settings.interactive = true;
            },
            devvar: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devmenu>div").removeClass("s");
                $this.find("#devvar").addClass("s");
                $this.find(".devpanel").hide();
                helpers.devmode.devvar.update($this);
            },
            devdef: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devmenu>div").removeClass("s");
                $this.find("#devdef").addClass("s");
                $this.find(".devpanel").hide();
                helpers.devmode.devdef.update($this);
            },
            devsto: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devmenu>div").removeClass("s");
                $this.find("#devsto").addClass("s");
                $this.find(".devpanel").hide();
                helpers.devmode.devsto.update($this);
            },
            devmode: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                var selected = $this.find("#devmenu .s").attr("id");
                if (selected && helpers.devmode[selected] && helpers.devmode[selected].update) { helpers.devmode[selected].update($this); }
                $this.find("#devcon").show();
                $this.find('#devpanel').show()
            },
            devexp: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devmenu>div").removeClass("s");
                $this.find("#devexp").addClass("s");
                $this.find(".devpanel").hide();
                var data = "";
                data+='"content":'+JSON.stringify(settings.content);
                data+=",";
                data+='"glossary":'+JSON.stringify(settings.glossary);
                $this.find("#devexppanel textarea").val(data);
                $this.find("#devexppanel").show();
            },
            devimp: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devmenu>div").removeClass("s");
                $this.find("#devimp").addClass("s");
                $this.find(".devpanel").hide();
                $this.find("#devimppanel").show();
            },
            import: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devmenu>div").removeClass("s");
                $this.find(".devpanel").hide();
                var data = $this.find("#devimppanel textarea").val();
                if (data[0]!='{') { data = '{'+data+'}'; }
                try { data = jQuery.parseJSON(data); } catch (e) { alert("[JSON ERROR] "+e.message); return; }
                $this.find("#devcon").hide();
                $this.find("#devimppanel textarea").val("");
                settings = $.extend({}, settings, data);
                settings.pc  = [];
                settings.data= {};
                helpers.settings($this, settings);
                
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in novel plugin!'); }
    };
})(jQuery);

