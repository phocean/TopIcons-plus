# TopIcons

![Screenshot](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/screenshot.png)

An alternative to GNOME Shell's Legacy Tray, making use of the top panel.

I had a few issues with the original TopIcons extension: it froze when changing the screen geometry, like enable an external monitor. Also, I found a few forks like TopTray with some good ideas, like settings for icon size and colors. So I simply merged them all in a better extension.

## Installation

Pre-Requisite: You need the *make* utility :

<code>
# Debian, Ubuntu
apt-get install make
# RedHad, Fedora
dnf install make
</code>

Download the code to any folder, e.g. <code>/home/$USER/Download</code>, using this command :

<code>
cd /home/$USER/Download
git clone https://github.com/phocean/TopIcons.git</code>

Move to the downloaded folder and execute the installation script:

<code>
cd TopIcons
make
</code>

This moved the extension to <code>~/.local/share/gnome-shell/extensions</code> with the proper naming convention.

Now, reload GNOME Shell with <code>Alt+F2 r Enter</code>.

![Reload Gnome](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/reload-gnome.png)

Finally, launch the *gnome-tweak-tool* utility to enable and configure the extension.

![Enable TopIcons](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/topicons-enable.png)

![Reload Gnome](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/topicons-config.png)

## Compatibility

GNOME Shell 3.16 and up.

## Credits

Many thanks go to Adel Gadllah for making the [original extension](http://94.247.144.115/repo/topicons/) and also to Mjnaderi for the [Toptray fork](https://github.com/mjnaderi/TopTray).

## Notes

The extension is pending review on https://extensions.gnome.org, so hopefully it will be validated so that it is easier to install soon.
