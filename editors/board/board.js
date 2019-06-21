(function($) {
	var defaults = {
		name: "board",
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
			
			settings.$activity.html("");
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{ },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		valid: function($this) {
            var settings = helpers.settings($this);

			
			var val = $this.find("#e_colors").val().split('\n');
			var chart=[],colors=[];
			for (var i=0; i<val.length; i++) {
				var t = val[i][0];
				if (t=="+") { colors.push(i); }
				
				var c=(val[i].substr(1)).split("|");
				var cc={rgb:c[0].split(',') };
				if (c.length>1) { cc.number = parseInt(c[1]); }
				chart.push(cc);
			}
			
			val = $this.find("#e_brushes").val().split('\n');
			var brushes=[];
			for (var i=0; i<val.length; i++) {
				
				var c=val[i].split("|");
				var cc={bitmap:c[0].split(',') };
				if (c.length>1) { cc.number = parseInt(c[1]); }
				brushes.push(cc);
			}
			
			
			var rgb = $this.find("#eph_color").val();
			var size = $this.find("#eph_size").val().split("*");
			size=[parseInt(size[0]), parseInt(size[1])];
			var board = "";
			for (var i=0; i<size[0]*size[1]; i++) { board+=rgb; }
			
			var font = [1,5,2.5,1.8,2.5,1.8,1.8,1.8,1.3,1.8];
			
			var data = {
				paintmode: parseInt($this.find("#e_mode").val()),
				brushesfont:parseFloat($this.find("#e_brushesfont").val()),
				brushes: brushes,
				colorsfont:parseFloat($this.find("#e_colorsfont").val()),
				chart: chart,
				colors: colors,
				nbsteps: $this.find("#eph_nbsteps").val(),
				size: size,
				init: board
			};
			
			settings.data = $.extend({}, settings.data, data);
			data = $.extend(true,{},settings.data);
			
			$this.find("#e_export").val(JSON.stringify(settings.data));
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
			}
			catch (e) { alert(e.message); return; }
					
		},
		update: function($this, _args) {
            var settings = helpers.settings($this);
			
			$this.find("#e_mode").val(_args.data.paintmode?_args.data.paintmode:0);
			
			var val=[];
			for (var ci=0; ci<_args.data.chart.length; ci++) {
				var c = _args.data.chart[ci];
				var isactive = false;
				for (var cj in _args.data.colors) { if (ci==_args.data.colors[cj]) { isactive = true; }}
				var v=(isactive?"+":"-") + c.rgb.join(",");
				if (c.number) { v+="|"+c.number; }
				val.push(v);
			}
			$this.find("#e_colors").val(val.join('\n'));
			
			
			val=[];
			for (var ci=0; ci<_args.data.brushes.length; ci++) {
				var c = _args.data.brushes[ci];
				var v = c.bitmap.join(",");
				if (c.number) { v+="|"+c.number; }
				val.push(v);
			}
			$this.find("#e_brushes").val(val.join('\n'));
			
			
			$this.find("#eph_nbsteps").val(_args.data.nbsteps);
			
			$this.find("#eph_color").val(_args.data.init[0]);
			$this.find("#eph_size").val(_args.data.size.join("*"));
			
			$this.find("#e_brushesfont").val(_args.data.brushesfont?_args.data.brushesfont.toString():"0");
			$this.find("#e_colorsfont").val(_args.data.colorsfont?_args.data.colorsfont.toString():"0");
			
			helpers.goal($this, _args.data);
			
		},
		goal: function($this, _data) {
            var settings = helpers.settings($this);
			$this.find("#e_goal").html("");
			var max = Math.max(_data.size[0], _data.size[1]);
			var step = 100/max;
			for (var j=0; j<_data.size[1]; j++) for (var i=0; i<_data.size[0]; i++) {
				var c=_data.goal[i+j*_data.size[0]];
				var cc=_data.chart[c<_data.chart.length?c:0];
				
				var $elt=$("<div></div>");
				$elt.css("background-color","rgb("+cc.rgb.join(',')+")")
				    .css("width",step+"%").css("height",step+"%")
					.css("top",(j*step)+"%").css("left",(i*step)+"%");
				$this.find("#e_goal").append($elt);
				
			}
		}
    };

    // The plugin
    $.fn.board_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					editpanel		: true,
					data			: {},				// Exercice data
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
						case "e_get":
								
								settings.data.goal="";
								var elts = settings.$activity.board("e_get");
								for (var i in elts) {
									var rgb = elts[i].color.rgb;
									var id = -1;
									for (var c=0; c<settings.data.chart.length; c++) {
										var cc = settings.data.chart[c].rgb;
										if (cc[0]==rgb[0] && cc[1]==rgb[1] && cc[2]==rgb[2] ) { id = c;	}
									}
									if (id==-1) {
										var content = $this.find("#e_colors").val();
										content+="\n-"+rgb.join(",");
										$this.find("#e_colors").val(content);
										settings.data.chart.push({rgb:rgb});
										id=settings.data.chart.length-1;
									}
									
									settings.data.goal+=id;
								}
								helpers.goal($this,settings.data);
								
								$this.find("#eph_nbsteps").val(settings.$activity.board("e_nb"));
								
								
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
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

