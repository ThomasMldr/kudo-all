.PHONY: install
install:
	npm install

.PHONY: lint
lint:
	npm run lint

.PHONY: test
test:
	npm run test

.PHONY: qa
qa: lint test

.PHONY: prepare
prepare:
	mkdir -p build/temp build/artefacts build/bundle
	rm -rf build/temp/*
	npm run bundle
	cp src/manifest.json build/temp/
	cp -r src/icons build/temp/
	cp build/bundle/kudoall.js build/temp/

chrome:
	sed -i 's/"manifest_version": 2/"manifest_version": 3/g' build/temp/manifest.json

.PHONY: zip
zip:
	cd build/temp && zip -rv kudoall.zip .
	zip -T build/temp/kudoall.zip

build.chrome: prepare chrome zip
	cp build/temp/kudoall.zip build/artefacts/kudoall-chrome.zip

build.firefox: prepare zip
	cp build/temp/kudoall.zip build/artefacts/kudoall-firefox.zip
