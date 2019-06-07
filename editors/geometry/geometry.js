(function($) {
	var defaults = {
		name: "geometry",
		args: {},				// activity arguments
		validation: false,
		debug: true
	};
   

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        load: function($this, _args) {
            var settings = helpers.settings($this), debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            var templatepath = "editors/"+settings.name+"/template.html"+debug;
            $this.load( templatepath, function(response, status, xhr) {
				settings.$activity = $this.find("#e_screen>div");
				if (!settings.validation) { $this.find("#e_submit").hide(); }

				if (_args.locale.editor) { $.each(_args.locale.editor, function(id,value) {
					if($.type(value) === "string") {
						if (id.indexOf("eph")==-1) { $this.find("#"+id).html(value); }
						else					   { $this.find("#"+id).attr("placeholder",value); }
					}
                }); }
				
				helpers.launch($this, _args);
			});
        },
		launch: function($this, _args) {
            var settings = helpers.settings($this);
			settings.locale = _args.locale;
			settings.data = _args.data;
			
			$this.find("#e_export").val(JSON.stringify(_args.data));
			
			helpers.update($this, _args);
			helpers.tab($this,1);
			
			settings.$activity.html("");
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{ helpers.edit($this, _data); },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		edit: function($this, _args) {
            var settings = helpers.settings($this);
			settings.addelt = _args;
			$this.find("#e_importelt").html(_args.type+" "+JSON.stringify(_args.value));
			$this.find("#e_add").removeClass("d");
			if (_args.pos)  { $this.find(".e_addobj").addClass("d"); }
			else			{ $this.find(".e_addobj").removeClass("d"); }
			
		},
		valid: function($this) {
            var settings = helpers.settings($this);

			var available=[];
			$this.find("#e_buttons .icon").each(function() {
				var name = $(this).attr("id").substr(3);
				if ($(this).hasClass("s") && name!="style") { available.push(name); }
			});
			
			var data = {
				exercice: $this.find("#eph_exercice").val(),
				number: $this.find("#eph_number").val(),
				style: $this.find("#e_buttons #eb_style").hasClass("s"),
				available: available,
				objectives:[],
				labels:[]
			};
			
			
			var cl = [];
			if ($this.find("#eph_class").val()!="default") { cl.push($this.find("#eph_class").val()); }
			if ($this.find("#eph_format").val()!="default") {
				var f = $this.find("#eph_format").val();
				cl.push(f);
				if (f=="full") { data.withcancel=true; }
			}
			if (cl.length) { data["class"]=cl.join(" "); }
			
			if (available.length==1) { data.selected = available[0]; data.locked=true; }
			
			try {
				var d=$this.find("#eph_data").val().split('\n'), dd=[];
				for (var i=0; i<d.length; i++) { if (d[i].length) { dd.push($.parseJSON(d[i])); } }
				data.data = dd;
				
				for (var o=0; o<5; o++) {
					var obj=$this.find("#e_obj"+(o+1)+" .e_ovalue").val();
					if (obj.length) {
						var ob=obj.split('\n'), oo=[];
						for (var i=0; i<ob.length; i++) { if (ob[i].length) { oo.push($.parseJSON(ob[i])); } }
						data.objectives.push(oo);
						data.labels.push($this.find("#e_obj"+(o+1)+" .e_olabel").val());
					}
				}
				
			} catch (e) { alert(e.message); return; }
			
			
			
			data = $.extend({}, settings.data, data);
			
			$this.find("#e_export").val(JSON.stringify(data));
			helpers.import($this, data);
			
		},
		import: function($this, _args) {
            var settings = helpers.settings($this);
			try {
				var args = _args;
				if (!args) {
					args = $.parseJSON($this.find("#e_export").val());
					settings.data = $.extend({},args);
				}
				
				args.edit = true;
				args.highlight = settings.highlight;
				args.context = { 
					onedit:		function($activity, _data) { helpers.edit($this, _data); },
					onquit:		function() { },
					onload:		function($t) { $t.addClass("nosplash"); } };
				args.locale = settings.locale;
				helpers.update($this, {data: args });
				settings.$activity[settings.name](args);
				settings.haschanged = false;
			}
			catch (e) { alert(e.message); return; }
					
		},
		update: function($this, _args) {
            var settings = helpers.settings($this);
			
			$this.find("#eph_exercice").val(_args.data.exercice);
			$this.find("#eph_number").val(_args.data.number);
			
			$this.find("#e_buttons").removeClass("s");
			if (_args.data.available) {
				for (var i in _args.data.available) {
					$this.find("#e_buttons #eb_"+_args.data.available[i]).addClass("s");
				}
			}
			if (_args.data.style) { $this.find("#e_buttons #eb_style").addClass("s"); }
			
			if (_args.data["class"]) {
				
				if (_args.data["class"].indexOf("white")!=-1) { $this.find("#eph_class").val("white"); }
				if (_args.data["class"].indexOf("black")!=-1) { $this.find("#eph_class").val("black"); }
				if (_args.data["class"].indexOf("blank")!=-1) { $this.find("#eph_class").val("blank"); }
				
				if (_args.data["class"].indexOf("full")!=-1) { $this.find("#eph_format").val("full"); }
				if (_args.data["class"].indexOf("large")!=-1) { $this.find("#eph_format").val("large"); }
			}
			
			var d = "";
			for (var dd in _args.data.data) { d+=(d.length?'\n':'')+JSON.stringify(_args.data.data[dd]); }
			$this.find("#eph_data").val(d);
			
			$this.find("#e_objs textarea").val("");
			for (var o=0; o<_args.data.objectives.length; o++) {
				var oo = _args.data.objectives[o];
				$this.find("#e_obj"+(o+1)+" .e_olabel").val(_args.data.labels[o]);
				var d = "";
				for (var dd in oo) { d+=(d.length?'\n':'')+JSON.stringify(oo[dd]); }
				$this.find("#e_obj"+(o+1)+" .e_ovalue").val(d);
			}
			
		},
		tab: function($this, _value) {
            var settings = helpers.settings($this);
			$this.find("#e_tabs>div").removeClass("s");
			$this.find("#e_tab"+_value).addClass("s");
			$this.find("#e_objs>div").hide();
			$this.find("#e_obj"+_value).show();
		}
    };

    // The plugin
    $.fn.geometry_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					editpanel		: true,
					data			: {},				// Exercice data
					addelt			: 0,
					idpoint			: 1,
					locale			: ""				// Locale object for relaunch
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    helpers.settings($this.addClass(defaults.name+"_editor").addClass("jlodb_editor"), $settings);
                    helpers.load($this, options.args);
                });
            },
			valid: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					helpers.valid($this);
				}
			},
			import:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					
					helpers.import($this,0);
				}
			},
			edit:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				var l = settings.args.locale.editor;
				
				if (settings.interactive)
				{
					
					var anim = true;
					switch($(_elt).attr("id")) {
						case 'e_import':
							if (settings.editpanel) {
								settings.editpanel = false;
								
								$this.find("#e_menu #e_import").html(l.e_toedit);
								$this.find("#e_editor").hide();
								$this.find("#e_control").show();
							}
							else {
								settings.editpanel = true;
								$this.find("#e_menu #e_import").html(l.e_import);
								$this.find("#e_editor").show();
								$this.find("#e_control").hide();
							}
							break;
						case "e_submit":
							if (settings.validation) { settings.validation($this.find("#e_export").val()); }
							break;
					}
					
					if (anim) {
						settings.interactive = false;
						$(_elt).addClass("touch");
						setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
						setTimeout(function() { settings.interactive = true; }, 500);
					}
				}
			},
			add: function() {
                var $this = $(this) , settings = helpers.settings($this);
				var txt=$this.find("#eph_data").val()+'\n';
				switch($this.find("#eph_add").val()) {
					case "point": 	txt += '{"type":"point","value":[100,100],"id":"X","idpos":45,"active":true}'; break;
					case "line": 	txt += '{"type":"line","value":[100,0],"active":true}'; break;
					case "segment": txt += '{"type":"segment","value":[0,0,100,100],"active":true}'; break;
					case "circle":	txt += '{"type":"circle","value":[100,100,100],"active":true}'; break;
					case "grid":	txt += '{"type":"grid","value":[0,0,6,6,50,50],"active":true}'; break;
					case "mesh":	txt += '{"type":"mesh","value":[0,0,6,6,50,50],"active":true}'; break;
					case "path":	txt += '{"type":"path","value":[100,100,100,200,50,100,100,100],"active":true}'; break;
					case "pathplus":txt += '{"type":"path+","value":[100,100,100,200,50,100,100,100],"active":true}'; break;
				}
				$this.find("#eph_data").val(txt);
			},
			addelt: function(_elt, _v) {
                var $this = $(this) , settings = helpers.settings($this);
				if (!$(_elt).hasClass("d") && settings.interactive && settings.addelt) {
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() {
						settings.interactive = true;
						settings.addelt = 0;
						$this.find("#e_importelt").html("...");
						$this.find("#e_add").addClass("d");
						$this.find(".e_addobj").addClass("d");
					}, 500);
					
					
					
					if (_v==-1) {
						var val = $this.find("#eph_data").val();
						var done = false;
						
						// ADD POINT TO PATH IF IS LAST
						if (val.length && settings.addelt.type=="point") {
							var vv = val.split("\n");
							var last = $.parseJSON(vv[vv.length-1]);
							if (last.type=="path+" || last.type=="path") {
								last.value.push(settings.addelt.value[0]);
								last.value.push(settings.addelt.value[1]);
								vv[vv.length-1]=JSON.stringify(last);
								$this.find("#eph_data").val(vv.join('\n'));
								done = true;
							}
						}
						
						if (!done) {
							var elt={type:settings.addelt.type, value:settings.addelt.value};
							if (elt.type=="point") { elt.id = (settings.idpoint++).toString(); }
							elt.active=true;

							$this.find("#eph_data").val(val+(val.length?"\n":"")+JSON.stringify(elt));
						}
					}
					else {
						var elt={type:settings.addelt.type, values:settings.addelt.value};
						
						var val = $this.find("#e_obj"+_v+" .e_ovalue").val();
						$this.find("#e_obj"+_v+" .e_ovalue").val(val+(val.length?"\n":"")+JSON.stringify(elt));
					}
					
				}
			},
			tab: function(_elt, _v) { helpers.tab($(this), _v); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

