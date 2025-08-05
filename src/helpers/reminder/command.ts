

import Fuse, {FuseResult} from "fuse.js";
import {Expr, Absolute, Recurring, Relative, Remove} from "@helpers/reminder/parser.js";

import dayjs, {Dayjs} from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import relativeTime from "dayjs/plugin/relativeTime.js";

dayjs.extend(advancedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);


export type MainReminderCommand = AbsoluteCommand | RecurringCommand | RelativeCommand
	| RemoveCommand | ListCommand;
export type RelativeContent = {
	type: "Relative";
	d: number;
	h: number;
	m: number;
};
export type AbsoluteContent = {
	type: "Absolute";
	year: number;
	month: number;
	date: number;
	hour: number;
	minute: number;
	timezone: string | "local";
};
export type AbsoluteCommand = {
	command: "Absolute";
	to_date: Dayjs;
	content: AbsoluteContent;
	message: string;
};
export type RecurringCommand = {
	command: "Recurring"
	to_date: Dayjs;
	content: AbsoluteContent | RelativeContent;
	message: string;
};
export type RelativeCommand = {
	command: "Relative";
	to_date: Dayjs;
	content: RelativeContent;
	message: string;
};
export type RemoveCommand = {
	command: "Remove";
	index: number;
}
export type ListCommand = {
	command: "List";
}

import tz from "@media/timezone.json" assert { type: "json" };
import {RemindTokenType} from "./lexer";
const fuse = new Fuse(tz, {
	keys: ["tz_id"],
	includeScore: true,
	shouldSort: true,
});

export class ReminderCommand {
	constructor() {}

	public recursiveParse(input: Expr, time: Dayjs): MainReminderCommand | Expr {
		switch (input.type) {
			case "Relative":
				return this.relative(input, time);
			case "Recurring":
				return this.recurring(input, time);
			case "Absolute":
				return this.absolute(input, time);
			case "Remove":
				return this.remove(input);
			case "List": 
				return {command: "List"};
			case "Clock":
			case "Unit":
				return input;

			default:
				throw new Error(`Unknown expression! This isn't supposed to happen, ${input}`);
		}
	}

	private relative(input: Expr, time: Dayjs): RelativeCommand {
		const relative_expr = input as Relative;
		const relative: RelativeContent = {
			type: "Relative",
			d: 0,
			h: 0,
			m: 0,
		};
		let result_time = time;
		for (const unit of relative_expr.units) {
			switch (unit.unit) {
				case RemindTokenType.DAY:
					relative.d = unit.value;
					result_time = result_time.add(unit.value, "day");
					break;
				case RemindTokenType.HOUR:
					relative.h = unit.value;
					result_time = result_time.add(unit.value, "hour"); 
					break;
				case RemindTokenType.MINUTE:
					relative.m = unit.value;
					result_time = result_time.add(unit.value, "minute"); 
					break;
				default: 
					throw new Error(`Unknown relative unit: "${unit.unit}"`);
			}
		}
		const time_difference = result_time.diff(dayjs(), "day", true);
		if (time_difference > 30) {
			throw new Error(`Too much time! You put in a reminder that triggers ${result_time.fromNow()}, it should be below 30 days.`);
		}
		return {
			command: "Relative",
			content: relative,
			to_date: result_time,
			message: relative_expr.content,
		};
	}
	private recurring(input: Expr, time: Dayjs): RecurringCommand {
		const recurring = input as Recurring;
		if (recurring.expr.type !== "Relative") {
			throw new Error(`${recurring.expr.type} types not supported yet!`);
		}

		const command = this.recursiveParse(recurring.expr, time) as RelativeCommand;
		return {
			command: "Recurring",
			to_date: command.to_date,
			content: command.content,
			message: command.message,
		};
	}

	private absolute(input: Expr, time: Dayjs): AbsoluteCommand {
		const expr = input as Absolute;
		const absolute: AbsoluteContent = {
			type: "Absolute",
			year: 0,
			month: 0,
			date: 0,
			hour: 0,
			minute: 0,
			timezone: expr.timezone,
		};
		const res = fuse.search(expr.timezone).slice(0, 2);
		if (!this.isValidTimezone(res)) {
			throw new Error(`Unknown timezone "${expr.timezone}", did you mean ${res.map(v => `"${v.item.tz_id}"`).join(", ")}`);
		}
		let result = time.tz(expr.timezone);
		for (const unit of expr.units) {
			switch (unit.unit) {
				case RemindTokenType.YEAR:
					absolute.year = unit.value;
					result = result.set("year", unit.value); 
					break;
				case RemindTokenType.MONTH:
					absolute.month = unit.value;
					result = result.set("month", unit.value - 1); 
					break; // months are 0-indexed
				case RemindTokenType.DATE:
					absolute.date = unit.value;
					result = result.set("date", unit.value); 
					break;
				default: 
					throw new Error(`Unknown absolute unit: ${unit.unit}`);
			}
		}
		if (expr.clock) {
			const clock = expr.clock;
			if (clock.hour !== undefined) {
				absolute.hour = clock.hour;
				result = result.set("hour", clock.hour);
			} else {
				result = result.set("hour", 0);
			}
			if (clock.minute !== undefined) {
				absolute.minute = clock.minute;
				result = result.set("minute", clock.minute);
			} else {
				result = result.set("minute", 0);
			}
			if (clock.meridiem === "pm" && result.hour() < 12) {
				absolute.hour += 12;
				result = result.add(12, "hour");
			}
		}

		if (!result.isValid() || result.isBefore(dayjs().tz(expr.timezone))) {
			throw new Error("Cannot set reminder in the past.");
		}
		const time_difference = result.diff(dayjs().tz(expr.timezone), "year", true);
		if (time_difference > 2) {
			throw new Error(`Too much time! You put in a reminder that triggers ${result.fromNow()}!`);
		}

		return {
			command: "Absolute",
			to_date: result,
			content: absolute,
			message: expr.content
		};
	}
	private remove(input: Expr): RemoveCommand {
		const expr = input as Remove;
		return {
			command: "Remove",
			index: expr.index
		};
	}

	private isValidTimezone<T>(matches: FuseResult<T>[]): boolean {
		const not_exact_match_threshold = 0.001;
		if (matches.length <= 0) {
			return false;
		}
		const best = matches[0];
		if (best.score! >= not_exact_match_threshold) {
			return false;
		}
		return true;
	}
}

