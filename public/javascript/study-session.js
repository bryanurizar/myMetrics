import * as luxon from 'https://moment.github.io/luxon/es6/luxon.min.js';
const Duration = luxon.Duration;

// let studySessionDuration = Duration.fromObject({ hours: 10, minutes: 0, seconds: 0 });
// setInterval(countdown, 1000);

// function countdown() {
//     studySessionDuration = studySessionDuration.minus({ seconds: 1 });
//     console.log(studySessionDuration.toFormat('hh : mm : ss'));
// }

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

    return response.text;
}

function createTimer(sessionTime) {
    timer.remove();
    const countdownTimer = document.createElement('div');
    countdownTimer.innerHTML = `<p>${sessionTime.hours} : ${sessionTime.minutes}</p>`;
    studySection.appendChild(countdownTimer);

    const pauseButton = document.createElement('button');
    pauseButton.innerText = 'Pause';
    studySection.appendChild(pauseButton);

    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    studySection.appendChild(cancelButton);
}


// Set the date we're counting down to
var countDownDate = new Date('Jan 5, 2022 15:37:25').getTime();

// Update the count down every 1 second
var x = setInterval(function () {

    // Get today's date and time
    var now = new Date().getTime();

    // Find the distance between now and the count down date
    var distance = countDownDate - now;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);

    // Display the result in the element with id="demo"
    document.getElementById('demo').innerHTML = days + 'd ' + hours + 'h '
        + minutes + 'm ' + seconds + 's ';

    // If the count down is finished, write some text
    if (distance < 0) {
        clearInterval(x);
        document.getElementById('demo').innerHTML = 'EXPIRED';
    }
}, 1000);
