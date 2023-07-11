// global variables
const dialogBox = document.getElementById("divDialog");
const dialogButton = document.getElementById("dialogButton");
const divTitle = document.getElementById("divTitle");
const canvas = document.getElementById("canvasGame");
const buttonRestart = document.getElementById("buttonRestart");
const ctx = canvas.getContext("2d");
const color1 = ["#0000FF", "#00FF00", "#FF0000", "#FFFF00", "#FF00FF", "#00FFFF", "#CF8000"];
const color2 = ["#00008F", "#008F00", "#8F0000", "#8F8F00", "#8F008F", "#008F8F", "#804000"];
const levelDefinitions = [ // [ nTracks , trackSize]  Warning TrackSize<=Ntracks+1 NTracks max= 8 
    [2, 2], [2, 3], [3, 2], [3, 3], [3, 4], [4, 3], [4, 4], [4, 5], [5, 4], [5, 5],
    [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [7, 3], [7, 4], [8, 4], [8, 5], [8, 6],
    [8, 7], [8, 8], [8, 9]
];
let tracks = [];
const selectedBlocks = [];

let nTracks;
let trackSize;
let currentLevel = 1;

//classes
class Track {
    constructor(size) {
        this.size = size;
        this.content = new Array();
    }

    // Track methods
    getSize() {
        return this.size;
    }

    isWin() {
        if (this.getNumberOfFreeSpaces() == 0) {
            for (let i = 0; i < this.getSize() - 1; i++) {
                if (this.content[i] != this.content[i + 1]) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    isEmpty() {
        return this.content.length === 0;
    }

    getNumberOfFreeSpaces() {
        return this.size - this.content.length;
    }

    pushBlock(blockColorIndex) {
        if (this.content.length < this.size) {
            this.content.push(blockColorIndex);
            return true;
        }
        return false;
    }

    popBlock() {
        if (this.content.length > 0) {
            return this.content.pop();
        }
        return -1;
    }

    peekTopBlock() {
        if (this.content.length > 0) {
            return this.content[this.content.length - 1];
        }
        return -1;

    }

    getBlockIndex(index) {
        if (index < this.content.length) {
            return this.content[index];
        }
        return -1;
    }

}

//functions
//=============================================
function drawBlock(x, y, size, colorIndex) {

    const borderSize = size / 8;
    ctx.strokeStyle = color1[colorIndex];
    ctx.lineWidth = borderSize;
    ctx.fillStyle = color2[colorIndex];
    ctx.fillRect(x - size / 2, y - size / 2, size, size);

    ctx.beginPath();

    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    ctx.stroke();

}

function canvasResize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvasRedraw();
}

function canvasRedraw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    const gameTopMargin = 0; //canvas.height * 0.1;
    const trackDistance = Math.min(canvas.width / (nTracks + 1), (canvas.height - gameTopMargin * 2) / (1 + trackSize));
    const gameLeftMargin = (canvas.width - trackDistance * nTracks) / 2
    ctx.lineWidth = trackDistance * 0.1;
    ctx.strokeStyle = "#A0A0A0"
    for (let i = 0; i < nTracks; i++) {
        ctx.moveTo(gameLeftMargin + i * trackDistance, gameTopMargin + (i === 0 ? 0 : trackDistance));
        ctx.lineTo(gameLeftMargin + i * trackDistance, gameTopMargin + trackDistance * (tracks[i].getSize() + 1));
        ctx.lineTo(gameLeftMargin + (i + 1) * trackDistance, gameTopMargin + trackDistance * (tracks[i].getSize() + 1));
        ctx.lineTo(gameLeftMargin + (i + 1) * trackDistance, gameTopMargin + (i === nTracks - 1 ? 0 : trackDistance));
        if (tracks[i].isWin()) {
            ctx.moveTo(gameLeftMargin + (i + 1) * trackDistance + trackDistance * 0.1 / 2, gameTopMargin + trackDistance);
            ctx.lineTo(gameLeftMargin + i * trackDistance - trackDistance * 0.1 / 2, gameTopMargin + trackDistance);
        }

    }
    ctx.moveTo(gameLeftMargin - trackDistance * 0.1 / 2, gameTopMargin);
    ctx.lineTo(gameLeftMargin + nTracks * trackDistance + trackDistance * 0.1 / 2, gameTopMargin);
    ctx.stroke();

    // draw the block in tracks
    for (let i = 0; i < nTracks; i++) {
        let blockColorIndex = 0;
        for (let index = 0; blockColorIndex >= 0; index++) {
            blockColorIndex = tracks[i].getBlockIndex(index);
            if (blockColorIndex < 0) {
                break;
            }
            drawBlock(gameLeftMargin + (i + 0.5) * trackDistance, gameTopMargin + trackDistance * (tracks[i].getSize() + 1) - trackDistance * (index + 0.5), trackDistance * 0.7, blockColorIndex);
        }
    }

    //draw the selected blocks
    for (let i = 0; i < selectedBlocks.length; i++) {
        drawBlock(gameLeftMargin + (i + 0.5 + (nTracks - selectedBlocks.length) / 2) * trackDistance, gameTopMargin + trackDistance * 0.5, trackDistance * 0.7, selectedBlocks[i]);
    }
}

function clickGame(xpos) {
    const gameTopMargin = 0;
    const trackDistance = Math.min(canvas.width / (nTracks + 1), (canvas.height - gameTopMargin * 2) / (1 + trackSize));
    const gameLeftMargin = (canvas.width - trackDistance * nTracks) / 2
    const selectedX = Math.floor((xpos - (gameLeftMargin)) / trackDistance);

    if (selectedX >= 0 && selectedX < nTracks && tracks[selectedX].isWin() === false) {
        if (selectedBlocks.length > 0) {
            if (tracks[selectedX].getNumberOfFreeSpaces() >= selectedBlocks.length) {
                const nSelected = selectedBlocks.length;
                for (let i = 0; i < nSelected; i++) {
                    tracks[selectedX].pushBlock(selectedBlocks.pop());
                }
            }
        }
        else {
            const popedBlock = tracks[selectedX].popBlock();
            if (popedBlock >= 0) {
                selectedBlocks.push(popedBlock);
                while (tracks[selectedX].peekTopBlock() === popedBlock) {
                    selectedBlocks.push(tracks[selectedX].popBlock());
                }
            }
        }
        if (gameWin()) {
            currentLevel++;

            dialogBox.style.visibility = "visible";
        }
        canvasRedraw();
    }
}

function gameWin() {
    for (let i = 0; i < nTracks; i++) {
        if (tracks[i].isWin() === false && tracks[i].isEmpty() === false) {
            return false;
        }
    }
    return true;

}

function newLevel() {
    const tmpBlocks = [];
    const actualLevel = (currentLevel <= levelDefinitions.length) ? currentLevel : levelDefinitions.length;
    nTracks = levelDefinitions[actualLevel - 1][0];
    trackSize = levelDefinitions[actualLevel - 1][1];

    dialogBox.style.visibility = "collapse";
    divTitle.innerHTML = "Block Sorter 2023<br>Level : " + currentLevel;

    tracks = [];
    for (let i = 0; i < nTracks; i++) {
        const track = new Track(trackSize);
        if (i < nTracks - 1) {
            for (let j = 0; j < track.getSize(); j++) {
                tmpBlocks.push(i);
            }
        }
        tracks.push(track);
    }

    for (let i = 0; i < tmpBlocks.length; i++) {
        let tmp = tmpBlocks[i];
        let swap = Math.floor(Math.random() * tmpBlocks.length);
        tmpBlocks[i] = tmpBlocks[swap];
        tmpBlocks[swap] = tmp;
    }

    for (let i = 0; i < nTracks; i++) {
        while (tmpBlocks.length > 0 && tracks[i].getNumberOfFreeSpaces() > 0) {
            tracks[i].pushBlock(tmpBlocks.pop());
        }
    }

    //avoid start winning position (important for small values of trackSize)
    for (let i = 0; i < nTracks - 1; i++) {
        {
            if (tracks[i].isWin() && tracks[nTracks - 1].getNumberOfFreeSpaces() > 0) {
                tracks[nTracks - 1].pushBlock(tracks[i].popBlock());
            }
        }
    }

    // for the fun put some blocks in last track
    for (let i = 0; i < nTracks - 1; i++) {
        {
            if (Math.random() > 0.4 && tracks[nTracks - 1].getNumberOfFreeSpaces() > 1) {
                tracks[nTracks - 1].pushBlock(tracks[i].popBlock());
            }
        }
    }
}

//events
//=============================================
window.onresize = function (event) {
    canvasResize();
}

canvas.onclick = function (event) {
    clickGame(event.offsetX);
}

window.onmouseup = function (event) {
    event.preventDefault();  // prevent search menu in edge
}

dialogButton.onclick = function (event) {
    newLevel();
    canvasRedraw();
}


buttonRestart.onclick = function (event) {
    newLevel();
    canvasRedraw();

}
//main program
//=============================================
newLevel();
canvasResize();

