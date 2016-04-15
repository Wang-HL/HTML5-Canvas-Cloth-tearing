
var physics_accuracy = 3,
    mouse_influence = 20,
    mouse_cut = 5,
    gravity = 1200,
    cloth_height = 30,
    cloth_width = 50,
    start_y = 20,
    spacing = 7,
    tear_distance = 60;


window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
};

var canvas,
    ctx,
    cloth,
    boundsx, //画布的总宽度
    boundsy, //画布的总长度
    mouse = {
        down: false,
        button: 1,
        x: 0, //鼠标在canvas画布上的横坐标
        y: 0, //鼠标在canvas画布上的纵坐标
        px: 0,
        py: 0
    };

var Point = function (x, y) {

    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.pin_x = null;
    this.pin_y = null;

    this.constraints = [];
};

Point.prototype.update = function (delta) {

    if (mouse.down) {

        var diff_x = this.x - mouse.x,
            diff_y = this.y - mouse.y,
            dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y);

        if (mouse.button == 1) {

            if (dist < mouse_influence) {
                this.px = this.x - (mouse.x - mouse.px) * 1.8;
                this.py = this.y - (mouse.y - mouse.py) * 1.8;
            }

        } else if (dist < mouse_cut) this.constraints = [];
    }

    this.add_force(0, gravity); //添加一个力到刚体。作为结果刚体将开始移动。

    delta *= delta;
    nx = this.x + ((this.x - this.px) * .99) + ((this.vx / 2) * delta);
    ny = this.y + ((this.y - this.py) * .99) + ((this.vy / 2) * delta);

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;

    this.vy = this.vx = 0
};

Point.prototype.draw = function () { //prototype 属性使您有能力向对象添加属性和方法。语法：object.prototype.name=value

    if (this.constraints.length <= 0) return;   //画布的形状

    var i = this.constraints.length;
    while (i--) this.constraints[i].draw();
};

Point.prototype.resolve_constraints = function () {

    if (this.pin_x != null && this.pin_y != null) {

        this.x = this.pin_x;
        this.y = this.pin_y;
        return;
    }

    var i = this.constraints.length;
    while (i--) this.constraints[i].resolve();

    if (this.x > boundsx) {

        this.x = 2 * boundsx - this.x;
        
    } else if (this.x < 1) {

        this.x = 2 - this.x;
    }

    if (this.y > boundsy) {

        this.y = 2 * boundsy - this.y;
        
    } else if (this.y < 1) {

        this.y = 2 - this.y;
    }
};

Point.prototype.attach = function (point) {

    this.constraints.push(
        new Constraint(this, point)
    );
};

Point.prototype.remove_constraint = function (lnk) {

    var i = this.constraints.length;
    while (i--)
        if (this.constraints[i] == lnk) this.constraints.splice(i, 1);
};

Point.prototype.add_force = function (x, y) {

    this.vx += x;
    this.vy += y;
};

Point.prototype.pin = function (pinx, piny) {
    this.pin_x = pinx;
    this.pin_y = piny;
};

var Constraint = function (p1, p2) {

    this.p1 = p1;
    this.p2 = p2;
    this.length = spacing;
};

Constraint.prototype.resolve = function () {

    var diff_x = this.p1.x - this.p2.x,
        diff_y = this.p1.y - this.p2.y,
        dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
        diff = (this.length - dist) / dist;

    if (dist > tear_distance) this.p1.remove_constraint(this);

    var px = diff_x * diff * 0.5;
    var py = diff_y * diff * 0.5;

    this.p1.x += px;
    this.p1.y += py;
    this.p2.x -= px;
    this.p2.y -= py;
};

Constraint.prototype.draw = function () {

    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
};

var Cloth = function () {

    this.points = [];

    var start_x = canvas.width / 2 - cloth_width * spacing / 2;

    for (var y = 0; y <= cloth_height; y++) {

        for (var x = 0; x <= cloth_width; x++) {

            var p = new Point(start_x + x * spacing, start_y + y * spacing);

            x != 0 && p.attach(this.points[this.points.length - 1]);
            y == 0 && p.pin(p.x, p.y);
            y != 0 && p.attach(this.points[x + (y - 1) * (cloth_width + 1)])

            this.points.push(p);
        }
    }
};

Cloth.prototype.update = function () {

    var i = physics_accuracy;

    while (i--) {
        var p = this.points.length;
        while (p--) this.points[p].resolve_constraints();
    }

    i = this.points.length;
    while (i--) this.points[i].update(.016);
};

Cloth.prototype.draw = function () {

    ctx.beginPath();

    var i = cloth.points.length;
    while (i--) cloth.points[i].draw();

    ctx.stroke();
};

function update() {

    ctx.clearRect(0, 0, canvas.width, canvas.height); //清除某个矩形区域的内容。

    cloth.update();
    cloth.draw();

    requestAnimFrame(update);
}

function start() {

    canvas.onmousedown = function (e) { //onmousedown 属性在鼠标按钮在元素上按下时触发。
        mouse.button = e.which;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect(); //这个方法返回一个矩形对象，包含四个属性：left、top、right和bottom。分别表示元素各边与页面上边和左边的距离。
        mouse.x = e.clientX - rect.left, //clientX 事件属性返回当事件被触发时鼠标指针向对于浏览器页面（或客户区）的水平坐标。（这里clientX-rect.left检测的是鼠标在canvas画布上的水平坐标）
        mouse.y = e.clientY - rect.top, //检测鼠标在canvas画布上的垂直距离，和上面的X坐标可以取得鼠标在canvas上的画布坐标
        mouse.down = true;
        e.preventDefault(); //  取消事件的默认动作。
    };

    canvas.onmouseup = function (e) { //onmouseup 事件会在鼠标按键被松开时发生。
        mouse.down = false;
        e.preventDefault();
    };

    canvas.onmousemove = function (e) { //onmouseover 属性在鼠标指针移动到元素上时触发。
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        e.preventDefault();
    };

    canvas.oncontextmenu = function (e) { //取消鼠标右键功能
        e.preventDefault();
    };

    boundsx = canvas.width - 1;
    boundsy = canvas.height - 1;

    ctx.strokeStyle = '#888'; //设置笔触颜色，也就是边框的颜色
    cloth = new Cloth();
    update();
}

window.onload = function () {

    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    canvas.width = 560;
    canvas.height = 350;

    start();
};