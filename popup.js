// chrome.tabs для доступа к активной вкладке браузера.
// chrome.scripting для внедрения кода JavaScript на web-страницу активной вкладки 
// и для исполнения этого кода в контексте этой страницы.

const button = document.getElementById("conf-btn"); // Основная кнопка

let asd = chrome.tabs.query(qObject, callback);

// Меняет визуал кнопки на клик
button.addEventListener("click", function () {
    // Если нажали включить
    if (!toggle) {
        this.className = "button-clicked";
        button.textContent = "Выключить";
        toggle = true;
    } else {
        this.classList.remove("button-clicked");
        button.textContent = "Включить";
        toggle = false;
    }
});

// Должна ловить элемент на котоырй нажали и кидать запрос на сервак
function showAnswers() {
    return null;
}