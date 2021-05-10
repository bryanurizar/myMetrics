'use strict';

import { DateTime } from 'luxon';

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

    const studyTime = {
        hours: Number(hoursInput.value),
        minutes: Number(minutesInput.value)
    };
    postStudyTime(studyTime);
    console.log(studyTime);
}

async function postStudyTime(studyTime) {
    const response = await fetch('http://localhost:3000/start-time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(studyTime)
    });

    return response.text;
}