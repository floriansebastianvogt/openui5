/*global QUnit*/

QUnit.config.autostart = false;

/**
 * General consistency checks on designtime metadata of controls in the sap.ui.unified library
 */
sap.ui.require(["sap/ui/dt/test/LibraryTest"], function (LibraryTest) {
	"use strict";
	LibraryTest("sap.ui.unified", QUnit);
});
