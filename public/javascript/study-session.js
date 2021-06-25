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

startButton.addEventListener('click', displayTimer);

const sessionUrl = new URL(window.location.href);
const sessionId = sessionUrl.pathname.split('/')[2];

const boardUrl = new URL(document.referrer);
const boardId = boardUrl.pathname.split('/')[2];

const countdownTimer = document.createElement('div');

async function postStudyLog(sessionData) {
    const response = await fetch('http://localhost:3000/study-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    });
    return response;
}

let val;

function displayTimer() {

    console.log('displayTimer called');
    timer.remove();

    const sessionData = {
        sessionId: sessionId,
        boardId: boardId,
        hours: Number(hoursInput.value),
        minutes: Number(minutesInput.value),
    };

    let studySessionDuration = Duration.fromObject({ hours: sessionData.hours, minutes: sessionData.minutes, seconds: sessionData.seconds });
    countdownTimer.innerHTML = studySessionDuration.toFormat('hh : mm : ss');
    studySection.prepend(countdownTimer);

    startTimer(studySessionDuration, countdownTimer);

    const pauseButton = document.createElement('button');
    pauseButton.innerText = 'Pause';
    studySection.appendChild(pauseButton);

    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    studySection.appendChild(cancelButton);

    const timerButtons = document.querySelectorAll('button');
    console.log(timerButtons);
    timerButtons.forEach(timerButton => {
        timerButton.addEventListener('click', (e) => {
            if (e.target.innerText === 'Pause') {
                e.target.innerText === 'Resume';
                pauseTimer(e);

            } else if (e.target.innerText === 'Cancel') {
                stopTimer();
            } else {
                resumeTimer(e);
            }
        });
    });

    postStudyLog(sessionData);
}

function startTimer(studySessionDuration) {
    val = setInterval(decrement, 1000);

    function decrement() {
        studySessionDuration = studySessionDuration.minus({ seconds: 1 });
        countdownTimer.innerHTML = studySessionDuration.toFormat('hh : mm : ss');
    }
}

function pauseTimer(e) {
    clearTimeout(val);
    e.target.innerText = 'Resume';
}

function stopTimer() {
    console.log('stopTimer');
}

function resumeTimer() {
    val = setInterval(decrement, 1000);
}
