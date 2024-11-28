import {RuntimeError} from "../lib/error.js";
import {ArrayType, Callable, LabelledNumber} from "../lib/expr.js";
import {Interpreter, numberToString} from "../lib/interpreter.js";
import {Token, TokenType} from "../lib/scanner.js";

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
	public variable_arity: number = 2;
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.max(...args.map(c => c.num_value)), type: args[0].type };
    };
}

export class Minimum extends Callable {
	public variable_arity: number = 2;
    constructor() { super(); }
    call(interpreter: Interpreter, args: LabelledNumber[]) {
		return { num_value: Math.min(...args.map(c => c.num_value)), type: args[0].type }; 
    };
}

function gcd(a: number, b: number) {
	let i = 0;
    while (b !== 0) {
        [a, b] = [b, a % b];
		i++;
    }
    return Math.abs(a);
}
function lcm(a: number, b: number): number {
	return (a * b) / gcd(a, b);
}
// from geeksforgeeks, dixon's prime factorization algorithm.
function factor(n: number) {
    // Factor base for the given number
    let base = [2, 3, 5, 7];
  
    // Starting from the ceil of the root
    // of the given number N
    let start = Math.floor(Math.sqrt(n));
  
    // Storing the related squares
    let pairs = [];
     
    // For every number from the square root 
    // Till N
    let len= base.length;
    for(let i = start; i < n; i++)
    {
        // Finding the related squares 
        for(let j = 0; j < len; j++)
        {
            let lhs = (i ** 2)% n;
            let rhs = ((base[j] ** 2)) % n;
              
            // If the two numbers are the 
            // related squares, then append
            // them to the array 
            if(lhs == rhs)
            {
                pairs.push([i, base[j]]);
            }
                 
        }
    }
 
    let newvec = [];
  
    // For every pair in the array, compute the 
    // GCD such that 
    len = pairs.length;


    for (let i = 0; i < len;i++){
        let factor = gcd(pairs[i][0] - pairs[i][1], n);
          
        // If we find a factor other than 1, then 
        // appending it to the final factor array
        if(factor != 1)
            newvec.push(factor);
  
    }
     
    let s = new Set(newvec);
    return [...s]
}

export class Factor extends Callable {
	public arity: number = 1;
	constructor() {super();}
	call(interpreter: Interpreter, args: LabelledNumber[]): ArrayType {
		if (args[0].num_value > 9000000) { // max limit.
			throw new RuntimeError(
				{ type: TokenType.LEFT_PAREN, text: "factor function", literal: undefined },
				`The number "${numberToString(args[0])}" is too large to factor in a sufficient time!`
			);
		}

		const factors = factor(args[0].num_value).map(c => {return {num_value: c, type: args[0].type}});
		factors.sort((prev, curr) => prev.num_value - curr.num_value);
		return { elements: factors };
	}
}

export class GCD extends Callable {
	public variable_arity: number = 2;
	constructor() {super();}
	call(interpreter: Interpreter, args: LabelledNumber[]): LabelledNumber | ArrayType {
		let result = args[0].num_value;
		for (let i = 1; i < args.length; i++) {
			result = gcd(result, args[i].num_value);
		}
		return { num_value: result, type: args[0].type };
	}
}

export class LCM extends Callable {
	public variable_arity: number = 2;
	constructor() {super();}
	call(interpreter: Interpreter, args: LabelledNumber[]): LabelledNumber | ArrayType {
		let result = args[0].num_value;
		for (let i = 1; i < args.length; i++) {
			result = lcm(result, args[i].num_value);
		}
		return { num_value: result, type: args[0].type };
	}
}

