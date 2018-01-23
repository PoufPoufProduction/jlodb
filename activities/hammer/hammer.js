(function($) {
    // Activity default options
    var defaults = {
        name        : "hammer",                            // The activity name
        label       : "Hammer",                            // The activity label
        template    : "template.html",                     // Activity's html template
        css         : "style.css",                         // Activity's css style sheet
        lang        : "en-US",                             // Current localization
        board       : "classic.html",                       // Board template
        exercice    : "",                                  // Exercice
        fontex      : 1,
        tags        : "",
        mode        : "default",
        totaltime   : 40,
        freq        : 1,
        goodfx      : false,
        background  : "",                                   // Background image
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
   
    var chars = {
        bunny : { type: "default", src:["res/img/ppvc/bunny01.svg", "res/img/ppvc/bunny03.svg", "res/img/ppvc/bunny02.svg"] },
        lizzie: { type: "default", src:["res/img/ppvc/lizzie01.svg","res/img/ppvc/lizzie04.svg","res/img/ppvc/lizzie03.svg"] },
        lottie: { type: "default", src:["res/img/ppvc/lottie01.svg","res/img/ppvc/lottie04.svg","res/img/ppvc/lottie02.svg"] },
        blueball: { type:"default", src:["res/img/asset/balls/blue01.svg", "res/img/asset/balls/blue02.svg", "res/img/asset/balls/blue02.svg"] },
        redball: { type:"default", src:["res/img/asset/balls/red01.svg", "res/img/asset/balls/red02.svg", "res/img/asset/balls/red02.svg"] },
        greenball: { type:"default", src:["res/img/asset/balls/green01.svg", "res/img/asset/balls/green02.svg", "res/img/asset/balls/green02.svg"] },
        purpleball: { type:"default", src:["res/img/asset/balls/purple01.svg", "res/img/asset/balls/purple02.svg", "res/img/asset/balls/purple02.svg"] }
    };
    
    var srcs = {
        bubble: [ "res/img/default/background/ball01.svg", "res/img/default/background/ball02.svg", "res/img/default/background/ball03.svg"]
    }

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
            settings.context.onquit($this,{'status':'success','score':Math.max(0,settings.score)});
        },
        // End all timers
        quit: function($this) {
            var settings = helpers.settings($this);
            if (settings.timerid) { clearTimeout(settings.timerid); }
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.board($this); });
            },
            board: function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                // Load the template
                var templatepath = "activities/"+settings.name+"/template/"+settings.board+debug;
                $this.find("#board").load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                
                
                
                // Prepare sprite packs
                var firstpack="";
                for (var p in settings.sprdata) {
                    if (!firstpack) { firstpack=p; }
                    settings.totalweight[p] = 0;
                    var pack = settings.sprdata[p];
                    for (var e in pack) {
                        pack[e]=$.extend(
                            { weight:1 }, (chars[e]?chars[e]:{}), pack[e]);
                        
                        pack[e].$img=[];
                        
                        if (srcs[pack[e].src]) { pack[e].src = srcs[pack[e].src]; }
                        
                        if ($.isArray(pack[e].src)) {
                            for (var s in pack[e].src) { pack[e].$img.push($("<img src='"+pack[e].src[s]+"'/>")); }
                        }
                        else for (var s=0; s<3; s++) { pack[e].$img.push($("<img src='"+pack[e].src+"'/>")); }
                        
                        if (pack[e].type=="embed") {
                            pack[e].$embed = $("<img src='"+
                                (pack[e].embed?pack[e].embed:"res/img/ppvc/sign01.svg")+"' alt=''/>"); }
                        
                        settings.totalweight[p]+=pack[e].weight;
                    }
                }
                
                // Handle holes
                if (typeof(settings.holes)=="string") {
                    switch(settings.holes) {
                        case "classic" : settings.holes = {
                            p00:{ pack:firstpack, anim:{top:[0.5,-0.28,-0.28,0.5]}, clickanim:{top:0.5},
                                  duration:[4,1]},
                            p10:"p00", p20:"p00", p30:"p00",
                            p01:"p00", p11:"p00", p21:"p00", p31:"p00",
                            p02:"p00", p12:"p00", p22:"p00", p32:"p00"
                            };
                            break
                        case "classic_6" : settings.holes = {
                            p00:{ pack:firstpack, anim:{top:[0.5,-0.28,-0.28,0.5]}, clickanim:{top:0.5},
                                  duration:[4,1]},
                            p10:"p00", p20:"p00", p01:"p00", p11:"p00", p21:"p00"
                            };
                            break
                        case "classic_3" : settings.holes = {
                            p00:{ pack:firstpack, anim:{top:[0.5,-0.28,-0.28,0.5]}, clickanim:{top:0.5},
                                  duration:[4,1]},
                            p10:"p00", p20:"p00"
                            };
                            break
                        case "simple": settings.holes = {
                            p00:{ pack:firstpack, anim:{opacity:[0,1,1,0]}, clickanim:{opacity:0}, duration:[4,1]},
                            p10:"p00", p20:"p00", p30:"p00",
                            p01:"p00", p11:"p00", p21:"p00", p31:"p00",
                            p02:"p00", p12:"p00", p22:"p00", p32:"p00"
                            };
                            break
                    };
                    
                }
                for (var h in settings.holes) {
                    var hole = settings.holes[h];
                    if (typeof(hole == "string" ) && settings.holes[hole]) {
                        settings.holes[h]=$.extend({}, settings.holes[hole]);
                    }
                    if (!hole.duration) { hole.duration = [4,1]; }
                    settings.emptyholes.push(h);
                }
                for (var i=0;i<5;i++) { settings.emptyholes.sort(function() { return Math.random()<0.5; }); }
               
                if (settings.tag) {
                    var value = settings.tag;
                    if (value.toString().indexOf(".svg")!=-1) { value = "<img src='"+value+"'/>"; }
                    if (settings.fonttag) {
                        var m = (1-settings.fonttag)/(2*settings.fonttag);
                        value="<div style='margin-top:"+m+"em;font-size:"+settings.fonttag+"em;'>"+value+"</div>";
                    }
                    else { value = "<div>"+value+"</div>"; }
                    $this.find("#tag").html(value).show();
                }
                
                $this.find(".touch").bind("mousedown touchstart", function(event){
                    if (settings.interactive) { helpers.touch($this,$(this).attr("id").substr(1)); }
                    event.preventDefault();
                });

                // Exercice
                $this.find("#exercice>div").html(helpers.format(settings.exercice))
                                               .css("font-size",settings.fontex+"em");

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        run: function($this) {
            var settings = helpers.settings($this);
            var d = Date.now();
            settings.timerid = 0;
            
            // CHECK ELT EVERY 100 ms
            if (d-settings.time.last>100 && d-settings.time.begin<settings.totaltime*1000) {
                if (settings.emptyholes.length &&
                    Math.random()*((d-settings.time.begin)/(settings.freq*1000)-settings.total)>0.5) {
                    
                    // Choose hole and sprite element
                    var holeid  = settings.emptyholes.pop();
                    var hole    = settings.holes[holeid];
                    var pack    = settings.sprdata[hole.pack];
                    var w       = Math.random()*settings.totalweight[hole.pack];
                    var wi      = 0;
                    var elt;
                    for (elt in pack) { wi+=pack[elt].weight; if (wi>w) { break; } }

                    // Build sprite
                    var sprite = $.extend({type:"default"}, pack[elt],
                                    { clicked: false, inpos:false, begin: d, hole:hole, current:{opacity:1} });
                    sprite.$html=$("<div class='icon "+sprite.type+"' id='p"+holeid+"'></div>");
                    for (var arg in hole.anim) {
                        switch(arg) {
                            case "top"      : sprite.$html.css("top",hole.anim[arg][0]+"em"); break;
                            case "left"     : sprite.$html.css("left",hole.anim[arg][0]+"em"); break;
                            case "opacity"  : sprite.$html.css("opacity",hole.anim[arg][0]); break;
                        }
                    }
                    var legend = sprite.legend;
                    if (sprite.gen) {
                        var gen = eval('('+sprite.gen+')')($this,settings);
                        if (typeof(gen.legend)!="undefined")     { legend = gen.legend.toString(); }
                        if (gen.alignment)  { sprite.alignment = gen.alignment; }
                        if (gen.src)        {
                            sprite.src=[];
                            sprite.$img=[];
                            if ($.isArray(gen.src)) {
                                for (var s in gen.src) {
                                    sprite.src.push(gen.src[s]);
                                    sprite.$imgpush($("<img src='"+gen.src[s]+"'/>"));
                                }
                            }
                            else for (var s=0; s<3; s++) {
                                sprite.src.push(gen.src);
                                sprite.$imgpush($("<img src='"+gen.src+"'/>")); 
                            }
                        }
                    }
                    if (legend) {
                        if (legend.indexOf(".svg")!=-1) { } else
                        if (legend.indexOf("<svg")!=-1) { } else {
                            legend ="<div class='legend'>"+legend+"</div>";
                        }
                    }
                    switch(sprite.type) {
                        case "embed" :
                            var $label = $("<div class='label'></div>");
                            if (sprite.src) { $label.append(sprite.$img[0].clone().addClass("toggle")); }
                            if (legend)     { $label.append(legend); }
                            sprite.$html.append(sprite.$embed.clone()).append($label);
                            break;
                        default:
                            if (sprite.src) { sprite.$html.append(sprite.$img[0].clone().addClass("toggle")) };
                            if (legend)     { sprite.$html.append(legend); }
                            break;
                    }
                    if (!sprite.noclickable) {
                        sprite.$html.bind("touchstart mousedown", function(event) {
                            helpers.touch($this, $(this).attr("id").substr(1));
                        });
                    }
                    
                    $this.find("#"+holeid).append(sprite.$html);
                    settings.sprites[holeid] = sprite;

                    settings.total++;
                }
                settings.time.last = d;
            }
            
            // HANDLE ACTIVE SPRITES
            var attrs=["top","left","opacity"];
            var empty=true;
            for (var s in settings.sprites) {
                var sprite = settings.sprites[s];
                if (sprite) {
                    empty=false;
                    if (sprite.clicked) {
                        var alpha = (d-sprite.begin)/(sprite.hole.duration[1]*1000);
                        
                        for (var a in attrs) {
                            if (typeof(sprite.hole.clickanim[attrs[a]])!="undefined") {
                                var attr    = sprite.hole.clickanim[attrs[a]];
                                var value   = sprite.current[attrs[a]]*(1-alpha)+alpha*attr;
                                switch(attrs[a]) {
                                    case "top"      : sprite.$html.css("top",value+"em"); break;
                                    case "left"     : sprite.$html.css("left",value+"em"); break;
                                    case "opacity"  : sprite.$html.css("opacity",value); break;
                                }
                            }
                        }
                    }
                    else {
                        var alpha = (d-sprite.begin)/(sprite.hole.duration[0]*1000);
                        
                        for (var a in attrs) {
                            if (sprite.hole.anim[attrs[a]]) {
                                var attr    = sprite.hole.anim[attrs[a]];
                                var nb      = attr.length-1;
                                var stepid  = Math.min(nb-1,Math.floor(alpha*nb));
                                var offset  = Math.min(1,alpha*nb-stepid);
                                
                                var value   = attr[stepid]*(1-offset)+offset*attr[stepid+1];
                                sprite.current[attrs[a]]=value;
                                
                                switch(attrs[a]) {
                                    case "top"      : sprite.$html.css("top",value+"em"); break;
                                    case "left"     : sprite.$html.css("left",value+"em"); break;
                                    case "opacity"  : sprite.$html.css("opacity",value); break;
                                }
                            }
                        }
                    }
                    
                    if (alpha>=1) {
                        var vAlign = sprite.alignment;
                        if (!sprite.clicked) {
                            if (vAlign=="good") {
                                $this.find(".fx#w"+s).css("opacity",1).show().animate({opacity:0},400,function(){$(this).hide(); });
                                settings.score--;
                            }
                            else if (vAlign="wrong" && settings.goodfx) {
                                $this.find(".fx#g"+s).css("opacity",1).show().animate({opacity:0},400,function(){$(this).hide(); });
                            }
                        }
                
                        sprite.$html.detach();
                        settings.sprites[s] = 0;
                        settings.emptyholes.push(s);
                        for (var i=0;i<5;i++) { settings.emptyholes.sort(function() { return Math.random()<0.5; }); }
                    }
                    
                }
            }
            
            if ( settings.score<=0 ||
                ( d-settings.time.begin>settings.totaltime*1000 && empty ) ) {
                settings.interactive = false;
                setTimeout(function() { helpers.end($this); }, 500);
            }
            else { settings.timerid = setTimeout(function() { helpers.run($this); }, 5); }
        },
        touch: function($this, _holeid) {
            var settings = helpers.settings($this);
            var d = Date.now();
            var sprite = settings.sprites[_holeid];
            if (sprite && !sprite.clicked) {
                sprite.begin=d;
                sprite.clicked=true;
                
                var vAlign = sprite.alignment;
                if (vAlign=="wrong") {
                    sprite.$html.addClass("wrong");
                    sprite.$html.find(".toggle").replaceWith(sprite.$img[2].clone());
                    settings.score--;
                    $this.find(".fx#w"+_holeid).css("opacity",1).show().animate({opacity:0},400,function(){$(this).hide(); });
                }
                else if (vAlign=="good") {
                    sprite.$html.addClass("good");
                    sprite.$html.find(".toggle").replaceWith(sprite.$img[1].clone());
                    $this.find(".fx#g"+_holeid).css("opacity",1).show().animate({opacity:0},400,function(){$(this).hide(); });
                }
            }
        }
    };

    // The plugin
    $.fn.hammer = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    totalweight     : {},
                    total           : 0,
                    score           : 5,
                    time            : { begin : 0, last : 0, newelt : 0 },
                    timerid         : 0,
                    emptyholes      : [],
                    sprites         : {}
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
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#countdown").show().animate({left:"75%"},500, function() {
                    setTimeout(function() { $this.find("#countdown").html(3); }, 0);
                    setTimeout(function() { $this.find("#countdown").html(2); }, 1000);
                    setTimeout(function() { $this.find("#countdown").html(1); }, 2000);
                    setTimeout(function() {
                        $this.find("#countdown").animate({left:"120%"},500, function() {
                            settings.interactive = true;
                            $(this).hide();
                            settings.time.begin = Date.now();
                            helpers.run($this);
                        });
                    }, 3000);
                });
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in hammer plugin!'); }
    };
})(jQuery);

