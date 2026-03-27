function addTokensToSelect() {
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 10000);

    fetch('https://raw.githubusercontent.com/Cockatrice/Magic-Token/master/tokens.xml', { signal: controller.signal })
        .then(function(response) {
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.text();
        })
        .then(function(text) {
            var parser = new DOMParser();
            var xml = parser.parseFromString(text, 'text/xml');
            var tokenArt = document.getElementById('token-art');
            var tokenSelect = document.getElementById('token-select');

            // Remove previously loaded token options to prevent duplicates on restart
            while (tokenSelect.options.length > 2) tokenSelect.remove(2);
            while (tokenArt.options.length > 0) tokenArt.remove(0);

            xml.querySelectorAll('card').forEach(function(card) {
                var setEl = card.querySelector('set');
                if (!setEl) return;

                var option = document.createElement('option');
                option.value = setEl.getAttribute('picURL');
                option.textContent = getTokenName(card);
                tokenArt.appendChild(option.cloneNode(true));
                tokenSelect.appendChild(option);
            });
        })
        .catch(function(err) {
            clearTimeout(timeoutId);
            console.warn('Failed to load token list:', err.message);
        });
}

function getTokenName(token) {
    var nameEl = token.querySelector('name');
    var name = nameEl ? nameEl.textContent : '';

    var ptEl = token.querySelector('pt');
    if (ptEl && ptEl.textContent !== '') {
        name += " (" + ptEl.textContent + ")";
    }

    var colorEl = token.querySelector('color');
    if (colorEl) {
        name += " " + colorEl.textContent;
    }

    return name;
}

var tokenChangeHandler = null;

function setupTokens() {
    addTokensToSelect();

    var tokenSelect = document.getElementById('token-select');
    if (tokenChangeHandler) {
        tokenSelect.removeEventListener('change', tokenChangeHandler);
    }
    tokenChangeHandler = function() {
        switch (this.value) {
            case "-1":
                break;
            case "0":
                bootstrap.Modal.getOrCreateInstance(document.getElementById('tokenModal')).show();
                break;
            default:
                var card = createCard({
                    backgroundImage: this.value,
                    imageUrlBack: "img/card-backside-mint.jpg",
                    goldfishId: createGoldfishId(),
                    layout: "token"
                });
                document.getElementById('table').appendChild(card);
                bindCardActions();
                break;
        }
    };
    tokenSelect.addEventListener('change', tokenChangeHandler);
}

function createToken(name, rules, powerToughness, backgroundImage, color) {
    var token = createCard({layout: "token"});

    var front = token.querySelector(".front");
    front.style.backgroundImage = "url('" + backgroundImage + "')";

    var frame = document.createElement('div');
    frame.className = "mtg-card-token-frame-" + color.toLowerCase();
    front.appendChild(frame);

    var nameDiv = document.createElement('div');
    nameDiv.className = "mtg-card-token-name";
    nameDiv.textContent = name;
    front.appendChild(nameDiv);

    var typeDiv = document.createElement('div');
    typeDiv.className = "mtg-card-token-type";
    typeDiv.textContent = name;
    front.appendChild(typeDiv);

    var rulesDiv = document.createElement('div');
    rulesDiv.className = "mtg-card-token-rules";
    rulesDiv.textContent = rules;
    front.appendChild(rulesDiv);

    var ptDiv = document.createElement('div');
    ptDiv.className = "mtg-card-token-powerToughness";
    ptDiv.textContent = powerToughness;
    front.appendChild(ptDiv);

    return token;
}

function addCustomToken() {
    var token = createToken(
        document.getElementById("token-name").value,
        document.getElementById("token-rules").value,
        document.getElementById("token-powerToughness").value,
        document.getElementById("token-art").value,
        document.getElementById("token-color").value);
    document.getElementById('table').appendChild(token);

    bootstrap.Modal.getOrCreateInstance(document.getElementById('tokenModal')).hide();

    bindCardActions();
}
