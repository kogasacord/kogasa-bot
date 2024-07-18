// Solution from this: https://stackoverflow.com/a/5124834
export function dec2frac(num: number, max_iter: number = 20) {
	const d = [0, 1];
	for (let i = 0; i < max_iter; i++) {
		d.push(0);
	}
	let z = structuredClone(num);
	let n = 1;
	let t = 1;

	while (num && t < max_iter && Math.abs(n / d[t] - num) > Number.EPSILON) {
		t += 1;
		z = 1 / (z - Math.floor(z));
		d[t] = d[t - 1] * Math.floor(z) + d[t - 2];
		n = Math.floor(num * d[t] + 0.5); // rounding 0.5
	}
	return [n, d[t]];
}
