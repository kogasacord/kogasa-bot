
import typescript from "@rollup/plugin-typescript";

export default {
	input: "index.ts",
	output: {
		file: "build/bundle.js",
		format: "es",
	},
	plugins: [typescript()]
};
