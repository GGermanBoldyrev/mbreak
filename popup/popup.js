// Chrome.tabs для доступа к активной вкладке браузера.
// Chrome.scripting для внедрения кода JavaScript на web-страницу активной вкладки
// и для исполнения этого кода в контексте этой страницы.

// URL для получения ответов
const url = "https://moodle-breaker.kmsign.ru/getQuestionResult";
// Основная кнопка (запуска скрипта)
const button = document.getElementById("conf-btn");
// Параметр cmid из URL страницы (переназначаем функцией getCmid(url))
let cmid = 0;

// Onclick по основной кнопке
button.addEventListener("click", function () {
    onClick();
});

// Функция, которая вызывается на клик по основной кнопке
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
            chrome.scripting.executeScript({
                target: {tabId: tab.id, allFrames: true}, func: grabQuestions
            }, onResult);
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

async function onResult(frames) {
    // Запускаем preloader
    preloaderVisible();
    // Проверяем пустое ли свойство объекта length
    if (!frames || !frames.length) {
        alert("Проблема с получением вопросов");
        return;
    }
    // Массив из вопросов
    let questionsArr = frames.map(frame => frame.result).reduce((r1, r2) => r1.concat(r2));
    // Получаем ответы на вопросы
    const answers = await getAnswers(questionsArr);
    // Запускаем в активной вкладке функцию, которая показывает юзеру ответы
    injectHighlightAnswers(answers);
    // Выводим текст, что ответы успешно получены
    success();
}

// Функция запроса
const postData = async (url = '', data = {}) => {
    // POST запрос
    const response = await fetch(url, {
        // Метод
        method: 'POST', // Заголовки
        headers: {
            'Content-Type': 'application/json'
        }, // Данные
        body: JSON.stringify(data)
    });
    // Возвращаем ответ в формате json
    return response.json();
}

// Функция для получения массива ответов
async function getAnswers(questions = []) {
    // Массив ответов
    let answersArr = [];
    // Итерируемся по всем вопросам и отправляем запрос для получения ответа на сервер
    for (const question of questions) {
        answersArr.push(await postData(url, {"test_id": Number(cmid), "question_text": question})
            .then(result => {
                // Если пустой ответ
                if (result["answers"] === null) {
                    return [question, null];
                }
                // Если ответ найден, то помещаем его в переменную
                let answer = result["answers"][0]["text"].trim()
                // Если ответ приходит в виде объекта
                if (answer.charAt(0) === '{' && answer.charAt(answer.length - 1) === '}') {
                    // Тогда ответ будет массивом массивов
                    answer = Object.entries(JSON.parse(answer));
                    return [question, answer];
                }
                // Если просто пришел ответ
                return [question, answer]
            }))
    }
    return answersArr;
}

// Функция для выделения нужных ответов и вопросов на которые ответа нет
function injectHighlightAnswers(answers) {
    chrome.tabs.query({active: true}, (tabs) => {
        const tab = tabs[0];
        chrome.scripting.executeScript({
            target: {tabId: tab.id}, func: highlightAnswers, args: [answers],
        }).then(response => console.log(response))
    });
}

// Функция для подсветки правильных ответов
function highlightAnswers(answers) {
    // Получаем все вопросы
    const questions = document.querySelectorAll(".qtext");
    // Итерируемся по всем вопросам
    questions.forEach(question => {
        answers.forEach(answer => {
            // Если ответ совпадает с вопросом
            if (question.outerText === answer[0]) {
                // Если ответ не найден (null)
                if (answer[1] === null) {
                    // Мы красим вопрос в красный цвет
                    question.style.backgroundColor = "rgba(229,27,69,0.45)";
                } else {
                    // Если ответ найден, то красим вопрос в зеленый
                    question.style.backgroundColor = "#27cf7b";
                    // Если ответ - массив, то мы не красим ответ, а выводим его рядом
                    if (Array.isArray(answer[1])) {
                        // Вывести массив ответов рядом с вопросом
                        console.log(answer)
                    } else { // Если ответ не массив, то просто красим правильный ответ в зеленый.
                        // Получаем лист блоков с ответами к конкретному вопросу
                        const answerBlock = question.parentNode.querySelector(".answer");
                        // Итерируемся блокам с ответами
                        for (const answerEl of answerBlock.children) {
                            // Если блок с ответом содержит подстроку с полученным ответом
                            if (answerEl.outerText.includes(answer[1])) {
                                // Делаем шрифт курсивом, потому что нельзя поменять цвет (почему-то)
                                answerEl.style.fontStyle = "italic";
                            }
                        }
                    }
                }
            }
        });
    });
    // Прописываем текст в лог активной вкладки
    return "Скрипт по подсветке правильных ответов отработал успешно!";
}

// div элемент preloader
let preloaderEl = document.getElementById('preloader');

// Функция для показа preloader
function preloaderVisible() {
    preloaderEl.classList.remove('hidden');
    preloaderEl.classList.add('visible');
    preloaderEl.innerText = "Идет загрузка...";
}

// Функция для показа текста ответы получены, вместо preloader
function success() {
    preloaderEl.classList.remove("red-text");
    preloaderEl.classList.add("green-text");
    preloaderEl.textContent = "Ответы получены";
}