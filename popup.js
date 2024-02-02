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
    // Получаем активную вкладку
    chrome.tabs.query({ active: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
            cmid = getCmid(tab.url);
            // Если cmid не найден
            if (cmid === -1) {
                alert("Параметр cmid в строке url не найден. Это точно тест?");
                return;
            }
            // Собираем вопросы в функции grabQuestions
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id, allFrames: true },
                    func: grabQuestions
                },
                onResult
            );
        } else {
            alert("Активных вкладок не найдено.")
        };
    });
};

// Получаем код теста
function getCmid(url) {
    strToSearch = "cmid=";
    // Если нет параметра cmid в строке url
    if (url.search(strToSearch) === -1) {
        return -1;
    };
    // Получаем индекс начала строки и плюсуем str
    cmidPos = url.search(strToSearch) + strToSearch.length;
    cmid = url.substr(cmidPos, 6);
    return cmid;
}

function grabQuestions() {
    // TODO - Запросить список div-ов 
    // и вернуть их список
    const questions = document.querySelectorAll(".qtext");
    return Array.from(questions).map(question => question.outerText);
}

function onResult(frames) {
    // TODO - Объединить списки URL-ов, полученных из каждого фрейма в один,
    // затем объединить их в строку, разделенную символом перевода строки
    // и скопировать в буфер обмена
}