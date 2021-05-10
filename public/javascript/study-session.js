'use strict';

const studySection = document.querySelector('#study-timer');

const timer = document.createElement('div');
studySection.appendChild(timer);

const hoursInput = document.createElement('input');
const minutesInput = document.createElement('input');
const startButton = document.createElement('button');

startButton.innerText = 'Start';

timer.appendChild(hoursInput);
timer.appendChild(minutesInput);
timer.appendChild(startButton);

startButton.addEventListener('click', startButtonClick);

function startButtonClick() {

    const sessionUrl = new URL(window.location.href);
    const sessionId = sessionUrl.pathname.split('/')[2];

    const boardUrl = new URL(document.referrer);
    const boardId = boardUrl.pathname.split('/')[2];

    const sessionData = {
        sessionId: sessionId,
        boardId: boardId,
        hours: Number(hoursInput.value),
        minutes: Number(minutesInput.value),
    };

    postStudyTime(sessionData);
}

async function postStudyTime(sessionData) {
    const response = await fetch('http://localhost:3000/study-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    });

    return response.text;
}