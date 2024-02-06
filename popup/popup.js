// chrome.tabs для доступа к активной вкладке браузера.
// chrome.scripting для внедрения кода JavaScript на web-страницу активной вкладки 
// и для исполнения этого кода в контексте этой страницы.

// URL для получения ответов
const url = "https://moodle-breaker.kmsign.ru/getQuestionResult";
// Основная кнопка (запуска скрипта)
const button = document.getElementById("conf-btn");
// Парамет cmid из URL страницы (переназначаем функцией getCmid(url))
let cmid = 0;

// Onclick по основной кнопке
button.addEventListener("click", function () {
    onClick();
});

// Функция которая вызывается на клик по оснвоной кнопке
function onClick() {
    // Получаем активную вкладку
    chrome.tabs.query({active: true}, (tabs) => {
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
                    target: {tabId: tab.id, allFrames: true},
                    func: grabQuestions
                },
                onResult
            );
        } else {
            alert("Активных вкладок не найдено.")
        }

    });
}

// Функция для получения кода теста
function getCmid(url) {
    const strToSearch = "cmid=";
    // Если нет параметра cmid в строке url
    if (url.search(strToSearch) === -1) {
        return -1;
    }
    // Получаем индекс начала строки и плюсуем str
    const cmidPos = url.search(strToSearch) + strToSearch.length;
    return url.substring(cmidPos, cmidPos + 6);
}

// Функция для получения всех вопросов
function grabQuestions() {
    // Все вопросы со страницы
    const questions = document.querySelectorAll(".qtext");
    // Возвращаем массив вопросов
    return Array.from(questions).map(question => question.outerText);
}

function onResult(frames) {
    // Проверяем пустое ли свойство объекта length
    if (!frames || !frames.length) {
        alert("Проблема с получением вопросов");
        return;
    }
    // Массив из вопросов
    const questionsArr = frames.map(frame => frame.result).reduce((r1, r2) => r1.concat(r2));
    // Ответы на вопросы
    const answers = getAnswers(questionsArr);
    // TODO: сделать заполнение ответов
}

// Функуция запроса
const postData = async (url = '', data = {}) => {
    // POST запрос
    const response = await fetch(url, {
        // Метод
        method: 'POST',
        // Заголвоки
        headers: {
            'Content-Type': 'application/json'
        },
        // Данные
        body: JSON.stringify(data)
    });
    // Возвращаем ответ в формате json
    return response.json();
}

// Функция для получения массива ответов
function getAnswers(questions = []) {
    // Массив ответов
    let answersArr = [];
    // Итерируемся по всем вопросам и отправляем запрос для получения ответа на сервер
    questions.forEach((question) => {
        try {
            postData(url, {"test_id": Number(cmid), "question_text": question}).then(result => {
                // Ответ на вопрос
                const answer = result["answers"];
                // Заполняем массив ответов полученными данными
                if (answer) {
                    // Текст ответа на вопрос
                    const res = answer[0]["text"].trim()
                    answersArr.push({"question:": question, "answer": res});
                } else {
                    answersArr.push({"question": question, "answer": "Ответ не найден"});
                }
            });
        } catch (error) {
            console.log("Ошибка при обращении к серверу: ", error);
        }
    })
    // Возвращаем массив ответов в формате {"вопрос": ответ}
    return answersArr;
}

// TODO: Функция для заполнения полей формы ответа
/*
function fillFields() {
    //
}*/
