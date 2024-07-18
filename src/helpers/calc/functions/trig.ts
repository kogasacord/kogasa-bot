import { Callable, LabelledNumber } from "../lib/expr.js";
import { Interpreter } from "../lib/interpreter.js";

export class Sine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.sin(args[0].num_value), type: args[0].type };
	}
}
export class Cosine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.cos(args[0].num_value), type: args[0].type };
	}
}
export class Tangent extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.tan(args[0].num_value), type: args[0].type };
	}
}
export class Log extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.log(args[0].num_value), type: args[0].type };
	}
}
export class Base2Log extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.log2(args[0].num_value), type: args[0].type };
	}
}
export class Base10Log extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.log10(args[0].num_value), type: args[0].type };
	}
}

export class HyperbolicSine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.sinh(args[0].num_value), type: args[0].type };
	}
}

export class HyperbolicCosine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.cosh(args[0].num_value), type: args[0].type };
	}
}

export class HyperbolicTangent extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.tanh(args[0].num_value), type: args[0].type };
	}
}

export class InverseSine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.asin(args[0].num_value), type: args[0].type };
	}
}
export class InverseCosine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.acos(args[0].num_value), type: args[0].type };
	}
}
export class InverseTangent extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.atan(args[0].num_value), type: args[0].type };
	}
}

export class InverseHyperbolicSine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.asinh(args[0].num_value), type: args[0].type };
	}
}

export class InverseHyperbolicCosine extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.acosh(args[0].num_value), type: args[0].type };
	}
}

export class InverseHyperbolicTangent extends Callable {
	public arity: number = 1;
	constructor() {
		super();
	}
	call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.atanh(args[0].num_value), type: args[0].type };
	}
}
