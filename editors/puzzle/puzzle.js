(function($) {
	var defaults = {
		name: "puzzle",
		args: {},				// activity arguments
		validation: false,
		gg: false,				// gg part only
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
					if($.type(value) === "string") { $this.find("#"+id).html(value); }
                }); }
				
				helpers.launch($this, _args);
			});
        },
		launch: function($this, _args) {
            var settings = helpers.settings($this);
			settings.locale = _args.locale;
			settings.data = _args.data;
			
			if (settings.gg && settings.data.gg) {
				$this.find("#e_export").val(JSON.stringify(settings.data.gg));
			}
			else { $this.find("#e_export").val(JSON.stringify(settings.data)); }
			settings.$activity.html("");
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{ },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		}
    };

    // The plugin
    $.fn.puzzle_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					$activity		: 0,				// The activity object
					locale			: "",				// Locale object for relaunch
					data			: {}
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    helpers.settings($this.addClass(defaults.name+"_editor").addClass("j_editor"), $settings);
                    helpers.load($this, options.args);
                });
            },
			import:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					
					try {
						var args;
						if (settings.gg && settings.data.gg) {
							args = $.extend(true,{},settings.data);
							args.gg = jQuery.parseJSON($this.find("#e_export").val());
						}
						else { args = jQuery.parseJSON($this.find("#e_export").val()); }
						args.edit = true;
						args.context = { onquit:function() { }, onload:function($t) { $t.addClass("nosplash"); } };
						args.locale = settings.locale;
						settings.$activity[settings.name](args);
					}
					catch (e) { alert(e.message); return; }
				}
			},
			edit:function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					
					if (settings.validation) {
						try {
							
							var args;
							if (settings.gg && settings.data.gg) {
								args = $.extend(true,{},settings.data);
								args.gg = jQuery.parseJSON($this.find("#e_export").val());
								args = JSON.stringify(args);
							}
							else { args = $this.find("#e_export").val(); }
							
							settings.validation(args);
						}
						catch (e) { alert(e.message); return; }
					}
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

