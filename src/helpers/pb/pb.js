export async function findThroughCollection(collection, id_name, id, expand) {
    const server_settings = await collection.getList(undefined, undefined, {
        filter: `${id_name} = "${id}"`,
        expand: expand,
        $autoCancel: false,
    });
    return server_settings.items.at(0);
}
