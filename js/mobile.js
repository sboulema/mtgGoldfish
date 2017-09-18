$(window).on('beforeunload', function(e) {
    return 'By leaving this page you will lose the data you have entered here.';
});

$(document).ready(function(){
    $("#btn-fullscreen").hide();

    if (jQuery.browser.mobile) {
        $(".life-counter").prop("disabled", true);
        $("#btn-fullscreen").show();

        $("#btn-fullscreen").unbind("click").click(function (event) {
            if (screenfull.enabled) {
                screenfull.request();
            }
        });
    }
});