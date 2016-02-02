// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

//const MainUI = imports.ui.main;

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
        
        // Appearance
        let label = new Gtk.Label({
            label: '<b>' + _("Icon appearance") + '</b>',
            use_markup: true,
            halign: Gtk.Align.CENTER,
            margin_top: 20, margin_bottom: 20
        });
        this.add(label);

        // Opacity
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7, spacing: 20});

        let label = new Gtk.Label({
          label: "Opacity",
          use_markup: true,
        });
        let adjustment = new Gtk.Adjustment({
          lower: 0,
          upper: 220,
          step_increment: 1
        });
        let opacity = new Gtk.HScale({
          digits:0,
          adjustment: adjustment,
          value_pos: Gtk.PositionType.RIGHT
        });
        hbox.add(label);
        hbox.pack_end(opacity, true, true, 0);
        this.add(hbox);

        //opacity.set_value(this._settings.get_double('icon-opacity'));

/*        opacity.connect('value-changed', Lang.bind(this, function(slide){
            let s = slide.get_value_as_double();
            this._settings.set_double('icon-opacity', s);
            //Main.refreshPos();
        }));*/

        // Saturation
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7, spacing: 20});

        let label = new Gtk.Label({
          label: "Saturation",
          use_markup: true,
        });
        let adjustment = new Gtk.Adjustment({
          lower: 0,
          upper: 1,
          step_increment: 0.005
        });
        let scale = new Gtk.HScale({
          digits:3,
          adjustment: adjustment,
          value_pos: Gtk.PositionType.RIGHT
        });
        hbox.add(label);
        hbox.pack_end(scale, true, true, 0);
        this.add(hbox);

        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7});

        //add_bool_option(this, 'icon-opacity', "Opacity",hbox);
        //add_bool_option(this, 'icon-saturation', "Saturation", hbox);


        // Size
        let box = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            margin: 10,
            spacing: 20
        });
        let label = new Gtk.Label({label: _("Size"), xalign: 0});
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
        box.pack_start(label, true, true, 0);
        box.add(iconSizeWidget);
        hbox.add(box);

        this.add(hbox)


        // Position
        let label = new Gtk.Label({
            label: '<b>' + _("Tray position") + '</b>',
            use_markup: true,
            halign: Gtk.Align.CENTER,
            margin_top: 20, margin_bottom: 20
        });
        this.add(label);
        
        let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, margin: 7, halign: Gtk.Align.CENTER});
        let positions = {'left': N_("left"), 'right': N_("right"),}
        let currentPos = this._settings.get_string('tray-pos');
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
        
        // let box = new Gtk.Box({
        //     orientation: Gtk.Orientation.HORIZONTAL,
        //     margin: 10,
        //     spacing: 20
        // });
        let label = new Gtk.Label({label: _("Order"), xalign: 0});
        let orderWidget = new Gtk.SpinButton({halign:Gtk.Align.END});
        orderWidget.set_sensitive(true);
        //let a = MainUI.panel._leftBox.get_n_children();
/*        if (currentPos == 'left') {
             orderWidget.set_range(0,10);
         }
         else {
             orderWidget.set_range(0,5);
         }*/
        orderWidget.set_range(0, 20);
        orderWidget.set_value(this._settings.get_int('tray-order'));
        orderWidget.set_increments(1, 2);
        orderWidget.connect('value-changed', Lang.bind(this, function(button){
            let s = button.get_value_as_int();
            this._settings.set_int('tray-order', s);
            Main.refreshPos();
        }));
        //box.pack_start(label, true, true, 0);
        //box.add(orderWidget);
        //hbox.add(box);
        this.add(label)
        this.add(orderWidget);

        this.add(hbox);    
        this._changedPermitted = true;
        
    }
});

function add_bool_option(widget, txtOption, txtLabel, hbox) {
    let optionLabel = new Gtk.Label({
        label: _(txtLabel),
        xalign: 0
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

    hbox.add(box);
}


function buildPrefsWidget() {
    let widget = new Settings();
    widget.show_all();

    return widget;
}
