INSTALL_PATH = ~/.local/share/gnome-shell/extensions
INSTALL_NAME = TopIcons@phocean.net
DESTDIR      = $(INSTALL_PATH)/$(INSTALL_NAME)

install: build
	rm -rf $(DESTDIR)
	mkdir -p $(DESTDIR)
	cp -r --preserve=timestamps _build/* $(DESTDIR)
	rm -rf _build
	echo Installed in $(DESTDIR)

build: compile-schema
	rm -rf _build
	mkdir _build
	cp -r --preserve=timestamps schemas convenience.js extension.js metadata.json prefs.js README.md _build
	echo Build was successfull 

compile-schema: ./schemas/org.gnome.shell.extensions.topicons.gschema.xml
	glib-compile-schemas schemas

clean:
	rm -rf _build
