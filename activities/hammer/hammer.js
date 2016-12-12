(function($) {
    // Activity default options
    var defaults = {
        name        : "hammer",                            // The activity name
        label       : "Hammer",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        fontex      : 1,
        tags        : "",
        mode        : "default",
        totaltime   : 40,
        freq        : 1,
        duration    : 4,
        animation   : 1,
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
   
    var predefined = {
        bunny       : { type: "img", src:"ppvc/bunny01",    wrong:"ppvc/bunny02",   good:"ppvc/bunny03" },
        lizzie      : { type: "img", src:"ppvc/lizzie01",   wrong:"ppvc/lizzie03",  good:"ppvc/lizzie04" },
        lottie      : { type: "img", src:"ppvc/lottie01",   wrong:"ppvc/lottie02",  good:"ppvc/lottie04" },
        blueball    : { type: "img", src:"balls/blue01",    wrong:"balls/gray02",   good:"balls/blue02" },
        redball     : { type: "img", src:"balls/red01",     wrong:"balls/gray02",   good:"balls/red02" },
        greenball   : { type: "img", src:"balls/green01",   wrong:"balls/gray02",   good:"balls/green02" },
        purpleball  : { type: "img", src:"balls/purple01",  wrong:"balls/gray02",   good:"balls/purple02" }
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", ($this.height()/12)+"px");
                $this.addClass(settings.mode);

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                var arr=["good","wrong"];
                for (var j in arr) {
                    for (var i in settings[arr[j]]) {
                        var elt = $.extend({},predefined[settings[arr[j]][i]]?predefined[settings[arr[j]][i]]:settings[arr[j]][i],true);
                        if (typeof(elt)=="string") { alert("Error: "+elt+" unknown"); } else {
                            if (elt.type=="sig") { elt.src = "ppvc/sign01"; }
                            if (elt.src)        { elt.$src = $("<img src='res/img/"+elt.src+".svg'/>"); }
                            if (elt[arr[j]])    { elt.$src2 = $("<img src='res/img/"+elt[arr[j]]+".svg'/>"); }
                            settings.elt[arr[j]].push(elt);
                        } 
                    }
                }
                
                if (settings.tag) {
                    $this.find("#tag").html(
                        settings.tag.toString().indexOf(".svg")!=-1?"<img src='res/img/"+settings.tag+"'/>":"<div>"+settings.tag+"</div>").show();
                }
                
                $this.bind("mousedown touchstart", function(event){
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                  event.originalEvent.touches[0]:event;

                    if (settings.interactive) {
                        var x = ((vEvent.clientX-$this.offset().left)/$this.width() - 0.02)/0.218;
                        var y = ((vEvent.clientY-$this.offset().top)/$this.height() - 0.12)/0.295;
                        var ok = true;
                        
                        if (settings.mode=="default")
                        {
                            var xx = Math.floor(x*100)%100;
                            ok = (xx>=18) && (xx<=82);
                            y+=0.3;
                        }
                        x=Math.floor(x); y=Math.floor(y);
                        if (ok && x>=0 && x<4 && y>=0 && y<3) {
                            var e = settings.grid[x+y*4];
                            if (e && !e.clicked) {
                                e.clicked = true;
                                if (e.from=="good") { $fx = $this.find("#g"+x.toString()+y.toString()).show(); }
                                else                { $fx = $this.find("#w"+x.toString()+y.toString()).show(); settings.score--; }
                                e.$html.addClass(e.from);
                                var now     = Date.now();
                                var delta   = Math.max(0,settings.animation*1000-(now-e.begin),(now-e.begin)-(settings.duration-settings.animation)*1000);
                                e.begin = Date.now()-(settings.duration-settings.animation)*1000-delta;
                                
                                switch(e.type) {
                                    case "img" :
                                        if (e.$src2) {
                                            e.$html.find("img").detach();
                                            e.$html.append(e.$src2);
                                        }
                                        break;
                                }
                                
                                setTimeout(function() { $fx.hide(); } , 200);
                            }
                            
                        }
                    }
                    event.preventDefault();
                });

                // Exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) { $this.find("#exercice>div").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&#xA0;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        run: function($this) {
            var settings = helpers.settings($this);
            var d = Date.now();
            settings.timerid = 0;
            
            // CHECK ELT EVERY 100 ms
            if (d-settings.time.last>100 && d-settings.time.begin<settings.totaltime*1000) {
                if (settings.count<12 && Math.random()*((d-settings.time.begin)/(settings.freq*1000)-settings.total)>0.5) {
                    var from = "good";
                    if (settings.elt.wrong.length) { from = Math.random()>0.5?"wrong":"good"; }
                    var elt=settings.elt[from][Math.floor(Math.random()*settings.elt[from].length)];
                    var to = -1;
                    do { to =Math.floor(Math.random()*12); } while (settings.grid[to]!=0);
                    var e = { type:elt.type, from:from, begin:d, clicked:false, inpos:false };
                    e.$html=$("<div class='icon'></div>");
                    
                    var top= Math.floor(to/4)+(settings.mode=="default"?0.52:0);
                    e.$html.css("z-index",Math.floor(to/4))
                           .css("top",top+"em")
                           .css("left",(to%4)+"em");
                    switch(e.type) {
                        case "img" :
                            e.$html.append(elt.$src.clone());
                            if (elt.$src2) { e.$src2 = elt.$src2.clone(); }
                            break;
                        case "txt" :
                            var value = elt.value;
                            if (elt.gen) { value = eval('('+elt.gen+')')(); }
                            if (value.toString().indexOf(".svg")!=-1) { value = "<img src='res/img/"+value+"'/>"; }
                            e.$html.addClass("text").append("<div>"+value+"</div>");
                            break;
                        case "sig" :
                            var value = elt.value;
                            if (elt.gen) { value = eval('('+elt.gen+')')(); }
                            if (value.toString().indexOf(".svg")!=-1) { value = "<img src='res/img/"+value+"'/>"; }
                            e.$html.append(elt.$src.clone()).append("<div class='label'>"+value+"</div>");
                            break;
                    }
                    $this.find("#elts").append(e.$html);
                    settings.grid[to] = e;
                    
                    settings.count++;
                    settings.total++;
                }
                settings.time.last = d;
            }

            for (var i=0; i<12; i++) if (settings.grid[i]) {
                var e = settings.grid[i];
                var still = (settings.duration*1000-(d-e.begin));
                var alpha = Math.min((d-e.begin)/(settings.animation*1000), still/(settings.animation*1000));
                if (settings.mode=="default") {
                    if (alpha<1)     { e.$html.css("top",(Math.floor(i/4)+0.52*(1-alpha)-0.25*alpha)+"em"); } else
                    if (!e.inpos)    { e.$html.css("top",(Math.floor(i/4)-0.25)+"em"); e.inpos = true; }
                }
                else {
                    if (alpha<1)     { e.$html.css("opacity",alpha); } else
                    if (!e.inpos)    { e.$html.css("opacity",1); e.inpos = true; }
                }

                if (still<=0) { 
                    e.$html.detach(); settings.count--; settings.grid[i] = 0;
                    if (e.from=="good" && !e.clicked) { 
                        settings.score--;
                        var $fx = $this.find("#w"+(i%4).toString()+Math.floor(i/4).toString());
                        $fx.show();
                        setTimeout(function() { $fx.hide(); } , 200);
                    }
                }
            }
            
            if (settings.score<=0 || (d-settings.time.begin>settings.totaltime*1000 && settings.count==0)) {
                settings.interactive = false;
                setTimeout(function() { helpers.end($this); }, 500);
            }
            else { settings.timerid = setTimeout(function() { helpers.run($this); }, 5); }
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
                    elt             : { good:[], wrong:[] },
                    grid            : [0,0,0,0,0,0,0,0,0,0,0,0],
                    total           : 0,
                    count           : 0,
                    score           : 5,
                    time            : { begin : 0, last : 0, newelt : 0 },
                    timerid         : 0
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
                settings.interactive = true;
                settings.time.begin = Date.now();
                settings.timerid = setTimeout(function() { helpers.run($this); }, 500);
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

