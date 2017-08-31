function defaultCard(cssClass) {
    return "<div class='mtg-card " + cssClass + "' style='background-image: url(\"img/backside.jpg\")'></div>"
}

function createCard(multiverseId, style) {
    return "<div class='mtg-card mtg-card-preview' style='background-image: url(\"" + createCardImageSrc(multiverseId) + "\"); " + style + "'></div>"
}

function createCardImageSrc(multiverseId) {
    return "http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=" + multiverseId + "&type=card";
}

function getMultiverseId(el) {
    return el.style.backgroundImage.slice(5, -2).substr(61).slice(0, -10);
}

function bindCardActions() {
    $("#table .mtg-card").rotate({
        bind: {
            click: function () {
                tapUntap(this);
            }
        }
    });

    $('.mtg-card-preview').popover({
        html: true,
        trigger: 'hover',
        content: function () { return '<img src="' + this.style.backgroundImage.slice(5, -2) + '" />'; }
    });
}

function tapUntap(card) {
    if ($(card).getRotateAngle() == 0) {
        $(card).rotate({
            angle: 0,
            animateTo: 90
        })
    } else {
        $(card).rotate({
            angle: 90,
            animateTo: 0
        })
    }
}

function untapAll() {
    $("#table .mtg-card").each(function(index) {
        tapUntap(this);
    });
}