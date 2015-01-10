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
        nbpages     : 0,                                        // number of values arrays (0 for no array but element)
        len         : 1,                                        // text length (0:auto)
        bgcolor     : ["gray","rgba(255,252,246,0.9)"],    // question and response colors
        bg          : ["",""],                                  // background image
        color       : ["white","black"],
        font        : 1,
        fontex      : 0.7,
        background  : ""
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
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
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
                if (settings.context.onload) { settings.context.onload($this); }

                // RESIZE THE TEMPLATE
                $this.find("#board").addClass(settings.type);
                $this.css("font-size", Math.floor($this.height()/12)+"px");
                $this.find("#interactive>div").css("font-size",settings.font+"em");

                // DISPLAY STUFF
                if (settings.exercice) { $this.find("#exercice").html(settings.exercice); }
                $this.find("#exercice").css("font-size",settings.fontex+"em").show();

                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                // ADD BACKGROUND
                $this.find("#background").css("background-image", "url('res/img/"+settings.background+"')");
                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
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
            if (!(settings.gen) && $.isArray(vValues[0][0])) {
                settings.nbpages = vValues.length;
                vValues = vValues[settings.pageit];
            }

            // GET AND COMPUTE THE VALUES
            if (!(settings.gen) && (settings.nbvalues>vValues.length) || (settings.type=="move")) {
                settings.nbvalues = vValues.length;
                settings.number = 1;
            }

            // BUILD THE REGEXP
            var vRegexpResp = (settings.regexp&&settings.regexp.response)?
                                new RegExp(settings.regexp.response.from, "g"):0;
            var vRegexpQuest= (settings.regexp&&settings.regexp.question)?
                                new RegExp(settings.regexp.question.from, "g"):0;

            // CREATE AN ELEMENT
            for (var i=0; i<settings.nbvalues; i++) {
                var vValue;
                do {
                    if (settings.gen)  { vValue = eval('('+settings.gen+')')(i,settings.elts); }
                    else {
                        if (settings.nbvalues==vValues.length) { vValue = vValues[i]; }
                        else { vValue = vValues[Math.floor(Math.random()*vValues.length)]; }
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
                html+="'>"+vLabel+"</div>";
                $this.find("#interactive #question").append(html);
            }

            $this.find("#interactive #response").html("");
            for (var i=0; i<settings.elts.length; i++) {
                var vValue = settings.elts[i][1];
                if (vRegexpResp) { vValue=vValue.replace(vRegexpResp, settings.regexp.response.to); }
                var html = "<div class='response' id='"+i+"'>"+
                           "<div style='background-color:"+settings.bgcolor[1]+";color:"+settings.color[1]+";";
                if (settings.bg[1].length) { html+="background-image:url("+settings.bg[1]+");" }
                html+="'>"+vValue+"</div></div>";
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
                    var parentId= settings.elts[dropId][2];

                    if (settings.type=="swap") {
                        settings.elts[eltId][2] = settings.elts[dropId][2];
                        settings.elts[dropId][2] = posId;

                        var html=$(this).html();
                        $(this).html(ui.draggable.html()).attr("id",eltId);
                        ui.draggable.html(html).attr("id",dropId);;
                    }
                    /*
                    else {
                            if (posId!=parentId) {
                                var moveup = (parentId>posId), min = moveup?posId+1:parentId, max = moveup?parentId:posId;

                                // UPDATE THE INDEX
                                for (var i=min; i<=max; i++) {
                                    var j=i+ (moveup?-1:1);
                                    var other   = $this.find("#interactive .response").get(i);
                                    var otherId = parseInt($(other).attr("id"));
                                    settings.elts[otherId][2] = j;
                                }
                                settings.elts[eltId][2]=parentId;

                                // REBUILD THE ELEMENTS
                                for (var i in settings.elts) {
                                    $this.find("#interactive .response#"+i).detach()
                                        .appendTo($this.find("#interactive #dz"+settings.elts[i][2]));
                                }

                            }
                        }
                      */
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
                        if ($settings.class) { $this.addClass($settings.class); }
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
                        settings.score = Math.floor(5-settings.wrong/2);
                        if (settings.score<0) { settings.score = 0; }
                        clearTimeout(settings.timer.id);
                        setTimeout(function() { helpers.end($this); }, vGood?1000:2000);

                    }
                    else {
                        if (settings.nbpages) { settings.pageit = (settings.pageit+1)%settings.nbpages; }
                        setTimeout(function() { helpers.build($this); }, vGood?1000:2000);
                    }
                }
            },
            next: function() {
                $(this).find("#splash").hide();
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

