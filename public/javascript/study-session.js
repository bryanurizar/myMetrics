import * as luxon from 'https://moment.github.io/luxon/es6/luxon.min.js';
const Duration = luxon.Duration;

// Below few lines of code create the inputs for the timer and appends them to the timerInputs div
const studySection = document.querySelector('#study-timer');

const timerInputs = document.createElement('div');
timerInputs.classList.add('timerInputs');
studySection.appendChild(timerInputs);

const hoursInput = document.createElement('input');
hoursInput.placeholder = 'HH';
hoursInput.id = 'hours';

const timerSeperator = document.createElement('p');
timerSeperator.className = 'seperator';
timerSeperator.innerHTML = ':';

const minutesInput = document.createElement('input');
minutesInput.placeholder = 'MM';
minutesInput.id = 'minutes';

const timerButtons = document.createElement('div');
studySection.appendChild(timerButtons);
timerButtons.classList.add('timer-btns');

const startButton = document.createElement('button');
startButton.innerText = 'Start';
startButton.id = 'btn';

timerInputs.appendChild(hoursInput);
timerInputs.appendChild(timerSeperator);
timerInputs.appendChild(minutesInput);
timerButtons.appendChild(startButton);

// Captures the session ID / board ID to be used later in the API call
const sessionUrl = new URL(window.location.href);
const sessionId = sessionUrl.pathname.split('/')[2];
const boardUrl = new URL(document.referrer);
const boardId = boardUrl.pathname.split('/')[2];

// Creates div where the countdown timer will be displayed
const countdownTimer = document.createElement('div');

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

    // Adds the pause / cancel buttons and event listeners
    const pauseButton = document.createElement('button');
    pauseButton.id = 'pause-btn';
    pauseButton.className = 'btn';
    pauseButton.innerText = 'Pause';
    studySection.appendChild(pauseButton);
    pauseButton.addEventListener('click', pauseOrResumeTimer);

    const cancelButton = document.createElement('button');
    cancelButton.id = 'cancel-btn';
    cancelButton.className = 'btn cancel-btn';
    cancelButton.innerText = 'Cancel';
    studySection.appendChild(cancelButton);
    cancelButton.addEventListener('click', cancelTimer);

    // Posts the study session to the db
    postStudySession(sessionData);

    // Starts the timer
    startTimer(studySessionDuration);
}

async function postStudySession(sessionData) {
    const response = await fetch('http://localhost:3000/study-session/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionData)
    });
    return response;
}

// Timer button logic (i.e. pause, resume, cancel logic)
let ticker;

function startTimer() {
    ticker = setInterval(decrement, 1000);
    startButton.remove();

    decrement();
}

function pauseOrResumeTimer(e) {
    if (e.target.innerText === 'Pause') {
        clearTimeout(ticker);
        e.target.innerText = 'Resume';
    } else {
        ticker = setInterval(decrement, 1000);
    }
}

function cancelTimer() {
    clearTimeout(ticker);
    const studySection = document.querySelector('#study');
    studySection.innerHTML = '<h2>Session Ended</h2>';
}

function decrement() {
    countdownTimer.innerHTML = studySessionDuration.toFormat('hh : mm : ss');
    studySessionDuration = studySessionDuration.minus({ seconds: 1 });
}