import {Callable} from "../lib/expr.js";
import {Interpreter} from "../lib/interpreter.js";

export class Sqrt extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return Math.sqrt(args[0]);
	};
}

export class Cbrt extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return Math.cbrt(args[0]);
	};
}


export class Clock extends Callable {
	public arity: number = 0;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return performance.now();
	};
}

export class Abs extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return Math.abs(args[0])
	};
}

export class Ceiling extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.ceil(args[0]);
    };
}

export class Floor extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.floor(args[0]);
    };
}

export class Round extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.round(args[0]);
    };
}

export class Signum extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.sign(args[0]);
    };
}

export class Maximum extends Callable {
    public arity: number = 2; 
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.max(args[0], args[1]);
    };
}

export class Minimum extends Callable {
    public arity: number = 2; 
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.min(args[0], args[1]);
    };
}

