(function($) {
	var defaults = {
		name: "marker",
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
			$this.find("#e_export").val(JSON.stringify(_args.data));
			settings.$activity.html("");
			
			helpers.update($this, _args);
			
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{ },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		import:function($this, _elt, _args, _launch) {
            var settings = helpers.settings($this);
				
			if (settings.interactive)
			{
				settings.interactive = false;
				$(_elt).addClass("touch");
				setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
				setTimeout(function() { settings.interactive = true; }, 500);
					
				try {
					var args = _args;
					if (!args) { args = jQuery.parseJSON($this.find("#e_export").val()); }
					else	   { $this.find("#e_export").val(JSON.stringify(args)) ;}
					helpers.update($this, {data: args });
					if (_launch) {
						args.edit = true;
						args.context = { onquit:function() { }, onload:function($t) { $t.addClass("nosplash"); } };
						args.locale = settings.locale;
						settings.$activity[settings.name](args);
					}
				}
				catch (e) { alert(e.message); return; }
			}
		},
		update: function($this, _args) {
            var settings = helpers.settings($this);
			
			$this.find("#eph_exercice").html(_args.data.exercice);
			for (var i=0; i<3; i++) {
				if (i < _args.data.questions.length) {
					$this.find("#eph_goal"+(i+1)).val(_args.data.questions[i].label);
					$this.find("#eph_sep"+(i+1)).val(_args.data.questions[i].s);
				}
				else {
					$this.find("#eph_goal"+(i+1)).val("");
				}
			}
			
			var locked = false;
			$this.find(".e_linex").detach();
			for (var i=0; i<_args.data.text.length; i++) {
				if (!settings.result) {
					for (var j=0; j<_args.data.questions.length; j++) {
						if (_args.data.text[i].indexOf(_args.data.questions[j].s)!=-1) { locked = true; }
					}
				}
				if (i) {
					$this.find("#e_data").append("<textarea class='e_line e_linex' placeholder='"+settings.args.locale.editor.eph_line1+"'>"+_args.data.text[i]+"</textarea>");
					
				}
				else { $this.find("#eph_line1").val(_args.data.text[i]); }
			}
			
			$this.find("#e_data .e_sep").attr("disabled",locked?"disabled":false);
			
			if (_args.data.font) { $this.find("#eph_size").val(_args.data.font); }
		},
		convert: function($this) {
			var val={text:[], questions:[], exercice:$this.find("#eph_exercice").val()};
			$this.find("#e_data .e_line").each(function() {
				if ($(this).val().length) { val.text.push($(this).val()); } });
			for (var i=0; i<3; i++) {
				if ($this.find("#eph_goal"+(i+1)).val().length) {
					val.questions.push({label:$this.find("#eph_goal"+(i+1)).val(), s:$this.find("#eph_sep"+(i+1)).val() });
				}
				else break;
			}
			if ($this.find("#eph_size").val().length) { val.font = $this.find("#eph_size").val(); }
			$this.find("#e_export").val(JSON.stringify(val));
			return val;
		}
    };

    // The plugin
    $.fn.marker_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					editpanel		: true,
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
			import:function(_elt) { helpers.import($(this), _elt, 0, true); },
			edit:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				var l = settings.args.locale.editor;
				
				if (settings.interactive)
				{
					var anim = true;
					switch($(_elt).attr("id")) {
						case 'e_new' :
								$this.find("#e_data").append("<textarea class='e_line e_linex' placeholder='"+l.eph_line1+"'></textarea>");
							break;
						case 'e_del' :
							var val = helpers.convert($this);
							for (var i in val.text) {
								var vReg = new RegExp("[|]","g");
								val.text[i]=val.text[i].replace(vReg,"");
							}
							helpers.import($this, _elt, val, true);
							anim = false;
							break;
						case 'e_get':
							var val = helpers.convert($this);
							val.text = settings.$activity.marker("e_get");
							helpers.import($this, _elt, val, false);
							anim = false;
							
							break;
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
			valid:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				helpers.import($this, _elt, helpers.convert($this),true);
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

