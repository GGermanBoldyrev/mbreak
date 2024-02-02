// chrome.tabs для доступа к активной вкладке браузера.
// chrome.scripting для внедрения кода JavaScript на web-страницу активной вкладки 
// и для исполнения этого кода в контексте этой страницы.

const button = document.getElementById("conf-btn"); // Основная кнопка

// Onclick
button.addEventListener("click", function () {
    onClick();
});

// Функция при включении расширения
function onClick() {
    chrome.tabs.query({ active: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
            cmid = getCmid(tab.url);
            // Если cmid не найден
            if (cmid === -1) {
                alert("Параметр cmid в строке url не найден. Это точно тест?");
                return;
            }
            // Получаем массив вопросов со страницы
            qText = getQText();
        } else {
            alert("Активных вкладок не найдено.")
        }
    })
}

// Получаем код теста
function getCmid(url) {
    strToSearch = "cmid=";
    // Если нет параметра cmid в строке url
    if (url.search(strToSearch) === -1) {
        return -1;
    }
    cmidPos = url.search(strToSearch) + strToSearch.length; // Получаем индекс начала строки и плюсуем str
    cmid = url.substr(cmidPos, 6)
    return cmid;
}

// Должна ловить элемент на котоырй нажали и кидать запрос на сервак
function showAnswers() {
    return null;
}