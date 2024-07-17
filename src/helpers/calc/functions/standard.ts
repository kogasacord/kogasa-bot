import {Callable, LabelledNumber} from "../lib/expr.js";
import {Interpreter} from "../lib/interpreter.js";

export class Num extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: args[0].num_value, type: undefined }; 
	};
}

export class Sqrt extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.sqrt(args[0].num_value), type: args[0].type }; 
	};
}

export class Cbrt extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.cbrt(args[0].num_value), type: args[0].type }; 
	};
}


export class Clock extends Callable {
	public arity: number = 0;
	constructor() { super(); }
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: performance.now(), type: undefined }; 
	};
}

export class Abs extends Callable {
	public arity: number = 1;
	constructor() { super(); }
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.abs(args[0].num_value), type: args[0].type }; 
	};
}

export class Ceiling extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.ceil(args[0].num_value), type: args[0].type }; 
    };
}

export class Floor extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.floor(args[0].num_value), type: args[0].type }; 
    };
}

export class Round extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.round(args[0].num_value), type: args[0].type }; 
    };
}

export class Signum extends Callable {
    public arity: number = 1;
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		// sign and signum isn't the same.
		return { num_value: Math.sign(args[0].num_value), type: args[0].type }; 
    };
}

export class Maximum extends Callable {
    public arity: number = 2; 
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.max(args[0].num_value, args[1].num_value), type: args[0].type };
    };
}

export class Minimum extends Callable {
    public arity: number = 2; 
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.min(args[0].num_value, args[1].num_value), type: args[0].type }; 
    };
}

