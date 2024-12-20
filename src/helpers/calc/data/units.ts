
import { JSONEdges } from "./types.js";

const weight: JSONEdges = [
	// metric
	{from: "kg", to: "g", forward_weight: 1000},
	{from: "g", to: "dg", forward_weight: 10},
	{from: "g", to: "cg", forward_weight: 100},
	{from: "g", to: "mg", forward_weight: 1000},
	{from: "g", to: "mcg", forward_weight: 1e+6},
	{from: "g", to: "ng", forward_weight: 1e+9},

	// conversion to imperial
	{from: "lb", to: "g", forward_weight: 453.5924},

	// imperial
	{from: "st", to: "lb", forward_weight: 14},
	{from: "qr", to: "lb", forward_weight: 28},
	{from: "oz", to: "lb", forward_weight: 16},
	{from: "gr", to: "lb", forward_weight: 7000},
	{from: "lb", to: "carat", forward_weight: 2267.962},

	{from: "ston", to: "lb", forward_weight: 2000},
	{from: "lton", to: "lb", forward_weight: 2240},
	{from: "mton", to: "lb", forward_weight: 2204.623},
];

const length: JSONEdges = [
	{from: "m", to: "mm", forward_weight: 1000},
	{from: "m", to: "cm", forward_weight: 100},
	{from: "km", to: "m", forward_weight: 1000},

	{from: "m", to: "in", forward_weight: 39.370078740157},
	{from: "nmi", to: "m", forward_weight: 1852},

	{from: "ft", to: "in", forward_weight: 12},
	{from: "yd", to: "in", forward_weight: 36},
	{from: "mi", to: "in", forward_weight: 63360},
];

export const edges: JSONEdges = [...weight, ...length];
