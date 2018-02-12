(function($) {
    // Plugin's default options
    var defaults = {
        name        : "sorting",                                // The activity name
        label       : "Sorting",                                // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        number      : 4,                                        // Number of exercices during the same session
        nbvalues    : 5,                                        // Number of values to be sorted
        showscore   : true,                                     // Show the score at the end
        debug       : true,                                     // Debug mode
        type        : "swap",                                   // swap: swap 2 elements, move: move all the elements for inserting
        len         : 1,                                        // text length (0:auto)
        bgcolor     : ["gray","rgba(255,252,246,0.9)"],         // question and response colors
        bg          : ["",""],                                  // background image
        color       : ["white","black"],
        font        : 1,
        fontex      : 0.7,
        errratio    : 0.5,
        background  : ""
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<span style='font-size:.6em;'>$1</span>",
        "\\\[icon\\\]([^\\\[]+)\\\[/icon\\\]",      "<div class='icon'><img src='$1'/></div>",
        "\\\[char\\\]([^\\\[]+)\\\[/char\\\]",      "<div class='char'><img src='$1'/></div>"
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
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
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
                if (settings.context.onload) { settings.context.onload($this); }

                // RESIZE THE TEMPLATE
                $this.find("#board").addClass(settings.type);
                $this.find("#splashex").addClass(settings.type);
                $this.find("#interactive>div").css("font-size",settings.font+"em");

                // DISPLAY STUFF
                if (settings.exercice) { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em").show();

                // LOCALE HANDLING
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                // ADD BACKGROUND
                if (settings.background) { $this.css("background-image","url("+settings.background+")"); }
                
                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        // Update the timer
        timer:function($this) {
            var settings = helpers.settings($this);
            settings.timer.value++;
            var vS = settings.timer.value%60;
            var vM = Math.floor(settings.timer.value/60)%60;
            var vH = Math.floor(settings.timer.value/3600);
            if (vH>99) { vS=99; vM=99; vH=99; }
            //$this.find("#time").text((vH<10?"0":"")+vH+(vM<10?":0":":")+vM+(vS<10?":0":":")+vS);
            if (settings.context.onSeconds) { settings.context.onSeconds(settings.timer.value); }
            settings.timer.id = setTimeout(function() { helpers.timer($this); }, 1000);
        },
        build:function($this) {
            var settings = helpers.settings($this);
            settings.elts   = [];
            settings.labels = [];

            $this.find("#submit").removeClass();

            // IS THERE MORE THAN ONE PAGE
            var vValues = settings.values;
            if (!settings.gen) {
                if ( ( $.isArray(vValues[0][0]) && settings.type=="swap") ||
                     ( $.isArray(vValues[0]) && settings.type=="move") ) {

                    settings.number = vValues.length;
                    vValues = vValues[settings.it%vValues.length];
                }
            }


            // GET AND COMPUTE THE VALUES
            var nbvalues = settings.nbvalues;
            if ((!(settings.gen) && (nbvalues>vValues.length)) || (nbvalues==-1) ) {
                nbvalues = vValues.length;
            }

            // BUILD THE REGEXP
            var vRegexpResp = (settings.regexp&&settings.regexp.response)?
                                new RegExp(settings.regexp.response.from, "g"):0;
            var vRegexpQuest= (settings.regexp&&settings.regexp.question)?
                                new RegExp(settings.regexp.question.from, "g"):0;

            // CREATE AN ELEMENT
            var last = 0;
            for (var i=0; i<nbvalues; i++) {
                var vValue;
                do {
                    if (settings.gen)  { vValue = eval('('+settings.gen+')')($this, settings, i); }
                    else {
                        if (nbvalues==vValues.length) { vValue = vValues[i]; }
                        else {
                            if (settings.type=="swap") { vValue = vValues[Math.floor(Math.random()*vValues.length)]; }
                            else {
                                var p = last + Math.floor(Math.random()*(vValues.length-last)/(nbvalues-i));
                                last = p+1;
                                vValue = vValues[p];
                            }
                        }
                    }
                    if (!$.isArray(vValue))
                        if (settings.type=="swap")  { vValue = [vValue, eval(vValue)]; }
                        else                        { vValue = [i+1,vValue]; }

                    var vAlreadyUsed = false;
                    for (var j=0; j<settings.elts.length; j++) { if (settings.elts[j][0]==vValue[0]) { vAlreadyUsed = true; } }
                }
                while (vAlreadyUsed);

                // MAKE A KIND OF COPY (IN ORDER TO NOT APPLY THE REGEXP MORE THAN ONCE ON THE SAME OBJECT REFERENCE)
                settings.elts.push([vValue[0],vValue[1],0]);
                settings.labels.push([vValue[0],vValue[1]]);
            }

            // RANDOM THE QUESTIONS (BUT NOT THE LABELS)
            for (var i=0; i<200; i++) {
                var vFirst = Math.floor(Math.random()*settings.elts.length);
                var vSecond = Math.floor(Math.random()*settings.elts.length);
                var vTmp = settings.elts[vFirst];
                settings.elts[vFirst] = settings.elts[vSecond];
                settings.elts[vSecond] = vTmp;
            }

            $this.find("#interactive #question").html("");
            for (var i=0; i<settings.elts.length; i++) {
                var vLabel = settings.labels[i][0];
                if (vRegexpQuest) { vLabel=vLabel.replace(vRegexpQuest, settings.regexp.question.to); }
                var html = "<div class='question' style='background-color:"+settings.bgcolor[0]+";color:"+settings.color[0]+";";
                if (settings.bg[0].length) { html+="background-image:url("+settings.bg[0]+");" }
                if (settings.len) { html+="width:"+settings.len+"em;"}
                html+="'>"+helpers.format(vLabel.toString())+"</div>";
                $this.find("#interactive #question").append(html);
            }

            $this.find("#interactive #response").html("");
            for (var i=0; i<settings.elts.length; i++) {
                var vValue = settings.elts[i][1];
                if (vRegexpResp) { vValue=vValue.replace(vRegexpResp, settings.regexp.response.to); }
                var html = "<div class='response' id='"+i+"'>"+
                           "<div style='background-color:"+settings.bgcolor[1]+";color:"+settings.color[1]+";";
                if (settings.bg[1].length) { html+="background-image:url("+settings.bg[1]+");" }
                html+="'>"+helpers.format(vValue.toString())+"</div></div>";
                $this.find("#interactive #response").append(html);

                settings.elts[i][2] = i;
            }

            $this.find(".response").draggable({containment:"parent", scroll:false, axis:"y", stack:".response",helper:"clone",
                start:function(event, ui) { $(this).addClass("switch"); },
                stop:function(event, ui) { $(this).removeClass("switch"); }
            });

            $this.find(".response").droppable({
                drop:function(e, ui) {
                    var eltId   = parseInt(ui.draggable.attr("id"));
                    var dropId  = parseInt($(this).attr("id"));

                    var posId   = parseInt(settings.elts[eltId][2]);
                    var parentId= parseInt(settings.elts[dropId][2]);

                    if (settings.type=="swap") {
                        settings.elts[eltId][2] = settings.elts[dropId][2];
                        settings.elts[dropId][2] = posId;

                        var html=$(this).html();
                        $(this).html(ui.draggable.html()).attr("id",eltId);
                        ui.draggable.html(html).attr("id",dropId);
                    }

                    else {
                        if (posId!=parentId) {

                            var moveup = (parentId>posId), min = moveup?posId:parentId+1, max = moveup?parentId-1:posId;
                            var vIds = [];
                            $this.find("#interactive .response").each(function() { vIds.push(parseInt($(this).attr("id"))); });
                            // UPDATE THE INDEX
                            for (var i=min; i<=max; i++) {
                                $($this.find("#interactive .response").get(i)).attr("id", vIds[i+(moveup?1:-1)]);
                            }
                            $($this.find("#interactive .response").get(parentId)).attr("id",eltId);

                            $this.find("#interactive .response").each(function(_index) {
                                var vId = $(this).attr("id");
                                if (vId) {
                                    $(this).children().first().html(helpers.format(settings.elts[vId][1]));
                                    settings.elts[vId][2] = _index;
                                }
                            });
                        }
                    }
                },
                hoverClass: "switch"
            });
            settings.interactive = true;
        }
    };


    // The plugin
    $.fn.sorting = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive : false,
                    timer: {                // the general timer
                        id      : 0,        // the timer id
                        value   : 0         // the timer value
                    },
                    labels      : [],       // elements not to sort
                    elts        : [],       // elements to sort
                    it          : 0,
                    wrong       : 0,
                    pageit      : 0
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);

                    var $settings = $.extend({}, defaults, options, settings);
                    if (settings.type=="match") { settings.mode==1; }

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
            check: function() {
                var settings = $(this).data("settings"), vGood = true, $this=$(this);
                if (settings.interactive) {

                    for (var i in settings.elts) {
                        var elt = $this.find("#interactive .response").get(i);
                        var id =  $(elt).attr("id");
                        // COMPARAISON IS DONE ON VALUES NOT ON INDEX BECAUSE VALUES MAY BE NOT UNIQUE
                        if (settings.labels[i][1]!=settings.elts[id][1]) {
                            vGood = false;
                            settings.wrong++;
                            $(elt).css("background-color","").addClass("wrong");
                        }
                        else { $(elt).css("background-color","").addClass("good"); }
                    }

                    $this.find("#submit").addClass(vGood?"good":"wrong");
                    settings.interactive = false;
                    if (++settings.it >= settings.number) {
                        settings.score = Math.floor(5-settings.errratio*settings.wrong);
                        if (settings.score<0) { settings.score = 0; }
                        clearTimeout(settings.timer.id);
                        setTimeout(function() { helpers.end($this); }, vGood?1000:2000);

                    }
                    else {
                        setTimeout(function() { helpers.build($this); }, vGood?1000:2000);
                    }
                }
            },
            next: function() {
                helpers.build($(this));
                helpers.timer($(this));
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in sorting plugin!'); }
    };
})(jQuery);

