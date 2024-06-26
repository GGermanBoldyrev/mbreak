// Chrome.tabs для доступа к активной вкладке браузера.
// Chrome.scripting для внедрения кода JavaScript на web-страницу активной вкладки
// и для исполнения этого кода в контексте этой страницы.

// URL для получения ответов
const url = "https://moodle-breaker.kmsign.ru/getQuestionResult";
// Основная кнопка (запуска скрипта)
const button = document.getElementById("conf-btn");
// Параметр cmid из URL страницы (переназначаем функцией getCmid(url))
// В версии 2 приложения не используется (ответ на вопрос приходит и без правильного параметра test_id)
const cmid = 123123;

// Onclick по основной кнопке
button.addEventListener("click", function () {
  onClick();
});

// Функция, которая вызывается на клик по основной кнопке
function onClick() {
  // Получаем активную вкладку
  chrome.tabs.query({ active: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      // Собираем вопросы в функции grabQuestions
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id, allFrames: true },
          func: grabQuestions,
        },
        onResult
      );
    } else {
      alert("Активных вкладок не найдено.");
    }
  });
}

// Функция для получения всех вопросов
function grabQuestions() {
  const questions = document.querySelectorAll(".qtext");
  return Array.from(questions).map((question) => question.outerText);
}

async function onResult(frames) {
  // Запускаем preloader
  preloaderVisible();
  if (!frames || !frames.length) {
    alert("Проблема с получением вопросов");
    return;
  }
  let questionsArr = frames
    .map((frame) => frame.result)
    .reduce((r1, r2) => r1.concat(r2));
  const answers = await getAnswers(questionsArr);
  // Запускаем в активной вкладке функцию, которая показывает юзеру ответы
  injectHighlightAnswers(answers);
  // Выводим текст, что ответы успешно получены
  success();
}

// Функция запроса
const postData = async (url = "", data = {}) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Функция для получения массива ответов
async function getAnswers(questions = []) {
  let answersArr = [];
  // Итерируемся по всем вопросам и отправляем запрос для получения ответа на сервер
  for (const question of questions) {
    answersArr.push(
      await postData(url, {
        test_id: Number(cmid),
        question_text: question,
      }).then((result) => {
        if (result["answers"] === null) {
          return [question, null];
        }
        let answer = result["answers"][0]["text"].trim();
        // Если ответ приходит в виде объекта
        if (
          answer.charAt(0) === "{" &&
          answer.charAt(answer.length - 1) === "}"
        ) {
          // Тогда ответ будет массивом массивов
          answer = Object.entries(JSON.parse(answer));
          return [question, answer];
        }
        // Если просто пришел ответ
        return [question, answer];
      })
    );
  }
  return answersArr;
}

// Функция для выделения нужных ответов и вопросов на которые ответа нет
function injectHighlightAnswers(answers) {
  chrome.tabs.query({ active: true }, (tabs) => {
    const tab = tabs[0];
    chrome.scripting
      .executeScript({
        target: { tabId: tab.id },
        func: highlightAnswers,
        args: [answers],
      })
      .then((response) => console.log(response));
  });
}

// Функция для подсветки правильных ответов
function highlightAnswers(answers) {
  const questions = document.querySelectorAll(".qtext");
  questions.forEach((question) => {
    answers.forEach((answer) => {
      // Если ответ совпадает с вопросом
      if (question.outerText === answer[0]) {
        if (answer[1] === null) {
          question.style.backgroundColor = "rgba(229,27,69,0.45)";
          // Добавляем div с текстом, что ответа нет
          let div = document.createElement("div");
          div.innerHTML = "На этот вопрос ответа нет";
          div.style.backgroundColor = "rgb(230,243,245)";
          div.style.marginTop = "15px";
          question.append(div);
        } else {
          question.style.backgroundColor = "#27cf7b";
          if (Array.isArray(answer[1])) {
            // Разделяем строку на массив элементов
            const answerArray = Object.keys(answer[1]).map((key) => [
              key,
              answer[1][key],
            ]);
            let resStr = "";
            answerArray.forEach((item) => {
              resStr += item[1][0] + " -> " + item[1][1] + "; ";
            });
            // Преобразуем массив пар в строку с разделением запятыми
            console.log(resStr);
            // Добавляем div с текстом
            let div = document.createElement("div");
            div.innerHTML = `Ответ: ${resStr}`;
            div.style.backgroundColor = "rgb(230,243,245)";
            div.style.marginTop = "15px";
            question.append(div);
          } else {
            // Получаем лист блоков с ответами к конкретному вопросу
            const answerBlock = question.parentNode.querySelector(".answer");
            for (const answerEl of answerBlock.children) {
              // Если блок с ответом содержит подстроку с полученным ответом
              if (answerEl.outerText.includes(answer[1])) {
                // Добавляем div с текстом ответа
                let div = document.createElement("div");
                div.innerHTML = `Ответ: ${answer[1]}`;
                div.style.backgroundColor = "rgb(230,243,245)";
                div.style.marginTop = "15px";
                question.append(div);
                // Делаем шрифт курсивом, потому что нельзя поменять цвет (почему-то)
                answerEl.style.fontStyle = "italic";
              }
            }
          }
        }
      }
    });
  });
  return "Скрипт по подсветке правильных ответов отработал успешно!";
}

// div элемент preloader
let preloaderEl = document.getElementById("preloader");

// Функция для показа preloader
function preloaderVisible() {
  preloaderEl.classList.remove("hidden");
  preloaderEl.classList.add("visible");
  preloaderEl.innerText = "Идет загрузка...";
}

// Функция для показа текста ответы получены, вместо preloader
function success() {
  preloaderEl.classList.remove("red-text");
  preloaderEl.classList.add("green-text");
  preloaderEl.textContent = "Ответы получены";
}

function renderNullAnswer() {
  console.log("the answer is null ");
  return;
}
