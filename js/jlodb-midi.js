if (typeof(jlodb) === "undefined") var jlodb = {};
if (typeof(MIDI) === "undefined") var MIDI = {};
if (typeof(MIDI.Soundfont) === "undefined") MIDI.Soundfont = {};

jlodb.midi= {
    soundfontUrl: "res/sound/",
    instruments:[],
    modname: "",
    init: function() {
        for (var i in jlodb.midi.mod) { if (jlodb.midi.mod[i].test()) { jlodb.midi.modname = i; } }
        if (jlodb.midi.modname.length) { jlodb.midi.mod[jlodb.midi.modname].init(); }
    },
    load:function(_instrument, _cbk) {
        if (!MIDI.Soundfont[_instrument]) {
            $.getScript(jlodb.midi.soundfontUrl+_instrument+'-ogg.js', function() {
                if (!jlodb.midi.instruments.length) { for (var i=0; i<12; i++) { jlodb.midi.instruments[i] = _instrument; } }
                _cbk(); });
        }
        else _cbk();
    },
    setInstrument:function(_channel, _instrument) {
        if (_channel<12 && MIDI.Soundfont[_instrument]) { jlodb.midi.instruments[_channel] = _instrument; }
    },
    setVolume:function(_channel, _volume) {
        if (jlodb.midi.modname.length) { jlodb.midi.mod[jlodb.midi.modname].setVolume(_channel, _volume); } },
    noteOn:function(_channel, _note, _velocity, _delay) {
        if (jlodb.midi.modname.length) {
            if (_delay) setTimeout(function() { jlodb.midi.mod[jlodb.midi.modname].noteOn(_channel, _note, _velocity); }, _delay);
            else        jlodb.midi.mod[jlodb.midi.modname].noteOn(_channel, _note, _velocity);
        }
    },
    noteOff:function(_channel, _note, _delay) {
        if (jlodb.midi.modname.length) {
            if (_delay) setTimeout(function() { jlodb.midi.mod[jlodb.midi.modname].noteOff(_channel, _note); }, _delay);
            else        jlodb.midi.mod[jlodb.midi.modname].noteOff(_channel, _note);
        }
    },
    mod : {
        audiotag: {
            channels: [],
            test: function() { return (window.Audio); },
            init: function() {
                for (var i=0; i<12; i++) { jlodb.midi.mod.audiotag.channels[i] = new Audio(); }
            },
            setVolume:function(_channel, _volume) { if (_channel<12) { jlodb.midi.mod.audiotag.channels[_channel].volume = _volume; } },
            noteOn:function(_channel, _note, _velocity) {
                if (_channel<12 && jlodb.midi.instruments[_channel].length) {
                    jlodb.midi.mod.audiotag.channels[_channel].src = MIDI.Soundfont[jlodb.midi.instruments[_channel]][_note];
                    jlodb.midi.mod.audiotag.channels[_channel].play();
                }
            },
            noteOff:function(_channel, _note) {
                if (_channel<12) jlodb.midi.mod.audiotag.channels[_channel].pause();
            }
        },
        // TODO: webkitAudioContext
        webaudio: {
            test: function() { return false; }
        }
    }
}

jlodb.midi.init();
