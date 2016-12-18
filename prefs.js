// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

//const MainUI = imports.ui.main;

const Gettext = imports.gettext.domain('TopIcons-Plus');
const _ = Gettext.gettext;
const N_ = function(e) { return e; }

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
    Convenience.initTranslations();
}

const Settings = new Lang.Class({
    Name: 'Settings',

    _init: function(params) {
        this.w = new Gtk.Grid(params);
        this.w.set_orientation(Gtk.Orientation.VERTICAL);
        this._settings = Convenience.getSettings();
        this._changedPermitted = false;

        // Icon opacity
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7, spacing:50});
        let label = new Gtk.Label({label: "Opacity", xalign: 0});
        let widget = new Gtk.SpinButton();
        widget.set_sensitive(true);
        widget.set_range(0, 255);
        widget.set_value(this._settings.get_int('icon-opacity'));
        widget.set_increments(1, 2);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value_as_int();
            this._settings.set_int('icon-opacity', value);
         }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        // Icon saturation
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: "Desaturation", xalign: 0});
        let widget = new Gtk.SpinButton({halign:Gtk.Align.END, digits:3});
        widget.set_sensitive(true);
        widget.set_range(0.000, 1.000);
        widget.set_value(this._settings.get_double('icon-saturation'));
        widget.set_increments(0.001, 0.010);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value();
            this._settings.set_double('icon-saturation', value);
         }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        // Icon brightness
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: "Brightness", xalign: 0});
        let widget = new Gtk.SpinButton({halign:Gtk.Align.END, digits:3});
        widget.set_sensitive(true);
        widget.set_range(-1.000, 1.000);
        widget.set_value(this._settings.get_double('icon-brightness'));
        widget.set_increments(0.001, 0.010);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value();
            this._settings.set_double('icon-brightness', value);
         }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        // Icon contrast
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: "Contrast", xalign: 0});
        let widget = new Gtk.SpinButton({halign:Gtk.Align.END, digits:3});
        widget.set_sensitive(true);
        widget.set_range(-1.000, 1.000);
        widget.set_value(this._settings.get_double('icon-contrast'));
        widget.set_increments(0.001, 0.010);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value();
            this._settings.set_double('icon-contrast', value);
         }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        // Icon size
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: _("Size"), xalign: 0});
        let widget = new Gtk.SpinButton({halign:Gtk.Align.END});
        widget.set_sensitive(true);
        widget.set_range(0, 512);
        widget.set_value(this._settings.get_int('icon-size'));
        widget.set_increments(1, 2);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value_as_int();
            this._settings.set_int('icon-size', value);
         }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        // Icon tray spacing
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: _("Spacing"), xalign: 0});
        let widget = new Gtk.SpinButton({halign:Gtk.Align.END});
        widget.set_sensitive(true);
        widget.set_range(0, 20);
        widget.set_value(this._settings.get_int('icon-spacing'));
        widget.set_increments(1, 2);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value_as_int();
            this._settings.set_int('icon-spacing', value);
         }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        // Tray position in panel
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: _("Tray side"), xalign: 0});
        let positions = {'left': N_("left"), 'center': N_("center"), 'right': N_("right")}
        let currentPos = this._settings.get_string('tray-pos');
        hbox.pack_start(label, true, true, 0);
        let radio = null;
        for (let pos in positions) {
            let position = pos;
            let name = Gettext.gettext(positions[pos]);
            radio = new Gtk.RadioButton({ group: radio, label: name, halign: Gtk.Align.CENTER });
            radio.connect('toggled', Lang.bind(this, function(widget) {
                if (widget.active)
                   this._settings.set_string('tray-pos', position);
            }));
            hbox.add(radio);
            if (pos == currentPos)
                radio.active = true;
        }
        this.w.add(hbox);
        
        // Tray order in panel
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});
        let label = new Gtk.Label({label: _("Tray position"), xalign: 0});
        let widget = new Gtk.SpinButton({halign:Gtk.Align.END});
        widget.set_sensitive(true);
        widget.set_range(0, 20);
        widget.set_value(this._settings.get_int('tray-order'));
        widget.set_increments(1, 2);
        widget.connect('value-changed', Lang.bind(this, function(w){
            let value = w.get_value_as_int();
            this._settings.set_int('tray-order', value);
        }));
        hbox.pack_start(label, true, true, 0);
        hbox.add(widget);
        this.w.add(hbox);

        this._changedPermitted = true;
    }
});

function buildPrefsWidget() {
    let widget = new Settings();
    widget.w.show_all();

    return widget.w;
}
