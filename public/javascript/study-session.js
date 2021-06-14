import * as luxon from 'https://moment.github.io/luxon/es6/luxon.min.js';
const Duration = luxon.Duration;

const studySection = document.querySelector('#study-timer');

const timer = document.createElement('div');
timer.classList.add('timerInputs');
studySection.appendChild(timer);

const hoursInput = document.createElement('input');
const minutesInput = document.createElement('input');
const startButton = document.createElement('button');

startButton.innerText = 'Start';

timer.appendChild(hoursInput);
timer.appendChild(minutesInput);
timer.appendChild(startButton);

startButton.addEventListener('click', startTimer);

function startTimer() {

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
    createTimer({ hours: sessionData.hours, minutes: sessionData.minutes });
}

async function postStudyTime(sessionData) {
    const response = await fetch('http://localhost:3000/study-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    });
    return response;
}

function createTimer(sessionTime) {
    timer.remove();
    const countdownTimer = document.createElement('div');

    let studySessionDuration = Duration.fromObject({ hours: sessionTime.hours, minutes: sessionTime.minutes, seconds: sessionTime.seconds });
    setInterval(countdown, 1000);

    function countdown() {
        studySessionDuration = studySessionDuration.minus({ seconds: 1 });
        countdownTimer.innerHTML = studySessionDuration.toFormat('hh : mm : ss');
        studySection.appendChild(countdownTimer);
    }

    const pauseButton = document.createElement('button');
    pauseButton.innerText = 'Pause';
    studySection.appendChild(pauseButton);

    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    studySection.appendChild(cancelButton);
}

function resumeTimer() {

}

function pauseTimer() {

}

function cancelTimer() {

}
