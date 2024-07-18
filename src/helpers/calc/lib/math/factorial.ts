function gamma(z: number): number {
	const g = 7;
	const p = [
		0.99999999999980993, 676.5203681218851, -1259.1392167224028,
		771.32342877765313, -176.61502916214059, 12.507343278686905,
		-0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
	];

	if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));

	z -= 1;
	let x = p[0];
	for (let i = 1; i < g + 2; i++) {
		x += p[i] / (z + i);
	}
	const t = z + g + 0.5;
	return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export function decimal_factorial(n: number) {
	if (n < 0) return NaN;
	if (n === 0 || n === 1) return 1;
	if (Number.isInteger(n)) {
		let result = 1;
		for (let i = 2; i <= n; i++) {
			result *= i;
		}
		return result;
	} else {
		return gamma(n + 1);
	}
}

export function factorial(n: number) {
	let result = 1;
	for (let i = 1; i <= n; i++) {
		result *= i;
	}
	return result;
}
