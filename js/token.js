function addTokensToSelect() {
    $.ajax({
        url: 'https://raw.githubusercontent.com/Cockatrice/Magic-Token/master/tokens.xml',
        type: 'GET', 
        dataType: 'xml',
        success: function(returnedXMLResponse){
            $('card', returnedXMLResponse).each(function(){
                $('<option/>', {
                    'value': $('set', this).attr('picURL'),
                    'text': getTokenName(this)
                }).appendTo('#token-art, #token-select');
            })
        }  
    });
}

function getTokenName(token) {
    var name = $('name', token).text();

    if ($('pt', token).text() !== '') {
        name += " (" + $('pt', token).text() + ")";
    }

    name += " " + $('color', token).text();
    return name;
}

function setupTokens() {
    addTokensToSelect();

    $('#token-select')
        .off('change')
        .on('change', function() {
            switch (this.value) {
                case "-1":
                    break;
                case "0":
                    $('#tokenModal').modal('show');
                    break;
                default:
                    createCard({
                        backgroundImage: this.value,
                        imageUrlBack: "img/backside.jpg",
                        goldfishId: createGoldfishId(),
                        layout: "token"
                    }).appendTo("#table");
                    bindCardActions();
                    break;
            }
        });
}

function createToken(name, rules, powerToughness, backgroundImage, color) {
    var token = createCard({layout: "token"});

    token.children(".front")[0].style.backgroundImage = `url('${backgroundImage}')`;

    $('<div/>')
        .addClass("mtg-card-token-frame-" + color)
        .addClass("mtg-card-side")
        .appendTo(token.children(".front"));

    $('<div/>')
        .addClass("mtg-card-token-name")
        .html(name)
        .appendTo(token.children(".front"));

    $('<div/>')
        .addClass("mtg-card-token-type")
        .html(name)
        .appendTo(token.children(".front"));

    $('<div/>')
        .addClass("mtg-card-token-rules")
        .html(rules)
        .appendTo(token.children(".front"));

    $('<div/>')
        .addClass("mtg-card-token-powerToughness")
        .html(powerToughness)
        .appendTo(token.children(".front"));

    return token;
}

function addCustomToken() {
    createToken(
        $("#token-name").val(),
        $("#token-rules").val(),
        $("#token-powerToughness").val(),
        $("#token-art").val(),
        $("#token-color").val())
        .appendTo("#table");

    $('#tokenModal').modal('hide');
    
    bindCardActions();
}