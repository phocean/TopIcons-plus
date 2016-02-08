// -*- mode: js; js-indent-level: 4; indent-tabs-mode: nil -*-

const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

let settings = null;

let tray = null;
let trayIconImplementations = [];
let trayAddedId = 0;
let trayRemovedId = 0;
let icons = [];
// Separators provide extra padding between tray icons and panel buttons
let separatorLeft = null;
let separatorRight = null;

function init() {
    settings = Convenience.getSettings();
}

function enable() {
    GLib.idle_add(GLib.PRIORITY_LOW, moveToTop);
    tray = Main.legacyTray;
    trayIconImplementations = imports.ui.legacyTray.STANDARD_TRAY_ICON_IMPLEMENTATIONS;
    settings.connect('changed::icon-opacity', Lang.bind(this, refreshOpacity));
    settings.connect('changed::icon-saturation', Lang.bind(this, refreshSaturation));
    settings.connect('changed::icon-size', Lang.bind(this, refreshSize));
    settings.connect('changed::icon-padding', Lang.bind(this, refreshTray));
    settings.connect('changed::tray-pos', Lang.bind(this, refreshPos));
    settings.connect('changed::tray-order', Lang.bind(this, refreshPos));
}

function disable() {
    moveToTray();
    settings.run_dispose();
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
    icon.reactive = true;
    let trayPosition = settings.get_string('tray-pos');
    let trayOrder = settings.get_int('tray-order');

    let iconContainer = new St.Button({child: icon, visible: false});
    applyPadding(iconContainer);

    icon.connect("destroy", function() {
        icon.clear_effects();
        iconContainer.destroy();
    });
    iconContainer.connect('button-release-event', function(actor, event) {
        icon.click(event);
    });
    
    // Apply user settings
    applyPreferences(icon);
    
    // Insert icon container before right separator
    if (trayPosition == 'left') {
        let index = Main.panel._leftBox.get_n_children() - trayOrder -1;
        Main.panel._leftBox.insert_child_at_index(iconContainer, index);
    }
    else {
        let index = Main.panel._rightBox.get_n_children() - trayOrder -1;
        Main.panel._rightBox.insert_child_at_index(iconContainer, index);
    }

    // Display icons (with a blacklist filter for specific extension like Skype integration)
    let blacklist = [];
    // blacklist: array of uuid and wmClass (icon application name)
    blacklist.push(["skype","SkypeNotification@chrisss404.gmail.com"]);
    // loop through the array and hide the extension if extension X is enabled and corresponding application is running
    for (let i = 0; i < blacklist.length; i++) {
        if (imports.misc.extensionUtils.extensions[blacklist[i][1]] !== undefined) {
            if(wmClass == blacklist[i][0] && imports.misc.extensionUtils.extensions[blacklist[i][1]].state == 1) {
                // Some icons won't appear on application start. As a workaround, 
                // we delay their visibility.
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function() {
                    iconContainer.visible = false;
                    separatorLeft.visible = false;
                    separatorRight.visible = false;
                    return GLib.SOURCE_REMOVE;
                }));
            }
            else {
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function() {
                    iconContainer.visible = true;
                    separatorLeft.visible = true;
                    separatorRight.visible = true;
                    return GLib.SOURCE_REMOVE;
                }));
            }
        }
        else {
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function() {
                    iconContainer.visible = true;
                    separatorLeft.visible = true;
                    separatorRight.visible = true;
                    return GLib.SOURCE_REMOVE;
                }));
        }
    }
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
    let trayPosition = settings.get_string('tray-pos'); 
    let trayOrder = settings.get_int('tray-order');

    // 8px = 12px (panel button padding) - 4px (icon container padding)
    separator.set_style('width: 8px;'); 

    if (trayPosition == 'left') {
        let index = Main.panel._leftBox.get_n_children() - trayOrder;
        Main.panel._leftBox.insert_child_at_index(separator, index);
    }
    else {
        let index = Main.panel._rightBox.get_n_children() - trayOrder;
        Main.panel._rightBox.insert_child_at_index(separator, index);
    }
    
    return separator;
}

function widgetNumber() {
    return Main.panel._leftBox.get_n_children();
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
        icon.opacity = 255;
        icon.clear_effects();

        let parent = icon.get_parent();
        parent.remove_actor(icon);
        parent.destroy();

        tray._onTrayIconAdded(tray, icon);
    }
        
    icons = [];
}

// These functions read settings and apply user preferences per icon

function applyPreferences(icon) {
    applyOpacity(icon);
    applySaturation(icon);
    applySize(icon);
}

function applySaturation(icon) {
    let desaturationValue =  settings.get_double('icon-saturation');
    let effect = new Clutter.DesaturateEffect({factor : desaturationValue});
    icon.add_effect(effect);
    effect.set_factor(desaturationValue);
}

function applyOpacity(icon) {
    let opacityValue = settings.get_int('icon-opacity');
    icon.opacityEnterId = icon.connect('enter-event', function(actor, event) {
        icon.opacity = 255;
    });
    icon.opacityLeaveId = icon.connect('leave-event', function(actor, event) {
        icon.opacity = opacityValue;
    });
    icon.opacity = opacityValue;
}

function applySize(icon) {
    let iconSize = settings.get_int('icon-size');
    icon.set_size(iconSize, iconSize)
}

function applyPadding(iconContainer) {
    let paddingValue = settings.get_int('icon-padding');
    iconContainer.set_style('padding: 0px ' + paddingValue + 'px;');
}

// These functions are called by signals on preference change and loop through icons to apply it

function refreshOpacity() {
    for (let i = 0; i < icons.length; i++) {
        let icon = icons[i];
        applyOpacity(icon);
    }
}

function refreshSaturation() {
    for (let i = 0; i < icons.length; i++) {
        let icon = icons[i];
        applySaturation(icon);
    }
    refreshTray();
}

function refreshSize() {
    let iconSize = settings.get_int('icon-size');
    for (let i=0; i<icons.length; i++)
        applySize(icons[i]);
}

function refreshTray() {
    moveToTray();
    moveToTop()
}

function refreshPos() {
    let trayPosition = settings.get_string('tray-pos');
    let value = settings.get_int('tray-order');

    // Dirty hack but could not find how to access Main items from prefs.js to set a dynamic max value for the current tray
    if (trayPosition == 'left') {
        if (value >= Main.panel._leftBox.get_n_children()) {
            value = 0;
            settings.set_int('tray-order',value);
        }
    }
    else {
        if (value >= Main.panel._rightBox.get_n_children()) {
            value = 0;
            settings.set_int('tray-order',value);
        }
    }
    refreshTray();
}
