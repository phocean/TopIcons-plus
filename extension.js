// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Panel = imports.ui.panel;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const ICON_OPACITY = 220;
const ICON_DESATURATION = 0.375;

let settings;

let tray;
let trayIconImplementations = [];
let trayAddedId = 0;
let trayRemovedId = 0;

// Keep track of icons for easier manipulation
let icons = [];

// Separators provide extra padding between tray icons and panel buttons
let separatorLeft;
let separatorRight;

function init() {
    settings = Convenience.getSettings();
    settings.connect(
            'changed::icon-opacity', Lang.bind(this, refreshOpacity));
    settings.connect(
            'changed::icon-saturation', Lang.bind(this, refreshSaturation));

    // we need to refresh icons when user changes icon-size in settings
    settings.connect('changed::icon-size', Lang.bind(this, refreshSize));

    tray = Main.legacyTray;
    trayIconImplementations = imports.ui.legacyTray.STANDARD_TRAY_ICON_IMPLEMENTATIONS;
}

function enable() {
    GLib.idle_add(GLib.PRIORITY_LOW, moveToTop);
}

function disable() {
    moveToTray();
}

function onTrayIconAddedDelayed(o, icon, role) {
    onTrayIconAdded(o, icon, role, 2500);
}

function onTrayIconAdded(o, icon, role, delay) {
    let wmClass = icon.wm_class ? icon.wm_class.toLowerCase() : '';
    if (trayIconImplementations[wmClass] !== undefined)
        return;

    icons.push(icon);

    // Icon properties
    let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;
    iconSize = settings.get_int('icon-size');
    icon.set_size(iconSize, iconSize);
    icon.reactive = true;

    let iconContainer = new St.Button({child: icon, visible: false});
    iconContainer.set_style('padding: 0px 4px;');

    icon.connect("destroy", function() {
        icon.clear_effects();
        iconContainer.destroy();
    });
    iconContainer.connect('button-release-event', function(actor, event) {
        icon.click(event);
    });

    applyPreferences(icon);
    
    // Insert icon container before right separator
    let index = Main.panel._rightBox.get_n_children() - 2;
    Main.panel._rightBox.insert_child_at_index(iconContainer, index);

    // Some icons won't appear on application start. As a workaround, 
    // we delay their visibility.
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function() {
        iconContainer.visible = true;
    
        separatorLeft.visible = true;
        separatorRight.visible = true;

        return GLib.SOURCE_REMOVE;
    }));
}

function onTrayIconRemoved(o, icon) {
    let parent = icon.get_parent();
    parent.destroy();
    icon.destroy();

    icons.splice(icons.indexOf(icon), 1);
    
    // Separators are hidden when no icons are present
    if(icons.length == 0) {
        separatorLeft.visible = false;
        separatorRight.visible = false;
    }
}

function addSeperator() {
    let separator = new St.Bin({visible: false});   

    // 8px = 12px (panel button padding) - 4px (icon container padding)
    separator.set_style('width: 8px;'); 

    let index = Main.panel._rightBox.get_n_children() - 1;
    Main.panel._rightBox.insert_child_at_index(separator, index);
    
    return separator;
}

function moveToTop() {
    separatorLeft = addSeperator();
    separatorRight = addSeperator();

    // Replace signal handlers;
    tray._trayManager.disconnect(tray._trayIconAddedId);
    tray._trayManager.disconnect(tray._trayIconRemovedId);
    trayAddedId = tray._trayManager.connect(
        'tray-icon-added', onTrayIconAddedDelayed);
    trayRemovedId = tray._trayManager.connect(
        'tray-icon-removed', onTrayIconRemoved);
    
    // Move each tray icon to the top;
    let length = tray._iconBox.get_n_children();
    for (let i = 0; i < length; i++) {
        let button = tray._iconBox.get_child_at_index(0);
        let icon = button.child;
        button.remove_actor(icon);
        button.destroy();

        // Icon already loaded, no need to delay insertion
        onTrayIconAdded(this, icon, '', 0);
    }
}

function moveToTray() {
    separatorLeft.destroy();
    separatorRight.destroy();

    // Restore signal handlers
    if (trayAddedId != 0) {
        tray._trayManager.disconnect(trayAddedId);
        trayAddedId = 0;
    }
    if (trayRemovedId != 0) {
        tray._trayManager.disconnect(trayRemovedId);
        trayRemovedId = 0;
    }
    tray._trayIconAddedId = tray._trayManager.connect(
        'tray-icon-added', Lang.bind(tray, tray._onTrayIconAdded));
    tray._trayIconRemovedId = tray._trayManager.connect(
        'tray-icon-removed', Lang.bind(tray, tray._onTrayIconRemoved));

    // Clean and move each icon back to the Legacy Tray;
    for (let i = 0; i < icons.length; i++) {
        let icon = icons[i];
        if (icon._clicked)
            icon.disconnect(icon._clicked);
        icon._clicked = undefined;
        icon.opacity = 255;
        icon.clear_effects();

        let parent = icon.get_parent();
        parent.remove_actor(icon);
        parent.destroy();

        tray._onTrayIconAdded(tray, icon);
    }
    
    icons = [];
}

function applyPreferences(icon) {
    if (settings.get_boolean('icon-opacity'))
        applyOpacity(icon);
    if (settings.get_boolean('icon-saturation'))
        applySaturation(icon);
}

function applyOpacity(icon) {
    icon.opacity = ICON_OPACITY;

    let parent = icon.get_parent();
    parent.opacityEnterId =
        parent.connect('enter-event', function(actor, event) {
            icon.opacity = 255;
        });
    parent.opacityLeaveId =
        parent.connect('leave-event', function(actor, event) {
            icon.opacity = ICON_OPACITY;
        });
}

function applySaturation(icon) {
    let effect = new Clutter.DesaturateEffect({factor : ICON_DESATURATION});
    icon.add_effect(effect);

    let parent = icon.get_parent();
    parent.saturationEnterId =
        parent.connect('enter-event', function(actor, event) {
            effect.set_factor(0.0);
        });
    parent.saturationLeaveId =
        parent.connect('leave-event', function(actor, event) {
            effect.set_factor(ICON_DESATURATION);
        });
}

function refreshOpacity() {
    if (settings.get_boolean('icon-opacity'))
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            applyOpacity(icon);
        }
    else
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            icon.opacity = 255;

            let parent = icon.get_parent();
            parent.disconnect(parent.opacityEnterId);
            parent.disconnect(parent.opacityLeaveId);
        }
}

function refreshSaturation() {
    if (settings.get_boolean('icon-saturation'))
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            applySaturation(icon);
        }
    else
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            icon.clear_effects();

            let parent = icon.get_parent();
            parent.disconnect(parent.saturationEnterId);
            parent.disconnect(parent.saturationLeaveId);
        }
}

function refreshSize() {
    iconSize = settings.get_int('icon-size');
    for (let i=0; i<icons.length; i++)
        icons[i].set_size(iconSize, iconSize);
}
