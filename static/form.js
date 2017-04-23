const {ipcRenderer} = require('electron');

$('select').material_select();
$('.datepicker').pickadate({
    selectMonths: true,
    selectYears: 200
});
$('.text-expansion-btn').click(function(e) {
    const returnValues = {};
    $('select.initialized, input.datepicker, input.single-data').each(function () {
        const element = $(this);
        returnValues[element.attr('id')] = element.val();
    });
    $('input.boolean-data').each(function () {
        const element = $(this);
        returnValues[element.attr('id')] = element.is(':checked');
    });
    ipcRenderer.send('expansion-data', returnValues);

    e.preventDefault();
});
