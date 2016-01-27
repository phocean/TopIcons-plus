// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

const Gettext = imports.gettext.domain('topicons');
const _ = Gettext.gettext;
const N_ = function(e) { return e };

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

function init() {
    Convenience.initTranslations();
}

const Settings = new Lang.Class({
    Name: 'Settings',
    Extends: Gtk.Grid,

    _init: function() {
        this.parent({halign: Gtk.Align.CENTER});
        this.set_orientation(Gtk.Orientation.VERTICAL);

        this._settings = Convenience.getSettings();

        this._changedPermitted = false;
            let label = new Gtk.Label({
                label: '<b>' + _("Customize icon appearance") + '</b>',
                use_markup: true,
                halign: Gtk.Align.CENTER,
                margin_top: 20, margin_bottom: 20
            });
            this.add(label);

            add_bool_option(this, 'icon-opacity', "Opacity");
            add_bool_option(this, 'icon-saturation', "Saturation");
        this._changedPermitted = true;

        this._changedPermitted = false;
            let label = new Gtk.Label({
                label: '<b>' + _("Icon size (px)") + '</b>',
                use_markup: true,
                halign: Gtk.Align.CENTER,
                margin_top: 20, margin_bottom: 20
            });
            this.add(label);

            let iconSizeWidget = new Gtk.SpinButton({halign:Gtk.Align.END});
                iconSizeWidget.set_sensitive(true);
                iconSizeWidget.set_range(0, 32);
                iconSizeWidget.set_value(this._settings.get_int('icon-size'));
                iconSizeWidget.set_increments(1, 2);
                iconSizeWidget.connect('value-changed', Lang.bind(this, function(button){
                    let s = button.get_value_as_int();
                    this._settings.set_int('icon-size', s);
                    Main.refreshSize();
                }));
            this.add(iconSizeWidget);

        this._changedPermitted = true;
    }
});

function add_bool_option(widget, txtOption, txtLabel) {
    let optionLabel = new Gtk.Label({
        label: _(txtLabel),
        xalign: 1.0
    });
    let optionSwitch = new Gtk.Switch({
        active: widget._settings.get_boolean(txtOption),
        halign: Gtk.Align.END
    });
    optionSwitch.connect(
        'notify::active', Lang.bind(widget, function(button) {
            widget._settings.set_boolean(txtOption, button.active);
        })
    );

    let box = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        margin: 10,
        spacing: 20
    });
    box.pack_start(optionLabel, true, true, 0);
    box.add(optionSwitch);

    widget.add(box);
}

function buildPrefsWidget() {
    let widget = new Settings();
    widget.show_all();

    return widget;
}
