
document.addEventListener('DOMContentLoaded', function () {
    var elems = document.querySelectorAll('select');
    var options = []
    var instances = M.FormSelect.init(elems, options);
});

let button = document.getElementById('report')
button.onclick = function (event) {
    document.getElementById('postStatus').style.visibility = "visible";
    let form = document.getElementById('reportForm')
    if (form !== null) {
        form.style.visibility = "visible"
    }
}
