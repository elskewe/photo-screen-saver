/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *
 *  Redistribution and use in source and binary forms, with or without
 *  modification, are permitted provided that the following conditions are met:
 *
 *  Redistributions of source code must retain the above copyright notice,
 *  this list of conditions and the following disclaimer.
 *
 *  Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation
 *  and/or other materials provided with the distribution.
 *
 *  Neither the name of the copyright holder nor the names of its contributors
 *  may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 *  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 *  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 *  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 *  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 *  OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 *  OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 *  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function() {
	'use strict';

	/**
	 * A photo for the screen saver
	 * @param {String} name - unique name
	 * @param {Object} source - source item
	 * @constructor
	 * @alias Photo
	 */
	const Photo = function(name, source) {
		this.name = name;
		this.path = source.url;
		this.author = source.author ? source.author : '';
		this.type = source.type;
		this.aspectRatio = source.asp;
		this.ex = source.ex;
		this.width = screen.width;
		this.height = screen.height;
		this.label = this.buildLabel(false);
	};

	/**
	 * Create the photo label
	 * @param {Boolean} force - require display of label if true
	 * @return {String} label describing the photo source and photographer name
	 */
	Photo.prototype.buildLabel = function(force) {
		let ret = '';
		let type = this.type;
		const idx = this.type.search('User');

		if (!force && !app.Utils.getBool('showPhotog') && (idx !== -1)) {
			// don't show label for user's own photos, if requested
			return ret;
		}

		if (idx !== -1) {
			// strip off 'User'
			type = this.type.substring(0, idx - 1);
		}

		if (this.author) {
			ret = `${this.author} / ${type}`;
		} else {
			// no photographer name
			ret = `Photo from ${type}`;
		}
		return ret;
	};

	/**
	 * Determine if a photo would look bad zoomed or stretched on the screen
	 * @param {Number} asp aspect ratio of photo
	 * @param {number} screenAsp - the screen aspect ratio
	 * @return {boolean} true if a photo aspect ratio differs substantially
	 * from the screens'
	 * @private
	 */
	Photo._isBadAspect = function(asp, screenAsp) {
		// arbitrary
		const CUT_OFF = 0.5;
		return (asp < screenAsp - CUT_OFF) || (asp > screenAsp + CUT_OFF);
	};

	/**
	 * Determine if a photo should not be displayed
	 * @param {number} asp - aspect ratio
	 * @param {number} screenAsp - the screen aspect ratio
	 * @param {int} photoSizing - the sizing type
	 * @return {Boolean} true if the photo should not be displayed
	 */
	Photo.ignore = function(asp, screenAsp, photoSizing) {
		let ret = false;
		const skip = app.Utils.getBool('skip');

		if ((!asp || isNaN(asp)) ||
			(skip && ((photoSizing === 1) || (photoSizing === 3)) &&
			Photo._isBadAspect(asp, screenAsp))) {
			// ignore photos that don't have aspect ratio
			// or would look bad with cropped or stretched sizing options
			ret = true;
		}
		return ret;
	};

	/**
	 * Create a new tab with a link to the
	 * original source of the current photo, if possible
	 * @param {object} item - a photo item
	 */
	Photo.showSource = function(item) {
		if (!item) {
			return;
		}
		const path = item.path;
		const extra = item.ex;
		let regex;
		let id;
		let url;

		switch (item.type) {
			case '500':
				// parse photo id
				regex = /(\/[^\/]*){4}/;
				id = path.match(regex);
				url = `http://500px.com/photo${id[1]}`;
				chrome.tabs.create({url: url});
				break;
			case 'flickr':
				if (extra) {
					// parse photo id
					regex = /(\/[^\/]*){4}(_.*_)/;
					id = path.match(regex);
					url = `https://www.flickr.com/photos/${item.ex}${id[1]}`;
					chrome.tabs.create({url: url});
				}
				break;
			case 'reddit':
				if (extra) {
					chrome.tabs.create({url: item.ex});
				}
				break;
			default:
				break;
		}
	};

	window.app = window.app || {};
	app.Photo = Photo;
})(window);