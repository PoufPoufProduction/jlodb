(function($) {
    // Activity default options
    var defaults = {
        template        : "browser.html",                           // Activity's html template
        css             : "style.css",                              // Activity's css style sheet
        lang            : "en-US",                                  // Current localization
        classification  : 0,                                        // Classification tree
        activities      : 0,                                        // Activitie list
        onmini			: -1,										// Action from context to do when minimized
        debug           : true                                      // Debug mode
    };

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },

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
            var settings = helpers.settings($this);
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
            var settings = helpers.settings($this);
            if (settings.activities) {helpers.build($this); } else {
                $.getJSON("api/activity.php", function (data) { settings.activities = data.activities; helpers.build($this); });
            }
        },
        buildClassification: function($this) {
            var settings = helpers.settings($this);
            var node = helpers.getNodeFromJSON(settings.classification, settings.classId);
            $("#ontab .content").html("");
            $("#ontab .jheader #onlabel").html(node.node.attr("label"));
            if (node.parent) {
                var html="<div class='elt' onclick=\"$(this).closest('.browser').browser('classification','"+
                         node.parent.attr("id")+"');\"><div class='icon' >"+"<img src='res/img/icon/classification/up.svg'/></div><div class='l'></div></div>";
                $("#ontab .content").append(html);
            }
            $(node.node.attr("children")).each(function() {
                var html="<div class='elt' onclick=\"$(this).closest('.browser').browser('classification','"+this.id+"');\"><div class='icon' >"+
                         "<img src='res/img/icon/classification/"+this.id+".svg'/></div><div class='l'>"+this.label+"</div></div>";
                $("#ontab .content").append(html);
            });
        },
        buildActivities: function($this) {
            var settings = helpers.settings($this);
			
			var $select = $this.find("#bractivities");
			for (var a in settings.activities) {
				$select.append("<option value='"+settings.activities[a].id+"'>"+
					settings.activities[a].label+"</option>");
			}
        },
        onclick: function(_args) {
            var txt = "";
            for (var i in _args) { if (txt.length) { txt+=","; } txt+="\""+_args[i]+"\""; }
            return "onclick='$(this).closest(\".browser\").browser("+txt+");' "+
                   "ontouchstart='$(this).closest(\".browser\").browser("+txt+");event.preventDefault();'";
        },
        buildExercices: function($this, data) {
            var settings = helpers.settings($this);
            $this.find("#jresults #jdata").html("");
            $this.find("#brcount").html(data.nb);

            for (var i=0; i<data.exercices.length; i++) {
                var e=data.exercices[i];
                var html="<div class='elt' id='"+e.id+"'>";

                html+="<div class='title' "+helpers.onclick(['id',e.id])+">"
                if (settings.url) {
                    var url = settings.url+"/res/img/exercices/"+e.activity+"/";
                        if (e.id.length>4) { url+=e.id[2]+e.id[3]+"/"; } else { url+="xx/"; }
                        url += e.id+".png";

                    html+="<img src='"+url+"'/>";
                }
                html+="<div class='id'>"+e.id+"</div>";
                if (e.nb) { html+="<div class='nb'>"+(parseInt(e.nb)+1)+"</div>"; }
                html+="</div>";

                html+="<div class='activity' "+helpers.onclick(['activity',e.activity])+">"+
                      "<img src='res/img/icon/activity/"+e.activity+".svg'/></div>";

                var txt = e.label;
                if (e.tag.length) {
                    var tags = e.tag.split(",");
                    for (var t in tags) {
                        txt+=" <span class='tag' "+helpers.onclick(['tag',tags[t]])+">#"+tags[t]+"</span>";
                    }
                }
                html+="<div class='label'><div class='m'>"+txt+"</div>";
                if (e.reference) {
                    html+="<div class='ref' "+helpers.onclick(['reference',e.reference])+">"+e.reference+"</div>";
                };
                if (e.variant) {
                    html+="<div class='variant' "+helpers.onclick(['id',e.variant])+">["+e.variant+"]</div>";
                }
                html+="</div>";

                html+="<div class='parameter'>";
                html+="<div "+helpers.onclick(['classification',e.classification])+">"+
                      "<img src='res/img/icon/classification/"+e.classification+".svg'/></div>";
                html+="<div>"+e.level+"</div>";
                html+="<div><img src='res/img/numbers/star/star"+e.diff+".svg'/></div>";
                html+="<div class='time'>"+e.extend+"</div>";
                html+="</div>";

                html+="<div class='context'>";
                for (var j in settings.context) {
                    html+="<div "+helpers.onclick(['context',j,e.id])+">";
                    html+="<img src='"+settings.context[j].icon+"'/>";
                    html+="</div>";
                }
                html+="";

                html+="</div>";
                $this.find("#jresults #jdata").append(html);
            }
             if (settings.onRefresh) { settings.onRefresh($this); }

        },
        build: function($this) {
            var settings = helpers.settings($this);
            helpers.buildActivities($this);
            helpers.buildClassification($this);
            helpers.submit($this, function() { $this.find("#jbrowser").show(); }, true);

			$this.find(".brtoggle").bind("touchstart mousedown", function(event) {
				 $(this).toggleClass('s');
				 $this.browser('update');
				 event.preventDefault();
			});
			
            if (settings.onReady) { settings.onReady($this); }
        },
        update: function($this) { $this.addClass("upd"); },
        submit: function($this, _fct, _force) {
            var settings = helpers.settings($this);
            if (_force || $this.hasClass("upd")) {

                //GET THE ACTIVITIES
                var activities = $this.find("#bractivities").val();
				if (activities) { activities = "&activity="+activities; }

                //GET THE CLASSIFICATION
                var classification = "";
                var recursive = $this.find("#ontab #ontoggle").hasClass("s");

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
				var sl = ["level","diff"];
				for (var s in sl) {
					
					var min=-1,max=-1;
					$this.find("#br"+sl[s]+" .brtoggle.s").each(function() {
						max = parseInt($(this).html());
						if (min==-1) { min = max; }
					});
					if (min!=-1) {
						sliders+="&"+sl[s]+"min="+min+"&"+sl[s]+"max="+max;
					}
				}

                //GET THE ID
                var id=$this.find("#exerciceid").val();
                if (id) { id="&id="+id; }

                //GET THE TAGS
                var tags="";
                if ($this.find("#tags").val()) { tags = "&tag="+$this.find("#tags").val(); }

                //GET THE REFERENCE
                var ref=$this.find("#reference").val();
                if (ref) { ref = "&reference="+ref; }
                
                 //GET THE DEFINITION
                var title=$this.find("#brtitle").val();
                if (title) { title="&title="+encodeURIComponent(title); }

                //GET THE ORDER
                var order="&by="+$this.find("#s1").val()+"&order="+$this.find("#s2").val();


                //GET THE NUMBER
                var n=[500,100,25,5];
                var number = n[$this.find("#brnumber").attr("class").substr(-1)];
                if (number==500) { number=""; } else { number="&limit="+number; }

                // TEST THE ALT
                if (id.length || title.length) { $this.find("#bralt").removeClass("s"); }
                var alt=$this.find("#bralt").hasClass("s")?"":"&alt=1";

                var args = activities+classification+sliders+id+tags+ref+title+order+number+alt;
                if (args.length) { args = args.substr(1); }
				
                //SEND THE REQUEST AND SHOW THE RESULTS
                $.getJSON("api/exercice.php?"+args, function (data) {
                    if (data.status=="success") { helpers.buildExercices($this, data); }
                    _fct();
                });

            }
        },
        popup: function($this) {
            var settings = helpers.settings($this);
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
                    tags            : [],
                    tagsbyid        : {},
                    sorting         : { elt:"", Id:1, Difficulty:1, Level:1, Duration:1},
                    elt             : { timer: 0, id:"" }
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    if ($settings["class"]) { $this.addClass($settings["class"]); }
                    helpers.settings($this, $settings);
                    helpers.loadTemplate($this.addClass("browser"));
                });
            },
            update: function() { helpers.update($(this)); },
            activity: function(_val) {
                var $this = $(this), settings = helpers.settings($this);
				$this.find("#bractivities").val(_val);
                helpers.update($this);
            },
            classification: function(_val) {
                var $this = $(this), settings = helpers.settings($this);
				$this.find("#onmask").show()
					 .css("opacity",1).animate({opacity:0}, 300, function() { $(this).hide(); });
                settings.classId = _val;
                $this.find("#exerciceid").val("");
                helpers.buildClassification($this);
                helpers.update($this);
            },
            id: function(_val) {
                var $this = $(this), settings = helpers.settings($this);
                
                if ($this.find("#jdata").hasClass("brsnap") && settings.onmini!=-1) {
					settings.context[settings.onmini].process(_val);
				}
                $this.find("#exerciceid").val(_val?_val:"");
                helpers.update($(this));
            },
            tag:function(_val) {
                var $this = $(this);
                $this.find("#tags").val(_val?_val:-1);
                helpers.update($(this));
            },
            reference: function(_val) {
                var $this = $(this);
                $this.find("#reference").val(_val?_val:"");
                helpers.update($(this));
            },
            submit: function(_force) { var $this=$(this); helpers.submit($this, function() { $this.removeClass("upd"); }, _force); },
            sort: function(_elt) {
                var $this = $(this), settings = helpers.settings($this);
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
            toggle: function() {
				
                var $this = $(this), settings = helpers.settings($this);
                if ($this.find("#jdata").hasClass("brsnap")) {
					$this.find("#jdata").removeClass("brsnap");
					$this.find("#brview img").attr("src","res/img/icon/action/nothing.svg");
				}
				else {
					$this.find("#jdata").addClass("brsnap");
					$this.find("#brview img").attr("src","res/img/icon/action/red.svg");
				}
			},
			onshow() {},
            context: function(_c, _id) {
                var $this = $(this), settings = $this.data("settings");
                settings.context[_c].process(_id);
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory-number plugin!'); }
    };
})(jQuery);

