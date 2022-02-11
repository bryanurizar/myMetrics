import * as luxon from 'https://moment.github.io/luxon/es6/luxon.min.js';
const Duration = luxon.Duration;
import { addItemEventListeners } from './itemEventHandlers.js';
import { isNumeric } from './isNumeric.js';

// Checks if user wants to navigate away without cancelling
window.addEventListener('beforeunload', (e) => {
    const isSessionOver = document.querySelector('#session-ended');
    if (!isSessionOver) {
        e.preventDefault();
        e.returnValue = '';
    }
    return;
});

// Adds checkbox, edit and trash icon event handlers to items in lists
addItemEventListeners();

// Uses target items stored in session storage to end focus session if all items are completed
const itemCheckboxes = document.querySelectorAll('input[type="checkbox"]');
itemCheckboxes.forEach((itemCheckbox) => {
    itemCheckbox.addEventListener('click', updateSessionStorage);
});

function updateSessionStorage(cardId) {
    const targetItemSessionStorage = JSON.parse(
        window.sessionStorage.getItem('targetItems')
    );

    const cardIdIndex = targetItemSessionStorage.indexOf(cardId);
    targetItemSessionStorage.splice(cardIdIndex, 1);
    window.sessionStorage.setItem(
        'targetItems',
        JSON.stringify(targetItemSessionStorage)
    );

    targetItemSessionStorage.length === 0 ? cancelTimer() : null;
}

// Captures the session ID / board ID to be used later in the API call
const sessionUrl = new URL(window.location.href);
const sessionId = sessionUrl.pathname.split('/')[2];
const boardUrl = new URL(document.referrer);
const boardId = boardUrl.pathname.split('/')[2];

// Below few lines of code create the inputs for the timer and appends them to the timerInputs div
const studySection = document.querySelector('#study-timer');

const timerHeader = document.createElement('h2');
timerHeader.innerText = 'Focus Session Duration';
studySection.append(timerHeader);

const timerInputs = document.createElement('div');
timerInputs.classList.add('timerInputs');
studySection.appendChild(timerInputs);

const hoursInput = document.createElement('input');
hoursInput.placeholder = 'HH';
hoursInput.autocomplete = 'off';
hoursInput.id = 'hours';

const timerSeparator = document.createElement('div');
timerSeparator.className = 'separator';
timerSeparator.innerHTML = '<p>:</p>';

const minutesInput = document.createElement('input');
minutesInput.placeholder = 'MM';
minutesInput.autocomplete = 'off';
minutesInput.id = 'minutes';

const timerButtons = document.createElement('div');
studySection.appendChild(timerButtons);
timerButtons.classList.add('timer-btns');

const startButton = document.createElement('button');
startButton.innerText = 'Start Timer';
startButton.className = 'btn';

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
    const areInputsNumbers =
        isNumeric(hoursInput.value) && isNumeric(minutesInput.value);
    if (!areInputsNumbers) {
        alert('Inputs are not numbers. Please try again');
        return;
    }

    timerInputs.remove();

    // Captures user input and includes board ID / study session ID
    const sessionData = {
        sessionId: sessionId,
        boardId: boardId,
        hours: Number(hoursInput.value),
        minutes: Number(minutesInput.value),
    };

    // Creates the duration object and prepends it so it can be displayed
    studySessionDuration = Duration.fromObject({
        hours: sessionData.hours,
        minutes: sessionData.minutes,
    });
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
    cancelButton.innerText = 'End';
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
const alarmAudio = new Audio('/audio/alarm.wav');

function startTimer() {
    alarmAudio.play();
    alarmAudio.pause();

    startButton.remove();
    timerHeader.innerText = 'Session Started!';
    countdownTimer.innerHTML = studySessionDuration
        .minus(elapsedTime)
        .toFormat('hh:mm:ss');
    startTime = new Date().getTime();
    decrement();
}

function pauseOrResumeTimer(e) {
    studySessionDuration = studySessionDuration.minus(elapsedTime);
    startTime = new Date().getTime();
    elapsedTime = 0;
    if (e.target.innerText === 'Pause') {
        timerHeader.innerText = 'Session Paused!';
        countdownTimer.style.color = '#DF5E5E';
        postStudySessionLog('Pause', studySessionDuration);
        clearTimeout(ticker);
        e.target.innerText = 'Resume';
    } else {
        countdownTimer.style.color = '#293B5D';
        timerHeader.innerText = 'Session Resumed!';
        postStudySessionLog('Resume', studySessionDuration);
        ticker = setTimeout(decrement, 1000);
        e.target.innerText = 'Pause';
    }
}

function cancelTimer() {
    if (studySessionDuration) {
        clearTimeout(ticker);
        studySessionDuration = studySessionDuration.minus(elapsedTime - 1000);
        postStudySessionLog('Cancel', studySessionDuration);
    }
    const studySection = document.querySelector('#study');
    studySection.innerHTML = `
        <div id="session-ended">
            <h2>Your Focus Session Has Ended.</h2>
        </div>`;
}

function decrement() {
    const now = new Date().getTime();
    elapsedTime = 1000 * Math.floor((now - startTime) / 1000);
    countdownTimer.innerHTML = studySessionDuration
        .minus(elapsedTime)
        .toFormat('hh:mm:ss');

    let isSessionDurationOver =
        Number(studySessionDuration.minus(elapsedTime).toFormat('s')) < 0;
    ticker = setTimeout(decrement, 1000);

    if (isSessionDurationOver) {
        alarmAudio.play();

        setTimeout(() => alarmAudio.pause(), 9800);
        cancelTimer();
    }
    return;
}

// API Function Calls
async function updateStudySession(data) {
    const response = await fetch('/focus-session/', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

    const response = await fetch(`/focus-session/${sessionData.sessionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
    });
    return response;
}
