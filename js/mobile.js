$(window).on('beforeunload', function(e) {
    return 'By leaving this page you will lose the data you have entered here.';
});

$(function() {
    if (jQuery.browser.mobile) {
        $(".life-counter").prop("disabled", true);
    }
});