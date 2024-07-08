import {Callable} from "../lib/expr.js";
import {Interpreter} from "../lib/interpreter.js";

export class Sine extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return Math.sin(args[0]);
	};
}
export class Cosine extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return Math.cos(args[0]);
	};
}
export class Tangent extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: number[]) {
		return Math.tan(args[0]);
	};
}
export class Log extends Callable {
	public arity: number = 1;
	constructor() {super();}
	call(interpreter: Interpreter, args: number[]) {
		return Math.log(args[0]);
	};
}
export class Base2Log extends Callable {
	public arity: number = 1;
	constructor() {super();}
	call(interpreter: Interpreter, args: number[]) {
		return Math.log2(args[0]);
	};
}
export class Base10Log extends Callable {
	public arity: number = 1;
	constructor() {super();}
	call(interpreter: Interpreter, args: number[]) {
		return Math.log10(args[0]);
	};
}



export class HyperbolicSine extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.sinh(args[0]);
    };
}

export class HyperbolicCosine extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.cosh(args[0]);
    };
}

export class HyperbolicTangent extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.tanh(args[0]);
    };
}

export class InverseSine extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.asin(args[0]);
    };
}
export class InverseCosine extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.acos(args[0]);
    };
}
export class InverseTangent extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.atan(args[0]);
    };
}

export class InverseHyperbolicSine extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.asinh(args[0]);
    };
}

export class InverseHyperbolicCosine extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.acosh(args[0]);
    };
}

export class InverseHyperbolicTangent extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: number[]) {
        return Math.atanh(args[0]);
    };
}

