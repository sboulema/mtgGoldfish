function addTokensToSelect() {
    $.getJSON("https://api.magicthegathering.io/v1/cards?layout=token&type=creature").then(function (data) {   
        $.each(data.cards, function(key, token) {
            $('<option/>', {
                'value': token.multiverseid,
                'text': token.name
            }).appendTo('#token-select');
        });
    }); 
}

function setupTokens() {
    addTokensToSelect();

    $('#token-select').on('change', function() {
        switch (this.value) {
            case -1:              
                break;
            case 0:
                $('#tokenModal').modal('show');
                break;
            default:
                createCard({
                    multiverseId: this.value,
                    layout: "token"
                }).appendTo("#table");
                bindCardActions();
                break;
        }   
    })
}

function createToken(name, rules, powerToughness) {
    var token = createCard({multiverseId: 0, layout: "token"});
    token.children(".front")[0].style.backgroundImage = "url('img/token.png')";

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
    createToken($("#token-name").val(), $("#token-rules").val(), $("#token-powerToughness").val())
        .appendTo("#table");
    $('#tokenModal').modal('hide');
    bindCardActions();
}