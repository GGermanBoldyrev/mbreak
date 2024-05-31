const url = "https://moodle-breaker.kmsign.ru/getQuestionResult";
const test_id = "123123";
const question = "Самый большой по численности населения город Индии:";

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

async function getAnswers() {
  await postData(url, {
    test_id: Number(test_id),
    question_text: question,
  }).then((response) => {
    console.log(response);
  });
}

getAnswers();
