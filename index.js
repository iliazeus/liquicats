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
var Tile = /** @class */ (function () {
    function Tile(backgroundType, backgroundId, foregroundType, foregroundId, headDirection, tailDirection) {
        this.backgroundType = backgroundType;
        this.backgroundId = backgroundId;
        this.foregroundType = foregroundType;
        this.foregroundId = foregroundId;
        this.headDirection = headDirection;
        this.tailDirection = tailDirection;
    }
    Tile.prototype.encode = function () {
        return (this.backgroundType << 0)
            | (this.backgroundId << 4)
            | (this.foregroundType << 8)
            | (this.foregroundId << 12)
            | (this.headDirection << 16)
            | (this.tailDirection << 20);
    };
    Tile.decode = function (n) {
        return new Tile((n >> 0) & 0xf, (n >> 4) & 0xf, (n >> 8) & 0xf, (n >> 12) & 0xf, (n >> 16) & 0xf, (n >> 20) & 0xf);
    };
    Tile.prototype.hasCat = function () {
        return this.foregroundType === ForegroundType.CatHead
            || this.foregroundType === ForegroundType.CatBody
            || this.foregroundType === ForegroundType.CatTail;
    };
    return Tile;
}());
var Field = /** @class */ (function () {
    function Field(width, height, tiles) {
        this.width = width;
        this.height = height;
        this.tiles = tiles;
        if (tiles.length !== height) {
            throw new Error('invalid height');
        }
        if (tiles.some(function (row) { return row.length !== width; })) {
            throw new Error('invalid width');
        }
    }
    Field.prototype.encode = function () {
        var arr = new Uint32Array(this.height * this.width + 2);
        arr[arr.length - 2] = this.width;
        arr[arr.length - 1] = this.height;
        for (var row = 0; row < this.height; row += 1) {
            for (var col = 0; col < this.width; col += 1) {
                arr[row * this.width + col] = this.tiles[row][col].encode();
            }
        }
        return arr;
    };
    Field.decode = function (arr) {
        var width = arr[arr.length - 2];
        var height = arr[arr.length - 1];
        if (arr.length !== width * height + 2) {
            throw new Error('invalid field');
        }
        var tiles = Array();
        for (var row = 0; row < height; row += 1) {
            var rowTiles = Array();
            for (var col = 0; col < width; col += 1) {
                rowTiles.push(Tile.decode(arr[row * width + col]));
            }
            tiles.push(rowTiles);
        }
        return new Field(width, height, tiles);
    };
    return Field;
}());
var Game = /** @class */ (function () {
    function Game(field) {
        this.field = field;
    }
    Game.prototype.isWon = function () {
        return this.field.tiles.every(function (rowTiles) { return rowTiles.every(function (tile) { return tile.hasCat()
            && tile.foregroundId === 1
            && tile.backgroundType === BackgroundType.Exit; }); });
    };
    Game.prototype.moveCat = function (fromRow, fromCol, toRow, toCol) {
        var fromTile = this.field.tiles[fromRow][fromCol];
        var toTile = this.field.tiles[toRow][toCol];
        if (fromTile.foregroundType !== ForegroundType.CatHead
            && fromTile.foregroundType !== ForegroundType.CatTail) {
            return;
        }
        var dist = Math.abs(toRow - fromRow) + Math.abs(toCol - fromCol);
        if (dist !== 1) {
            return;
        }
        var frontEndForegroundType = fromTile.foregroundType;
        var backEndForegroundType = fromTile.foregroundType === ForegroundType.CatHead
            ? ForegroundType.CatTail
            : ForegroundType.CatHead;
        var frontDirection = fromTile.foregroundType === ForegroundType.CatHead
            ? "headDirection"
            : "tailDirection";
        var backDirection = fromTile.foregroundType === ForegroundType.CatHead
            ? "tailDirection"
            : "headDirection";
        var moveValid = false;
        if (toTile.foregroundType === ForegroundType.Empty) {
            moveValid = true;
        }
        if (toTile.foregroundId === fromTile.foregroundId
            && toTile.foregroundType === backEndForegroundType) {
            moveValid = true;
        }
        if (!moveValid)
            return;
        var lastTile = fromTile;
        var lastRow = toRow;
        var lastCol = toCol;
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
    };
    return Game;
}());
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
    $background.querySelectorAll(".tile").forEach(function ($tile) {
        var row = Number($tile.getAttribute("data-row"));
        var col = Number($tile.getAttribute("data-col"));
        setBackgroundTileData($tile, game.field.tiles[row][col]);
    });
    $foreground.querySelectorAll(".tile").forEach(function ($tile) {
        var row = Number($tile.getAttribute("data-row"));
        var col = Number($tile.getAttribute("data-col"));
        setForegroundTileData($tile, game.field.tiles[row][col]);
    });
}
// const fieldData = Uint32Array.of(
//     0x000100, 0x000100, 0x000100, 0x000100, 0x000100,
//     0x000100, 0x311400, 0x102300, 0x202200, 0x000100,
//     0x000100, 0x311300, 0x132300, 0x000000, 0x000100,
//     0x000100, 0x311200, 0x132400, 0x000000, 0x000100,
//     0x000100, 0x000100, 0x000001, 0x000100, 0x000100,
//     5, 5
// );
var fieldData = Uint32Array.from(window.location.hash.slice(1).split(',').map(function (s) { return Number(s); }));
console.log(fieldData.toString());
var game = new Game(Field.decode(fieldData));
var fromRow = -1;
var fromCol = -1;
var toRow = -1;
var toCol = -1;
window.addEventListener("load", function () {
    var $foreground = document.getElementById("foreground");
    var $background = document.getElementById("background");
    var _loop_1 = function (row) {
        var $foregroundRow = document.createElement("tr");
        var $backgroundRow = document.createElement("tr");
        var _loop_2 = function (col) {
            var $foregroundTile = document.createElement("td");
            var $backgroundTile = document.createElement("td");
            $foregroundTile.className = "tile";
            $backgroundTile.className = "tile";
            $foregroundTile.setAttribute("data-row", String(row));
            $foregroundTile.setAttribute("data-col", String(col));
            $backgroundTile.setAttribute("data-row", String(row));
            $backgroundTile.setAttribute("data-col", String(col));
            $foregroundTile.addEventListener("mousedown", function (e) {
                e.preventDefault();
                fromRow = row;
                fromCol = col;
            });
            $foregroundTile.addEventListener("mouseenter", function (e) {
                if (e.buttons !== 1)
                    return;
                e.preventDefault();
                if (fromRow === row && fromCol === col)
                    return;
                toRow = row;
                toCol = col;
                game.moveCat(fromRow, fromCol, toRow, toCol);
                updateTileData($background, $foreground, game);
                fromRow = toRow = row;
                fromCol = toCol = col;
            });
            $foregroundRow.appendChild($foregroundTile);
            $backgroundRow.appendChild($backgroundTile);
        };
        for (var col = 0; col < game.field.width; col += 1) {
            _loop_2(col);
        }
        $foreground.appendChild($foregroundRow);
        $background.appendChild($backgroundRow);
    };
    for (var row = 0; row < game.field.height; row += 1) {
        _loop_1(row);
    }
    updateTileData($background, $foreground, game);
});
