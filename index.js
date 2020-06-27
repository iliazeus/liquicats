var Direction;
(function (Direction) {
    Direction[Direction["Right"] = 0] = "Right";
    Direction[Direction["Down"] = 1] = "Down";
    Direction[Direction["Left"] = 2] = "Left";
    Direction[Direction["Up"] = 3] = "Up";
})(Direction || (Direction = {}));
var BackgroundType;
(function (BackgroundType) {
    BackgroundType[BackgroundType["Floor"] = 0] = "Floor";
    BackgroundType[BackgroundType["Exit"] = 1] = "Exit";
})(BackgroundType || (BackgroundType = {}));
var ForegroundType;
(function (ForegroundType) {
    ForegroundType[ForegroundType["Empty"] = 0] = "Empty";
    ForegroundType[ForegroundType["Wall"] = 1] = "Wall";
    ForegroundType[ForegroundType["CatHead"] = 2] = "CatHead";
    ForegroundType[ForegroundType["CatBody"] = 3] = "CatBody";
    ForegroundType[ForegroundType["CatTail"] = 4] = "CatTail";
})(ForegroundType || (ForegroundType = {}));
class Tile {
    constructor(backgroundType, backgroundId, foregroundType, foregroundId, headDirection, tailDirection) {
        this.backgroundType = backgroundType;
        this.backgroundId = backgroundId;
        this.foregroundType = foregroundType;
        this.foregroundId = foregroundId;
        this.headDirection = headDirection;
        this.tailDirection = tailDirection;
    }
    encode() {
        return (this.backgroundType << 0)
            | (this.backgroundId << 4)
            | (this.foregroundType << 8)
            | (this.foregroundId << 12)
            | (this.headDirection << 16)
            | (this.tailDirection << 20);
    }
    static decode(n) {
        return new Tile((n >> 0) & 0xf, (n >> 4) & 0xf, (n >> 8) & 0xf, (n >> 12) & 0xf, (n >> 16) & 0xf, (n >> 20) & 0xf);
    }
    hasCat() {
        return this.foregroundType === ForegroundType.CatHead
            || this.foregroundType === ForegroundType.CatBody
            || this.foregroundType === ForegroundType.CatTail;
    }
}
class Field {
    constructor(width, height, tiles) {
        this.width = width;
        this.height = height;
        this.tiles = tiles;
        if (tiles.length !== height) {
            throw new Error("invalid height");
        }
        if (tiles.some(row => row.length !== width)) {
            throw new Error("invalid width");
        }
    }
    encode() {
        const arr = new Uint32Array(this.height * this.width + 2);
        arr[arr.length - 2] = this.width;
        arr[arr.length - 1] = this.height;
        for (let row = 0; row < this.height; row += 1) {
            for (let col = 0; col < this.width; col += 1) {
                arr[row * this.width + col] = this.tiles[row][col].encode();
            }
        }
        return arr;
    }
    static decode(arr) {
        const width = arr[arr.length - 2];
        const height = arr[arr.length - 1];
        if (arr.length !== width * height + 2) {
            throw new Error("invalid field");
        }
        const tiles = Array();
        for (let row = 0; row < height; row += 1) {
            const rowTiles = Array();
            for (let col = 0; col < width; col += 1) {
                rowTiles.push(Tile.decode(arr[row * width + col]));
            }
            tiles.push(rowTiles);
        }
        return new Field(width, height, tiles);
    }
}
class Game {
    constructor(field) {
        this.field = field;
        this._moveCount = 0;
    }
    get moveCount() {
        return this._moveCount;
    }
    isWon() {
        return this.field.tiles.some(rowTiles => rowTiles.some(tile => tile.hasCat()
            && tile.foregroundId === 1
            && tile.backgroundType === BackgroundType.Exit));
    }
    moveCat(fromRow, fromCol, toRow, toCol) {
        let fromTile = this.field.tiles[fromRow][fromCol];
        let toTile = this.field.tiles[toRow][toCol];
        if (fromTile.foregroundType !== ForegroundType.CatHead
            && fromTile.foregroundType !== ForegroundType.CatTail) {
            return;
        }
        const dist = Math.abs(toRow - fromRow) + Math.abs(toCol - fromCol);
        if (dist !== 1) {
            return;
        }
        const frontEndForegroundType = fromTile.foregroundType;
        const backEndForegroundType = fromTile.foregroundType === ForegroundType.CatHead
            ? ForegroundType.CatTail
            : ForegroundType.CatHead;
        const frontDirection = fromTile.foregroundType === ForegroundType.CatHead
            ? "headDirection"
            : "tailDirection";
        const backDirection = fromTile.foregroundType === ForegroundType.CatHead
            ? "tailDirection"
            : "headDirection";
        let moveValid = false;
        if (toTile.foregroundType === ForegroundType.Empty) {
            moveValid = true;
        }
        if (toTile.foregroundId === fromTile.foregroundId
            && toTile.foregroundType === backEndForegroundType) {
            moveValid = true;
            if (toRow - fromRow === -1 && fromTile[backDirection] === Direction.Up)
                moveValid = false;
            if (toRow - fromRow === +1 && fromTile[backDirection] === Direction.Down)
                moveValid = false;
            if (toCol - fromCol === -1 && fromTile[backDirection] === Direction.Left)
                moveValid = false;
            if (toCol - fromCol === +1 && fromTile[backDirection] === Direction.Right)
                moveValid = false;
        }
        if (!moveValid)
            return;
        let lastTile = fromTile;
        let lastRow = toRow;
        let lastCol = toCol;
        while (lastTile.foregroundType !== backEndForegroundType) {
            if (fromTile !== lastTile && fromTile.foregroundType === frontEndForegroundType) {
                toTile.foregroundId = fromTile.foregroundId;
                toTile.foregroundType = backEndForegroundType;
            }
            else {
                toTile.foregroundId = fromTile.foregroundId;
                toTile.foregroundType = fromTile.foregroundType;
                fromTile.foregroundId = 0;
                fromTile.foregroundType = ForegroundType.Empty;
            }
            if (lastRow - toRow === -1)
                toTile[frontDirection] = Direction.Up;
            if (lastRow - toRow === +1)
                toTile[frontDirection] = Direction.Down;
            if (lastCol - toCol === -1)
                toTile[frontDirection] = Direction.Left;
            if (lastCol - toCol === +1)
                toTile[frontDirection] = Direction.Right;
            if (fromRow - toRow === -1)
                toTile[backDirection] = Direction.Up;
            if (fromRow - toRow === +1)
                toTile[backDirection] = Direction.Down;
            if (fromCol - toCol === -1)
                toTile[backDirection] = Direction.Left;
            if (fromCol - toCol === +1)
                toTile[backDirection] = Direction.Right;
            lastTile = toTile;
            lastRow = toRow;
            lastCol = toCol;
            toTile = fromTile;
            toRow = fromRow;
            toCol = fromCol;
            if (fromTile[backDirection] === Direction.Up)
                fromRow -= 1;
            if (fromTile[backDirection] === Direction.Down)
                fromRow += 1;
            if (fromTile[backDirection] === Direction.Left)
                fromCol -= 1;
            if (fromTile[backDirection] === Direction.Right)
                fromCol += 1;
            fromTile = this.field.tiles[fromRow][fromCol];
        }
        this._moveCount += 1;
    }
}
function setBackgroundTileData(el, tile) {
    el.setAttribute("data-backgroundType", String(tile.backgroundType));
    el.setAttribute("data-backgroundId", String(tile.backgroundId));
}
function setForegroundTileData(el, tile) {
    el.setAttribute("data-foregroundType", String(tile.foregroundType));
    el.setAttribute("data-foregroundId", String(tile.foregroundId));
    el.setAttribute("data-headDirection", String(tile.headDirection));
    el.setAttribute("data-tailDirection", String(tile.tailDirection));
}
function updateTileData($background, $foreground, game) {
    $background.querySelectorAll(".tile").forEach($tile => {
        const row = Number($tile.getAttribute("data-row"));
        const col = Number($tile.getAttribute("data-col"));
        setBackgroundTileData($tile, game.field.tiles[row][col]);
    });
    $foreground.querySelectorAll(".tile").forEach($tile => {
        const row = Number($tile.getAttribute("data-row"));
        const col = Number($tile.getAttribute("data-col"));
        setForegroundTileData($tile, game.field.tiles[row][col]);
    });
}
let fromRow = -1;
let fromCol = -1;
let toRow = -1;
let toCol = -1;
function resetGame() {
    // const fieldData = Uint32Array.of(
    //     0x000100, 0x000100, 0x000100, 0x000100, 0x000100, 0x000100, 0x000100,
    //     0x000100, 0x000000, 0x000000, 0x000000, 0x000000, 0x000000, 0x000100,
    //     0x000100, 0x000000, 0x000000, 0x122200, 0x000100, 0x133200, 0x000100,
    //     0x000100, 0x102300, 0x202300, 0x232300, 0x000100, 0x133300, 0x000100,
    //     0x000100, 0x032300, 0x022300, 0x022400, 0x000100, 0x133400, 0x000100,
    //     0x000100, 0x021200, 0x021300, 0x021400, 0x000100, 0x000001, 0x000100,
    //     0x000100, 0x000100, 0x000100, 0x000100, 0x000100, 0x000100, 0x000100,
    //     7, 7
    // );
    const fieldData = Uint32Array.from(window.location.hash.slice(1).split(/\s|,/g).map(s => Number(s)));
    window.location.hash = "";
    // console.log(fieldData.toString());
    const game = new Game(Field.decode(fieldData));
    const $foreground = document.getElementById("foreground");
    const $background = document.getElementById("background");
    const $congratulation = document.getElementById("congratulation");
    const $moveCounter = document.getElementById("moveCounter");
    $foreground.innerHTML = "";
    $background.innerHTML = "";
    for (let row = 0; row < game.field.height; row += 1) {
        const $foregroundRow = document.createElement("tr");
        const $backgroundRow = document.createElement("tr");
        for (let col = 0; col < game.field.width; col += 1) {
            const $foregroundTile = document.createElement("td");
            const $backgroundTile = document.createElement("td");
            $foregroundTile.className = "tile";
            $backgroundTile.className = "tile";
            $foregroundTile.setAttribute("data-row", String(row));
            $foregroundTile.setAttribute("data-col", String(col));
            $backgroundTile.setAttribute("data-row", String(row));
            $backgroundTile.setAttribute("data-col", String(col));
            $foregroundTile.addEventListener("mousedown", e => {
                e.preventDefault();
                fromRow = row;
                fromCol = col;
            });
            $foregroundTile.addEventListener("mouseenter", e => {
                if (e.buttons !== 1)
                    return;
                e.preventDefault();
                if (fromRow === row && fromCol === col)
                    return;
                toRow = row;
                toCol = col;
                game.moveCat(fromRow, fromCol, toRow, toCol);
                updateTileData($background, $foreground, game);
                $congratulation.style.visibility = game.isWon() ? "visible" : "hidden";
                $moveCounter.innerText = String(game.moveCount);
                fromRow = toRow = row;
                fromCol = toCol = col;
            });
            $foregroundRow.appendChild($foregroundTile);
            $backgroundRow.appendChild($backgroundTile);
        }
        $foreground.appendChild($foregroundRow);
        $background.appendChild($backgroundRow);
    }
    updateTileData($background, $foreground, game);
    $congratulation.style.visibility = "hidden";
    $moveCounter.innerText = "0";
}
;
window.addEventListener("load", () => {
    if (window.location.hash === "") {
        document.getElementById("level1").click();
    }
    else {
        resetGame();
    }
});
window.addEventListener("hashchange", () => {
    if (window.location.hash === "")
        return;
    resetGame();
});
