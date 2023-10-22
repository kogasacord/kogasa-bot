export function run(input, transform, none) {
    if (input.hasNull) {
        if (none) {
            none();
        }
        return { content: undefined, hasNull: true };
    }
    if (input.content === undefined) {
        return { content: undefined, hasNull: true };
    }
    return transform(input.content);
}
export async function asyncRun(input, transform, none, ...args) {
    if (input.hasNull) {
        if (none) {
            none();
        }
        return { content: undefined, hasNull: true };
    }
    if (input.content === undefined) {
        return { content: undefined, hasNull: true };
    }
    return await transform(input.content, ...args);
}
export function wrapInOption(object) {
    return {
        content: object,
        hasNull: object === undefined
    };
}
