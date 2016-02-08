# TopIcons Plus

![Screenshot 1](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/screenshot.png)

![Screenshot 2](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/screenshot_2.png)

An alternative to GNOME Shell's Legacy Tray, making use of the top panel.

I had a few issues with the original TopIcons extension: it froze when changing the screen geometry, like enable an external monitor. Also, I found a few forks like TopTray with some good ideas, like settings for icon size and colors. So I simply merged them all in a better extension.

## Installation

Pre-Requisite: You need the *make* utility :

```bash
# Debian, Ubuntu
apt-get install make
# RedHad, Fedora
dnf install make
```

Download the code to any folder, e.g. <code>/home/$USER/Downloads</code>, using this command :

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

![Install](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/install.png)

This moved the extension to <code>~/.local/share/gnome-shell/extensions</code> with the proper naming convention.

Now, reload GNOME Shell with <code>Alt+F2 r Enter</code>:

![Reload Gnome](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/reload-gnome.png)

Finally, launch the *gnome-tweak-tool* utility to manage extensions:

![Enable TopIcons](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/gnome-tweak.png)

Enable it:

![Enable TopIcons](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/topicons-enable.png)

You can configure appearance settings (opacity, saturation and icon size):

![Reload Gnome](https://raw.githubusercontent.com/phocean/TopIcons/master/screenshots/topicons-config.png)

## Compatibility

GNOME Shell 3.16 and up.

## Credits

Many thanks go to Adel Gadllah for making the [original extension](http://94.247.144.115/repo/topicons/) and also to Mjnaderi for the [Toptray fork](https://github.com/mjnaderi/TopTray).

## Notes

The extension is pending review on https://extensions.gnome.org, so hopefully it will be validated so that it is easier to install soon.
