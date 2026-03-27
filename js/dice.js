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
    // 3x3 grid for pip placement
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

    // Accumulate rotations to avoid jumps; add extra full spins for visual effect
    var curX = parseFloat(cube.dataset.rotX) || 0;
    var curY = parseFloat(cube.dataset.rotY) || 0;

    // Snap current angles to nearest 360 multiple, then add 720 + target offset
    var baseX = Math.round(curX / 360) * 360;
    var baseY = Math.round(curY / 360) * 360;
    var newX = baseX + 720 + target.x;
    var newY = baseY + 720 + target.y;

    cube.dataset.rotX = newX;
    cube.dataset.rotY = newY;
    cube.style.transform = 'rotateX(' + newX + 'deg) rotateY(' + newY + 'deg)';

    var label = container.parentElement && container.parentElement.querySelector('.dice-label');
    if (label) label.textContent = 'Rolling...';

    setTimeout(function() {
        cube.dataset.rolling = 'false';
        if (label) label.textContent = 'Result: ' + result;
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
    var label = container.parentElement && container.parentElement.querySelector('.dice-label');
    if (label) label.textContent = 'Rolling...';

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
            if (label) label.textContent = 'Result: ' + result;
        }
    }, 50);
}

function spawnDice(type) {
    var table = document.getElementById('table');
    if (!table) return;

    var tableRect = table.getBoundingClientRect();

    // Outer container (positioned on table)
    var outer = document.createElement('div');
    outer.className = 'dice-container';
    outer.dataset.diceType = type;

    // Position near center of table
    var startX = (tableRect.width / 2) - 45 + (Math.random() * 60 - 30);
    var startY = (tableRect.height / 2) - 45 + (Math.random() * 60 - 30);
    outer.style.left = startX + 'px';
    outer.style.top = startY + 'px';

    // Close button
    var closeBtn = document.createElement('span');
    closeBtn.className = 'dice-close';
    closeBtn.textContent = '×';
    closeBtn.title = 'Remove dice';
    outer.appendChild(closeBtn);

    // Dice visual + label wrapper
    var inner = document.createElement('div');
    inner.className = 'dice-inner';
    outer.appendChild(inner);

    var diceEl;
    if (type === 'd6') {
        diceEl = createD6Element();
    } else {
        diceEl = createD20Element();
    }
    inner.appendChild(diceEl);

    var label = document.createElement('div');
    label.className = 'dice-label';
    label.textContent = 'Click to roll';
    outer.appendChild(label);

    table.appendChild(outer);

    // Trigger initial roll
    if (type === 'd6') {
        rollD6(inner);
    } else {
        rollD20(inner);
    }

    // --- Drag logic ---
    var isDragging = false;
    var dragStartX, dragStartY, elStartX, elStartY;
    var dragMoved = false;

    outer.addEventListener('mousedown', function(e) {
        if (e.target === closeBtn) return;
        isDragging = true;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        elStartX = parseInt(outer.style.left, 10) || 0;
        elStartY = parseInt(outer.style.top, 10) || 0;
        outer.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - dragStartX;
        var dy = e.clientY - dragStartY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
        outer.style.left = (elStartX + dx) + 'px';
        outer.style.top = (elStartY + dy) + 'px';
    });

    document.addEventListener('mouseup', function(e) {
        if (!isDragging) return;
        isDragging = false;
        outer.style.cursor = 'grab';
        if (!dragMoved) {
            // Treat as a click — re-roll
            if (e.target !== closeBtn) {
                if (type === 'd6') {
                    rollD6(inner);
                } else {
                    rollD20(inner);
                }
            }
        }
    });

    // Close button
    closeBtn.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        outer.remove();
    });
}
