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
        len         : [0,0],                                    // text length (0:auto)
        background  : ""
    };

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onQuit)  { ret = "mandatory callback onQuit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onQuit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onQuit({'status':'success', 'score':settings.score});
        },
        // Handle the elements sizes and show the activity
        resize: function($this) {
            var settings = helpers.settings($this);

            // SEND THE ONLOAD CALLBACK
            if (settings.context.onLoad) { settings.context.onLoad(false); }

            // RESIZE THE TEMPLATE
            $this.find("#board").addClass(settings.type);
            $this.css("font-size", Math.floor($this.height()/12)+"px");

            // LOCALE HANDLING
            $this.find("h1#label").html(settings.label);
            if (settings.exercice) { $this.find("#exercice").html(settings.exercice); }
            if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

            // ADD BACKGROUND
            $this.find("#background").css("background-image", "url('res/img/"+settings.background+"')");

            // Handle spash panel
            if (settings.nosplash) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            else                   { $this.find("#intro").show(); }
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
        // Load the different elements of the activity
        load: function($this) {
            var settings = helpers.settings($this);
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(true); }

            // Load the template
            var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
            $this.load( templatepath, function(response, status, xhr) {
                if (status=="error") {
                    settings.context.onQuit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                }
                else {
                    var cssAlreadyLoaded = false;
                    $("head").find("link").each(function() {
                        if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                    });

                    if(cssAlreadyLoaded) {
                        helpers.resize($this);
                    }
                    else {
                        // Load the css
                        $("head").append("<link>");
                        var css = $("head").children(":last");
                        var csspath = "activities/"+settings.name+"/"+settings.css+debug;
                        css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(function() {
                            helpers.resize($this);
                        });
                    }
                }
            });
        },
        build:function($this) {
            var settings = helpers.settings($this);
            $this.find("#interactive").html("").removeClass("inactive");
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

            // CREATE AN ELEMENT
            for (var i=0; i<settings.nbvalues; i++) {
                var vValue;
                do {
                    if (settings.gen)  { vValue = eval('('+settings.gen+')')(i); }
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

            // Build the table
            var vTable='<table>';
            for (var i=0; i<settings.elts.length; i++) {
                // QUESTION
                vTable+='<tr><td><div class="question" ';
                if (settings.len[0]) { vTable+='style="width:'+settings.len[0]+'em;" '; }
                vTable+='>'+settings.labels[i][0]+'</div></td>';

                var vValue = settings.elts[i][1];
                // HANDLE THE REGEXP
                if (vRegexpResp) { vValue=vValue.replace(vRegexpResp, settings.regexp.response.to); }

                // RESPONSE
                vTable+='<td class="dropzone" id="dz'+i+'"><div class="response" ';
                if (settings.len[1]) { vTable+='style="width:'+settings.len[1]+'em;" '; }
                vTable+='id="'+i+'">'+vValue+'</div></td></tr>';

                settings.elts[i][2] = i;
            }
            vTable+='</table>';
            $this.find("#interactive").append(vTable);

            // CENTER THE TABLE
            var margin = ($this.width() - $this.find("#interactive table").width())/2;
            $this.find("#interactive table").css("margin-left", margin+"px");

            // DISPLAY STUFF
            if (settings.exercice) { $this.find("#exercice").show(); }

            // HANDLE THE DRAGGABLE
            $this.find("#interactive .response").each(function(index) {
                $(this).draggable({
                    containment:'#interactive table', opacity: 0.95, scroll:false,
                    appendTo:'#interactive', axis:'y', stack:".response",
                    start:function(event, ui) { },
                    stop:function(event, ui) { $(this).css("top",0).css("left",0); },
                });
            });

            $this.find("#interactive .dropzone").each(function(index) {
                $(this).droppable({
                    drop: function(e, ui) {
                        var eltId   = parseInt(ui.draggable.attr("id"));
                        var posId   = parseInt(settings.elts[eltId][2]);
                        var drop    = $(this).children().get(0);
                        var dropId  = parseInt($(drop).attr("id"));
                        var parentId= settings.elts[dropId][2];

                        if (settings.type=="swap") {
                            settings.elts[eltId][2] = settings.elts[dropId][2];
                            settings.elts[dropId][2] = posId;

                            $(drop).detach().appendTo(ui.draggable.parent());
                            ui.draggable.detach().appendTo($(this));
                        }
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
                    },
                    hoverClass: 'drophover'
                });
            });
        }
    };


    // The plugin
    $.fn.sorting = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    finish          : false,
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
                    $(document).unbind("keypress");


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
                        helpers.load($this);
                    }
                });
            },
            check: function() {
                var settings = $(this).data("settings"), vGood = true, $this=$(this);
                if (!$this.find("#interactive").hasClass("inactive")) {

                    for (var i in settings.elts) {
                        var elt = $this.find("#interactive .response").get(i);
                        var id =  $(elt).attr("id");
                        // COMPARAISON IS DONE ON VALUES NOT ON INDEX BECAUSE VALUES MAY BE NOT UNIQUE
                        if (settings.labels[i][1]!=settings.elts[id][1]) {
                            vGood = false;
                            settings.wrong++;
                            $(elt).addClass("wrong");
                        }
                        else { $(elt).addClass("good"); }
                    }

                    $this.find("#submit").addClass(vGood?"good":"wrong");
                    $this.find("#interactive").addClass("inactive");
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
                $(this).find("#intro").hide();
                helpers.build($(this));
                helpers.timer($(this));
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in sorting plugin!'); }
    };
})(jQuery);

