/*
Copyright (C) phocean <jc@phocean.net>

Credits to:
 - "ag" for the original extension,
 - "Mjnaderi" for the Toptray first fork.

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

let settings = null;
let tray = null;
let trayIconImplementations = null;
let trayAddedId = 0;
let trayRemovedId = 0;
let icons = [];
let iconsBoxLayout = null;
let iconsContainer = null;

function init() { }

function enable() {
    GLib.idle_add(GLib.PRIORITY_LOW, moveToTop);
    tray = Main.legacyTray;
    settings = Convenience.getSettings();
    settings.connect('changed::icon-opacity', Lang.bind(this, refreshOpacity));
    settings.connect('changed::icon-saturation', Lang.bind(this, refreshSaturation));
    settings.connect('changed::icon-brightness', Lang.bind(this, refreshBrightnessContrast));
    settings.connect('changed::icon-contrast', Lang.bind(this, refreshBrightnessContrast));
    settings.connect('changed::icon-size', Lang.bind(this, refreshTray));
    settings.connect('changed::icon-spacing', Lang.bind(this, refreshTray));
    settings.connect('changed::tray-pos', Lang.bind(this, refreshPos));
    settings.connect('changed::tray-order', Lang.bind(this, refreshPos));
}

function disable() {
    moveToTray();
    settings.run_dispose();
}

function onTrayIconAdded(o, icon, role, delay=500) {

    let wmClass = icon.wm_class ? icon.wm_class.toLowerCase() : '';

    // Icon properties
    icon.reactive = true;
    let trayPosition = settings.get_string('tray-pos');
    let trayOrder = settings.get_int('tray-order');
    let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;

    // Container
    let iconContainer = new St.Button({child: icon, visible: false});

    icon.connect("destroy", function() {
        icon.clear_effects();
        iconContainer.destroy();
    });
    iconContainer.connect('button-release-event', function(actor, event) {
        icon.click(event);
    });
    applyPreferences(icon, scaleFactor); // user settings

    iconsBoxLayout.insert_child_at_index(iconContainer, 0);

    // Display icons (with a blacklist filter for specific extension like Skype integration)
    
    let blacklist = [];
    // blacklist: array of uuid and wmClass (icon application name)
    blacklist.push(["skype","SkypeNotification@chrisss404.gmail.com"]);
    // loop through the array and hide the extension if extension X is enabled and corresponding application is running
    for (let i = 0; i < blacklist.length; i++) {
        if (ExtensionUtils.extensions[blacklist[i][1]] !== undefined && ExtensionUtils.extensions[blacklist[i][1]].state == 1 && wmClass == blacklist[i][0]) {
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function()
            {
                iconContainer.visible = false;
                return GLib.SOURCE_REMOVE;
            }));
        }
        else {
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function()
            {
                iconContainer.visible = true;
                iconsContainer.actor.visible = true;
                return GLib.SOURCE_REMOVE;
            }));
        }
    }

    icons.push(icon);
}

function onTrayIconRemoved(o, icon) {
    let parent = icon.get_parent();
    parent.destroy();
    icon.destroy();
    icons.splice(icons.indexOf(icon), 1);

    if (icons.length === 0)
        iconsContainer.actor.visible = false;
}

function widgetNumber() {
    return Main.panel._leftBox.get_n_children();
}

function moveToTop() {
    // Replace signal handlers
    if (tray._trayIconAddedId)
        tray._trayManager.disconnect(tray._trayIconAddedId);
    if (tray._trayIconRemovedId)
        tray._trayManager.disconnect(tray._trayIconRemovedId);
    trayAddedId = tray._trayManager.connect('tray-icon-added', onTrayIconAdded);
    trayRemovedId = tray._trayManager.connect('tray-icon-removed', onTrayIconRemoved);

    // Create box layout for icon containers 
    iconsBoxLayout = new St.BoxLayout();
    let boxLayoutSpacing = settings.get_int('icon-spacing');
    iconsBoxLayout.set_style('spacing: ' + boxLayoutSpacing + 'px;');

    // An empty ButtonBox will still display padding,
    // therefore create it without visibility.
    iconsContainer = new PanelMenu.ButtonBox({visible: false});
    let iconsContainerActor = iconsContainer.actor;
    iconsContainerActor.add_actor(iconsBoxLayout);
    let parent = iconsContainerActor.get_parent();
    if (parent)
        parent.remove_actor(iconsContainerActor);

    // Position
    let trayPosition = settings.get_string('tray-pos');
    let trayOrder = settings.get_int('tray-order');
    if (trayPosition == 'left') {
        let index = Main.panel._leftBox.get_n_children() - trayOrder -1;
        Main.panel._leftBox.insert_child_at_index(iconsContainerActor, index);
    }
    else {
        let index = Main.panel._rightBox.get_n_children() - trayOrder -1;
        Main.panel._rightBox.insert_child_at_index(iconsContainerActor, index);
    }

    // Move each tray icon to the top
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
    // Replace signal handlers
    if (trayAddedId) {
        tray._trayManager.disconnect(trayAddedId);
        trayAddedId = 0;
    }
    if (trayRemovedId) {
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

    // Clean containers
    icons = [];
    if (iconsBoxLayout) {
        iconsBoxLayout.destroy();
        iconsBoxLayout = null;
    }
    if (iconsContainer) {
        if (iconsContainer.actor) {
            iconsContainer.actor.destroy();
            iconsContainer.actor = null;
        }
        iconsContainer = null;
    }
}

// These functions read settings and apply user preferences per icon

function applyPreferences(icon, scaleFactor) {
    applyOpacity(icon);
    applyBrightnessContrast(icon);
    applySaturation(icon);
    applySize(icon, scaleFactor);
}

function applySaturation(icon) {
    let desaturationValue =  settings.get_double('icon-saturation');
    let effect = new Clutter.DesaturateEffect({factor : desaturationValue});
    icon.add_effect(effect);
    effect.set_factor(desaturationValue);
}

function applyBrightnessContrast(icon) {
    let brightnessValue = settings.get_double('icon-brightness');
    let contrastValue =  settings.get_double('icon-contrast');
    let effect = new Clutter.BrightnessContrastEffect({});
    effect.set_brightness(brightnessValue);
    effect.set_contrast(contrastValue);
    icon.add_effect(effect);
}

function applyOpacity(icon) {
    let opacityValue = settings.get_int('icon-opacity');

    // Apply mouse events to iconContainer,
    // since click events are also received by it
    icon.opacityEnterId = icon.get_parent().connect(
        'enter-event', function(actor, event) { icon.opacity = 255; });
    icon.opacityLeaveId = icon.get_parent().connect(
        'leave-event', function(actor, event) { icon.opacity = opacityValue; });
    icon.opacity = opacityValue;
}

function applySize(icon, scaleFactor) {
    let iconSize = settings.get_int('icon-size');
    icon.set_size(iconSize * scaleFactor, iconSize * scaleFactor);
    icon.get_parent().set_size(iconSize * scaleFactor, iconSize * scaleFactor);
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

function refreshBrightnessContrast() {
    for (let i = 0; i < icons.length; i++) {
        let icon = icons[i];
        applyBrightnessContrast(icon);
    }
    refreshTray();
}

function refreshTray() {
    moveToTray();
    moveToTop();
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
