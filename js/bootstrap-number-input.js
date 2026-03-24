
/* ========================================================================
 * bootstrap-spin - v1.0
 * https://github.com/wpic/bootstrap-spin
 * ========================================================================
 * Copyright 2014 WPIC, Hamed Abdollahpour
 *
 * ========================================================================
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================================
 */

function bootstrapNumber(element, options) {
	var settings = Object.assign({
		upClass: 'default',
		downClass: 'default',
		upText: '+',
		downText: '-',
		center: true
	}, options);

	var clone = element.cloneNode(true);

	var min = element.getAttribute('min');
	var max = element.getAttribute('max');
	var step = parseInt(element.getAttribute('step')) || 1;

	function setText(n) {
		if (isNaN(n) || (min && n < min) || (max && n > max)) {
			return false;
		}

		clone.focus();
		clone.value = n;
		clone.dispatchEvent(new Event('change'));
		return true;
	}

	var group = document.createElement('div');
	group.className = 'input-group';

	var down = document.createElement('button');
	down.type = 'button';
	down.className = 'btn btn-' + settings.downClass;
	down.textContent = settings.downText;
	down.addEventListener('click', function() {
		setText(parseInt(clone.value || clone.getAttribute('value')) - step);
	});

	var up = document.createElement('button');
	up.type = 'button';
	up.className = 'btn btn-' + settings.upClass;
	up.textContent = settings.upText;
	up.addEventListener('click', function() {
		setText(parseInt(clone.value || clone.getAttribute('value')) + step);
	});

	var spanDown = document.createElement('span');
	spanDown.className = 'input-group-btn';
	spanDown.appendChild(down);

	var spanUp = document.createElement('span');
	spanUp.className = 'input-group-btn';
	spanUp.appendChild(up);

	group.appendChild(spanDown);
	group.appendChild(clone);
	if (settings.center) {
		clone.style.textAlign = 'center';
	}
	group.appendChild(spanUp);

	// remove spins from original
	clone.type = 'text';
	clone.addEventListener('keydown', function(e) {
		var allowedKeys = [46, 8, 9, 27, 13, 110, 190];
		if (allowedKeys.indexOf(e.keyCode) !== -1 ||
			(e.keyCode == 65 && e.ctrlKey === true) ||
			(e.keyCode >= 35 && e.keyCode <= 39)) {
			return;
		}
		if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
			e.preventDefault();
		}

		var c = String.fromCharCode(e.which);
		var n = parseInt(clone.value + c);

		if ((min && n < min) || (max && n > max)) {
			e.preventDefault();
		}
	});

	element.replaceWith(group);
}
