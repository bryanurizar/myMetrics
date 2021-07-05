import * as luxon from 'https://moment.github.io/luxon/es6/luxon.min.js';
const Duration = luxon.Duration;
import { addItemEventListeners } from './itemEventHandlers.js';

// Checks if user wants to navigate away without cancelling
window.addEventListener('beforeunload', e => {
    e.preventDefault();
    e.returnValue = '';
});

// Adds checkbox, edit and trash icon event handlers to items in lists
addItemEventListeners();

// Captures the session ID / board ID to be used later in the API call
const sessionUrl = new URL(window.location.href);
const sessionId = sessionUrl.pathname.split('/')[2];
const boardUrl = new URL(document.referrer);
const boardId = boardUrl.pathname.split('/')[2];

// Below few lines of code create the inputs for the timer and appends them to the timerInputs div
const studySection = document.querySelector('#study-timer');

const timerHeader = document.createElement('h2');
timerHeader.innerText = 'Study Session';
studySection.append(timerHeader);

const timerInputs = document.createElement('div');
timerInputs.classList.add('timerInputs');
studySection.appendChild(timerInputs);

const hoursInput = document.createElement('input');
hoursInput.placeholder = 'HH';
hoursInput.autocomplete = 'off';
hoursInput.id = 'hours';

const timerSeparator = document.createElement('p');
timerSeparator.className = 'separator';
timerSeparator.innerHTML = ':';

const minutesInput = document.createElement('input');
minutesInput.placeholder = 'MM';
minutesInput.autocomplete = 'off';
minutesInput.id = 'minutes';

const timerButtons = document.createElement('div');
studySection.appendChild(timerButtons);
timerButtons.classList.add('timer-btns');

const startButton = document.createElement('button');
startButton.innerText = 'Start';
startButton.id = 'btn';

timerInputs.appendChild(hoursInput);
timerInputs.appendChild(timerSeparator);
timerInputs.appendChild(minutesInput);
timerButtons.appendChild(startButton);

// Creates div where the countdown timer will be displayed
const countdownTimer = document.createElement('div');
countdownTimer.id = 'countdown-timer';

// Adds the event listener to the start button
startButton.addEventListener('click', displayTimer);
let studySessionDuration;

function displayTimer() {
    timerInputs.remove();

    // Captures user input and includes board ID / study session ID
    const sessionData = {
        sessionId: sessionId,
        boardId: boardId,
        hours: Number(hoursInput.value),
        minutes: Number(minutesInput.value),
    };

    // Creates the duration object and prepends it so it can be displayed
    studySessionDuration = Duration.fromObject({ hours: sessionData.hours, minutes: sessionData.minutes });
    countdownTimer.innerHTML = studySessionDuration.toFormat('hh : mm : ss');
    studySection.append(countdownTimer);

    const timerButtons = document.createElement('div');
    studySection.appendChild(timerButtons);

    // Adds the pause / cancel buttons and event listeners
    const pauseButton = document.createElement('button');
    pauseButton.id = 'pause-btn';
    pauseButton.className = 'btn';
    pauseButton.innerText = 'Pause';
    timerButtons.appendChild(pauseButton);
    pauseButton.addEventListener('click', pauseOrResumeTimer);

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-btn';
    cancelButton.className = 'btn cancel-btn';
    cancelButton.innerText = 'Cancel';
    timerButtons.appendChild(cancelButton);
    cancelButton.addEventListener('click', cancelTimer);

    // Starts the timer
    startTimer();

    // Posts the study session to the db
    updateStudySession(sessionData);
    postStudySessionLog('Start', studySessionDuration);

}

// Timer logic (i.e. pause, resume, cancel logic)
let ticker;
let elapsedTime = 0;
let startTime;

function startTimer() {
    startButton.remove();
    countdownTimer.innerHTML = studySessionDuration.minus(elapsedTime).toFormat('hh:mm:ss');
    startTime = new Date().getTime();
    decrement();
    // ticker = setInterval(decrement, 1000);
}

function pauseOrResumeTimer(e) {
    studySessionDuration = studySessionDuration.minus(elapsedTime - 1);
    startTime = new Date().getTime();
    elapsedTime = 0;
    if (e.target.innerText === 'Pause') {
        clearTimeout(ticker);
        e.target.innerText = 'Resume';
        postStudySessionLog('Pause', studySessionDuration);
    } else {
        ticker = setTimeout(decrement, 1000);
        e.target.innerText = 'Pause';
        postStudySessionLog('Resume', studySessionDuration);
    }
}

function cancelTimer() {
    clearTimeout(ticker);
    const studySection = document.querySelector('#study');
    studySection.innerHTML = `
        <h2 id="session-ended">Your Study Session Has Ended.</h2>`;
    postStudySessionLog('Cancel', studySessionDuration);
}

function decrement() {
    const now = new Date().getTime();
    elapsedTime = 1000 * Math.floor((now - startTime) / 1000);
    countdownTimer.innerHTML = studySessionDuration.minus(elapsedTime).toFormat('hh:mm:ss');

    let isSessionDurationOver = Number(studySessionDuration.minus(elapsedTime).toFormat('s')) < 0;
    if (isSessionDurationOver) {
        cancelTimer();
    }
    ticker = setTimeout(decrement, 1000);
}

// API Function Calls
async function updateStudySession(data) {
    const response = await fetch('http://localhost:3000/study-session/', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    return response;
}

async function postStudySessionLog(action, duration) {
    const sessionData = {
        boardId: boardId,
        sessionId: sessionId,
        userAction: action,
        hours: duration.hours,
        minutes: duration.minutes,
        seconds: duration.seconds,
        milliseconds: duration.milliseconds,
    };

    const response = await fetch(`http://localhost:3000/study-session/${sessionData.sessionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
    });
    response;
}