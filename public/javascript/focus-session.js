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
hoursInput.inputMode = 'numeric';

const timerSeparator = document.createElement('div');
timerSeparator.className = 'separator';
timerSeparator.innerHTML = '<p>:</p>';

const minutesInput = document.createElement('input');
minutesInput.placeholder = 'MM';
minutesInput.autocomplete = 'off';
minutesInput.id = 'minutes';
minutesInput.inputMode = 'numeric';

const timerButtons = document.createElement('div');
studySection.appendChild(timerButtons);
timerButtons.classList.add('timer-btns');

const startButton = document.createElement('button');
startButton.innerText = 'Start';
startButton.className = 'btn';

timerInputs.appendChild(hoursInput);
timerInputs.appendChild(timerSeparator);
timerInputs.appendChild(minutesInput);
timerButtons.appendChild(startButton);
hoursInput.focus();
hoursInput.select();

// Creates div where the countdown timer will be displayed
const countdownTimer = document.createElement('div');
countdownTimer.id = 'countdown-timer';

// Adds the event listener to the start button
startButton.addEventListener('click', displayTimer);
document.addEventListener('keydown', isEnter);

function isEnter(e) {
    if (e.key === 'Enter') {
        displayTimer();
    }
}

let ticker;
let elapsedTime = 0;
let startTime;
const alarmAudio = new Audio('/audio/alarm.wav');
const clockAudio = new Audio('/audio/clock.wav');
let studySessionDuration;

function areInputsNumbers(hours, minutes) {
    const areInputsNumbers = isNumeric(hours.value) && isNumeric(minutes.value);

    if (!areInputsNumbers) {
        alert('Inputs need to be positive values. Please try again');
        return false;
    }

    if (
        Number(hours.value) < 0 ||
        Number(minutes.value) < 0 ||
        (Number(hours.value) === 0 && Number(minutes.value) === 0)
    ) {
        alert('Inputs need to be positive values. Please try again');
        return false;
    }
    timerInputs.remove();
    return true;
}

function displayTimer() {
    if (!areInputsNumbers(hoursInput, minutesInput)) return;

    document.removeEventListener('keydown', isEnter);
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
    cancelButton.className = 'cancel-btn';
    cancelButton.innerText = 'End';
    timerButtons.appendChild(cancelButton);
    cancelButton.addEventListener('click', cancelTimer);

    const extendDiv = document.createElement('div');
    extendDiv.id = 'extend-timer';
    studySection.appendChild(extendDiv);

    const extendButton = document.createElement('button');
    extendButton.id = 'extend-btn';
    extendButton.className = 'btn';
    extendButton.innerText = 'Extend Session';
    extendDiv.appendChild(extendButton);

    const extendModal = document.querySelector('.extend-timer');

    extendButton.addEventListener('click', () => {
        extendModal.classList.toggle('hidden');
        const hoursInput = document.querySelector('#hours');
        hoursInput.focus();
        hoursInput.select();
    });

    // Starts the timer
    startTimer();

    // Posts the study session to the db
    updateStudySession(sessionData);
    postStudySessionLog('Start', studySessionDuration);
}

document.addEventListener('keydown', (e) => {
    const isExtendModalHidden = document
        .querySelector('.extend-timer')
        .classList.contains('hidden');
    if (!isExtendModalHidden) {
        if (e.key === 'Enter') extendTimer();
    }
});

document.addEventListener('click', (e) => {
    if (
        (e.target.closest('.extend-timer') === null &&
            !e.target.closest('#extend-timer')) ||
        e.target.closest('.cancel-btn')
    ) {
        extendModal.classList.add('hidden');
    }
});

// Timer logic (i.e. pause, resume, cancel logic)
function startTimer() {
    alarmAudio.play();
    alarmAudio.pause();
    clockAudio.play();
    clockAudio.pause();

    startButton.remove();
    timerHeader.innerText = 'Session Started!';
    countdownTimer.innerHTML = studySessionDuration
        .minus(elapsedTime)
        .toFormat('hh:mm:ss');
    startTime = new Date().getTime();
    decrement();
}

function pauseOrResumeTimer(e) {
    clockAudio.pause();
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
    clockAudio.pause();
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

// Additional time functionality

const extendButton = document.querySelector('.extend-button > button');
extendButton.addEventListener('click', extendTimer);
const extendModal = document.querySelector('.extend-timer');

function extendTimer() {
    clockAudio.pause();
    const hoursInput = document.querySelector('#hours');
    const minutesInput = document.querySelector('#minutes');

    if (!areInputsNumbers(hoursInput, minutesInput)) return;
    extendModal.className = 'extend-timer hidden';

    const sessionData = {
        sessionId: sessionId,
        extendHours: Number(hoursInput.value),
        extendMinutes: Number(minutesInput.value),
    };

    updateStudySession(sessionData);

    studySessionDuration = studySessionDuration.minus(elapsedTime).plus({
        hours: Number(hoursInput.value),
        minutes: Number(minutesInput.value),
    });
    countdownTimer.innerHTML = studySessionDuration.toFormat('hh:mm:ss');
    startTime = new Date().getTime() - 1000;
    hoursInput.value = '';
    minutesInput.value = '';
}

function decrement() {
    const now = new Date().getTime();
    elapsedTime = 1000 * Math.floor((now - startTime) / 1000);
    countdownTimer.innerHTML = studySessionDuration
        .minus(elapsedTime)
        .toFormat('hh:mm:ss');

    let isSessionDurationOver =
        Number(studySessionDuration.minus(elapsedTime).toFormat('s')) < 0;

    let isThirtySecondsLeft =
        Number(studySessionDuration.minus(elapsedTime).toFormat('s')) <= 30;
    ticker = setTimeout(decrement, 1000);

    if (isThirtySecondsLeft) {
        clockAudio.play();
    }

    if (isSessionDurationOver) {
        clockAudio.pause();
        alarmAudio.play();
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
