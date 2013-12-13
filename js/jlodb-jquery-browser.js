(function($) {
    // Activity default options
    var defaults = {
        template        : "browser.html",                           // Activity's html template
        css             : "style.css",                              // Activity's css style sheet
        lang            : "en-US",                                  // Current localization
        classification  : 0,                                        // Classification tree
        activities      : 0,                                        // Activitie list
        debug           : true                                      // Debug mode
    };

    // private methods
    var helpers = {
        getNodeFromJSON: function(_root,_id) {
            var ret = {parent:0, node:0};
            if (_root.attr("id")==_id) { ret= {parent:0, node:_root}; }
            else {
                if (_root.attr("children")) {
                    for (var i=0; i<_root.attr("children").length; i++) {
                        ret = helpers.getNodeFromJSON($(_root.attr("children")[i]), _id);
                        if (ret.node) {
                            if (!ret.parent) { ret.parent = _root; }
                            break;
            }   }   }   }
            return ret;
        },
        getSubNodes: function(_obj) {
            var ret="'"+_obj.attr("id")+"'";
            if (_obj.attr("children")) {
                for (var i=0; i<_obj.attr("children").length; i++) {
                    ret += ","+helpers.getSubNodes($(_obj.attr("children")[i]));
                }
            }
            return ret;
        },
        // Load the different elements of the activity
        loadTemplate: function($this) {
            var settings = $this.data("settings");
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            // Load the template
            var templatepath = "locale/"+settings.lang+"/"+settings.template+debug;
            $this.load( templatepath, function(response, status, xhr) {
                if (status!="error") {
                    if (!settings.classification) {
                        $.getJSON("locale/"+settings.lang+"/classification.json", function(data) {
                            settings.classification = $(data);
                            helpers.loadActivities($this);
                        });
                    }
                    else { helpers.loadActivities($this); }
                }
            });
        },
        loadActivities: function($this) {
            var settings = $this.data("settings");
            if (settings.activities) { helpers.loadTags($this); } else {
                $.getJSON("api/activities.php", function (data) { settings.activities = data.activities; helpers.loadTags($this); });
            }
        },
        loadTags: function($this) {
            var settings = $this.data("settings");
            $.getJSON("api/tags.php", function (data) { settings.tags = data.tags; helpers.build($this); });
        },
        updateSlider: function($this,_cursor) {
            var settings = $this.data("settings");

            var $slide          = $(_cursor).parent();
            var vWidthCursor    = $(_cursor).width();
            var vWidthBar       = $slide.width()-vWidthCursor;
            var vLeft           = $slide.offset().left;
            var $min            = $slide.find("#min");
            var $max            = $slide.find("#max");
            var l1              = $min.offset().left-vLeft;
            var l2              = $max.offset().left-vLeft;

            var val             = 1+Math.floor((l1/vWidthBar)*settings.sliders[$slide.attr("id")]);
            $min.html((val<=settings.sliders[$slide.attr("id")])?val:settings.sliders[$slide.attr("id")]);

            val = 1+Math.floor((l2/vWidthBar)*settings.sliders[$slide.attr("id")])
            $max.html((val<=settings.sliders[$slide.attr("id")])?val:settings.sliders[$slide.attr("id")]);

            if (l1>l2) { var l=l1; l1=l2; l2=l; }
            $(_cursor).parent().find(".bar").width((l2-l1+vWidthCursor)+"px").css("margin-left",l1+"px");
        },
        buildSliders: function($this) {
            var settings = $this.data("settings");
            // HANDLE THE SLIDERS
            $("#patab .slide .cursor").each(function() {
                $(this).draggable({ axis:"x", containment:"parent",
                    drag:function() { helpers.updateSlider($this, this);
                        },
                    stop:function(event,ui) { helpers.updateSlider($this, this); helpers.update($this);}
                });
                helpers.updateSlider($this, this);

            });
        },
        buildClassification: function($this) {
            var settings = $this.data("settings");
            var node = helpers.getNodeFromJSON(settings.classification, settings.classId);
            $("#ontab .content").html("");
            $("#ontab .label").html(node.node.attr("label"));
            if (node.parent) {
                var html="<div class='elt' onclick=\"$(this).closest('.browser').browser('classification','"+
                         node.parent.attr("id")+"',false);\"><div class='icon'  >"+"<img src='res/img/classification/up.svg'/></div><div class='l'></div></div>";
                $("#ontab .content").append(html);
            }
            $(node.node.attr("children")).each(function() {
                var html="<div class='elt' onclick=\"$(this).closest('.browser').browser('classification','"+this.id+"',false);\"><div class='icon' >"+
                         "<img src='res/img/classification/"+this.id+".svg'/></div><div class='l'>"+this.label+"</div></div>";
                $("#ontab .content").append(html);
            });
        },
        buildActivities: function($this) {
            var settings = $this.data("settings");
            var nbrows   = 4;
            var reg      = new RegExp("(')" ,"g");
            var nbcols   = Math.ceil(settings.activities.length/nbrows);
            var html     = "<table>";
            for (var i=0; i<nbcols*nbrows; i++) {
                if (i%nbcols==0) { html+="<tr>"; }
                html+="<td>";
                var actid = (i%nbcols)*nbrows+Math.floor(i/nbcols);
                if (actid<settings.activities.length) {
                    html+="<div  class='elt'><div class='icon' id='"+settings.activities[actid].id+"' " +
                        "onclick=\"$(this).toggleClass('s');$(this).closest('.browser').browser('update');\" >"+
                        "<img src='res/img/activity/"+settings.activities[actid].id+".svg'/></div></div>";
                }
                html+="</td>";
                if (i%nbcols==nbcols-1) { html+="</tr>"; }
            }
            html+="</table>";
            $("#jbrowser #actab").html(html);
        },
        buildTags: function($this) {
            var settings = $this.data("settings");
            for (var t in settings.tags) {
                $this.find("#tags").append("<option value='"+t+"'>"+settings.tags[t]+"</option>");
            }
        },
        buildExercices: function($this, data) {
            var settings = $this.data("settings");
            $this.find("#jresults table tr.data").remove();
            $this.find("#jcount").html(data.nb);

            for (var i=0; i<data.exercices.length; i++) {
                var e=data.exercices[i];
                var html="<tr class='data'>";
                html+="<td><div class=";
                if (e.nb) { html+="'c7 s' onclick=\"$(this).closest('.browser').browser('setid','"+e.id+"');\">"+(parseInt(e.nb)+1); }
                else if (e.variant) { html+="'c7 s' onclick=\"$(this).closest('.browser').browser('setid','"+e.variant+"');\">^"; }
                else { html+="'c7'>"; }
                html+="</div></td>";
                html+="<td><div class='c0' "+
                      "onclick=\"$(this).closest('.browser').browser('click',this);\">"+e.id+"</div></td>";
                html+="<td><div class='c1' onclick=\"$(this).closest('.browser').browser('classification','"+e.classification+"',true);\"><img src='res/img/classification/"+e.classification+".svg'/></div></td>";
                html+="<td><div class='c2' onclick=\"$(this).closest('.browser').browser('activity','"+e.activity+"');\"><img src='res/img/activity/"+e.activity+".svg'/></div></td>";
                html+="<td><div class='c3'>"+e.label+"</div></td>";
                html+="<td><div class='c4'>"+e.level+"</div></td>";
                html+="<td><div class='c5'><img src='res/img/star/star"+e.diff+".svg'/></div></td>";
                html+="<td><div class='c6'>"+e.extend+"</div></td>";
                html+="</tr>";
                $this.find("#jresults table").append(html);
            }

        },
        buildPopup: function($this) {
            var settings = $this.data("settings");
            for (var i in settings.context) { $this.find("#jpopup").
                append("<div onclick=\"$(this).closest('.browser').browser('callback','"+i+"');\">"+i+"</div>"); }
        },
        build: function($this) {
            var settings = $this.data("settings");
            helpers.buildActivities($this);
            helpers.buildClassification($this);
            helpers.buildTags($this);
            helpers.buildPopup($this);
            helpers.submit($this, function() { $this.find("#jbrowser").show(); helpers.buildSliders($this);}, true);
        },
        update: function($this) { $this.addClass("upd"); },
        submit: function($this, _fct, _force) {
            var settings = $this.data("settings");
            if (_force || ($this.hasClass("upd") && parseInt($this.find("#level div#max").html()))) {

                //GET THE ACTIVITIES
                var activities = "";
                $this.find("#actab .icon.s").each(function() {
                    if (activities.length) { activities+=","; } else { activities="&activity="; }
                    activities+="'"+$(this).attr("id")+"'";
                });

                //GET THE CLASSIFICATION
                var classification = "";
                var recursive = $this.find("#ontab .label").hasClass("s");

                if (settings.classId!="root" || !recursive) {
                    if (recursive) {
                        var node = helpers.getNodeFromJSON(settings.classification, settings.classId);
                        classification = "&classification="+helpers.getSubNodes(node.node)+"";
                    }
                    else {
                        classification = "&classification='"+settings.classId+"'";
                    }
                }

                //GET THE SLIDERS VALUES
                var sliders = "";
                if ($this.find("#jbrowser").is(':visible')) {
                for (var slide in settings.sliders) {
                    var vMin = parseInt($this.find("#"+slide+" #min").html());
                    var vMax = parseInt($this.find("#"+slide+" #max").html());
                    if (vMin>vMax) { var vTmp = vMin; vMin = vMax; vMax = vTmp; }
                    if (vMin!=1)                        { sliders+="&"+slide+"min="+vMin; }
                    if (vMax!=settings.sliders[slide])  { sliders+="&"+slide+"max="+vMax; }
                }}

                //GET THE ID
                var id=$this.find("#exerciceid").val();
                if (id) { id="&id="+id; }

                //GET THE TAGS
                var tags="";
                if ($this.find("#tags").val()!=-1) { tags = "&tag="+settings.tags[$this.find("#tags").val()]; }

                //GET THE ORDER
                var order="";
                if (settings.sorting.elt && settings.sorting[settings.sorting.elt]) {
                    order = "&order="+(settings.sorting[settings.sorting.elt]==1?"ASC":"DESC")+
                            "&by="+settings.sorting.elt;
                }

                //SEND THE REQUEST AND SHOW THE RESULTS
                $.getJSON("api/exercices.php?"+activities+classification+sliders+id+tags+order, function (data) {
                    if (data.status=="success") { helpers.buildExercices($this, data); }
                    _fct();
                });

            }
        },
        popup: function($this) {
            var settings = $this.data("settings");
            $this.find("#jpopup").hide();
            if (settings.elt.timer) { clearTimeout(settings.elt.timer); settings.elt.timer = 0; }
        }
    };

    // The plugin
    $.fn.browser = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    classId     : "root",
                    sliders       : {
                        level       : 5 ,
                        diff        : 5 ,
                        extend      : 60
                    },
                    tags            : [],
                    sorting         : { elt:"", Id:1, Difficulty:1, Level:1, Duration:1},
                    elt             : { timer: 0, id:"" }
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    if ($settings.class) { $this.addClass($settings.class); }
                    helpers.loadTemplate($(this).addClass("browser").data("settings", $settings));
                });
            },
            update: function() { helpers.update($(this)); },
            activity: function(_val) {
                var $this = $(this), settings = $this.data("settings");
                $this.find("#actab .icon").removeClass("s");
                $this.find("#actab #"+_val).addClass("s");
                helpers.submit($this, function() { $this.removeClass("upd"); }, true);
            },
            classification: function(_val, _update) {
                var $this = $(this), settings = $this.data("settings");
                settings.classId = _val;
                helpers.buildClassification($this);
                if (_update) { helpers.submit($this, function() { $this.removeClass("upd"); }, true); }
                else         { helpers.update($this); }
            },
            slider: function(_type) {
                $(this).find("#"+_type+" .cursor").removeAttr('style');
                helpers.updateSlider($(this), $(this).find("#"+_type+" #min"));
                helpers.update($(this));
            },
            onshow: function() {
                helpers.updateSlider($(this), $(this).find("#level #min"));
                helpers.updateSlider($(this), $(this).find("#diff #min"));
                helpers.updateSlider($(this), $(this).find("#extend #min"));
            },
            id: function() { $(this).find("#exerciceid").val(""); helpers.update($(this)); },
            tag:function() { $(this).find("#tags").val(-1); helpers.update($(this)); },
            submit: function() { var $this=$(this); helpers.submit($this, function() { $this.removeClass("upd"); }, false); },
            sort: function(_elt) {
                var $this = $(this), settings = $this.data("settings");
                $this.find("#jresults .header div").removeClass("asc").removeClass("desc");

                if (_elt) {
                    if (settings.sorting.elt==_elt) { settings.sorting[_elt]=(settings.sorting[_elt]+1)%3; }
                    else if (settings.sorting[_elt]==0) { settings.sorting[_elt]=1; }
                    settings.sorting.elt=_elt;
                }

                if (settings.sorting[settings.sorting.elt]==1) {
                    $this.find("#jresults #jc"+settings.sorting.elt).addClass("asc"); } else
                if (settings.sorting[settings.sorting.elt]==2) {
                    $this.find("#jresults #jc"+settings.sorting.elt).addClass("desc"); }

                helpers.update($this);
            },
            click:function(_elt) {
                var $this = $(this), settings = $this.data("settings"), $popup = $(this).find("#jpopup");
                 if (settings.elt.timer) { clearTimeout(settings.elt.timer); settings.elt.timer = 0; }

                $(this).find("#jresults .data .c0").removeClass("s");
                $popup.css("left",Math.floor($(_elt).width()*3))
                      .css("top",$this.find("#jresults").position().top+$(_elt).position().top-Math.floor($(_elt).height())*0.5  )
                      .show();
                $(_elt).addClass("s");
                settings.elt.timer = setTimeout(function() { helpers.popup($this); }, 1500);
                settings.elt.id = $(_elt).html();
            },
            callback:function(_fct) {
                var $this = $(this), settings = $this.data("settings");
                if (settings.context&&settings.context[_fct]&&settings.elt.id) { settings.context[_fct](settings.elt.id); }
            },
            setid: function(_val) {
                var $this = $(this), settings = $this.data("settings");
                $(this).find("#exerciceid").val(_val);
                helpers.submit($this, function() { $this.removeClass("upd"); }, true);
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory-number plugin!'); }
    };
})(jQuery);

