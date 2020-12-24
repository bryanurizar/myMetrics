let imgTags = document.getElementsByTagName('img');
console.log(imgTags);

for (let i = 0; i < imgTags.length; i++) {
    imgTags[i].addEventListener('click', e => {
        console.log(e.target);
        const index = Array.from(imgTags).indexOf(e.target);
        console.log(index);
    });
}