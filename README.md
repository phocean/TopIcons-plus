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

### Get it from the extensions website

Point your web browser to the TopIcons Plus page on the [GNOME Shell Extensions website](https://extensions.gnome.org/extension/1031/topicons/). GNOME uses a browser addon, which should have come with your Linux distro, to provide a web interface to the extensions manager on your system. Currently, only Firefox is supported, but support for other browsers is in the works. The first time you visit this website, you should be prompted to enable this browser addon -- [see the FAQs](https://extensions.gnome.org/about/#no-detection) if you have any issues, then go back to the TopIcons Plus page.

All you have to do next is click the switch from off to on.

![Toggle Switch](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/toggle-switch.png)

There will be a GNOME Shell pop-up asking you to confirm that you want to download and install this extension. After that, it may take a moment for the extension to set itself up, but *you* are done. Icons will move from the legacy tray to the top panel on their own.

If you want to tweak the icons' look and feel, you can go to the web page for [Installed Extensions](https://extensions.gnome.org/local/). Click on the wrench-and-screwdriver button to open the TopIcons Plus settings, or click the red X button to uninstall.

![Installed Extensions web page](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/installed-extension-web-page.png)

If you install extensions from the GNOME website like this, be sure to revisit this page occasionally to check for updates.

### Or compile it yourself

Pre-Requisite: You need the *make* utility :

```bash
# Debian, Ubuntu
apt-get install make
# Red Hat, Fedora
dnf install make
```

Download the code to any folder, using git:

```bash
git clone https://github.com/phocean/TopIcons-plus.git
```

Go into the TopIcons Plus project directory and execute the installation script. This will compile the glib schemas and copy all the necessary files to the GNOME Shell extensions directory for your own user account (so you don't need admin privileges to run `make`). By default, TopIcons Plus will live in the directory `~/.local/share/gnome-shell/extensions/TopIcons@phocean.net/`.

```bash
cd TopIcons-plus
make install
```

If you want to install the extension so that it was usable system-wide, you'll have to change the `INSTALL_PATH` variable, and run as root.

```bash
sudo make install INSTALL_PATH=/usr/share/gnome-shell/extensions
```

Now, reload GNOME Shell. You can either hit <kbd>Alt</kbd>+<kbd>F2</kbd>, type `r`, and hit enter --- or login/logout.

![Reload Gnome](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/reload.png)

Finally, launch the *gnome-tweak-tool* utility to manage extensions. There, you can enable *TopIcons Plus* and then tweak its look and feel.

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
