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
        createCard({
            multiverseId: this.value,
            layout: "token"
        }).appendTo("#table");
        bindCardActions();
    })
}