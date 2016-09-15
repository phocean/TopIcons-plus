# TopIcons Plus

## Introduction

Topicons Plus is an alternative to the Gnome Shell Legacy Tray, which is hidden most of the time and generally considered inconvenient.

It brings all icons to back to the top panel, as with most desktop environments.

With colors:

![Tray](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/tray1.png)

Grayscale alternative (desaturation setting):

![Tray](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/tray2.png)

There were an original TopIcons extension for that, but it stopped being maintained and it had a few issues and little configuration options.
Thus, this fork.

Before (standard Gnome legacy tray, bottom left):

![Before](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/before.png)

After:

![After](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/after.png)

Enjoy it!


## Installation

Pre-Requisite: You need the *make* utility :

```bash
# Debian, Ubuntu
apt-get install make
# RedHad, Fedora
dnf install make
```

Download the code to any folder, e.g. <code>/home/$USER/Downloads</code>, using these commands :

```bash
cd /home/$USER/Downloads
git clone https://github.com/phocean/TopIcons.git
```

Move to the downloaded folder and execute the installation script:

```bash
cd TopIcons
make
```

The whole process should look similar to this:

```bash
% make
glib-compile-schemas schemas
rm -rf _build
mkdir _build
cp -r schemas convenience.js extension.js metadata.json prefs.js README.md _build
echo Build was successfull 
Build was successfull
rm -rf ~/.local/share/gnome-shell/extensions/TopIcons@phocean.net
mkdir -p ~/.local/share/gnome-shell/extensions/TopIcons@phocean.net
cp -r _build/* ~/.local/share/gnome-shell/extensions/TopIcons@phocean.net
rm -rf _build
echo Installed in ~/.local/share/gnome-shell/extensions/TopIcons@phocean.net
Installed in /home/phocean/.local/share/gnome-shell/extensions/TopIcons@phocean.net
% 
```

To avoid any Gnome update issue ([see the official statement](https://git.gnome.org/browse/gnome-shell/commit/?id=5e0e3ed)), make sure that version check is disabled:

```bash
gsettings set org.gnome.shell disable-extension-version-validation "true"
```


This moved the extension to <code>~/.local/share/gnome-shell/extensions</code> with the proper naming convention.

Now, reload GNOME Shell with <code>Alt+F2</code> and then <code>r</code> or login/logout.

![Reload Gnome](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/reload.png)

Finally, launch the *gnome-tweak-tool* utility to manage extensions.
There, you can enable *TopIcons Plus* and then tweak its appearance settings:

![Enable TopIcons](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/tweak.png)

## Compatibility

GNOME Shell 3.16 and up.

## Changelog

v16:

* Updated Gnome version support
* Documentation updates
* Minor changes to the icon box layout (margin)

## Known issues

### Dropbox

The Dropbox notification icon sometimes trashes the tray (also buggy with the Gnome legacy tray).

You can restore the tray by reloading Gnome-shell (ALT-F2, r).

On a longer term, you can solve this problem using:

- *systemd* to launch Dropbox (instead of as a Gnome startup application),
- rely on the *Dropbox nautilus extension* to get a visual feedback on the synchronization status.

Here is the systemd script to run it in the user context (thanks @robolange for the tip):

```bash
$ cat ~/.config/systemd/user/dropbox.service
[Unit]
Description=Dropbox Service

[Service]
Type=forking
ExecStart=/usr/bin/dropbox start
ExecStop=/usr/bin/dropbox stop
PIDFile=${HOME}/.dropbox/dropbox.pid
Restart=on-failure
RestartSec=5
StartLimitInterval=60s
StartLimitBurst=3

[Install]
WantedBy=default.target
```

Which you can enable with these commands:

```bash
systemctl --user enable dropbox
systemctl --user start dropbox
```


## Credits

Many thanks go to Adel Gadllah for making the [original extension](http://94.247.144.115/repo/topicons/) and also to Mjnaderi for the [Toptray fork](https://github.com/mjnaderi/TopTray).

Also, thanks to all contributors (code and issues), and especially to [nevesnunes](https://github.com/nevesnunes) for the very nice code improvements he brought up!

## Notes

The extension is pending review on https://extensions.gnome.org, so hopefully it will be validated so that it is easier to install soon.
