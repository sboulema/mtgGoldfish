// Dice roller: d6 (3D cube) and d20 (polygon with number animation)

// d6 face rotations: which rotateX/Y to apply to the cube so that face N faces the viewer
var D6_FACES = {
    1: { x: 0,   y: 0   },
    2: { x: 0,   y: -90 },
    3: { x: 90,  y: 0   },
    4: { x: -90, y: 0   },
    5: { x: 0,   y: 90  },
    6: { x: 0,   y: 180 }
};

// Dot layouts for each face (grid positions: row 0-2, col 0-2)
var D6_PIPS = {
    1: [[1,1]],
    2: [[0,0],[2,2]],
    3: [[0,0],[1,1],[2,2]],
    4: [[0,0],[0,2],[2,0],[2,2]],
    5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
    6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]]
};

function buildD6Face(n) {
    var face = document.createElement('div');
    face.className = 'dice-face';
    var grid = document.createElement('div');
    grid.className = 'dice-pip-grid';
    for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 3; c++) {
            var cell = document.createElement('div');
            cell.className = 'dice-pip-cell';
            var hasPip = D6_PIPS[n].some(function(p) { return p[0] === r && p[1] === c; });
            if (hasPip) {
                var pip = document.createElement('div');
                pip.className = 'pip';
                cell.appendChild(pip);
            }
            grid.appendChild(cell);
        }
    }
    face.appendChild(grid);
    return face;
}

function createD6Element() {
    var wrapper = document.createElement('div');
    wrapper.className = 'dice-perspective';

    var cube = document.createElement('div');
    cube.className = 'dice-d6';
    cube.dataset.rotX = 0;
    cube.dataset.rotY = 0;

    var faceClasses = ['face-front','face-back','face-right','face-left','face-top','face-bottom'];
    // face values: front=1, back=6, right=5, left=2, top=3, bottom=4
    var faceValues = [1, 6, 5, 2, 3, 4];
    faceClasses.forEach(function(cls, i) {
        var face = buildD6Face(faceValues[i]);
        face.classList.add(cls);
        cube.appendChild(face);
    });

    wrapper.appendChild(cube);
    return wrapper;
}

function rollD6(container) {
    var cube = container.querySelector('.dice-d6');
    if (cube.dataset.rolling === 'true') return;
    cube.dataset.rolling = 'true';

    var result = Math.floor(Math.random() * 6) + 1;
    var target = D6_FACES[result];

    var curX = parseFloat(cube.dataset.rotX) || 0;
    var curY = parseFloat(cube.dataset.rotY) || 0;

    var baseX = Math.round(curX / 360) * 360;
    var baseY = Math.round(curY / 360) * 360;
    var newX = baseX + 720 + target.x;
    var newY = baseY + 720 + target.y;

    cube.dataset.rotX = newX;
    cube.dataset.rotY = newY;
    cube.style.transform = 'rotateX(' + newX + 'deg) rotateY(' + newY + 'deg)';

    setTimeout(function() {
        cube.dataset.rolling = 'false';
    }, 1050);
}

function createD20Element() {
    var shape = document.createElement('div');
    shape.className = 'dice-d20';

    var num = document.createElement('span');
    num.className = 'dice-d20-number';
    num.textContent = '?';
    shape.appendChild(num);

    return shape;
}

function rollD20(container) {
    var shape = container.querySelector('.dice-d20');
    var num = shape.querySelector('.dice-d20-number');
    if (shape.dataset.rolling === 'true') return;
    shape.dataset.rolling = 'true';

    var result = Math.floor(Math.random() * 20) + 1;

    shape.classList.add('rolling');

    var cycles = 0;
    var maxCycles = 20;
    var interval = setInterval(function() {
        num.textContent = Math.floor(Math.random() * 20) + 1;
        cycles++;
        if (cycles >= maxCycles) {
            clearInterval(interval);
            shape.classList.remove('rolling');
            num.textContent = result;
            shape.dataset.rolling = 'false';
        }
    }, 50);
}

// Shows a small context menu near the cursor for the given dice container
function showDiceContextMenu(outer, inner, clientX, clientY) {
    // Remove any existing context menu
    var existing = document.getElementById('dice-context-menu');
    if (existing) existing.remove();

    var menu = document.createElement('div');
    menu.id = 'dice-context-menu';
    menu.className = 'dice-context-menu';
    menu.style.left = (clientX + 4) + 'px';
    menu.style.top  = (clientY + 4) + 'px';

    function closeMenu() { menu.remove(); }

    // Option 1: Remove die
    var itemRemove = document.createElement('div');
    itemRemove.className = 'dice-context-menu-item';
    itemRemove.textContent = 'Remove die';
    itemRemove.addEventListener('click', function() {
        outer.remove();
        closeMenu();
    });
    menu.appendChild(itemRemove);

    // Option 2: Switch type
    var currentType = outer.dataset.diceType;
    var otherType   = currentType === 'd6' ? 'd20' : 'd6';
    var itemSwitch  = document.createElement('div');
    itemSwitch.className = 'dice-context-menu-item';
    itemSwitch.textContent = 'Change to ' + otherType;
    itemSwitch.addEventListener('click', function() {
        inner.innerHTML = '';
        var newEl = otherType === 'd6' ? createD6Element() : createD20Element();
        inner.appendChild(newEl);
        outer.dataset.diceType = otherType;
        var label = outer.querySelector('.dice-label');
        if (label) label.textContent = 'Klik om te rollen';
        if (otherType === 'd6') rollD6(inner); else rollD20(inner);
        closeMenu();
    });
    menu.appendChild(itemSwitch);

    document.body.appendChild(menu);

    // Close on outside click (next event loop so this click doesn't immediately close it)
    setTimeout(function() {
        function onOutsideClick(e) {
            if (!menu.contains(e.target)) {
                closeMenu();
                document.removeEventListener('mousedown', onOutsideClick);
                document.removeEventListener('keydown', onEscape);
            }
        }
        function onEscape(e) {
            if (e.key === 'Escape') {
                closeMenu();
                document.removeEventListener('mousedown', onOutsideClick);
                document.removeEventListener('keydown', onEscape);
            }
        }
        document.addEventListener('mousedown', onOutsideClick);
        document.addEventListener('keydown', onEscape);
    }, 0);
}

function createCoinElement() {
    var wrapper = document.createElement('div');
    wrapper.className = 'coin-perspective';

    var coin = document.createElement('div');
    coin.className = 'coin';
    coin.dataset.rotY = '0';

    var heads = document.createElement('div');
    heads.className = 'coin-face coin-heads';
    heads.textContent = 'H';

    var tails = document.createElement('div');
    tails.className = 'coin-face coin-tails';
    tails.textContent = 'T';

    coin.appendChild(heads);
    coin.appendChild(tails);
    wrapper.appendChild(coin);
    return wrapper;
}

function flipCoin(container) {
    var coin = container.querySelector('.coin');
    if (coin.dataset.flipping === 'true') return;
    coin.dataset.flipping = 'true';

    var result = Math.random() < 0.5 ? 'heads' : 'tails';
    var currentRot = parseFloat(coin.dataset.rotY) || 0;

    var baseRot = Math.round(currentRot / 360) * 360;
    var landing = result === 'heads' ? 0 : 180;
    var newRot = baseRot + 1800 + landing;

    coin.dataset.rotY = newRot;
    coin.style.transform = 'rotateY(' + newRot + 'deg)';

    setTimeout(function() {
        coin.dataset.flipping = 'false';
    }, 1050);
}

function showCoinContextMenu(outer, clientX, clientY) {
    var existing = document.getElementById('dice-context-menu');
    if (existing) existing.remove();

    var menu = document.createElement('div');
    menu.id = 'dice-context-menu';
    menu.className = 'dice-context-menu';
    menu.style.left = (clientX + 4) + 'px';
    menu.style.top  = (clientY + 4) + 'px';

    function closeMenu() { menu.remove(); }

    var itemRemove = document.createElement('div');
    itemRemove.className = 'dice-context-menu-item';
    itemRemove.textContent = 'Remove coin';
    itemRemove.addEventListener('click', function() {
        outer.remove();
        closeMenu();
    });
    menu.appendChild(itemRemove);

    document.body.appendChild(menu);

    setTimeout(function() {
        function onOutsideClick(e) {
            if (!menu.contains(e.target)) {
                closeMenu();
                document.removeEventListener('mousedown', onOutsideClick);
                document.removeEventListener('keydown', onEscape);
            }
        }
        function onEscape(e) {
            if (e.key === 'Escape') {
                closeMenu();
                document.removeEventListener('mousedown', onOutsideClick);
                document.removeEventListener('keydown', onEscape);
            }
        }
        document.addEventListener('mousedown', onOutsideClick);
        document.addEventListener('keydown', onEscape);
    }, 0);
}

function spawnCoin() {
    var table = document.getElementById('table');
    if (!table) return;

    var tableRect = table.getBoundingClientRect();

    var outer = document.createElement('div');
    outer.className = 'dice-container';
    outer.dataset.diceType = 'coin';

    var startX = (tableRect.width / 2) - 40 + (Math.random() * 60 - 30);
    var startY = (tableRect.height / 2) - 40 + (Math.random() * 60 - 30);
    outer.style.left = startX + 'px';
    outer.style.top  = startY + 'px';

    var inner = document.createElement('div');
    inner.className = 'dice-inner';
    outer.appendChild(inner);

    inner.appendChild(createCoinElement());
    table.appendChild(outer);

    // Initial flip
    flipCoin(inner);

    // Drag logic
    var isDragging = false;
    var dragStartX, dragStartY, elStartX, elStartY;
    var dragMoved = false;

    outer.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        isDragging = true;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        elStartX = parseInt(outer.style.left, 10) || 0;
        elStartY = parseInt(outer.style.top,  10) || 0;
        outer.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - dragStartX;
        var dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
        outer.style.left = (elStartX + dx) + 'px';
        outer.style.top  = (elStartY + dy) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;
        outer.style.cursor = 'grab';
        if (!dragMoved) {
            flipCoin(inner);
        }
    });

    // Right-click → context menu
    outer.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showCoinContextMenu(outer, e.clientX, e.clientY);
    });
}

function spawnDice(type) {
    var table = document.getElementById('table');
    if (!table) return;

    var tableRect = table.getBoundingClientRect();

    var outer = document.createElement('div');
    outer.className = 'dice-container';
    outer.dataset.diceType = type;

    var startX = (tableRect.width / 2) - 45 + (Math.random() * 60 - 30);
    var startY = (tableRect.height / 2) - 45 + (Math.random() * 60 - 30);
    outer.style.left = startX + 'px';
    outer.style.top  = startY + 'px';

    // Dice visual wrapper
    var inner = document.createElement('div');
    inner.className = 'dice-inner';
    outer.appendChild(inner);

    var diceEl = type === 'd6' ? createD6Element() : createD20Element();
    inner.appendChild(diceEl);

    table.appendChild(outer);

    // Initial roll
    if (type === 'd6') rollD6(inner); else rollD20(inner);

    // --- Drag logic ---
    var isDragging = false;
    var dragStartX, dragStartY, elStartX, elStartY;
    var dragMoved = false;

    outer.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return; // only left button drags
        isDragging = true;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        elStartX = parseInt(outer.style.left, 10) || 0;
        elStartY = parseInt(outer.style.top,  10) || 0;
        outer.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - dragStartX;
        var dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
        outer.style.left = (elStartX + dx) + 'px';
        outer.style.top  = (elStartY + dy) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;
        outer.style.cursor = 'grab';
        if (!dragMoved) {
            // Left-click without drag → re-roll
            var ct = outer.dataset.diceType;
            if (ct === 'd6') rollD6(inner); else rollD20(inner);
        }
    });

    // Right-click → context menu
    outer.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showDiceContextMenu(outer, inner, e.clientX, e.clientY);
    });
}
