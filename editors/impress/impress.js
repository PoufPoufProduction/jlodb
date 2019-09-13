(function($) {
	var defaults = {
		name: "impress",
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
					if($.type(value) === "string") { $this.find("#"+id).html(value); }
                }); }
				
				helpers.launch($this, _args);
			});
        },
		launch: function($this, _args) {
            var settings = helpers.settings($this);
			settings.$activity.jlodb({
				onedit:		function($activity, _data) 		{ helpers.edit($this, _data); },
				onstart:    function($activity)       		{ settings.$activity.addClass("nosplash"); },
                onfinish:   function($activity, _hide)		{ },
                onscore:    function($activity, _ret) 		{ return true; },
                onexercice: function($activity, _id, _data)	{ _data.edit = true; } }, _args);
		},
		edit: function($this, _args) {
            var settings = helpers.settings($this);
			var l = settings.args.locale.editor;
			var $control = $("<div id='edition'></div>");
			var page = _args.data;
			$control.append("<input id='e_title' class='title' placeholder='"+l.e_htitle+"' type='text' value='"+(page.title?page.title:"")+"'/>");
			$control.append("<input id='e_subtitle' class='title' placeholder='"+l.e_hsubtitle+"' type='text' value='"+(page.subtitle?page.subtitle:"")+"'/>");
			$control.append("<textarea id='e_content' class='content' placeholder='"+l.e_hcontent+"'>"+(page.content?page.content:"")+"</textarea>");
				
			switch(page.type) {
				case "list":
					for (var i=0; i<5; i++) {
						$control.append("<textarea class='list' id='e_list"+i+"' placeholder='"+l.e_puce+" #"+(i+1)+"'>"+(i<page.list.length?page.list[i]:"")+"</textarea>");
					}
					$control.append("<select id='e_dynamic' class='select'><option value='s'"+(page.dynamic?"":" selected='selected'")+">"+l.e_static+"</option><option value='d'"+(page.dynamic?" selected='selected'":"")+">"+l.e_dynamic+"</option></select>");
				break;
				case "img":
					$control.append("<textarea id='e_src' placeholder='"+l.e_url+"'>"+(page.src?page.src:"")+"</textarea>");
					$control.append("<input id='e_size' placeholder='"+l.e_size+"' type='text' value='"+(page.size?page.size:"")+"'/>");
					
					$control.append("<select id='e_dynamic' class='select'><option value='s'"+(page.dynamic?"":" selected='selected'")+">"+l.e_static+"</option><option value='d'"+(page.dynamic?" selected='selected'":"")+">"+l.e_dynamic+"</option></select>");
				break;
			}
				
			$control.append("<select id='e_fade' class='select'><option value='none'>"+l.e_none+"</option><option value='fade'>"+l.e_fade+"</option><option value='totop'>"+l.e_totop+"</option><option value='tobottom'>"+l.e_tobottom+"</option><option value='toleft'>"+l.e_toleft+"</option><option value='toright'>"+l.e_toright+"</option></select>");
			if (page.out) { $control.find("#e_fade").val(page.out); }
			$control.append("<textarea id='e_footer' class='content' placeholder='"+l.e_hfooter+"'>"+(page.footer?page.footer:"")+"</textarea>");

			$this.find("#e_control").html($control);
			
			var $valid = $("<div class='l g_bluekey'>OK</div>");
			$this.find("#e_control").append($valid);
			$valid.bind("mousedown touchstart", function(_event) { helpers.valid($this, _args); });
		},
		valid: function($this, _args) {
            var settings = helpers.settings($this);
			_args.data.title = $this.find("#e_control #e_title").val();
			_args.data.subtitle = $this.find("#e_control #e_subtitle").val();
			_args.data.content = $this.find("#e_control #e_content").val();
			_args.data.out = $this.find("#e_control #e_fade").val();
			_args.data.footer = $this.find("#e_control #e_footer").val();
			
			switch(_args.data.type) {
				case "list":
					_args.data.list=[];
					for (var i=0; i<5; i++) {
						var value = $this.find("#e_control #e_list"+i).val();
						if (value) { _args.data.list.push(value); }
					}
					_args.data.dynamic = ($this.find("#e_control #e_dynamic").val()=="d");
				break;
				case "img":
					_args.data.src = $this.find("#e_control #e_src").val();
					_args.data.size = $this.find("#e_control #e_size").val();
					_args.data.dynamic = ($this.find("#e_control #e_dynamic").val()=="d");
				break;
			}
			
			settings.$activity.impress("e_update");
		}
    };

    // The plugin
    $.fn.impress_editor = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : true,
					editpanel		: true,
					$activity		: 0				// The activity object
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend({}, defaults, options, settings);
                    $this.removeClass();
                    helpers.settings($this.addClass(defaults.name+"_editor").addClass("j_editor"), $settings);
                    helpers.load($this, options.args);
                });
            },
			edit: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
				var l = settings.args.locale.editor;
				
				if (settings.interactive)
				{
					settings.interactive = false;
					$(_elt).addClass("touch");
					setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
					setTimeout(function() { settings.interactive = true; }, 800);
					
					var data = settings.$activity.impress("e_settings");

					switch($(_elt).attr("id"))
					{
						case 'e_del' :
							if (data.slideid>=0 && data.slideid<data.slides.length) {
								data.slides.splice(data.slideid,1);
								if (data.slides.length && data.slideid>=data.slides.length) {
									data.slideid=data.slides.length-1; }
								
								settings.$activity.impress("e_update");
							}
						break;
						case 'e_left':
							if (data.slideid>0 && data.slideid<data.slides.length) {
								var elt = data.slides.splice(data.slideid,1);
								data.slideid--;
								data.slides.splice(data.slideid,0,elt[0]);
								
								settings.$activity.impress("e_update");
							}
						break;
						case 'e_right':
							if (data.slideid>=0 && data.slideid<data.slides.length-1) {
								var elt = data.slides.splice(data.slideid,1);
								data.slideid++;
								data.slides.splice(data.slideid,0,elt[0]);
								
								settings.$activity.impress("e_update");
							}
						break;
						case 'e_export':
							if (settings.editpanel) {
								var $export = $("<textarea id='e_export' class='export'></textarea>");
								var $button = $("<div class='l g_bluekey'>OK</div>");
								$export.val(JSON.stringify(data.slides));
								$this.find("#e_control").html($export).append($button);
								$button.bind("touchstart mousedown", function(_event) {
									try {
										data.slideid = 0;
										data.offset = 0;
										data.slides = jQuery.parseJSON($this.find("#e_export").val());
										settings.$activity.impress("e_update");
										settings.editpanel = true;
										$this.find("#e_menu #e_export").html(l.e_export);
									}
									catch (e) { alert(e.message); return; }
							
									_event.preventDefault();
								});
								settings.editpanel = false;
								$this.find("#e_menu #e_export").html(l.e_toedit);
							}
							else {
								settings.editpanel = true;
								$this.find("#e_menu #e_export").html(l.e_export);
								helpers.edit($this, { id:data.slideid, data:data.slides[data.slideid] });
							}
						break;
						case 'e_new':
							var slide={out:"fade", type:$this.find("#e_type").val()};
							switch ($this.find("#e_type").val()) {
								case "list":
									slide.list=[l.e_puce+" #1",l.e_puce+" #2"];
									slide.dynamic=true;
									break;
								case "img":
									slide.src="res/img/characters/imp_r01.svg";
									slide.size=80;
									slide.dynamic=false;
									break;
								case "title":
									slide.title=l.e_htitle;
									slide.subtitle=l.e_hsubtitle;
									break;
								default:
									slide.title=l.e_htitle;
									slide.content="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
									break;
							}
							data.slideid++;
							data.slides.splice(data.slideid,0,slide);
								
							settings.$activity.impress("e_update");
						break;
						case 'e_submit': if (settings.validation) { settings.validation(JSON.stringify({slides:data.slides})); } break;
					}
				}
			}
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in editor plugin!'); }
    };
})(jQuery);

