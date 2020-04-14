INSTALL_PATH = ~/.local/share/gnome-shell/extensions
INSTALL_NAME = TopIcons@phocean.net

all: build

install: build
	rm -rf $(INSTALL_PATH)/$(INSTALL_NAME)
	mkdir -p $(INSTALL_PATH)/$(INSTALL_NAME)
	cp -R -p _build/* $(INSTALL_PATH)/$(INSTALL_NAME)
	rm -rf _build
	echo Installed in $(INSTALL_PATH)/$(INSTALL_NAME)

build: compile-schema
	rm -rf _build
	mkdir _build
	cp -P -p locale schemas convenience.js extension.js metadata.json prefs.js README.md _build
	echo Build was successful

compile-schema: ./schemas/org.gnome.shell.extensions.topicons.gschema.xml
	glib-compile-schemas schemas

clean:
	rm -rf _build

uninstall:
	rm -rf $(INSTALL_PATH)/$(INSTALL_NAME)
