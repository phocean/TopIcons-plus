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

const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const System = imports.system;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Config = imports.misc.config;

let settings = null;
let tray = null;
let trayIconImplementations = null;
let trayAddedId = 0;
let trayRemovedId = 0;
let icons = [];
let iconsBoxLayout = null;
let iconsContainer = null;
let panelChildSignals = {};
let blacklist = [["skype","SkypeNotification@chrisss404.gmail.com"]]; // blacklist: array of [uuid, wmClass (icon application name)] pairs

function init() { Convenience.initTranslations(); }

function enable() {
    tray = Main.legacyTray;

    if (tray)
        GLib.idle_add(GLib.PRIORITY_LOW, moveToTop);
    else
        GLib.idle_add(GLib.PRIORITY_LOW, createTray);

    settings = Convenience.getSettings();
    settings.connect('changed::icon-opacity', Lang.bind(this, setOpacity));
    settings.connect('changed::icon-saturation', Lang.bind(this, setSaturation));
    settings.connect('changed::icon-brightness', Lang.bind(this, setBrightnessContrast));
    settings.connect('changed::icon-contrast', Lang.bind(this, setBrightnessContrast));
    settings.connect('changed::icon-size', Lang.bind(this, setSize));
    settings.connect('changed::icon-spacing', Lang.bind(this, setSpacing));
    settings.connect('changed::tray-pos', Lang.bind(this, placeTray));
    settings.connect('changed::tray-order', Lang.bind(this, placeTray));

    connectPanelChildSignals();
}

function disable() {
    disconnectPanelChildSignals();
    
    if (Main.legacyTray)
        moveToTray();
    else
        destroyTray();
    settings.run_dispose();
}

function onTrayIconAdded(o, icon, role, delay=1000) {

    // loop through the array and hide the extension if extension X is enabled and corresponding application is running
    let iconWmClass = icon.wm_class ? icon.wm_class.toLowerCase() : '';
    for (let [wmClass, uuid] of blacklist) {
        if (ExtensionUtils.extensions[uuid] !== undefined &&
            ExtensionUtils.extensions[uuid].state === 1 &&
            iconWmClass === wmClass)
            return;
    }

    let iconContainer = new St.Button({child: icon, visible: false});

    icon.connect("destroy", function() {
        icon.clear_effects();
        iconContainer.destroy();
    });

    iconContainer.connect('button-release-event', function(actor, event) {
        icon.click(event);
    });

    GLib.timeout_add(GLib.PRIORITY_DEFAULT, delay, Lang.bind(this, function(){
        iconContainer.visible = true;
        iconsContainer.actor.visible = true;
        return GLib.SOURCE_REMOVE;
    }));

    iconsBoxLayout.insert_child_at_index(iconContainer, 0);
    setIcon(icon);
    icons.push(icon);
}

function onTrayIconRemoved(o, icon) {

    if (icons.indexOf(icon) == -1) {
      return;
    }

    let parent = icon.get_parent();
    if (parent)
         parent.destroy();
    if (!parent || !versionAtLeast('3.30', Config.PACKAGE_VERSION))
	icon.destroy();
    icons.splice(icons.indexOf(icon), 1);

    if (icons.length === 0)
        iconsContainer.actor.visible = false;

}

function onPanelChange(actor, child) {
    if (!iconsBoxLayout || iconsBoxLayout.get_parent() === child)
        return;

    // refresh position on panel left/center/right
    // box add/remove child event
    placeTray();
}

function connectPanelChildSignals() {
    panelChildSignals = {
        left: {
            add: Main.panel._leftBox.connect('actor_added', Lang.bind(this, onPanelChange)),
            del: Main.panel._leftBox.connect('actor_removed', Lang.bind(this, onPanelChange))
        },
        center: {
            add: Main.panel._centerBox.connect('actor_added', Lang.bind(this, onPanelChange)),
            del: Main.panel._centerBox.connect('actor_removed', Lang.bind(this, onPanelChange))
        },
        right: {
            add: Main.panel._rightBox.connect('actor_added', Lang.bind(this, onPanelChange)),
            del: Main.panel._rightBox.connect('actor_removed', Lang.bind(this, onPanelChange))
        }
    }
}

function disconnectPanelChildSignals() {
    Main.panel._leftBox.disconnect(panelChildSignals.left.add);
    Main.panel._leftBox.disconnect(panelChildSignals.left.del);
    Main.panel._centerBox.disconnect(panelChildSignals.center.add);
    Main.panel._centerBox.disconnect(panelChildSignals.center.del);
    Main.panel._rightBox.disconnect(panelChildSignals.right.add);
    Main.panel._rightBox.disconnect(panelChildSignals.right.del);
}

function createIconsContainer() {
    // Create box layout for icon containers
    iconsBoxLayout = new St.BoxLayout();
    setSpacing();

    // An empty ButtonBox will still display padding,therefore create it without visibility.
    iconsContainer = new PanelMenu.ButtonBox({visible: false});
    iconsContainer.actor.add_actor(iconsBoxLayout);
}

function createTray() {
    createIconsContainer();

    tray = new Shell.TrayManager();
    tray.connect('tray-icon-added', onTrayIconAdded);
    tray.connect('tray-icon-removed', onTrayIconRemoved);
    if (global.screen) {
        // For GNOME 3.28 and older
        tray.manage_screen(global.screen, Main.panel.actor);
    } else {
        // For GNOME 3.30+
        tray.manage_screen(Main.panel.actor);
    }
    placeTray();
}

function destroyTray() {
    iconsContainer.actor.destroy();
    iconsContainer = null;
    iconsBoxLayout = null;
    icons = [];

    tray = null;
    System.gc(); // force finalizing tray to unmanage screen
}

function moveToTop() {

    // Replace signal handlers
    if (tray._trayIconAddedId)
        tray._trayManager.disconnect(tray._trayIconAddedId);
    if (tray._trayIconRemovedId)
        tray._trayManager.disconnect(tray._trayIconRemovedId);
    trayAddedId = tray._trayManager.connect('tray-icon-added', onTrayIconAdded);
    trayRemovedId = tray._trayManager.connect('tray-icon-removed', onTrayIconRemoved);

    createIconsContainer();
    placeTray();

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
        if (parent) {
            parent.remove_actor(icon);
            parent.destroy();
        }
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

// Settings

function placeTray() {

    let trayPosition = settings.get_string('tray-pos');
    let trayOrder = settings.get_int('tray-order');

    let parent = iconsContainer.actor.get_parent();
    if (parent)
        parent.remove_actor(iconsContainer.actor);

    // panel box
    let box;
    if (trayPosition == 'left') box = Main.panel._leftBox;
    else if (trayPosition == 'center') box = Main.panel._centerBox;
    else box = Main.panel._rightBox;

    // fix index (trayOrder larger than length)
    let length = box.get_n_children();
    let index = length - Math.min(trayOrder, length);

    box.insert_child_at_index(iconsContainer.actor, index);

}

function setIcon(icon) {

    icon.reactive = true;
    setSize(icon);
    setOpacity(icon);
    setSaturation(icon);
    setBrightnessContrast(icon);

}

function setOpacity(icon) {

    let opacityValue = settings.get_int('icon-opacity');

    if (arguments.length == 1) {
        icon.opacityEnterId = icon.get_parent().connect('enter-event', function(actor, event) { icon.opacity = 255; });
        icon.opacityLeaveId = icon.get_parent().connect('leave-event', function(actor, event) { icon.opacity = opacityValue; });
        icon.opacity = opacityValue;
    } else {
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            icon.opacityEnterId = icon.get_parent().connect('enter-event', function(actor, event) { icon.opacity = 255; });
            icon.opacityLeaveId = icon.get_parent().connect('leave-event', function(actor, event) { icon.opacity = opacityValue; });
            icon.opacity = opacityValue;
        }
    }
}

function setSaturation(icon) {

    let desaturationValue =  settings.get_double('icon-saturation');

    if (arguments.length == 1) {
        let sat_effect = new Clutter.DesaturateEffect({factor : desaturationValue});
        sat_effect.set_factor(desaturationValue);
        sat_effect.set_factor(desaturationValue);
        icon.add_effect_with_name('desaturate', sat_effect);
    } else {
        for (let i = 0; i < icons.length; i++) {
             let icon = icons[i];
             let effect = icon.get_effect('desaturate');
             if (effect)
                effect.set_factor(desaturationValue);
         }
    }

}

function setBrightnessContrast(icon) {

    let brightnessValue = settings.get_double('icon-brightness');
    let contrastValue =  settings.get_double('icon-contrast');

    if (arguments.length == 1) {
        let bright_effect = new Clutter.BrightnessContrastEffect({});
        bright_effect.set_brightness(brightnessValue);
        bright_effect.set_contrast(contrastValue);
        icon.add_effect_with_name('brightness-contrast', bright_effect);
    } else {
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            let effect = icon.get_effect('brightness-contrast')
            effect.set_brightness(brightnessValue);
            effect.set_contrast(contrastValue);
        }
    }

}

function setSize(icon) {

    let iconSize = settings.get_int('icon-size');
    let scaleFactor = St.ThemeContext.get_for_stage(global.stage).scale_factor;

    if (arguments.length == 1) {
        icon.get_parent().set_size(iconSize * scaleFactor, iconSize * scaleFactor);
        icon.set_size(iconSize * scaleFactor, iconSize * scaleFactor);
    } else {
        for (let i = 0; i < icons.length; i++) {
            let icon = icons[i];
            icon.get_parent().set_size(iconSize * scaleFactor, iconSize * scaleFactor);
            icon.set_size(iconSize * scaleFactor, iconSize * scaleFactor);
        }
    }

}

function setSpacing() {

    let boxLayoutSpacing = settings.get_int('icon-spacing');

    iconsBoxLayout.set_style('spacing: ' + boxLayoutSpacing + 'px; margin_top: 2px; margin_bottom: 2px;');

}

// Code copied from PanelOSD extension (GPL 2.0)
function versionAtLeast(atleast, current) {
    let currentArray = current.split('.');
    let major = currentArray[0];
    let minor = currentArray[1];
    let point = currentArray[2];
    let atleastArray = atleast.split('.');
    if ((atleastArray[0] < major) ||
        (atleastArray[0] == major &&
         atleastArray[1] < minor) ||
        (atleastArray[0] == major &&
         atleastArray[1] == minor) &&
        (atleastArray[2] == undefined ||
         atleastArray[2] <= point))
        return true;
    return false;
}
